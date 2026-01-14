/**
 * 추적 링크 API
 * GET /api/tracking-links - 추적 링크 목록 조회
 * POST /api/tracking-links - 새 추적 링크 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'
import { extractOgImage } from '@/lib/utils/og-image'

// 추적 링크 목록 조회
export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 추적 링크 목록 조회 (products의 price, cost 포함)
    const { data: trackingLinks, error } = await supabase
      .from('tracking_links')
      .select(`
        *,
        products (
          id,
          name,
          image_url,
          price,
          cost
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Tracking links fetch error:', error)
      return NextResponse.json({ error: '추적 링크 조회에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: trackingLinks })

  } catch (error) {
    console.error('Tracking links API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 새 추적 링크 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const {
      productId, utmSource, utmMedium, utmCampaign, targetUrl, adSpend, targetRoasGreen, targetRoasYellow,
      channelType, postName, enableDmAutoSend, dmTriggerKeywords, dmMessage,
      requireFollow, followMessage, followButtonText,
      // Instagram 게시물 정보 (DM 자동발송용)
      instagramMediaId, instagramMediaUrl, instagramMediaType, instagramCaption, instagramThumbnailUrl,
      // 광고 채널 연결 (Instagram 포함)
      adChannelId,
      // 캐러셀 관련
      sendMode, carouselProductIds, selectedProductId
    } = body

    if (!targetUrl) {
      return NextResponse.json({ error: '목적지 URL은 필수입니다' }, { status: 400 })
    }

    // channelType이 있으면 utmSource/utmMedium 자동 설정
    const finalUtmSource = utmSource || channelType || 'direct'
    const finalUtmMedium = utmMedium || (channelType ? 'social' : 'referral')
    const finalUtmCampaign = utmCampaign || postName || `tracking_${Date.now()}`

    // 구독 상태 확인
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()

    let hasAccess = false
    if (sub) {
      hasAccess = true
    } else {
      // 무료 체험 기간 확인
      const { data: profile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        const createdAt = new Date(profile.created_at)
        const now = new Date()
        const diffDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
        hasAccess = diffDays < 30
      }
    }

    // 체험 만료된 사용자는 추적 링크 3개 제한
    if (!hasAccess) {
      const { count: currentCount } = await supabase
        .from('tracking_links')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if ((currentCount || 0) >= 3) {
        return NextResponse.json({
          error: '체험 기간이 만료되었습니다. 구독하시면 무제한으로 추적 링크를 사용할 수 있습니다.',
          code: 'TRACKING_LINK_LIMIT_EXCEEDED',
          currentCount: currentCount,
          limit: 3
        }, { status: 403 })
      }
    }

    // 사용자 잔액 확인 (유료 추적 링크 구매 시스템용)
    const { data: balance } = await supabase
      .from('user_balance')
      .select('slot_balance')
      .eq('user_id', user.id)
      .single()

    const currentBalance = balance?.slot_balance || 0

    // 추적 링크 ID 생성
    const trackingLinkId = `TL-${nanoid(8).toUpperCase()}`

    // 트래킹 전용 도메인 (짧은 URL용) - 없으면 기본 앱 URL 사용
    const trackingBaseUrl = process.env.NEXT_PUBLIC_TRACKING_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // 모든 경우에 go_url 사용 (브릿지샵 제거 - 네이버 스마트스토어 연동으로 전환 추적 가능)
    const goUrl = `${trackingBaseUrl}/go/${trackingLinkId}`
    const trackingUrl = goUrl

    // 썸네일 URL 결정: Instagram > 목적지 URL OG 이미지 자동 추출
    let finalThumbnailUrl = instagramThumbnailUrl || null
    if (!finalThumbnailUrl && targetUrl) {
      // 목적지 URL에서 OG 이미지 자동 추출 (스마트스토어 등)
      finalThumbnailUrl = await extractOgImage(targetUrl)
    }

    // 추적 링크 생성
    const insertData: any = {
      id: trackingLinkId,
      user_id: user.id,
      product_id: productId || null,
      utm_source: finalUtmSource,
      utm_medium: finalUtmMedium,
      utm_campaign: finalUtmCampaign,
      target_url: targetUrl,
      tracking_url: trackingUrl,
      go_url: goUrl,
      channel_type: channelType || null,
      post_name: postName || null,
      status: 'active',
      clicks: 0,
      conversions: 0,
      revenue: 0,
      ad_spend: adSpend || 0,
      target_roas_green: targetRoasGreen ?? 300,
      target_roas_yellow: targetRoasYellow ?? 150,
      thumbnail_url: finalThumbnailUrl
    }

    // ad_channel_id는 컬럼이 존재할 때만 추가 (마이그레이션 적용 전 호환성)
    if (adChannelId) {
      insertData.ad_channel_id = adChannelId
    }

    const { data: trackingLink, error } = await supabase
      .from('tracking_links')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Tracking link create error:', error)
      return NextResponse.json({ error: '추적 링크 생성에 실패했습니다' }, { status: 500 })
    }

    // 잔액 차감 (유료인 경우)
    if (currentBalance > 0) {
      await supabase
        .from('user_balance')
        .update({ slot_balance: currentBalance - 1 })
        .eq('user_id', user.id)
    }

    // Instagram DM 자동발송 설정 (Instagram 채널 + 옵션 활성화 시)
    if (channelType === 'instagram' && enableDmAutoSend && dmMessage && adChannelId) {
      // 지정된 Instagram 채널 확인 (본인 채널인지 검증)
      const { data: instagramChannel } = await supabase
        .from('ad_channels')
        .select('id')
        .eq('id', adChannelId)
        .eq('user_id', user.id)
        .eq('channel_type', 'instagram')
        .eq('status', 'connected')
        .single()

      if (instagramChannel) {
        // 키워드 파싱 (쉼표로 구분된 문자열 → 배열)
        const keywords = dmTriggerKeywords
          ? dmTriggerKeywords.split(',').map((k: string) => k.trim()).filter((k: string) => k)
          : ['링크', '구매', '정보', '가격']

        // 게시물 정보가 있으면 바로 활성화, 없으면 비활성화
        const hasMediaInfo = instagramMediaId && instagramMediaId !== 'pending_selection'

        // DM 설정 생성 (ad_channel_id 사용)
        const { error: dmSettingsError } = await supabase
          .from('instagram_dm_settings')
          .insert({
            user_id: user.id,
            ad_channel_id: instagramChannel.id,
            tracking_link_id: trackingLinkId,
            instagram_media_id: instagramMediaId || 'pending_selection',
            instagram_media_url: instagramMediaUrl || null,
            instagram_media_type: instagramMediaType || null,
            instagram_caption: instagramCaption || postName || null,
            instagram_thumbnail_url: instagramThumbnailUrl || null,
            trigger_keywords: keywords,
            dm_message: dmMessage,
            follow_cta_message: followMessage || null,
            follow_button_text: followButtonText || '팔로우 했어요!',
            require_follow: requireFollow ?? true,
            is_active: hasMediaInfo,
            // 캐러셀 관련
            send_mode: sendMode || 'single',
            carousel_product_ids: carouselProductIds || null,
            selected_product_id: selectedProductId || null,
          })

        if (dmSettingsError) {
          console.error('DM settings insert error:', dmSettingsError)
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: trackingLink,
      trackingUrl
    })

  } catch (error) {
    console.error('Tracking link create API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
