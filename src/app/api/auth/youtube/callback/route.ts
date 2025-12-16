import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  scope: string
}

interface YouTubeChannel {
  id: string
  snippet: {
    title: string
    description: string
    customUrl?: string
    thumbnails: {
      default?: { url: string }
      medium?: { url: string }
      high?: { url: string }
    }
  }
  statistics: {
    viewCount: string
    subscriberCount: string
    hiddenSubscriberCount: boolean
    videoCount: string
  }
}

interface YouTubeChannelListResponse {
  items?: YouTubeChannel[]
}

// YouTube OAuth 콜백 처리
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // 사용자가 거부하거나 에러 발생
    if (error) {
      console.error('YouTube OAuth error:', error, errorDescription)
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

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/youtube/callback`

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=configuration_error`
      )
    }

    // 1. Authorization code를 Access token으로 교환
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    })

    const tokenData: GoogleTokenResponse = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error('Failed to get access token:', tokenData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=token_exchange_failed`
      )
    }

    // 2. YouTube Data API로 채널 정보 가져오기
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      }
    )

    const channelData: YouTubeChannelListResponse = await channelResponse.json()

    if (!channelData.items || channelData.items.length === 0) {
      console.error('No YouTube channel found:', channelData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=no_youtube_channel`
      )
    }

    const channel = channelData.items[0]

    // 3. Supabase에 저장
    const supabase = await createClient()

    // 기존 연동이 있는지 확인
    const { data: existingChannel } = await supabase
      .from('ad_channels')
      .select('id')
      .eq('user_id', userId)
      .eq('channel_type', 'youtube')
      .eq('account_id', channel.id)
      .single()

    const channelDbData = {
      user_id: userId,
      channel_type: 'youtube',
      channel_name: channel.snippet.title,
      account_id: channel.id,
      account_name: channel.snippet.title,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      is_manual: false,
      metadata: {
        channel_url: channel.snippet.customUrl
          ? `https://youtube.com/${channel.snippet.customUrl}`
          : `https://youtube.com/channel/${channel.id}`,
        thumbnail_url: channel.snippet.thumbnails?.medium?.url || channel.snippet.thumbnails?.default?.url,
        subscriber_count: parseInt(channel.statistics.subscriberCount) || 0,
        video_count: parseInt(channel.statistics.videoCount) || 0,
        view_count: parseInt(channel.statistics.viewCount) || 0,
        hidden_subscriber_count: channel.statistics.hiddenSubscriberCount,
        description: channel.snippet.description,
        category: 'organic',
      },
    }

    if (existingChannel) {
      // 기존 연동 업데이트
      await supabase
        .from('ad_channels')
        .update(channelDbData)
        .eq('id', existingChannel.id)
    } else {
      // 새 연동 생성
      const { error: insertError } = await supabase
        .from('ad_channels')
        .insert(channelDbData)

      if (insertError) {
        console.error('Failed to save YouTube channel:', insertError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=save_failed`
        )
      }
    }

    // 성공 시 ad-channels 페이지로 리다이렉트
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?success=youtube_connected`
    )
  } catch (error) {
    console.error('YouTube OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=internal_error`
    )
  }
}
