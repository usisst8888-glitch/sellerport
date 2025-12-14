/**
 * 주문 동기화 API
 * POST /api/orders/sync - 네이버 주문을 가져와서 클릭과 매칭
 *
 * 이 API는 Vercel Cron Job으로 5분마다 실행되거나,
 * 사용자가 수동으로 동기화 버튼을 누를 때 호출됩니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNaverClient } from '@/lib/naver/commerce-api'

// 주문 상태 매핑
const ORDER_STATUS_MAP: Record<string, string> = {
  'PAYED': 'paid',           // 결제 완료
  'PAYMENT_WAITING': 'pending',
  'DELIVERING': 'shipping',   // 배송 중
  'DELIVERED': 'delivered',   // 배송 완료
  'CLAIM_REQUESTED': 'claim', // 클레임 요청
  'CANCELLED': 'cancelled',   // 취소
  'RETURNED': 'returned',     // 반품
  'EXCHANGED': 'exchanged',   // 교환
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인 (Cron Job인 경우 헤더로 인증)
    const cronSecret = request.headers.get('x-cron-secret')
    const isCronJob = cronSecret === process.env.CRON_SECRET

    let userId: string | null = null

    if (!isCronJob) {
      // 일반 사용자 요청
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
      }
      userId = user.id
    }

    // Body에서 siteId 확인 (특정 사이트만 동기화)
    let siteId: string | null = null
    try {
      const body = await request.json()
      siteId = body.siteId || null
    } catch {
      // Body가 없어도 OK
    }

    // 동기화할 사이트 목록 조회
    let query = supabase
      .from('my_sites')
      .select('*')
      .eq('status', 'connected')
      .eq('site_type', 'naver')

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (siteId) {
      query = query.eq('id', siteId)
    }

    const { data: sites, error: siteError } = await query

    if (siteError || !sites || sites.length === 0) {
      return NextResponse.json({
        success: true,
        message: '동기화할 사이트가 없습니다',
        synced: 0
      })
    }

    let totalSynced = 0
    let totalMatched = 0
    const errors: string[] = []

    // 각 사이트별로 주문 동기화
    for (const site of sites) {
      try {
        const client = createNaverClient(
          site.application_id,
          site.application_secret
        )

        // 최근 7일간 주문 조회
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const ordersResponse = await client.getOrdersByDate(
          sevenDaysAgo.toISOString(),
          new Date().toISOString()
        )
        const orders = ordersResponse.data?.contents || []

        if (orders.length === 0) continue

        for (const order of orders) {
          // 이미 존재하는 주문인지 확인
          const { data: existingOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('my_site_id', site.id)
            .eq('external_order_id', order.orderId)
            .eq('product_order_id', order.productOrderId || order.orderId)
            .single()

          if (existingOrder) {
            // 기존 주문 상태 업데이트
            await supabase
              .from('orders')
              .update({
                order_status: ORDER_STATUS_MAP[order.productOrderStatus] || order.productOrderStatus,
                status: order.productOrderStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingOrder.id)
            continue
          }

          // 상품 찾기
          const { data: product } = await supabase
            .from('products')
            .select('id, cost')
            .eq('my_site_id', site.id)
            .eq('external_product_id', String(order.originProductNo))
            .single()

          // UTM 파라미터에서 추적 링크/캠페인 정보 추출
          const inflowPath = order.inflowPathType || ''
          const utmParams = parseUtmFromInflowPath(inflowPath)

          // 클릭 매칭 시도 (30일 이내 클릭 중 매칭)
          let matchedClick = null
          let campaignId = null

          if (utmParams.utm_campaign) {
            // UTM campaign으로 추적 링크 찾기
            const { data: trackingLink } = await supabase
              .from('tracking_links')
              .select('id, campaign_id')
              .eq('user_id', site.user_id)
              .eq('utm_campaign', utmParams.utm_campaign)
              .single()

            if (trackingLink) {
              campaignId = trackingLink.campaign_id

              // 해당 추적 링크의 최근 클릭 중 미전환 클릭 찾기
              const thirtyDaysAgo = new Date()
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

              const { data: click } = await supabase
                .from('tracking_link_clicks')
                .select('*')
                .eq('tracking_link_id', trackingLink.id)
                .eq('is_converted', false)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

              if (click) {
                matchedClick = click
              }
            }
          }

          // 플랫폼 수수료 계산 (네이버 2.73%)
          const platformFee = Math.round(order.totalPaymentAmount * 0.0273)
          const cost = product?.cost || 0
          const profit = order.totalPaymentAmount - cost - platformFee

          // 주문 저장
          const { data: newOrder, error: insertError } = await supabase
            .from('orders')
            .insert({
              user_id: site.user_id,
              my_site_id: site.id,
              product_id: product?.id || null,
              site_type: 'naver',
              external_order_id: order.orderId,
              product_order_id: order.productOrderId || order.orderId,
              external_product_id: String(order.originProductNo),
              product_name: order.productName,
              quantity: order.quantity || 1,
              price: order.productPrice || order.totalPaymentAmount,
              product_price: order.productPrice || 0,
              total_amount: order.totalPaymentAmount,
              shipping_fee: order.shippingFee || 0,
              cost: cost,
              platform_fee: platformFee,
              profit: profit,
              order_status: ORDER_STATUS_MAP[order.productOrderStatus] || 'paid',
              status: order.productOrderStatus,
              utm_source: utmParams.utm_source,
              utm_medium: utmParams.utm_medium,
              utm_campaign: utmParams.utm_campaign,
              tracking_link_id: matchedClick?.tracking_link_id || null,
              click_id: matchedClick?.click_id || null,
              campaign_id: campaignId,
              inflow_path: inflowPath,
              ordered_at: order.orderDate || new Date().toISOString(),
              order_date: order.orderDate,
              synced_at: new Date().toISOString(),
              metadata: order
            })
            .select()
            .single()

          if (insertError) {
            console.error('Order insert error:', insertError)
            continue
          }

          totalSynced++

          // 클릭 매칭 성공 시
          if (matchedClick && newOrder) {
            totalMatched++

            // 클릭을 전환됨으로 표시
            await supabase
              .from('tracking_link_clicks')
              .update({
                is_converted: true,
                converted_order_id: newOrder.id,
                converted_at: new Date().toISOString()
              })
              .eq('id', matchedClick.id)

            // 추적 링크 전환 수 증가
            const { data: trackingLink } = await supabase
              .from('tracking_links')
              .select('conversions, revenue')
              .eq('id', matchedClick.tracking_link_id)
              .single()

            if (trackingLink) {
              await supabase
                .from('tracking_links')
                .update({
                  conversions: (trackingLink.conversions || 0) + 1,
                  revenue: (trackingLink.revenue || 0) + order.totalPaymentAmount
                })
                .eq('id', matchedClick.tracking_link_id)
            }

            // 캠페인 전환 수 및 매출 증가
            if (campaignId) {
              const { data: campaign } = await supabase
                .from('campaigns')
                .select('conversions, revenue, spent')
                .eq('id', campaignId)
                .single()

              if (campaign) {
                const newRevenue = (campaign.revenue || 0) + order.totalPaymentAmount
                const newConversions = (campaign.conversions || 0) + 1
                const roas = campaign.spent > 0 ? Math.round((newRevenue / campaign.spent) * 100) : 0

                await supabase
                  .from('campaigns')
                  .update({
                    conversions: newConversions,
                    revenue: newRevenue,
                    roas: roas
                  })
                  .eq('id', campaignId)
              }
            }
          }
        }

        // 사이트 마지막 동기화 시간 업데이트
        await supabase
          .from('my_sites')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', site.id)

      } catch (err) {
        console.error(`Site ${site.id} sync error:`, err)
        errors.push(`${site.site_name}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${totalSynced}개 주문 동기화, ${totalMatched}개 클릭 매칭`,
      data: {
        synced: totalSynced,
        matched: totalMatched,
        sites: sites.length,
        errors: errors.length > 0 ? errors : undefined
      }
    })

  } catch (error) {
    console.error('Order sync error:', error)
    return NextResponse.json({ error: '주문 동기화에 실패했습니다' }, { status: 500 })
  }
}

// UTM 파라미터 파싱 (inflowPath에서 추출)
function parseUtmFromInflowPath(inflowPath: string): {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
} {
  const result: { utm_source?: string; utm_medium?: string; utm_campaign?: string } = {}

  try {
    // URL 형식인 경우
    if (inflowPath.includes('?') || inflowPath.includes('utm_')) {
      const url = new URL(inflowPath.startsWith('http') ? inflowPath : `https://dummy.com?${inflowPath}`)
      const source = url.searchParams.get('utm_source')
      const medium = url.searchParams.get('utm_medium')
      const campaign = url.searchParams.get('utm_campaign')
      if (source) result.utm_source = source
      if (medium) result.utm_medium = medium
      if (campaign) result.utm_campaign = campaign
    }
  } catch {
    // 파싱 실패 시 무시
  }

  return result
}

// Cron Job용 GET 핸들러 (Vercel Cron)
export async function GET(request: NextRequest) {
  // Vercel Cron에서 호출 시
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // POST 핸들러 재사용
  const fakeRequest = new NextRequest(request.url, {
    method: 'POST',
    headers: new Headers({
      'x-cron-secret': process.env.CRON_SECRET || ''
    })
  })

  return POST(fakeRequest)
}
