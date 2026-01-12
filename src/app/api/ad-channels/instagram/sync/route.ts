/**
 * Instagram 전체 동기화 API
 * - 프로필 정보, 미디어, 인사이트 등 모든 데이터 동기화
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
      .eq('channel_type', 'instagram')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const accessToken = channel.access_token
    const syncResults: {
      profile: boolean
      media: number
      insights: boolean
    } = {
      profile: false,
      media: 0,
      insights: false
    }

    // 1. 프로필 정보 가져오기
    const userInfoUrl = new URL('https://graph.instagram.com/me')
    userInfoUrl.searchParams.set('fields', 'user_id,username,name,profile_picture_url,account_type,media_count,followers_count,follows_count,biography,website')
    userInfoUrl.searchParams.set('access_token', accessToken)

    const userInfoResponse = await fetch(userInfoUrl.toString())
    const userInfo = await userInfoResponse.json()

    if (userInfo.error) {
      // 토큰 만료된 경우
      if (userInfo.error.code === 190 || userInfo.error.type === 'OAuthException') {
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
        error: userInfo.error.message || '프로필 정보를 가져오지 못했습니다'
      }, { status: 400 })
    }

    syncResults.profile = true

    // 2. 최근 미디어 가져오기 (최대 25개)
    let recentMedia: Array<{
      id: string
      media_type: string
      media_url?: string
      thumbnail_url?: string
      permalink: string
      caption?: string
      timestamp: string
      like_count?: number
      comments_count?: number
      // 게시물별 인사이트 (비즈니스/크리에이터 계정만)
      insights?: {
        impressions?: number
        reach?: number
        saved?: number
        engagement?: number
        video_views?: number
      }
    }> = []

    try {
      const mediaUrl = new URL(`https://graph.instagram.com/me/media`)
      mediaUrl.searchParams.set('fields', 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count')
      mediaUrl.searchParams.set('limit', '25')
      mediaUrl.searchParams.set('access_token', accessToken)

      const mediaResponse = await fetch(mediaUrl.toString())
      const mediaData = await mediaResponse.json()

      if (mediaData.data && Array.isArray(mediaData.data)) {
        recentMedia = mediaData.data
        syncResults.media = recentMedia.length

        // 비즈니스/크리에이터 계정이면 게시물별 인사이트도 가져오기
        if (userInfo.account_type === 'BUSINESS' || userInfo.account_type === 'CREATOR') {
          for (let i = 0; i < recentMedia.length; i++) {
            const media = recentMedia[i]
            try {
              // 미디어 타입에 따라 가져올 메트릭이 다름
              const metrics = media.media_type === 'VIDEO' || media.media_type === 'REELS'
                ? 'impressions,reach,saved,video_views'
                : 'impressions,reach,saved,engagement'

              const insightUrl = new URL(`https://graph.instagram.com/${media.id}/insights`)
              insightUrl.searchParams.set('metric', metrics)
              insightUrl.searchParams.set('access_token', accessToken)

              const insightResponse = await fetch(insightUrl.toString())
              const insightData = await insightResponse.json()

              if (insightData.data && Array.isArray(insightData.data)) {
                const mediaInsights: typeof recentMedia[0]['insights'] = {}
                for (const metric of insightData.data) {
                  if (metric.name && metric.values?.[0]?.value !== undefined) {
                    mediaInsights[metric.name as keyof typeof mediaInsights] = metric.values[0].value
                  }
                }
                recentMedia[i].insights = mediaInsights
              }
            } catch (insightError) {
              // 개별 게시물 인사이트 실패는 무시하고 계속 진행
              console.error(`Failed to fetch insights for media ${media.id}:`, insightError)
            }
          }
        }
      }
    } catch (mediaError) {
      console.error('Failed to fetch media:', mediaError)
    }

    // 3. 계정 인사이트 가져오기 (비즈니스/크리에이터 계정만)
    let accountInsights: {
      impressions?: number
      reach?: number
      profile_views?: number
    } = {}

    if (userInfo.account_type === 'BUSINESS' || userInfo.account_type === 'CREATOR') {
      try {
        const insightsUrl = new URL(`https://graph.instagram.com/${userInfo.user_id}/insights`)
        insightsUrl.searchParams.set('metric', 'impressions,reach,profile_views')
        insightsUrl.searchParams.set('period', 'day')
        insightsUrl.searchParams.set('access_token', accessToken)

        const insightsResponse = await fetch(insightsUrl.toString())
        const insightsData = await insightsResponse.json()

        if (insightsData.data && Array.isArray(insightsData.data)) {
          for (const metric of insightsData.data) {
            if (metric.name && metric.values?.[0]?.value !== undefined) {
              accountInsights[metric.name as keyof typeof accountInsights] = metric.values[0].value
            }
          }
          syncResults.insights = true
        }
      } catch (insightsError) {
        console.error('Failed to fetch insights:', insightsError)
      }
    }

    // 4. 총 좋아요/댓글/인사이트 수 계산
    let totalLikes = 0
    let totalComments = 0
    let totalImpressions = 0
    let totalReach = 0
    let totalSaved = 0
    let totalVideoViews = 0

    for (const media of recentMedia) {
      totalLikes += media.like_count || 0
      totalComments += media.comments_count || 0
      // 게시물별 인사이트 합계
      if (media.insights) {
        totalImpressions += media.insights.impressions || 0
        totalReach += media.insights.reach || 0
        totalSaved += media.insights.saved || 0
        totalVideoViews += media.insights.video_views || 0
      }
    }

    // 5. 채널 정보 업데이트
    const { error: updateError } = await supabase
      .from('ad_channels')
      .update({
        account_id: userInfo.user_id || channel.account_id,
        account_name: userInfo.username || userInfo.name,
        channel_name: userInfo.username || userInfo.name,
        metadata: {
          ...channel.metadata,
          // 프로필 정보
          profile_picture_url: userInfo.profile_picture_url || null,
          account_type: userInfo.account_type,
          biography: userInfo.biography || null,
          website: userInfo.website || null,
          // 통계
          media_count: userInfo.media_count || 0,
          followers_count: userInfo.followers_count || 0,
          follows_count: userInfo.follows_count || 0,
          // 최근 미디어 통계
          recent_total_likes: totalLikes,
          recent_total_comments: totalComments,
          recent_media_count: recentMedia.length,
          // 게시물별 인사이트 합계 (최근 25개 기준)
          recent_total_impressions: totalImpressions,
          recent_total_reach: totalReach,
          recent_total_saved: totalSaved,
          recent_total_video_views: totalVideoViews,
          // 계정 레벨 인사이트 (일별)
          ...accountInsights,
          // 최근 미디어 상세 (게시물별 인사이트 포함)
          recent_media: recentMedia.map(m => ({
            id: m.id,
            media_type: m.media_type,
            permalink: m.permalink,
            caption: m.caption?.substring(0, 100), // 너무 길면 자르기
            timestamp: m.timestamp,
            like_count: m.like_count || 0,
            comments_count: m.comments_count || 0,
            insights: m.insights || null
          })),
          // 동기화 정보
          last_synced_at: new Date().toISOString()
        },
        status: 'connected'
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
      message: '전체 동기화가 완료되었습니다',
      synced: {
        profile: syncResults.profile,
        media_count: syncResults.media,
        insights: syncResults.insights
      },
      data: {
        username: userInfo.username,
        name: userInfo.name,
        profile_picture_url: userInfo.profile_picture_url,
        account_type: userInfo.account_type,
        media_count: userInfo.media_count,
        followers_count: userInfo.followers_count,
        follows_count: userInfo.follows_count,
        recent_total_likes: totalLikes,
        recent_total_comments: totalComments,
        // 게시물별 인사이트 합계
        recent_total_impressions: totalImpressions,
        recent_total_reach: totalReach,
        recent_total_saved: totalSaved,
        recent_total_video_views: totalVideoViews
      }
    })

  } catch (error) {
    console.error('Instagram sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
