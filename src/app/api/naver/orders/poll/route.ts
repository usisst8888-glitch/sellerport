/**
 * 네이버 주문 폴링 API
 * POST /api/naver/orders/poll
 *
 * 네이버 Commerce API에서 새 주문을 감지하고
 * nt_detail 파라미터로 추적 링크를 매칭합니다.
 * 매칭된 주문은 CAPI를 통해 Meta에 Purchase 이벤트를 전송합니다.
 *
 * Vercel Cron Job으로 5분마다 실행 권장
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNaverClient } from '@/lib/naver/commerce-api'
import { createMetaClient } from '@/lib/meta/conversions-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 인증 확인 (Cron Job용 비밀키 또는 사용자 인증)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    let userId: string | null = null

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Cron Job 호출 - 모든 사용자 폴링
      userId = null
    } else {
      // 일반 사용자 호출 - 본인 것만 폴링
      const body = await request.json().catch(() => ({}))
      userId = body.userId || null

      if (!userId) {
        return NextResponse.json({
          success: false,
          error: '인증이 필요합니다'
        }, { status: 401 })
      }
    }

    // 폴링 대상 사이트 조회
    let query = supabase
      .from('my_shoppingmall')
      .select('id, user_id, application_id, application_secret, last_sync_at')
      .eq('site_type', 'naver')
      .eq('status', 'connected')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: sites, error: sitesError } = await query

    if (sitesError || !sites || sites.length === 0) {
      return NextResponse.json({
        success: true,
        message: '폴링할 사이트가 없습니다',
        processed: 0
      })
    }

    let totalNewOrders = 0
    let totalMatched = 0
    let totalCapiSent = 0
    const results: any[] = []

    // 각 사이트별 주문 폴링
    for (const site of sites) {
      try {
        if (!site.application_id || !site.application_secret) {
          continue
        }

        const naverClient = createNaverClient(
          site.application_id,
          site.application_secret
        )

        // 최근 주문 조회 (마지막 동기화 이후)
        const lastSync = site.last_sync_at
          ? new Date(site.last_sync_at)
          : new Date(Date.now() - 24 * 60 * 60 * 1000) // 기본 24시간 전

        const now = new Date()

        const ordersResponse = await naverClient.getOrdersByDate(
          lastSync.toISOString(),
          now.toISOString()
        )

        const orders = ordersResponse.data?.contents || []
        let siteMatched = 0
        let siteCapiSent = 0

        for (const order of orders) {
          // 주문 저장
          const { error: orderError } = await supabase.from('orders').upsert({
            user_id: site.user_id,
            my_shoppingmall_id: site.id,
            site_type: 'naver',
            external_order_id: order.orderId,
            product_order_id: order.productOrderId,
            external_product_id: order.originProductNo?.toString(),
            product_name: order.productName,
            quantity: order.quantity,
            price: order.productPrice,
            total_amount: order.totalPaymentAmount,
            shipping_fee: order.shippingFee,
            order_status: mapNaverStatus(order.productOrderStatus),
            status: order.productOrderStatus,
            inflow_path: order.inflowPathType,
            ordered_at: order.orderDate,
            synced_at: now.toISOString()
          }, {
            onConflict: 'my_shoppingmall_id,external_order_id,product_order_id'
          })

          if (!orderError) {
            totalNewOrders++
          }

          // 추적 링크 매칭 및 CAPI 전송
          const matchResult = await tryTrackingLinkMatchingWithCAPI(site.user_id, order)
          if (matchResult.matched) {
            siteMatched++
            totalMatched++
          }
          if (matchResult.capiSent) {
            siteCapiSent++
            totalCapiSent++
          }
        }

        // 마지막 동기화 시간 업데이트
        await supabase
          .from('my_shoppingmall')
          .update({ last_sync_at: now.toISOString() })
          .eq('id', site.id)

        results.push({
          siteId: site.id,
          orders: orders.length,
          matched: siteMatched,
          capiSent: siteCapiSent
        })

      } catch (err) {
        console.error(`Site ${site.id} polling error:`, err)
        results.push({
          siteId: site.id,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalSites: sites.length,
      totalNewOrders,
      totalMatched,
      totalCapiSent,
      results
    })

  } catch (error) {
    console.error('Order poll error:', error)
    return NextResponse.json({
      success: false,
      error: '주문 폴링에 실패했습니다'
    }, { status: 500 })
  }
}

// 네이버 주문 상태 매핑
function mapNaverStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'PAYMENT_WAITING': 'pending',
    'PAYED': 'paid',
    'DELIVERING': 'shipping',
    'DELIVERED': 'delivered',
    'PURCHASE_DECIDED': 'completed',
    'CANCELLED': 'cancelled',
    'RETURNED': 'returned',
    'EXCHANGED': 'exchanged',
  }
  return statusMap[status] || 'unknown'
}

// inflowPathType에서 nt_detail 추출
function extractNtDetailFromInflowPath(inflowPath: string): string | null {
  // inflowPathType 형식 예시: "nt_source=meta&nt_medium=ad&nt_detail=campaign_abc"
  // 또는 단순히 nt_detail 값만 포함되어 있을 수 있음
  if (!inflowPath) return null

  // URL 파라미터 형식으로 파싱 시도
  try {
    const params = new URLSearchParams(inflowPath)
    const ntDetail = params.get('nt_detail')
    if (ntDetail) return ntDetail
  } catch {
    // 파싱 실패 시 무시
  }

  // nt_detail= 패턴 직접 검색
  const match = inflowPath.match(/nt_detail=([^&\s]+)/)
  if (match) return match[1]

  return null
}

// 추적 링크 매칭 및 CAPI 전송
async function tryTrackingLinkMatchingWithCAPI(
  userId: string,
  order: any
): Promise<{ matched: boolean; capiSent: boolean }> {
  try {
    // 1. inflowPathType에서 nt_detail (= utm_campaign) 추출
    const inflowPath = order.inflowPathType || ''
    const ntDetail = extractNtDetailFromInflowPath(inflowPath)

    // 2. 사용자의 활성 추적 링크 조회
    const { data: trackingLinks } = await supabase
      .from('tracking_links')
      .select('id, utm_campaign, conversions, revenue, user_id')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (!trackingLinks || trackingLinks.length === 0) {
      return { matched: false, capiSent: false }
    }

    // 3. nt_detail로 추적 링크 매칭
    let matchedLink = null

    if (ntDetail) {
      // nt_detail = utm_campaign 으로 매칭
      matchedLink = trackingLinks.find(link => link.utm_campaign === ntDetail)
    }

    if (!matchedLink) {
      return { matched: false, capiSent: false }
    }

    // 4. 해당 추적 링크의 최근 클릭 정보 조회 (fbc, fbp 가져오기)
    const { data: recentClick } = await supabase
      .from('tracking_link_clicks')
      .select('id, click_id, fbp, fbc, user_agent, ip_address')
      .eq('tracking_link_id', matchedLink.id)
      .order('clicked_at', { ascending: false })
      .limit(1)
      .single()

    // 5. 전환 기록 저장
    const conversionId = `CV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    await supabase.from('ad_performance').insert({
      id: conversionId,
      tracking_link_id: matchedLink.id,
      user_id: userId,
      click_id: recentClick?.click_id || null,
      order_id: order.orderId,
      order_amount: order.totalPaymentAmount,
      product_name: order.productName,
      quantity: order.quantity,
      site_type: 'naver',
      fbp: recentClick?.fbp || null,
      fbc: recentClick?.fbc || null,
      converted_at: new Date().toISOString()
    })

    // 6. 추적 링크 통계 업데이트
    await supabase
      .from('tracking_links')
      .update({
        conversions: (matchedLink.conversions || 0) + 1,
        revenue: (matchedLink.revenue || 0) + order.totalPaymentAmount
      })
      .eq('id', matchedLink.id)

    // 7. 클릭 로그에 전환 표시
    if (recentClick?.click_id) {
      await supabase
        .from('tracking_link_clicks')
        .update({
          is_converted: true,
          converted_at: new Date().toISOString(),
          order_id: order.orderId,
          order_amount: order.totalPaymentAmount
        })
        .eq('click_id', recentClick.click_id)
    }

    // 8. CAPI로 Purchase 이벤트 전송
    let capiSent = false

    // 사용자의 Meta 설정 조회
    const { data: userMeta } = await supabase
      .from('user_meta_settings')
      .select('pixel_id, access_token')
      .eq('user_id', userId)
      .single()

    if (userMeta?.pixel_id && userMeta?.access_token && recentClick?.fbp) {
      try {
        const metaClient = createMetaClient(userMeta.pixel_id, userMeta.access_token)

        await metaClient.trackPurchase({
          userData: {
            fbp: recentClick.fbp,
            fbc: recentClick.fbc || undefined,
            clientIp: recentClick.ip_address || undefined,
            userAgent: recentClick.user_agent || undefined,
            // 구매자 전화번호가 있다면 추가 (해시하여 전송)
            phone: order.ordererTel || undefined
          },
          value: order.totalPaymentAmount,
          currency: 'KRW',
          orderId: order.orderId,
          productName: order.productName,
          numItems: order.quantity
        })

        capiSent = true

        // 전환 테이블에 CAPI 전송 표시
        await supabase
          .from('ad_performance')
          .update({
            meta_sent: true,
            meta_sent_at: new Date().toISOString(),
            meta_event_id: conversionId
          })
          .eq('id', conversionId)

        console.log(`[CAPI] Purchase event sent for order ${order.orderId}`)

      } catch (capiError) {
        console.error(`[CAPI] Failed to send Purchase event for order ${order.orderId}:`, capiError)
      }
    }

    return { matched: true, capiSent }

  } catch (err) {
    console.error('Tracking link matching error:', err)
    return { matched: false, capiSent: false }
  }
}

// Vercel Cron Job 설정 예시 (vercel.json)
// {
//   "crons": [{
//     "path": "/api/naver/orders/poll",
//     "schedule": "*/5 * * * *"
//   }]
// }
