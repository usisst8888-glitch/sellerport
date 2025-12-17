/**
 * 아임웹 웹훅 수신
 * POST /api/webhooks/imweb
 *
 * 아임웹에서 발생하는 이벤트를 실시간으로 수신
 * - 주문 생성 (order.created)
 * - 회원 생성 (member.created)
 * - 앱 연동 해제 (app.uninstalled)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase Admin 클라이언트 (Service Role - RLS 우회)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 웹훅 이벤트 타입
type ImwebWebhookEvent = 'order.created' | 'member.created' | 'app.uninstalled'

interface ImwebWebhookPayload {
  event: ImwebWebhookEvent
  siteCode: string
  timestamp: string
  data: {
    // 주문 생성 시
    order_no?: string
    order_id?: string
    order_time?: string
    pay_price?: number
    orderer?: {
      name: string
      email: string
    }
    product_list?: Array<{
      prod_no: string
      prod_name: string
      price: number
      count: number
    }>
    // 회원 생성 시
    member_code?: string
    email?: string
    name?: string
    join_time?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // 웹훅 시크릿 검증
    const webhookSecret = request.headers.get('x-webhook-secret') ||
                          request.headers.get('X-Webhook-Secret') ||
                          request.headers.get('authorization')?.replace('Bearer ', '')

    const expectedSecret = process.env.IMWEB_WEBHOOK_SECRET

    if (!webhookSecret || webhookSecret !== expectedSecret) {
      console.error('[Imweb Webhook] Invalid webhook secret')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 요청 바디 파싱
    const payload: ImwebWebhookPayload = await request.json()

    console.log(`[Imweb Webhook] Received event: ${payload.event}`, {
      siteCode: payload.siteCode,
      timestamp: payload.timestamp
    })

    // siteCode로 연결된 사이트 찾기
    const { data: site, error: siteError } = await supabaseAdmin
      .from('my_sites')
      .select('id, user_id, site_name')
      .eq('site_type', 'imweb')
      .eq('store_id', payload.siteCode)
      .eq('status', 'connected')
      .single()

    if (siteError || !site) {
      console.warn('[Imweb Webhook] Site not found:', payload.siteCode)
      // 사이트를 찾지 못해도 200 반환 (재시도 방지)
      return NextResponse.json({ received: true, warning: 'Site not found' })
    }

    // 이벤트 타입별 처리
    switch (payload.event) {
      case 'order.created':
        await handleOrderCreated(site, payload)
        break

      case 'member.created':
        await handleMemberCreated(site, payload)
        break

      case 'app.uninstalled':
        await handleAppUninstalled(site, payload)
        break

      default:
        console.log(`[Imweb Webhook] Unhandled event type: ${payload.event}`)
    }

    return NextResponse.json({ received: true, event: payload.event })

  } catch (error) {
    console.error('[Imweb Webhook] Error:', error)
    // 에러가 발생해도 200 반환 (재시도 방지, 필요시 500 반환)
    return NextResponse.json({ received: true, error: 'Processing error' })
  }
}

/**
 * 주문 생성 이벤트 처리
 */
async function handleOrderCreated(
  site: { id: string; user_id: string; site_name: string },
  payload: ImwebWebhookPayload
) {
  const { data } = payload

  console.log(`[Imweb Webhook] Order created: ${data.order_no}`, {
    orderer: data.orderer?.name,
    amount: data.pay_price
  })

  // 주문 정보 저장
  const orderData = {
    user_id: site.user_id,
    site_id: site.id,
    platform: 'imweb',
    order_id: data.order_no || data.order_id,
    order_date: data.order_time || new Date().toISOString(),
    total_amount: data.pay_price || 0,
    buyer_name: data.orderer?.name || '',
    buyer_email: data.orderer?.email || '',
    status: 'paid',
    raw_data: data
  }

  const { error: orderError } = await supabaseAdmin
    .from('orders')
    .upsert(orderData, {
      onConflict: 'user_id,platform,order_id'
    })

  if (orderError) {
    console.error('[Imweb Webhook] Order save error:', orderError)
  }

  // 전환 추적 (추적 링크와 매칭 시도)
  // TODO: 아임웹 주문에 UTM 파라미터나 sp_slot 쿠키 정보가 있으면 매칭
}

/**
 * 회원 생성 이벤트 처리
 */
async function handleMemberCreated(
  site: { id: string; user_id: string; site_name: string },
  payload: ImwebWebhookPayload
) {
  const { data } = payload

  console.log(`[Imweb Webhook] Member created: ${data.member_code}`, {
    email: data.email,
    name: data.name
  })

  // 회원가입 전환 이벤트 기록
  const conversionData = {
    user_id: site.user_id,
    site_id: site.id,
    conversion_type: 'signup',
    platform: 'imweb',
    event_time: data.join_time || new Date().toISOString(),
    event_data: {
      member_code: data.member_code,
      email: data.email,
      name: data.name
    }
  }

  const { error: conversionError } = await supabaseAdmin
    .from('conversions')
    .insert(conversionData)

  if (conversionError) {
    console.error('[Imweb Webhook] Conversion save error:', conversionError)
  }
}

/**
 * 앱 연동 해제 이벤트 처리
 */
async function handleAppUninstalled(
  site: { id: string; user_id: string; site_name: string },
  payload: ImwebWebhookPayload
) {
  console.log(`[Imweb Webhook] App uninstalled for site: ${site.site_name}`)

  // 사이트 상태를 disconnected로 변경
  const { error: updateError } = await supabaseAdmin
    .from('my_sites')
    .update({
      status: 'disconnected',
      access_token: null,
      refresh_token: null
    })
    .eq('id', site.id)

  if (updateError) {
    console.error('[Imweb Webhook] Site status update error:', updateError)
  }
}

// GET 요청도 허용 (웹훅 URL 확인용)
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Sellerport Imweb Webhook',
    events: ['order.created', 'member.created', 'app.uninstalled']
  })
}
