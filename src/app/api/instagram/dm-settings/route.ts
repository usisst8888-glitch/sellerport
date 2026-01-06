/**
 * Instagram DM 자동발송 설정 API
 * GET - 설정 목록 조회
 * POST - 새 설정 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DM 설정 목록 조회 (또는 trackingLinkId로 단일 조회)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const trackingLinkId = searchParams.get('trackingLinkId')

    // trackingLinkId가 있으면 해당 설정만 조회
    if (trackingLinkId) {
      const { data: setting, error } = await supabase
        .from('instagram_dm_settings')
        .select(`
          *,
          ad_channels (
            id,
            channel_name,
            account_id,
            account_name
          ),
          tracking_links (
            id,
            utm_campaign,
            target_url,
            go_url,
            post_name,
            clicks,
            conversions
          )
        `)
        .eq('user_id', user.id)
        .eq('tracking_link_id', trackingLinkId)
        .single()

      if (error) {
        console.error('Failed to fetch DM setting:', error)
        return NextResponse.json({ error: 'DM 설정을 찾을 수 없습니다' }, { status: 404 })
      }

      return NextResponse.json({ success: true, data: setting })
    }

    // 전체 목록 조회
    const { data: settings, error } = await supabase
      .from('instagram_dm_settings')
      .select(`
        *,
        ad_channels (
          id,
          channel_name,
          account_id,
          account_name,
          access_token
        ),
        tracking_links (
          id,
          utm_campaign,
          target_url,
          go_url,
          post_name,
          clicks,
          conversions
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch DM settings:', error)
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }

    // 썸네일이 없는 설정들에 대해 Instagram API에서 가져와서 업데이트
    if (settings && settings.length > 0) {
      const settingsToUpdate = settings.filter(s => !s.instagram_thumbnail_url && s.instagram_media_id && s.ad_channels?.access_token)

      for (const setting of settingsToUpdate) {
        try {
          const accessToken = setting.ad_channels?.access_token
          if (!accessToken) continue

          // Instagram API에서 미디어 정보 가져오기
          const mediaUrl = new URL(`https://graph.instagram.com/v24.0/${setting.instagram_media_id}`)
          mediaUrl.searchParams.set('access_token', accessToken)
          mediaUrl.searchParams.set('fields', 'id,media_type,media_url,thumbnail_url,permalink')

          const response = await fetch(mediaUrl.toString())
          const mediaData = await response.json()

          if (!mediaData.error && (mediaData.thumbnail_url || mediaData.media_url)) {
            const thumbnailUrl = mediaData.thumbnail_url || mediaData.media_url

            // DB 업데이트
            await supabase
              .from('instagram_dm_settings')
              .update({ instagram_thumbnail_url: thumbnailUrl })
              .eq('id', setting.id)

            // 현재 응답에도 반영
            setting.instagram_thumbnail_url = thumbnailUrl
          }
        } catch (e) {
          console.error('Failed to fetch thumbnail for setting:', setting.id, e)
        }
      }
    }

    // access_token 제거 후 반환
    const sanitizedSettings = settings?.map(s => ({
      ...s,
      ad_channels: s.ad_channels ? {
        id: s.ad_channels.id,
        channel_name: s.ad_channels.channel_name,
        account_id: s.ad_channels.account_id,
        account_name: s.ad_channels.account_name
      } : null
    }))

    return NextResponse.json({ success: true, data: sanitizedSettings })
  } catch (error) {
    console.error('DM settings API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 새 DM 설정 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      adChannelId,
      trackingLinkId,
      instagramMediaId,
      instagramMediaUrl,
      instagramMediaType,
      instagramCaption,
      instagramThumbnailUrl,
      triggerKeywords,
      dmMessage,
      includeFollowCta,
      followCtaMessage,
    } = body

    if (!adChannelId || !instagramMediaId || !dmMessage) {
      return NextResponse.json({
        error: '필수 항목이 누락되었습니다 (Instagram 채널, 게시물 ID, DM 메시지)'
      }, { status: 400 })
    }

    // 해당 Instagram 채널이 사용자의 것인지 확인
    const { data: channel } = await supabase
      .from('ad_channels')
      .select('id, user_id')
      .eq('id', adChannelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'instagram')
      .single()

    if (!channel) {
      return NextResponse.json({ error: 'Instagram 채널을 찾을 수 없습니다' }, { status: 404 })
    }

    // 동일 게시물에 대한 설정이 있는지 확인
    const { data: existing } = await supabase
      .from('instagram_dm_settings')
      .select('id')
      .eq('user_id', user.id)
      .eq('instagram_media_id', instagramMediaId)
      .single()

    if (existing) {
      return NextResponse.json({
        error: '이 게시물에 대한 DM 설정이 이미 존재합니다'
      }, { status: 409 })
    }

    // DM 설정 생성
    const { data: setting, error } = await supabase
      .from('instagram_dm_settings')
      .insert({
        user_id: user.id,
        ad_channel_id: adChannelId,
        tracking_link_id: trackingLinkId || null,
        instagram_media_id: instagramMediaId,
        instagram_media_url: instagramMediaUrl,
        instagram_media_type: instagramMediaType,
        instagram_caption: instagramCaption,
        instagram_thumbnail_url: instagramThumbnailUrl || null,
        trigger_keywords: triggerKeywords || ['링크', '구매', '정보', '가격'],
        dm_message: dmMessage,
        include_follow_cta: includeFollowCta || false,
        follow_cta_message: followCtaMessage,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create DM setting:', error)
      return NextResponse.json({ error: 'Failed to create setting' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: setting })
  } catch (error) {
    console.error('DM settings create API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
