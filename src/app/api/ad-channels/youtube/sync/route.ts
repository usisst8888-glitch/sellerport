/**
 * YouTube 채널 동기화 API
 * - 채널 정보, 통계 등 데이터 동기화
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
  error?: {
    code: number
    message: string
    status: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId } = await request.json()

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 })
    }

    // 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'youtube')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    let accessToken = channel.access_token

    // 토큰 만료 체크 및 갱신
    const tokenExpiresAt = channel.token_expires_at ? new Date(channel.token_expires_at) : null
    const now = new Date()

    if (tokenExpiresAt && tokenExpiresAt < now && channel.refresh_token) {
      // 토큰 갱신 시도
      const refreshResult = await refreshYoutubeToken(channel.refresh_token)

      if (refreshResult.success && refreshResult.accessToken) {
        accessToken = refreshResult.accessToken

        // DB에 새 토큰 저장
        await supabase
          .from('ad_channels')
          .update({
            access_token: refreshResult.accessToken,
            token_expires_at: new Date(Date.now() + (refreshResult.expiresIn || 3600) * 1000).toISOString()
          })
          .eq('id', channelId)
      } else {
        // 갱신 실패 - 토큰 만료 상태로 변경
        await supabase
          .from('ad_channels')
          .update({ status: 'token_expired' })
          .eq('id', channelId)

        return NextResponse.json({
          success: false,
          error: '토큰이 만료되었습니다. 다시 연동해주세요.',
          needsReconnect: true
        }, { status: 401 })
      }
    }

    // YouTube Data API로 채널 정보 가져오기
    const channelResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    const channelData: YouTubeChannelListResponse = await channelResponse.json()

    if (channelData.error) {
      // 토큰 만료된 경우
      if (channelData.error.code === 401) {
        await supabase
          .from('ad_channels')
          .update({ status: 'token_expired' })
          .eq('id', channelId)

        return NextResponse.json({
          success: false,
          error: '토큰이 만료되었습니다. 다시 연동해주세요.',
          needsReconnect: true
        }, { status: 401 })
      }

      return NextResponse.json({
        success: false,
        error: channelData.error.message || '채널 정보를 가져오지 못했습니다'
      }, { status: 400 })
    }

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'YouTube 채널을 찾을 수 없습니다'
      }, { status: 404 })
    }

    const ytChannel = channelData.items[0]

    // 채널 정보 업데이트
    const { error: updateError } = await supabase
      .from('ad_channels')
      .update({
        account_id: ytChannel.id,
        account_name: ytChannel.snippet.title,
        channel_name: ytChannel.snippet.title,
        metadata: {
          ...channel.metadata,
          channel_url: ytChannel.snippet.customUrl
            ? `https://youtube.com/${ytChannel.snippet.customUrl}`
            : `https://youtube.com/channel/${ytChannel.id}`,
          thumbnail_url: ytChannel.snippet.thumbnails?.medium?.url || ytChannel.snippet.thumbnails?.default?.url,
          subscriber_count: parseInt(ytChannel.statistics.subscriberCount) || 0,
          video_count: parseInt(ytChannel.statistics.videoCount) || 0,
          view_count: parseInt(ytChannel.statistics.viewCount) || 0,
          hidden_subscriber_count: ytChannel.statistics.hiddenSubscriberCount,
          description: ytChannel.snippet.description,
          last_synced_at: new Date().toISOString()
        },
        status: 'connected',
        last_sync_at: new Date().toISOString()
      })
      .eq('id', channelId)

    if (updateError) {
      console.error('Failed to update channel:', updateError)
      return NextResponse.json({
        success: false,
        error: '채널 정보 업데이트에 실패했습니다'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '동기화가 완료되었습니다',
      data: {
        channel_name: ytChannel.snippet.title,
        subscriber_count: parseInt(ytChannel.statistics.subscriberCount) || 0,
        video_count: parseInt(ytChannel.statistics.videoCount) || 0,
        view_count: parseInt(ytChannel.statistics.viewCount) || 0
      }
    })

  } catch (error) {
    console.error('YouTube sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// YouTube 토큰 갱신
async function refreshYoutubeToken(refreshToken: string): Promise<{
  success: boolean
  accessToken?: string
  expiresIn?: number
}> {
  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return { success: false }
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()

    if (data.access_token) {
      return {
        success: true,
        accessToken: data.access_token,
        expiresIn: data.expires_in
      }
    }

    return { success: false }
  } catch (error) {
    console.error('Failed to refresh YouTube token:', error)
    return { success: false }
  }
}
