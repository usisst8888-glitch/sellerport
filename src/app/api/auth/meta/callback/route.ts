import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface MetaTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}

interface MetaAdAccount {
  id: string
  name: string
  account_id: string
  account_status: number
  currency: string
}

interface MetaAdAccountsResponse {
  data: MetaAdAccount[]
}

// Meta OAuth 콜백 처리
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // 사용자가 거부하거나 에러 발생
    if (error) {
      console.error('Meta OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=${encodeURIComponent(errorDescription || error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=invalid_request`
      )
    }

    // state에서 user_id 및 type 추출
    let userId: string
    let stateType: string = 'meta_ads' // 기본값: 광고 연동
    let stateFrom: string = 'ad-channels'
    let stateSiteId: string | null = null

    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = stateData.userId
      stateType = stateData.type || 'meta_ads'
      stateFrom = stateData.from || 'ad-channels'
      stateSiteId = stateData.siteId || null

      // timestamp 검증 (10분 이내)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=state_expired`
        )
      }
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=invalid_state`
      )
    }

    // Instagram DM 연동인 경우 별도 처리
    if (stateType === 'instagram_dm') {
      return handleInstagramDmCallback(code, userId, stateFrom, stateSiteId)
    }

    const META_APP_ID = process.env.META_APP_ID
    const META_APP_SECRET = process.env.META_APP_SECRET
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

    if (!META_APP_ID || !META_APP_SECRET) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=configuration_error`
      )
    }

    // 1. Authorization code를 Access token으로 교환
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    tokenUrl.searchParams.set('client_id', META_APP_ID)
    tokenUrl.searchParams.set('client_secret', META_APP_SECRET)
    tokenUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    tokenUrl.searchParams.set('code', code)

    const tokenResponse = await fetch(tokenUrl.toString())
    const tokenData: MetaTokenResponse = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error('Failed to get access token:', tokenData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=token_exchange_failed`
      )
    }

    // 2. Short-lived token을 Long-lived token으로 교환 (60일)
    const longLivedTokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    longLivedTokenUrl.searchParams.set('grant_type', 'fb_exchange_token')
    longLivedTokenUrl.searchParams.set('client_id', META_APP_ID)
    longLivedTokenUrl.searchParams.set('client_secret', META_APP_SECRET)
    longLivedTokenUrl.searchParams.set('fb_exchange_token', tokenData.access_token)

    const longLivedResponse = await fetch(longLivedTokenUrl.toString())
    const longLivedData: MetaTokenResponse = await longLivedResponse.json()

    const accessToken = longLivedData.access_token || tokenData.access_token
    const expiresIn = longLivedData.expires_in || 3600

    // 3. 사용자의 광고 계정 목록 가져오기
    const adAccountsUrl = new URL('https://graph.facebook.com/v18.0/me/adaccounts')
    adAccountsUrl.searchParams.set('access_token', accessToken)
    adAccountsUrl.searchParams.set('fields', 'id,name,account_id,account_status,currency')

    const adAccountsResponse = await fetch(adAccountsUrl.toString())
    const adAccountsData: MetaAdAccountsResponse = await adAccountsResponse.json()

    if (!adAccountsData.data || adAccountsData.data.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=no_ad_accounts`
      )
    }

    // 4. Supabase에 저장
    const supabase = await createClient()

    // 첫 번째 활성 광고 계정 사용 (나중에 선택 UI 추가 가능)
    const activeAccount = adAccountsData.data.find(acc => acc.account_status === 1) || adAccountsData.data[0]

    // 기존 연동이 있는지 확인
    const { data: existingChannel } = await supabase
      .from('ad_channels')
      .select('id')
      .eq('user_id', userId)
      .eq('channel_type', 'meta')
      .eq('account_id', activeAccount.account_id)
      .single()

    const channelData = {
      user_id: userId,
      channel_type: 'meta',
      channel_name: activeAccount.name || 'Meta Ads',
      account_id: activeAccount.account_id,
      account_name: activeAccount.name,
      access_token: accessToken, // 실제로는 암호화 저장 권장
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      metadata: {
        currency: activeAccount.currency,
        ad_account_id: activeAccount.id, // act_XXXXX 형식
        all_accounts: adAccountsData.data.map(acc => ({
          id: acc.id,
          name: acc.name,
          account_id: acc.account_id,
          status: acc.account_status,
        })),
      },
    }

    if (existingChannel) {
      // 기존 연동 업데이트
      await supabase
        .from('ad_channels')
        .update(channelData)
        .eq('id', existingChannel.id)
    } else {
      // 새 연동 생성
      const { error: insertError } = await supabase
        .from('ad_channels')
        .insert(channelData)

      if (insertError) {
        console.error('Failed to save ad channel:', insertError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=save_failed`
        )
      }
    }

    // 성공 시 ad-channels 페이지로 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?success=meta_connected`
    )
  } catch (error) {
    console.error('Meta OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=internal_error`
    )
  }
}

