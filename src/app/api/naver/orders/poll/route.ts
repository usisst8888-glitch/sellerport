/**
 * 네이버 주문 폴링 API
 * POST /api/naver/orders/poll
 *
 * 네이버 Commerce API에서 새 주문을 감지하고
 * 추적 링크 쿠키로 전환 매칭을 시도합니다.
 *
 * Vercel Cron Job으로 5분마다 실행 권장
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNaverClient } from '@/lib/naver/commerce-api'

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

    // 폴링 대상 플랫폼 조회
    let query = supabase
      .from('platforms')
      .select('id, user_id, application_id, application_secret, last_sync_at')
      .eq('platform_type', 'naver')
      .eq('status', 'connected')

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: platforms, error: platformsError } = await query

    if (platformsError || !platforms || platforms.length === 0) {
      return NextResponse.json({
        success: true,
        message: '폴링할 플랫폼이 없습니다',
        processed: 0
      })
    }

    let totalNewOrders = 0
    let totalMatched = 0
    const results: any[] = []

    // 각 플랫폼별 주문 폴링
    for (const platform of platforms) {
      try {
        if (!platform.application_id || !platform.application_secret) {
          continue
        }

        const naverClient = createNaverClient(
          platform.application_id,
          platform.application_secret
        )

        // 최근 주문 조회 (마지막 동기화 이후)
        const lastSync = platform.last_sync_at
          ? new Date(platform.last_sync_at)
          : new Date(Date.now() - 24 * 60 * 60 * 1000) // 기본 24시간 전

        const now = new Date()

        const ordersResponse = await naverClient.getOrdersByDate(
          lastSync.toISOString(),
          now.toISOString()
        )

        const orders = ordersResponse.data?.contents || []

        for (const order of orders) {
          // 주문 저장
          const { error: orderError } = await supabase.from('orders').upsert({
            user_id: platform.user_id,
            platform_id: platform.id,
            platform_type: 'naver',
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
            onConflict: 'platform_id,external_order_id,product_order_id'
          })

          if (!orderError) {
            totalNewOrders++
          }

          // 추적 링크 매칭 시도 (UTM 캠페인 기반)
          const matched = await tryTrackingLinkMatching(platform.user_id, order)
          if (matched) {
            totalMatched++
          }
        }

        // 마지막 동기화 시간 업데이트
        await supabase
          .from('platforms')
          .update({ last_sync_at: now.toISOString() })
          .eq('id', platform.id)

        results.push({
          platformId: platform.id,
          orders: orders.length,
          matched: totalMatched
        })

      } catch (err) {
        console.error(`Platform ${platform.id} polling error:`, err)
        results.push({
          platformId: platform.id,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalPlatforms: platforms.length,
      totalNewOrders,
      totalMatched,
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

// 추적 링크 매칭 시도
async function tryTrackingLinkMatching(userId: string, order: any): Promise<boolean> {
  try {
    // 1. 유입경로에서 UTM 캠페인 추출 시도
    const inflowPath = order.inflowPathType || ''

    // 2. 사용자의 활성 추적 링크 조회
    const { data: trackingLinks } = await supabase
      .from('tracking_links')
      .select('id, utm_campaign, conversions, revenue')
      .eq('user_id', userId)
      .eq('status', 'active')

    if (!trackingLinks || trackingLinks.length === 0) {
      return false
    }

    // 3. UTM 캠페인 매칭 (정확한 매칭은 쿠키 기반이 필요)
    // 현재는 최근 활성 추적 링크 기반 휴리스틱 매칭
    // TODO: 실제로는 클릭 시 저장한 쿠키와 매칭해야 함

    // 4. 주문에 tracking_link_id가 있으면 매칭
    if (order.tracking_link_id) {
      const matchedLink = trackingLinks.find(s => s.id === order.tracking_link_id)
      if (matchedLink) {
        // 전환 기록
        await supabase.from('conversions').insert({
          id: `CV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          tracking_link_id: matchedLink.id,
          user_id: userId,
          order_id: order.orderId,
          order_amount: order.totalPaymentAmount,
          product_name: order.productName,
          quantity: order.quantity,
          platform_type: 'naver',
          converted_at: new Date().toISOString()
        })

        // 추적 링크 통계 업데이트
        await supabase
          .from('tracking_links')
          .update({
            conversions: (matchedLink.conversions || 0) + 1,
            revenue: (matchedLink.revenue || 0) + order.totalPaymentAmount
          })
          .eq('id', matchedLink.id)

        return true
      }
    }

    return false

  } catch (err) {
    console.error('Tracking link matching error:', err)
    return false
  }
}

// Vercel Cron Job 설정 예시 (vercel.json)
// {
//   "crons": [{
//     "path": "/api/naver/orders/poll",
//     "schedule": "*/5 * * * *"
//   }]
// }
