/**
 * Meta 전환 추적 API
 * POST /api/meta/track
 *
 * 추적 링크의 전환 이벤트를 Meta CAPI로 전송합니다.
 * 주문이 발생했을 때 호출되어 Meta 광고 최적화에 활용됩니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createMetaClient } from '@/lib/meta/conversions-api'

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
      eventType, // 'purchase', 'add_to_cart', 'view_content', 'lead'
      trackingLinkId,
      value,
      orderId,
      productId,
      productName,
      numItems,
      userData, // { email, phone, clientIp, userAgent, fbc, fbp }
    } = body

    if (!eventType) {
      return NextResponse.json({ error: 'eventType이 필요합니다' }, { status: 400 })
    }

    // 사용자의 Meta 설정 조회
    const { data: settings } = await supabase
      .from('user_settings')
      .select('meta_pixel_id, meta_access_token, meta_test_event_code')
      .eq('user_id', user.id)
      .single()

    if (!settings?.meta_pixel_id || !settings?.meta_access_token) {
      return NextResponse.json({ error: 'Meta 연동 설정이 필요합니다' }, { status: 400 })
    }

    // Meta CAPI 클라이언트 생성
    const metaClient = createMetaClient(
      settings.meta_pixel_id,
      settings.meta_access_token,
      settings.meta_test_event_code || undefined
    )

    // 이벤트 소스 URL (추적 링크가 있으면 추적 링크 URL 사용)
    let eventSourceUrl: string | undefined
    if (trackingLinkId) {
      const { data: trackingLink } = await supabase
        .from('tracking_links')
        .select('target_url')
        .eq('id', trackingLinkId)
        .single()
      eventSourceUrl = trackingLink?.target_url
    }

    // 이벤트 전송
    let result
    switch (eventType) {
      case 'purchase':
        if (!orderId || !value) {
          return NextResponse.json({ error: 'orderId와 value가 필요합니다' }, { status: 400 })
        }
        result = await metaClient.trackPurchase({
          userData: userData || {},
          value,
          orderId,
          productIds: productId ? [productId] : undefined,
          productName,
          numItems,
          eventSourceUrl,
        })

        // 추적 링크의 전환 수 증가
        if (trackingLinkId) {
          const { data: currentLink } = await supabase
            .from('tracking_links')
            .select('conversions')
            .eq('id', trackingLinkId)
            .single()

          if (currentLink) {
            await supabase
              .from('tracking_links')
              .update({ conversions: (currentLink.conversions || 0) + 1 })
              .eq('id', trackingLinkId)
          }
        }
        break

      case 'add_to_cart':
        if (!productId || !value) {
          return NextResponse.json({ error: 'productId와 value가 필요합니다' }, { status: 400 })
        }
        result = await metaClient.trackAddToCart({
          userData: userData || {},
          value,
          productId,
          productName,
          eventSourceUrl,
        })
        break

      case 'view_content':
        if (!productId) {
          return NextResponse.json({ error: 'productId가 필요합니다' }, { status: 400 })
        }
        result = await metaClient.trackViewContent({
          userData: userData || {},
          value,
          productId,
          productName,
          eventSourceUrl,
        })
        break

      case 'lead':
        result = await metaClient.trackLead({
          userData: userData || {},
          value,
          eventSourceUrl,
        })
        break

      default:
        return NextResponse.json({ error: '지원하지 않는 eventType입니다' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: '이벤트가 전송되었습니다',
      data: result,
    })

  } catch (error) {
    console.error('Meta track error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
