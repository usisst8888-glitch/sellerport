import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface FacebookTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface FacebookPage {
  id: string
  name: string
  access_token: string
  instagram_business_account?: {
    id: string
  }
}

interface InstagramAccount {
  id: string
  username: string
  name?: string
  profile_picture_url?: string
  followers_count?: number
  follows_count?: number
  media_count?: number
  biography?: string
}

// Instagram OAuth 콜백 처리 (Facebook Login 기반)
// DM 자동발송을 위한 Instagram Graph API 연동
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // 사용자가 거부하거나 에러 발생
    if (error) {
      console.error('Instagram OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/quick-start?error=${encodeURIComponent(errorDescription || error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/quick-start?error=invalid_request`
      )
    }

    // state에서 정보 추출
    let userId: string
    let from: string = 'quick-start'
    let siteId: string | null = null

    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = stateData.userId
      from = stateData.from || 'quick-start'
      siteId = stateData.siteId || null

      // timestamp 검증 (10분 이내)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=state_expired`
        )
      }
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/quick-start?error=invalid_state`
      )
    }

    const FB_APP_ID = process.env.META_APP_ID || process.env.INSTAGRAM_APP_ID
    const FB_APP_SECRET = process.env.META_APP_SECRET || process.env.INSTAGRAM_APP_SECRET
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`

    if (!FB_APP_ID || !FB_APP_SECRET) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=configuration_error`
      )
    }

    // 1. Authorization code를 Access token으로 교환
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    tokenUrl.searchParams.set('client_id', FB_APP_ID)
    tokenUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    tokenUrl.searchParams.set('client_secret', FB_APP_SECRET)
    tokenUrl.searchParams.set('code', code)

    const tokenResponse = await fetch(tokenUrl.toString())
    const tokenData: FacebookTokenResponse = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error('Failed to get access token:', tokenData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=token_exchange_failed`
      )
    }

    // 2. Long-lived access token으로 교환 (60일)
    const longLivedUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token')
    longLivedUrl.searchParams.set('client_id', FB_APP_ID)
    longLivedUrl.searchParams.set('client_secret', FB_APP_SECRET)
    longLivedUrl.searchParams.set('fb_exchange_token', tokenData.access_token)

    const longLivedResponse = await fetch(longLivedUrl.toString())
    const longLivedData: FacebookTokenResponse = await longLivedResponse.json()

    const userAccessToken = longLivedData.access_token || tokenData.access_token
    const expiresIn = longLivedData.expires_in || tokenData.expires_in || 5184000 // 60일

    // 3. 연결된 Facebook 페이지 가져오기 (Instagram 비즈니스 계정이 연결된 페이지)
    const pagesUrl = new URL('https://graph.facebook.com/v18.0/me/accounts')
    pagesUrl.searchParams.set('access_token', userAccessToken)
    pagesUrl.searchParams.set('fields', 'id,name,access_token,instagram_business_account')

    const pagesResponse = await fetch(pagesUrl.toString())
    const pagesData = await pagesResponse.json()

    if (!pagesData.data || pagesData.data.length === 0) {
      console.error('No Facebook pages found')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=no_facebook_page`
      )
    }

    // Instagram 비즈니스 계정이 연결된 페이지 찾기
    const pageWithInstagram = pagesData.data.find(
      (page: FacebookPage) => page.instagram_business_account
    )

    if (!pageWithInstagram || !pageWithInstagram.instagram_business_account) {
      console.error('No Instagram business account found')
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=no_instagram_business`
      )
    }

    const pageAccessToken = pageWithInstagram.access_token
    const instagramAccountId = pageWithInstagram.instagram_business_account.id
    const facebookPageId = pageWithInstagram.id

    // 4. Instagram 비즈니스 계정 정보 가져오기
    const igUrl = new URL(`https://graph.facebook.com/v18.0/${instagramAccountId}`)
    igUrl.searchParams.set('access_token', pageAccessToken)
    igUrl.searchParams.set('fields', 'id,username,name,profile_picture_url,followers_count,follows_count,media_count,biography')

    const igResponse = await fetch(igUrl.toString())
    const igAccount: InstagramAccount = await igResponse.json()

    if (!igAccount.id || !igAccount.username) {
      console.error('Failed to get Instagram account:', igAccount)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=instagram_account_error`
      )
    }

    // 5. Supabase에 저장
    const supabase = await createClient()

    // 기존 연동이 있는지 확인
    const { data: existingChannel } = await supabase
      .from('ad_channels')
      .select('id')
      .eq('user_id', userId)
      .eq('channel_type', 'instagram')
      .eq('account_id', igAccount.username)
      .single()

    const channelData = {
      user_id: userId,
      channel_type: 'instagram',
      channel_name: igAccount.name || igAccount.username,
      account_id: igAccount.username,
      account_name: igAccount.name || igAccount.username,
      access_token: pageAccessToken, // 페이지 토큰 사용 (DM 발송용)
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      is_manual: false,
      my_site_id: siteId,
      metadata: {
        instagram_user_id: igAccount.id,
        instagram_username: igAccount.username,
        facebook_page_id: facebookPageId,
        facebook_page_name: pageWithInstagram.name,
        profile_picture_url: igAccount.profile_picture_url,
        followers_count: igAccount.followers_count,
        follows_count: igAccount.follows_count,
        media_count: igAccount.media_count,
        biography: igAccount.biography,
        dm_enabled: true, // DM 자동발송 가능
        category: 'organic',
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
        console.error('Failed to save Instagram channel:', insertError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/${from}?error=save_failed`
        )
      }
    }

    // 성공 시 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/${from}?success=instagram_connected`
    )
  } catch (error) {
    console.error('Instagram OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/quick-start?error=internal_error`
    )
  }
}
