/**
 * Meta 광고 크리에이티브 조회 API
 * - 광고 ID로 크리에이티브 정보(이미지, 영상, 캐러셀) 가져오기
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshMetaToken } from '@/lib/meta/refresh-token'

interface MetaCreativeData {
  id: string
  name?: string
  object_story_spec?: {
    // 이미지 광고
    link_data?: {
      image_hash?: string
      picture?: string
      link?: string
      message?: string
      name?: string
      description?: string
      call_to_action?: {
        type: string
        value?: {
          link?: string
        }
      }
      // 캐러셀
      child_attachments?: Array<{
        link?: string
        picture?: string
        image_hash?: string
        name?: string
        description?: string
      }>
    }
    // 영상 광고
    video_data?: {
      video_id?: string
      image_url?: string
      image_hash?: string
      title?: string
      message?: string
      call_to_action?: {
        type: string
        value?: {
          link?: string
        }
      }
    }
  }
  // 직접 지정된 경우
  image_url?: string
  image_hash?: string
  video_id?: string
  thumbnail_url?: string
}

interface MetaAdData {
  id: string
  name: string
  status: string
  creative?: {
    id: string
  }
  insights?: {
    data: Array<{
      impressions: string
      clicks: string
      spend: string
      actions?: Array<{
        action_type: string
        value: string
      }>
      action_values?: Array<{
        action_type: string
        value: string
      }>
    }>
  }
}

interface MetaVideoData {
  id: string
  source?: string // 영상 다운로드 URL
  thumbnails?: {
    data: Array<{
      uri: string
      width: number
      height: number
    }>
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channelId')
    const adId = searchParams.get('adId')
    const campaignId = searchParams.get('campaignId')

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 })
    }

    // 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'meta')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // 토큰 갱신 체크
    let accessToken = channel.access_token
    const tokenExpiresAt = channel.token_expires_at ? new Date(channel.token_expires_at) : null
    const now = new Date()

    if (tokenExpiresAt && tokenExpiresAt < now) {
      const refreshResult = await refreshMetaToken(channelId, accessToken, supabase)
      if (refreshResult.success && refreshResult.accessToken) {
        accessToken = refreshResult.accessToken
      } else {
        return NextResponse.json({
          error: 'Token expired, please reconnect',
          needsReconnect: true
        }, { status: 401 })
      }
    }

    const adAccountId = channel.metadata?.ad_account_id || `act_${channel.account_id}`

    // 특정 광고 ID가 주어진 경우
    if (adId) {
      const creative = await getAdCreative(adId, accessToken)
      return NextResponse.json({ success: true, creative })
    }

    // 캠페인 ID가 주어진 경우 해당 캠페인의 모든 광고 크리에이티브 가져오기
    if (campaignId) {
      const creatives = await getCampaignCreatives(campaignId, accessToken)
      return NextResponse.json({ success: true, creatives })
    }

    // 둘 다 없으면 광고 계정의 최근 광고들 가져오기
    const creatives = await getAccountCreatives(adAccountId, accessToken)
    return NextResponse.json({ success: true, creatives })

  } catch (error) {
    console.error('Meta creative fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 특정 광고의 크리에이티브 가져오기
async function getAdCreative(adId: string, accessToken: string) {
  // 광고 정보 + 크리에이티브 ID 가져오기
  const adUrl = `https://graph.facebook.com/v18.0/${adId}?fields=id,name,status,creative{id,name,object_story_spec,image_url,image_hash,video_id,thumbnail_url}&access_token=${accessToken}`

  const adResponse = await fetch(adUrl)
  const adData: MetaAdData & { creative?: MetaCreativeData } = await adResponse.json()

  if (!adData.creative) {
    return null
  }

  return parseCreative(adData.creative, accessToken)
}

// 캠페인의 모든 광고 크리에이티브 가져오기
async function getCampaignCreatives(campaignId: string, accessToken: string) {
  // 캠페인의 광고들 가져오기
  const adsUrl = `https://graph.facebook.com/v18.0/${campaignId}/ads?fields=id,name,status,creative{id,name,object_story_spec,image_url,image_hash,video_id,thumbnail_url},insights.date_preset(last_30d){impressions,clicks,spend,actions,action_values}&access_token=${accessToken}&limit=50`

  const adsResponse = await fetch(adsUrl)
  const adsData: { data: Array<MetaAdData & { creative?: MetaCreativeData }> } = await adsResponse.json()

  if (!adsData.data) {
    return []
  }

  const creatives = []
  for (const ad of adsData.data) {
    if (ad.creative) {
      const creative = await parseCreative(ad.creative, accessToken)
      if (creative) {
        // 성과 데이터 추가
        const insight = ad.insights?.data?.[0]
        creatives.push({
          adId: ad.id,
          adName: ad.name,
          status: ad.status,
          ...creative,
          metrics: insight ? {
            impressions: parseInt(insight.impressions) || 0,
            clicks: parseInt(insight.clicks) || 0,
            spend: parseFloat(insight.spend) || 0,
            conversions: insight.actions?.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase')?.value || 0,
            revenue: insight.action_values?.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase')?.value || 0,
          } : null
        })
      }
    }
  }

  return creatives
}

// 광고 계정의 최근 광고들 가져오기
async function getAccountCreatives(adAccountId: string, accessToken: string) {
  const adsUrl = `https://graph.facebook.com/v18.0/${adAccountId}/ads?fields=id,name,status,creative{id,name,object_story_spec,image_url,image_hash,video_id,thumbnail_url},insights.date_preset(last_30d){impressions,clicks,spend,actions,action_values}&access_token=${accessToken}&limit=20&effective_status=["ACTIVE","PAUSED"]`

  const adsResponse = await fetch(adsUrl)
  const adsData: { data: Array<MetaAdData & { creative?: MetaCreativeData }> } = await adsResponse.json()

  if (!adsData.data) {
    return []
  }

  const creatives = []
  for (const ad of adsData.data) {
    if (ad.creative) {
      const creative = await parseCreative(ad.creative, accessToken)
      if (creative) {
        const insight = ad.insights?.data?.[0]
        creatives.push({
          adId: ad.id,
          adName: ad.name,
          status: ad.status,
          ...creative,
          metrics: insight ? {
            impressions: parseInt(insight.impressions) || 0,
            clicks: parseInt(insight.clicks) || 0,
            spend: parseFloat(insight.spend) || 0,
            conversions: parseInt(insight.actions?.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase')?.value || '0'),
            revenue: parseFloat(insight.action_values?.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase')?.value || '0'),
          } : null
        })
      }
    }
  }

  return creatives
}

// 크리에이티브 데이터 파싱
async function parseCreative(creative: MetaCreativeData, accessToken: string) {
  const result: {
    creativeId: string
    type: 'image' | 'video' | 'carousel'
    imageUrls: string[]
    videoUrl: string | null
    thumbnailUrl: string | null
    title: string | null
    message: string | null
    description: string | null
  } = {
    creativeId: creative.id,
    type: 'image',
    imageUrls: [],
    videoUrl: null,
    thumbnailUrl: null,
    title: null,
    message: null,
    description: null,
  }

  const spec = creative.object_story_spec

  // 영상 광고
  if (spec?.video_data) {
    result.type = 'video'
    result.title = spec.video_data.title || null
    result.message = spec.video_data.message || null
    result.thumbnailUrl = spec.video_data.image_url || null

    // 영상 URL 가져오기
    if (spec.video_data.video_id) {
      const videoData = await getVideoSource(spec.video_data.video_id, accessToken)
      if (videoData) {
        result.videoUrl = videoData.source || null
        if (!result.thumbnailUrl && videoData.thumbnails?.data?.[0]) {
          result.thumbnailUrl = videoData.thumbnails.data[0].uri
        }
      }
    }
  }
  // 캐러셀 광고
  else if (spec?.link_data?.child_attachments && spec.link_data.child_attachments.length > 1) {
    result.type = 'carousel'
    result.message = spec.link_data.message || null
    result.title = spec.link_data.name || null
    result.description = spec.link_data.description || null

    for (const child of spec.link_data.child_attachments) {
      if (child.picture) {
        result.imageUrls.push(child.picture)
      }
    }
  }
  // 단일 이미지 광고
  else if (spec?.link_data) {
    result.type = 'image'
    result.message = spec.link_data.message || null
    result.title = spec.link_data.name || null
    result.description = spec.link_data.description || null

    if (spec.link_data.picture) {
      result.imageUrls.push(spec.link_data.picture)
    }
  }
  // 직접 지정된 이미지
  else if (creative.image_url) {
    result.type = 'image'
    result.imageUrls.push(creative.image_url)
  }
  // 직접 지정된 영상
  else if (creative.video_id) {
    result.type = 'video'
    result.thumbnailUrl = creative.thumbnail_url || null

    const videoData = await getVideoSource(creative.video_id, accessToken)
    if (videoData) {
      result.videoUrl = videoData.source || null
    }
  }

  return result
}

// 영상 소스 URL 가져오기
async function getVideoSource(videoId: string, accessToken: string): Promise<MetaVideoData | null> {
  try {
    const videoUrl = `https://graph.facebook.com/v18.0/${videoId}?fields=id,source,thumbnails&access_token=${accessToken}`
    const response = await fetch(videoUrl)
    const data: MetaVideoData = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch video source:', error)
    return null
  }
}
