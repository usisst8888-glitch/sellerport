/**
 * 전환 추적 API
 * POST /api/conversions/track
 *
 * 주문이 발생하면 쿠키(sp_tracking_link)로 어떤 추적 링크에서 온 주문인지 매칭
 * 추적 링크별 매출/전환 수 업데이트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMetaClient } from '@/lib/meta/conversions-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface ConversionData {
  // 필수
  orderId: string           // 주문 번호
  orderAmount: number       // 주문 금액

  // 추적 링크 매칭용 (쿠키에서 가져옴)
  trackingLinkId?: string   // sp_tracking_link 쿠키
  clickId?: string          // sp_click_id 쿠키
  clickTime?: number        // sp_click_time 쿠키

  // 상품 정보
  productId?: string
  productName?: string
  quantity?: number

  // 메타 픽셀용
  fbp?: string              // _fbp 쿠키
  fbc?: string              // _fbc 쿠키

  // 추가 정보
  userId?: string
  siteType?: string     // 'naver', 'coupang', 'cafe24' 등
  metadata?: Record<string, any>
}

export async function POST(request: NextRequest) {
  try {
    const body: ConversionData = await request.json()
    const { orderId, orderAmount, trackingLinkId, clickId, productId, productName, quantity = 1, fbp, fbc, userId, siteType, metadata } = body

    if (!orderId || !orderAmount) {
      return NextResponse.json({
        success: false,
        error: 'orderId와 orderAmount는 필수입니다'
      }, { status: 400 })
    }

    // 추적 링크 ID가 없으면 쿠키에서 가져오기
    const cookies = request.cookies
    const finalTrackingLinkId = trackingLinkId || cookies.get('sp_tracking_link')?.value
    const finalClickId = clickId || cookies.get('sp_click_id')?.value
    const finalFbp = fbp || cookies.get('_fbp')?.value
    const finalFbc = fbc || cookies.get('_fbc')?.value

    if (!finalTrackingLinkId) {
      // 추적 링크 ID 없으면 전환 추적 불가 (유기적 유입)
      return NextResponse.json({
        success: true,
        matched: false,
        message: '추적 링크 ID가 없어 전환 추적이 불가능합니다 (유기적 유입)'
      })
    }

    // 추적 링크 조회
    const { data: trackingLink, error: trackingLinkError } = await supabase
      .from('tracking_links')
      .select('id, user_id, conversions, revenue, campaign_id')
      .eq('id', finalTrackingLinkId)
      .single()

    if (trackingLinkError || !trackingLink) {
      return NextResponse.json({
        success: false,
        error: '추적 링크를 찾을 수 없습니다'
      }, { status: 404 })
    }

    // 중복 전환 체크 (같은 주문 번호)
    const { data: existingConversion } = await supabase
      .from('conversions')
      .select('id')
      .eq('order_id', orderId)
      .single()

    if (existingConversion) {
      return NextResponse.json({
        success: true,
        matched: true,
        duplicate: true,
        message: '이미 기록된 전환입니다'
      })
    }

    // 전환 기록 저장
    const conversionId = `CV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const { error: insertError } = await supabase.from('conversions').insert({
      id: conversionId,
      tracking_link_id: finalTrackingLinkId,
      user_id: trackingLink.user_id,
      click_id: finalClickId,
      order_id: orderId,
      order_amount: orderAmount,
      product_id: productId,
      product_name: productName,
      quantity,
      fbp: finalFbp,
      fbc: finalFbc,
      site_type: siteType,
      converted_at: new Date().toISOString(),
      metadata: metadata || {}
    })

    if (insertError) {
      console.error('Conversion insert error:', insertError)
      // conversions 테이블이 없을 수 있음 - 테이블 생성 필요
    }

    // 추적 링크 전환 수/매출 업데이트
    await supabase
      .from('tracking_links')
      .update({
        conversions: (trackingLink.conversions || 0) + 1,
        revenue: (trackingLink.revenue || 0) + orderAmount
      })
      .eq('id', finalTrackingLinkId)

    // 캠페인이 있으면 캠페인도 업데이트
    if (trackingLink.campaign_id) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('conversions, revenue')
        .eq('id', trackingLink.campaign_id)
        .single()

      if (campaign) {
        await supabase
          .from('campaigns')
          .update({
            conversions: (campaign.conversions || 0) + 1,
            revenue: (campaign.revenue || 0) + orderAmount
          })
          .eq('id', trackingLink.campaign_id)
      }
    }

    // 클릭 로그에 전환 표시
    if (finalClickId) {
      await supabase
        .from('tracking_link_clicks')
        .update({
          is_converted: true,
          converted_at: new Date().toISOString(),
          order_id: orderId,
          order_amount: orderAmount
        })
        .eq('click_id', finalClickId)
    }

    // Meta CAPI Purchase 이벤트 전송
    let metaSent = false
    let metaResult: { events_received?: number; fbtrace_id?: string } = {}

    try {
      // 추적 링크의 Meta 설정 조회
      const { data: trackingLinkMeta } = await supabase
        .from('tracking_links')
        .select('meta_pixel_id, meta_access_token, target_url')
        .eq('id', finalTrackingLinkId)
        .single()

      let pixelId = trackingLinkMeta?.meta_pixel_id
      let accessToken = trackingLinkMeta?.meta_access_token

      // 추적 링크에 설정이 없으면 사용자 기본 설정 조회
      if (!pixelId || !accessToken) {
        const { data: userSettings } = await supabase
          .from('user_settings')
          .select('meta_pixel_id, meta_access_token')
          .eq('user_id', trackingLink.user_id)
          .single()

        if (userSettings) {
          pixelId = pixelId || userSettings.meta_pixel_id
          accessToken = accessToken || userSettings.meta_access_token
        }
      }

      // Meta 설정이 있으면 Purchase 이벤트 전송
      if (pixelId && accessToken) {
        const metaClient = createMetaClient(
          pixelId,
          accessToken,
          process.env.NODE_ENV !== 'production' ? 'TEST_EVENT' : undefined
        )

        const result = await metaClient.trackPurchase({
          userData: {
            fbp: finalFbp || undefined,
            fbc: finalFbc || undefined,
            clientIp: request.headers.get('x-forwarded-for')?.split(',')[0] || undefined,
            userAgent: request.headers.get('user-agent') || undefined
          },
          value: orderAmount,
          currency: 'KRW',
          orderId: orderId,
          productIds: productId ? [productId] : undefined,
          productName: productName,
          numItems: quantity,
          eventSourceUrl: trackingLinkMeta?.target_url
        })

        metaSent = true
        metaResult = result

        // 전환 기록에 Meta 전송 결과 업데이트
        await supabase
          .from('conversions')
          .update({
            meta_sent: true,
            meta_sent_at: new Date().toISOString(),
            meta_event_id: `purchase_${orderId}_${Date.now()}`
          })
          .eq('id', conversionId)
      }
    } catch (metaError) {
      console.error('Meta CAPI error:', metaError)
      // Meta 전송 실패는 전체 응답에 영향 주지 않음
    }

    return NextResponse.json({
      success: true,
      matched: true,
      data: {
        conversionId,
        trackingLinkId: finalTrackingLinkId,
        orderId,
        orderAmount,
        metaSent,
        metaEventsReceived: metaResult.events_received
      }
    })

  } catch (error) {
    console.error('Conversion track error:', error)
    return NextResponse.json({
      success: false,
      error: '전환 추적에 실패했습니다'
    }, { status: 500 })
  }
}

/**
 * 자체몰용 전환 추적 (JS SDK)
 * 구매완료 페이지에서 호출
 *
 * 사용 예시:
 * sellerport('track', 'Purchase', {
 *   tracking_link_id: getCookie('sp_tracking_link'),
 *   value: 50000,
 *   order_id: 'ORDER_123'
 * })
 */
