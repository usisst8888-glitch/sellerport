/**
 * YouTube Analytics API
 * - 채널 또는 특정 영상의 분석 데이터 조회
 * - 조회수, 시청시간, 도달(노출수), 클릭률, 좋아요 등
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 토큰 갱신 함수
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null
  }

  try {
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
    return data.access_token || null
  } catch (error) {
    console.error('Failed to refresh token:', error)
    return null
  }
}

// 날짜 포맷 (YYYY-MM-DD)
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const adChannelId = searchParams.get('adChannelId')
    const videoId = searchParams.get('videoId') // 특정 영상만 조회할 경우
    const startDate = searchParams.get('startDate') // YYYY-MM-DD
    const endDate = searchParams.get('endDate') // YYYY-MM-DD
    const metrics = searchParams.get('metrics') || 'views,estimatedMinutesWatched,likes,comments,shares,subscribersGained'

    if (!adChannelId) {
      return NextResponse.json({ error: '채널 ID가 필요합니다' }, { status: 400 })
    }

    // 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', adChannelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'youtube')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다' }, { status: 404 })
    }

    if (!channel.access_token) {
      return NextResponse.json({ error: '액세스 토큰이 없습니다. 다시 연동해주세요.' }, { status: 400 })
    }

    let accessToken = channel.access_token

    // 토큰 만료 확인 및 갱신
    const tokenExpiry = new Date(channel.token_expires_at)
    if (tokenExpiry < new Date()) {
      if (!channel.refresh_token) {
        return NextResponse.json({
          error: '토큰이 만료되었습니다. YouTube 채널을 다시 연동해주세요.'
        }, { status: 400 })
      }

      const newAccessToken = await refreshAccessToken(channel.refresh_token)
      if (!newAccessToken) {
        return NextResponse.json({
          error: '토큰 갱신에 실패했습니다. YouTube 채널을 다시 연동해주세요.'
        }, { status: 400 })
      }

      accessToken = newAccessToken

      // 새 토큰 저장
      await supabase
        .from('ad_channels')
        .update({
          access_token: newAccessToken,
          token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
        })
        .eq('id', adChannelId)
    }

    // 기본 날짜 범위: 최근 30일
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // YouTube Analytics API 호출
    const analyticsUrl = new URL('https://youtubeanalytics.googleapis.com/v2/reports')
    analyticsUrl.searchParams.set('ids', `channel==${channel.account_id}`)
    analyticsUrl.searchParams.set('startDate', formatDate(start))
    analyticsUrl.searchParams.set('endDate', formatDate(end))
    analyticsUrl.searchParams.set('metrics', metrics)

    // 특정 영상만 필터링
    if (videoId) {
      analyticsUrl.searchParams.set('filters', `video==${videoId}`)
    }

    // 일별 데이터
    analyticsUrl.searchParams.set('dimensions', 'day')
    analyticsUrl.searchParams.set('sort', 'day')

    const analyticsResponse = await fetch(analyticsUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!analyticsResponse.ok) {
      const errorData = await analyticsResponse.json()
      console.error('YouTube Analytics API error:', errorData)

      return NextResponse.json({
        success: false,
        error: errorData.error?.message || '분석 데이터 조회 실패',
        details: errorData.error
      }, { status: 400 })
    }

    const analyticsData = await analyticsResponse.json()

    // 총계 계산
    const totals: Record<string, number> = {}
    const metricsList = metrics.split(',')

    if (analyticsData.rows && analyticsData.rows.length > 0) {
      analyticsData.rows.forEach((row: (string | number)[]) => {
        // row[0]은 day, row[1]부터 metrics
        metricsList.forEach((metric, index) => {
          const value = Number(row[index + 1]) || 0
          totals[metric] = (totals[metric] || 0) + value
        })
      })
    }

    // 일별 데이터 포맷팅
    const dailyData = analyticsData.rows?.map((row: (string | number)[]) => {
      const data: Record<string, string | number> = { date: row[0] }
      metricsList.forEach((metric, index) => {
        data[metric] = row[index + 1]
      })
      return data
    }) || []

    return NextResponse.json({
      success: true,
      channelId: channel.account_id,
      channelName: channel.channel_name,
      period: {
        startDate: formatDate(start),
        endDate: formatDate(end),
      },
      totals: {
        views: totals.views || 0,
        watchTimeMinutes: totals.estimatedMinutesWatched || 0,
        likes: totals.likes || 0,
        comments: totals.comments || 0,
        shares: totals.shares || 0,
        subscribersGained: totals.subscribersGained || 0,
      },
      dailyData,
      raw: analyticsData,
    })

  } catch (error) {
    console.error('YouTube analytics error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '분석 데이터 조회 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}

// 영상 목록 조회 (업로드한 영상들)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { adChannelId, maxResults = 10 } = await request.json()

    if (!adChannelId) {
      return NextResponse.json({ error: '채널 ID가 필요합니다' }, { status: 400 })
    }

    // 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', adChannelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'youtube')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다' }, { status: 404 })
    }

    if (!channel.access_token) {
      return NextResponse.json({ error: '액세스 토큰이 없습니다. 다시 연동해주세요.' }, { status: 400 })
    }

    let accessToken = channel.access_token

    // 토큰 만료 확인 및 갱신
    const tokenExpiry = new Date(channel.token_expires_at)
    if (tokenExpiry < new Date()) {
      if (!channel.refresh_token) {
        return NextResponse.json({
          error: '토큰이 만료되었습니다. YouTube 채널을 다시 연동해주세요.'
        }, { status: 400 })
      }

      const newAccessToken = await refreshAccessToken(channel.refresh_token)
      if (!newAccessToken) {
        return NextResponse.json({
          error: '토큰 갱신에 실패했습니다. YouTube 채널을 다시 연동해주세요.'
        }, { status: 400 })
      }

      accessToken = newAccessToken

      await supabase
        .from('ad_channels')
        .update({
          access_token: newAccessToken,
          token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString()
        })
        .eq('id', adChannelId)
    }

    // 채널의 업로드 플레이리스트 ID 가져오기
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channel.account_id}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    const channelData = await channelResponse.json()
    const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads

    if (!uploadsPlaylistId) {
      return NextResponse.json({
        success: true,
        videos: [],
        message: '업로드된 영상이 없습니다'
      })
    }

    // 업로드된 영상 목록 가져오기
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    const playlistData = await playlistResponse.json()

    if (!playlistData.items || playlistData.items.length === 0) {
      return NextResponse.json({
        success: true,
        videos: [],
        message: '업로드된 영상이 없습니다'
      })
    }

    // 영상 ID 목록
    const videoIds = playlistData.items.map((item: { contentDetails: { videoId: string } }) =>
      item.contentDetails.videoId
    ).join(',')

    // 영상 상세 정보 (조회수 포함)
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    )

    const videosData = await videosResponse.json()

    const videos = videosData.items?.map((video: {
      id: string
      snippet: {
        title: string
        description: string
        publishedAt: string
        thumbnails: {
          medium?: { url: string }
          default?: { url: string }
        }
      }
      statistics: {
        viewCount: string
        likeCount: string
        commentCount: string
      }
      contentDetails: {
        duration: string
      }
    }) => ({
      videoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      publishedAt: video.snippet.publishedAt,
      thumbnailUrl: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
      videoUrl: `https://www.youtube.com/watch?v=${video.id}`,
      statistics: {
        views: parseInt(video.statistics.viewCount) || 0,
        likes: parseInt(video.statistics.likeCount) || 0,
        comments: parseInt(video.statistics.commentCount) || 0,
      },
      duration: video.contentDetails.duration,
    })) || []

    return NextResponse.json({
      success: true,
      channelId: channel.account_id,
      channelName: channel.channel_name,
      videos,
      totalResults: playlistData.pageInfo?.totalResults || videos.length,
    })

  } catch (error) {
    console.error('YouTube videos list error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '영상 목록 조회 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}
