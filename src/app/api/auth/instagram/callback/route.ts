import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface InstagramTokenResponse {
  access_token: string
  user_id: number
}

interface InstagramLongLivedTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface InstagramUserProfile {
  id: string
  username: string
  account_type?: string
  media_count?: number
  followers_count?: number
  follows_count?: number
  biography?: string
  profile_picture_url?: string
  name?: string
}

// Instagram OAuth 콜백 처리 (Instagram API 전용)
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
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=${encodeURIComponent(errorDescription || error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=invalid_request`
      )
    }

    // state에서 user_id 추출
    let userId: string
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = stateData.userId

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

    const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID
    const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`

    if (!INSTAGRAM_APP_ID || !INSTAGRAM_APP_SECRET) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=configuration_error`
      )
    }

    // 1. Authorization code를 Short-lived Access token으로 교환
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
      }),
    })

    const tokenData: InstagramTokenResponse = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error('Failed to get access token:', tokenData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=token_exchange_failed`
      )
    }

    // 2. Short-lived token을 Long-lived token으로 교환 (60일)
    const longLivedTokenUrl = new URL('https://graph.instagram.com/access_token')
    longLivedTokenUrl.searchParams.set('grant_type', 'ig_exchange_token')
    longLivedTokenUrl.searchParams.set('client_secret', INSTAGRAM_APP_SECRET)
    longLivedTokenUrl.searchParams.set('access_token', tokenData.access_token)

    const longLivedResponse = await fetch(longLivedTokenUrl.toString())
    const longLivedData: InstagramLongLivedTokenResponse = await longLivedResponse.json()

    const accessToken = longLivedData.access_token || tokenData.access_token
    const expiresIn = longLivedData.expires_in || 3600

    // 3. Instagram 사용자 프로필 정보 가져오기
    const profileUrl = new URL('https://graph.instagram.com/me')
    profileUrl.searchParams.set('access_token', accessToken)
    profileUrl.searchParams.set('fields', 'id,username,account_type,media_count,followers_count,follows_count,biography,profile_picture_url,name')

    const profileResponse = await fetch(profileUrl.toString())
    const profile: InstagramUserProfile = await profileResponse.json()

    if (!profile.id || !profile.username) {
      console.error('Failed to get Instagram profile:', profile)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=instagram_account_error`
      )
    }

    // 4. Supabase에 저장
    const supabase = await createClient()

    // 기존 연동이 있는지 확인
    const { data: existingChannel } = await supabase
      .from('ad_channels')
      .select('id')
      .eq('user_id', userId)
      .eq('channel_type', 'instagram')
      .eq('account_id', profile.username)
      .single()

    const channelData = {
      user_id: userId,
      channel_type: 'instagram',
      channel_name: profile.name || profile.username,
      account_id: profile.username,
      account_name: profile.name || profile.username,
      access_token: accessToken,
      token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      is_manual: false,
      metadata: {
        instagram_user_id: profile.id,
        account_type: profile.account_type,
        profile_picture_url: profile.profile_picture_url,
        followers_count: profile.followers_count,
        follows_count: profile.follows_count,
        media_count: profile.media_count,
        biography: profile.biography,
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
          `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=save_failed`
        )
      }
    }

    // 성공 시 ad-channels 페이지로 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?success=instagram_connected`
    )
  } catch (error) {
    console.error('Instagram OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=internal_error`
    )
  }
}
