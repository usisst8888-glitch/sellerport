/**
 * Meta CAPI Purchase 이벤트 전송 API
 * POST /api/conversions/purchase
 *
 * 전환이 감지되면 호출하여 Meta에 Purchase 이벤트 전송
 * - 주문 정보와 쿠키(fbp, fbc)를 매칭하여 전송
 * - 추적 링크에 연결된 Meta Pixel/Access Token 사용
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMetaClient } from '@/lib/meta/conversions-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PurchaseRequest {
  conversionId: string
  trackingLinkId: string
  orderId: string
  orderAmount: number
  productName?: string
  productId?: string
  quantity?: number
  // 사용자 데이터
  fbp?: string
  fbc?: string
  clientIp?: string
  userAgent?: string
  email?: string
  phone?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PurchaseRequest = await request.json()

    const {
      conversionId,
      trackingLinkId,
      orderId,
      orderAmount,
      productName,
      productId,
      quantity,
      fbp,
      fbc,
      clientIp,
      userAgent,
      email,
      phone
    } = body

    if (!trackingLinkId || !orderId) {
      return NextResponse.json({
        success: false,
        error: 'trackingLinkId와 orderId는 필수입니다'
      }, { status: 400 })
    }

    // 추적 링크 정보 조회 (Meta 설정 포함)
    const { data: trackingLink, error: trackingLinkError } = await supabase
      .from('tracking_links')
      .select(`
        id,
        user_id,
        utm_campaign,
        meta_pixel_id,
        meta_access_token,
        target_url
      `)
      .eq('id', trackingLinkId)
      .single()

    if (trackingLinkError || !trackingLink) {
      return NextResponse.json({
        success: false,
        error: '추적 링크를 찾을 수 없습니다'
      }, { status: 404 })
    }

    // Meta 설정이 없으면 사용자의 기본 Meta 설정 조회
    let pixelId = trackingLink.meta_pixel_id
    let accessToken = trackingLink.meta_access_token

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

    // Meta 설정이 여전히 없으면 스킵
    if (!pixelId || !accessToken) {
      return NextResponse.json({
        success: true,
        message: 'Meta CAPI 설정이 없어 스킵합니다',
        metaSent: false
      })
    }

    // 클릭 정보에서 fbp, fbc 가져오기 (쿠키에서 못 가져온 경우)
    let finalFbp = fbp
    let finalFbc = fbc
    let finalClientIp = clientIp
    let finalUserAgent = userAgent

    if (!finalFbp || !finalFbc) {
      // 해당 추적 링크의 최근 클릭에서 fbp, fbc 조회
      const { data: recentClick } = await supabase
        .from('tracking_link_clicks')
        .select('fbp, fbc, ip_address, user_agent')
        .eq('tracking_link_id', trackingLinkId)
        .order('clicked_at', { ascending: false })
        .limit(1)
        .single()

      if (recentClick) {
        finalFbp = finalFbp || recentClick.fbp
        finalFbc = finalFbc || recentClick.fbc
        finalClientIp = finalClientIp || recentClick.ip_address
        finalUserAgent = finalUserAgent || recentClick.user_agent
      }
    }

    // Meta CAPI 클라이언트 생성
    const metaClient = createMetaClient(
      pixelId,
      accessToken,
      process.env.NODE_ENV !== 'production' ? 'TEST_EVENT' : undefined
    )

    // Purchase 이벤트 전송
    const result = await metaClient.trackPurchase({
      userData: {
        fbp: finalFbp || undefined,
        fbc: finalFbc || undefined,
        clientIp: finalClientIp || undefined,
        userAgent: finalUserAgent || undefined,
        email: email || undefined,
        phone: phone || undefined
      },
      value: orderAmount,
      currency: 'KRW',
      orderId: orderId,
      productIds: productId ? [productId] : undefined,
      productName: productName,
      numItems: quantity || 1,
      eventSourceUrl: trackingLink.target_url
    })

    // 전환 기록에 Meta 전송 결과 업데이트
    if (conversionId) {
      await supabase
        .from('ad_performance')
        .update({
          meta_sent: true,
          meta_sent_at: new Date().toISOString(),
          meta_event_id: `purchase_${orderId}_${Date.now()}`,
          metadata: {
            meta_response: {
              events_received: result.events_received,
              fbtrace_id: result.fbtrace_id
            }
          }
        })
        .eq('id', conversionId)
    }

    // 전환 로그는 conversions 테이블의 metadata에 저장됨 (별도 테이블 불필요)

    return NextResponse.json({
      success: true,
      metaSent: true,
      eventsReceived: result.events_received,
      fbtraceId: result.fbtrace_id
    })

  } catch (error) {
    console.error('Meta purchase event error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Meta CAPI 전송에 실패했습니다'
    }, { status: 500 })
  }
}