// Instagram DM 연동 콜백 처리
async function handleInstagramDmCallback(
  code: string,
  userId: string,
  from: string,
  siteId: string | null
): Promise<NextResponse> {
  try {
    const META_APP_ID = process.env.META_APP_ID
    const META_APP_SECRET = process.env.META_APP_SECRET
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

    if (!META_APP_ID || !META_APP_SECRET) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=configuration_error`
      )
    }

    // 1. Authorization code를 Access token으로 교환
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    tokenUrl.searchParams.set('client_id', META_APP_ID)
    tokenUrl.searchParams.set('client_secret', META_APP_SECRET)
    tokenUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    tokenUrl.searchParams.set('code', code)

    const tokenResponse = await fetch(tokenUrl.toString())
    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error('Failed to get access token:', tokenData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=token_exchange_failed`
      )
    }

    // 2. Long-lived token으로 교환
    const longLivedTokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    longLivedTokenUrl.searchParams.set('grant_type', 'fb_exchange_token')
    longLivedTokenUrl.searchParams.set('client_id', META_APP_ID)
    longLivedTokenUrl.searchParams.set('client_secret', META_APP_SECRET)
    longLivedTokenUrl.searchParams.set('fb_exchange_token', tokenData.access_token)

    const longLivedResponse = await fetch(longLivedTokenUrl.toString())
    const longLivedData = await longLivedResponse.json()
    const userAccessToken = longLivedData.access_token || tokenData.access_token

    // 3. Facebook 페이지 목록 가져오기
    const pagesUrl = new URL('https://graph.facebook.com/v18.0/me/accounts')
    pagesUrl.searchParams.set('access_token', userAccessToken)
    pagesUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account')

    const pagesResponse = await fetch(pagesUrl.toString())
    const pagesData = await pagesResponse.json()

    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=no_facebook_pages`
      )
    }

    // 4. Instagram 비즈니스 계정이 연결된 페이지 찾기
    let instagramAccount = null
    let pageAccessToken = null
    let pageName = null

    for (const page of pagesData.data) {
      if (page.instagram_business_account) {
        // Instagram 계정 정보 가져오기
        const igUrl = new URL(`https://graph.facebook.com/v18.0/${page.instagram_business_account.id}`)
        igUrl.searchParams.set('access_token', page.access_token)
        igUrl.searchParams.set('fields', 'id,username,name,profile_picture_url,followers_count')

        const igResponse = await fetch(igUrl.toString())
        const igData = await igResponse.json()

        if (igData.id) {
          instagramAccount = igData
          pageAccessToken = page.access_token
          pageName = page.name
          break
        }
      }
    }

    if (!instagramAccount || !pageAccessToken) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=no_instagram_business_account`
      )
    }

    // 5. Supabase에 저장
    const supabase = await createClient()

    // 기존 Instagram 채널 확인
    const { data: existingChannel } = await supabase
      .from('ad_channels')
      .select('id')
      .eq('user_id', userId)
      .eq('channel_type', 'instagram')
      .eq('account_id', instagramAccount.id)
      .single()

    const channelData = {
      user_id: userId,
      channel_type: 'instagram',
      channel_name: instagramAccount.username || instagramAccount.name || 'Instagram',
      account_id: instagramAccount.id,
      account_name: instagramAccount.username,
      access_token: pageAccessToken, // 페이지 액세스 토큰 (DM 발송용)
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      my_site_id: siteId, // 빠른 시작에서 전달받은 사이트 ID
      metadata: {
        instagram_user_id: instagramAccount.id,
        username: instagramAccount.username,
        name: instagramAccount.name,
        profile_picture_url: instagramAccount.profile_picture_url,
        followers_count: instagramAccount.followers_count,
        facebook_page_name: pageName,
        dm_enabled: true,
      },
    }

    if (existingChannel) {
      await supabase
        .from('ad_channels')
        .update(channelData)
        .eq('id', existingChannel.id)
    } else {
      const { error: insertError } = await supabase
        .from('ad_channels')
        .insert(channelData)

      if (insertError) {
        console.error('Failed to save Instagram channel:', insertError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=save_failed`
        )
      }
    }

    // 6. Instagram 비즈니스 계정에 대한 Webhook 구독 (댓글 이벤트 수신용)
    try {
      const subscribeUrl = `https://graph.facebook.com/v18.0/${instagramAccount.id}/subscribed_apps`
      const subscribeResponse = await fetch(subscribeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscribed_fields: ['comments', 'messages'],
          access_token: pageAccessToken
        })
      })

      const subscribeResult = await subscribeResponse.json()
      console.log('Instagram Webhook subscription result:', subscribeResult)

      if (subscribeResult.error) {
        console.error('Failed to subscribe to Instagram webhooks:', subscribeResult.error)
        // 구독 실패해도 계속 진행 (필수 권한이 없을 수 있음)
      }
    } catch (webhookError) {
      console.error('Instagram webhook subscription error:', webhookError)
      // 구독 실패해도 계속 진행
    }

    // 성공
    const redirectUrl = siteId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/${from}?success=instagram_connected&siteId=${siteId}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/${from}?success=instagram_connected`

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Instagram DM callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=internal_error`
    )
  }
}
