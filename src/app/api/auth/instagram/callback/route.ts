import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * Instagram OAuth 콜백 처리 (Instagram Login 방식)
 *
 * 2024년 7월 출시된 "Instagram 로그인을 통한 Instagram API" 사용
 * Facebook 페이지 연결 없이 Instagram 프로페셔널 계정으로 직접 인증
 *
 * 참고: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')
    const errorReason = searchParams.get('error_reason')

    // 기본 리다이렉트 경로
    let redirectPath = 'guide'

    // state에서 정보 추출
    let userId: string | null = null
    let siteId: string | null = null

    if (state) {
      try {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
        userId = stateData.userId
        redirectPath = stateData.from || 'guide'
        siteId = stateData.siteId || null

        // timestamp 검증 (10분 이내)
        if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?error=state_expired`
          )
        }
      } catch {
        console.error('Failed to parse state')
      }
    }

    // 사용자가 거부하거나 에러 발생
    if (error) {
      console.error('Instagram OAuth error:', error, errorReason, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?error=${encodeURIComponent(errorDescription || errorReason || error)}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?error=no_code`
      )
    }

    const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID
    const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`

    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?error=configuration_error`
      )
    }

    // 1. Authorization code를 Short-lived Access Token으로 교환
    // https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login#step-2--exchange-the-code-for-a-token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        code: code,
      }).toString(),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error_type || tokenData.error_message) {
      console.error('Instagram token exchange error:', tokenData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?error=token_exchange_failed`
      )
    }

    const shortLivedToken = tokenData.access_token
    const instagramUserId = tokenData.user_id

    if (!shortLivedToken || !instagramUserId) {
      console.error('Missing token or user_id:', tokenData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?error=invalid_token_response`
      )
    }

    // 2. Short-lived token을 Long-lived token으로 교환 (60일)
    // https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login#step-3--exchange-the-short-lived-token-for-a-long-lived-token
    const longLivedTokenUrl = new URL('https://graph.instagram.com/access_token')
    longLivedTokenUrl.searchParams.set('grant_type', 'ig_exchange_token')
    longLivedTokenUrl.searchParams.set('client_secret', INSTAGRAM_APP_SECRET)
    longLivedTokenUrl.searchParams.set('access_token', shortLivedToken)

    const longLivedResponse = await fetch(longLivedTokenUrl.toString())
    const longLivedData = await longLivedResponse.json()

    const accessToken = longLivedData.access_token || shortLivedToken
    const expiresIn = longLivedData.expires_in || 3600

    // 3. Instagram 사용자 정보 가져오기
    // https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/get-started#get-user-info
    // Instagram Login API에서 지원하는 필드만 요청 (account_type, followers_count는 지원 안 될 수 있음)
    const userInfoUrl = new URL(`https://graph.instagram.com/v24.0/me`)
    userInfoUrl.searchParams.set('access_token', accessToken)
    userInfoUrl.searchParams.set('fields', 'user_id,username,name,profile_picture_url,account_type')

    const userInfoResponse = await fetch(userInfoUrl.toString())
    const userInfo = await userInfoResponse.json()

    console.log('Instagram user info response:', JSON.stringify(userInfo))

    if (userInfo.error) {
      console.error('Failed to get Instagram user info:', userInfo.error)
      // 기본 정보만으로 진행 (에러가 나도 토큰은 있으니 저장)
      // return NextResponse.redirect(
      //   `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?error=user_info_failed`
      // )
    }

    // 계정 타입 확인 (BUSINESS 또는 CREATOR만 지원) - 정보가 있을 때만 체크
    if (userInfo?.account_type && !['BUSINESS', 'MEDIA_CREATOR'].includes(userInfo.account_type)) {
      console.error('Not a professional account:', userInfo.account_type)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?error=not_professional_account`
      )
    }

    // 4. Supabase에 저장 (ad_channels 테이블 사용)
    // Admin 클라이언트 사용 (RLS 우회) - OAuth 콜백에서는 세션 쿠키가 없을 수 있음
    const adminSupabase = createAdminClient()
    const supabase = await createClient()

    // userId가 없으면 현재 로그인된 사용자 확인
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?error=not_authenticated`
        )
      }
      userId = user.id
    }

    // 기존 Instagram 채널 확인 (ad_channels)
    const { data: existingAdChannel } = await adminSupabase
      .from('ad_channels')
      .select('id')
      .eq('user_id', userId)
      .eq('channel_type', 'instagram')
      .eq('account_id', instagramUserId.toString())
      .single()

    const adChannelData = {
      user_id: userId,
      channel_type: 'instagram',
      channel_name: userInfo?.username || `Instagram ${instagramUserId}`,
      account_id: instagramUserId.toString(),
      account_name: userInfo?.name || userInfo?.username || null,
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      status: 'connected',
      metadata: {
        instagram_user_id: instagramUserId.toString(),
        profile_picture_url: userInfo?.profile_picture_url || null,
        account_type: userInfo?.account_type || null,
      },
    }

    if (existingAdChannel) {
      const { error: updateError } = await adminSupabase
        .from('ad_channels')
        .update(adChannelData)
        .eq('id', existingAdChannel.id)

      if (updateError) {
        console.error('Failed to update Instagram channel:', updateError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?error=save_failed`
        )
      }
    } else {
      const { error: insertError } = await adminSupabase
        .from('ad_channels')
        .insert(adChannelData)

      if (insertError) {
        console.error('Failed to save Instagram channel:', insertError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?error=save_failed`
        )
      }
    }

    console.log('Instagram channel connected successfully:', {
      userId,
      instagramUserId,
      username: userInfo?.username,
      accountType: userInfo?.account_type,
    })

    // 5. Webhook 구독 (유저별로 필수!)
    // 참고: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/webhooks
    // POST /{INSTAGRAM_ACCOUNT_ID}/subscribed_apps?subscribed_fields=comments,messages

    // 토큰 전파 대기 (Meta 서버 간 동기화 시간 필요)
    console.log('Waiting 3 seconds for token propagation across Meta servers...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 재시도 로직 포함 (일시적 에러 대응)
    const maxRetries = 3
    let webhookSubscribed = false

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Webhook subscription attempt ${attempt}/${maxRetries}...`)

        const subscribeUrl = `https://graph.instagram.com/v24.0/${instagramUserId}/subscribed_apps`
        const subscribeResponse = await fetch(subscribeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            subscribed_fields: 'comments,messages',
            access_token: accessToken,
          }).toString(),
        })

        const subscribeResult = await subscribeResponse.json()

        if (subscribeResult.error) {
          console.error(`Webhook subscription attempt ${attempt} failed:`, subscribeResult.error)

          // 일시적 에러면 재시도
          if (subscribeResult.error.is_transient && attempt < maxRetries) {
            console.log(`Retrying in ${attempt} second(s)...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
            continue
          }
          // 영구적 에러이거나 마지막 시도면 포기
          break
        } else {
          console.log('Webhook subscription successful:', subscribeResult)
          webhookSubscribed = true
          break
        }
      } catch (webhookError) {
        console.error(`Webhook subscription attempt ${attempt} error:`, webhookError)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    // 웹훅 구독 실패해도 계정 연결은 성공으로 처리
    if (!webhookSubscribed) {
      console.warn('Webhook subscription failed after all retries. User can retry later via settings.')
    }

    // 성공
    const redirectUrl = siteId
      ? `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?success=instagram_connected&siteId=${siteId}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/${redirectPath}?success=instagram_connected`

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('Instagram OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/guide?error=internal_error`
    )
  }
}
