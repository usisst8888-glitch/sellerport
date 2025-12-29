/**
 * 카페24 주문 웹훅 API
 * POST /api/webhooks/cafe24
 *
 * 카페24에서 주문 완료 시 호출되어 Meta CAPI로 Purchase 이벤트 전송
 *
 * 카페24 웹훅 설정:
 * 1. 카페24 개발자센터 > 앱 관리 > Webhook 설정
 * 2. URL: https://your-domain.com/api/webhooks/cafe24
 * 3. 이벤트: 주문 생성 (orders/placed)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createMetaClient } from '@/lib/meta/conversions-api'

// Supabase Admin 클라이언트 (Service Role - RLS 우회)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 카페24 웹훅 페이로드 타입
interface Cafe24WebhookPayload {
  event_no: string           // 이벤트 번호
  resource: string           // 리소스 (orders, products 등)
  event_shop_no: string      // 쇼핑몰 번호
  mall_id: string            // 몰 ID
  event_code: string         // 이벤트 코드 (placed, paid 등)
  trace_id?: string          // 추적 ID
  data: {
    order_id: string
    order_date?: string
    payment_date?: string
    order_amount?: {
      order_price_amount: number
      total_amount_due: number
    }
    buyer?: {
      name: string
      email: string
      phone: string
    }
    items?: Array<{
      product_no: number
      product_name: string
      product_price: number
      quantity: number
    }>
    // SellerPort 추적용 파라미터 (쿠키에서 전달됨)
    sp_click?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // 웹훅 시크릿 검증 (HMAC)
    const signature = request.headers.get('x-cafe24-hmac-sha256')
    const webhookSecret = process.env.CAFE24_WEBHOOK_SECRET

    // TODO: HMAC 검증 구현 (필요시)
    // if (webhookSecret && signature) {
    //   const isValid = verifyHmac(await request.text(), webhookSecret, signature)
    //   if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    // }

    const payload: Cafe24WebhookPayload = await request.json()

    console.log(`[Cafe24 Webhook] Received event: ${payload.event_code}`, {
      mall_id: payload.mall_id,
      order_id: payload.data?.order_id
    })

    // mall_id로 연결된 사이트 찾기
    const { data: site, error: siteError } = await supabaseAdmin
      .from('my_sites')
      .select('id, user_id, site_name')
      .eq('site_type', 'cafe24')
      .eq('store_id', payload.mall_id)
      .eq('status', 'connected')
      .single()

    if (siteError || !site) {
      console.warn('[Cafe24 Webhook] Site not found:', payload.mall_id)
      return NextResponse.json({ received: true, warning: 'Site not found' })
    }

    // 이벤트 타입별 처리
    if (payload.event_code === 'placed' || payload.event_code === 'paid') {
      await handleOrderCreated(site, payload)
    }

    return NextResponse.json({ received: true, event: payload.event_code })

  } catch (error) {
    console.error('[Cafe24 Webhook] Error:', error)
    return NextResponse.json({ received: true, error: 'Processing error' })
  }
}

/**
 * 주문 생성 이벤트 처리
 */
async function handleOrderCreated(
  site: { id: string; user_id: string; site_name: string },
  payload: Cafe24WebhookPayload
) {
  const { data } = payload

  console.log(`[Cafe24 Webhook] Order created: ${data.order_id}`, {
    buyer: data.buyer?.name,
    amount: data.order_amount?.total_amount_due
  })

  // 주문 정보 저장
  const orderData = {
    user_id: site.user_id,
    site_id: site.id,
    platform: 'cafe24',
    order_id: data.order_id,
    order_date: data.order_date || new Date().toISOString(),
    total_amount: data.order_amount?.total_amount_due || 0,
    buyer_name: data.buyer?.name || '',
    buyer_email: data.buyer?.email || '',
    buyer_phone: data.buyer?.phone || '',
    status: payload.event_code === 'paid' ? 'paid' : 'pending',
    raw_data: data
  }

  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .upsert(orderData, {
      onConflict: 'user_id,platform,order_id'
    })

  if (orderError) {
    console.error('[Cafe24 Webhook] Order save error:', orderError)
  }

  // 전환 추적 (sp_click이 있으면 Meta CAPI 전송)
  const spClick = data.sp_click

  if (spClick) {
    await sendMetaConversionEvent(site.user_id, spClick, {
      orderId: data.order_id,
      value: data.order_amount?.total_amount_due || 0,
      email: data.buyer?.email,
      phone: data.buyer?.phone,
      firstName: data.buyer?.name,
      productIds: data.items?.map(p => String(p.product_no)),
      productName: data.items?.[0]?.product_name,
      numItems: data.items?.reduce((sum, p) => sum + p.quantity, 0),
    })
  }
}

/**
 * Meta CAPI 전환 이벤트 전송
 */
async function sendMetaConversionEvent(
  userId: string,
  spClick: string,
  orderInfo: {
    orderId: string
    value: number
    email?: string
    phone?: string
    firstName?: string
    productIds?: string[]
    productName?: string
    numItems?: number
  }
) {
  try {
    // sp_click으로 클릭 데이터 조회 (fbc, fbp 포함)
    const { data: clickData } = await supabaseAdmin
      .from('tracking_clicks')
      .select('tracking_link_id, fbp, fbc')
      .eq('click_id', spClick)
      .single()

    if (!clickData) {
      console.log('[Cafe24 Webhook] Click data not found for sp_click:', spClick)
      return
    }

    // 셀러의 Meta Pixel 정보 조회
    const { data: adChannel } = await supabaseAdmin
      .from('ad_channels')
      .select('metadata, access_token')
      .eq('user_id', userId)
      .eq('channel_type', 'meta')
      .eq('status', 'connected')
      .single()

    if (!adChannel?.metadata?.default_pixel_id || !adChannel.access_token) {
      console.log('[Cafe24 Webhook] Meta Pixel not configured for user:', userId)
      return
    }

    // Meta CAPI로 Purchase 이벤트 전송
    const metaClient = createMetaClient(
      adChannel.metadata.default_pixel_id,
      adChannel.access_token
    )

    await metaClient.trackPurchase({
      userData: {
        email: orderInfo.email,
        phone: orderInfo.phone,
        firstName: orderInfo.firstName,
        fbc: clickData.fbc || undefined,
        fbp: clickData.fbp || undefined,
      },
      value: orderInfo.value,
      currency: 'KRW',
      orderId: orderInfo.orderId,
      productIds: orderInfo.productIds,
      productName: orderInfo.productName,
      numItems: orderInfo.numItems || 1,
    })

    console.log('[Cafe24 Webhook] Meta CAPI Purchase event sent for order:', orderInfo.orderId)

    // 추적 링크 통계 업데이트
    const { data: currentLink } = await supabaseAdmin
      .from('tracking_links')
      .select('conversions, revenue')
      .eq('id', clickData.tracking_link_id)
      .single()

    if (currentLink) {
      await supabaseAdmin
        .from('tracking_links')
        .update({
          conversions: (currentLink.conversions || 0) + 1,
          revenue: (currentLink.revenue || 0) + orderInfo.value,
        })
        .eq('id', clickData.tracking_link_id)
    }

  } catch (error) {
    console.error('[Cafe24 Webhook] Meta CAPI error:', error)
  }
}

// GET 요청도 허용 (웹훅 URL 확인용)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Sellerport Cafe24 Webhook',
    events: ['orders/placed', 'orders/paid']
  })
}
