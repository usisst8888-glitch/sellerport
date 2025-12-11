/**
 * 주문 동기화 Cron Job
 * 5분마다 실행되어 모든 연결된 플랫폼의 주문을 동기화합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNaverClient } from '@/lib/naver/commerce-api'

// 서비스 롤 키로 Supabase 접근 (RLS 우회)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  // Vercel Cron 인증
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] Starting order sync...')

  const supabase = getSupabaseAdmin()

  try {
    // 모든 연결된 플랫폼 조회
    const { data: platforms, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('status', 'connected')

    if (platformError || !platforms) {
      console.error('[Cron] Platform fetch error:', platformError)
      return NextResponse.json({ error: 'Platform fetch failed' }, { status: 500 })
    }

    console.log(`[Cron] Found ${platforms.length} connected platforms`)

    let totalSynced = 0
    let totalMatched = 0

    for (const platform of platforms) {
      if (platform.platform_type !== 'naver') continue

      try {
        const client = createNaverClient(
          platform.application_id,
          platform.application_secret
        )

        // 최근 24시간 주문 조회
        const oneDayAgo = new Date()
        oneDayAgo.setDate(oneDayAgo.getDate() - 1)

        const ordersResponse = await client.getOrdersByDate(
          oneDayAgo.toISOString(),
          new Date().toISOString()
        )
        const orders = ordersResponse.data?.contents || []

        if (orders.length === 0) continue

        for (const order of orders) {
          // 중복 체크
          const { data: existing } = await supabase
            .from('orders')
            .select('id')
            .eq('platform_id', platform.id)
            .eq('external_order_id', order.orderId)
            .eq('product_order_id', order.productOrderId || order.orderId)
            .single()

          if (existing) continue

          // 상품 찾기
          const { data: product } = await supabase
            .from('products')
            .select('id, cost')
            .eq('platform_id', platform.id)
            .eq('external_product_id', String(order.originProductNo))
            .single()

          // UTM 파싱
          const inflowPath = order.inflowPathType || ''
          const utmParams = parseUtm(inflowPath)

          // 클릭 매칭
          let matchedClick = null
          let campaignId = null

          if (utmParams.utm_campaign) {
            const { data: trackingLink } = await supabase
              .from('tracking_links')
              .select('id, campaign_id')
              .eq('user_id', platform.user_id)
              .eq('utm_campaign', utmParams.utm_campaign)
              .single()

            if (trackingLink) {
              campaignId = trackingLink.campaign_id

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

              if (click) matchedClick = click
            }
          }

          // 수수료 계산
          const platformFee = Math.round(order.totalPaymentAmount * 0.0273)
          const cost = product?.cost || 0
          const profit = order.totalPaymentAmount - cost - platformFee

          // 주문 저장
          const { data: newOrder } = await supabase
            .from('orders')
            .insert({
              user_id: platform.user_id,
              platform_id: platform.id,
              product_id: product?.id || null,
              platform_type: 'naver',
              external_order_id: order.orderId,
              product_order_id: order.productOrderId || order.orderId,
              external_product_id: String(order.originProductNo),
              product_name: order.productName,
              quantity: order.quantity || 1,
              price: order.productPrice || order.totalPaymentAmount,
              total_amount: order.totalPaymentAmount,
              shipping_fee: order.shippingFee || 0,
              cost,
              platform_fee: platformFee,
              profit,
              order_status: 'paid',
              status: order.productOrderStatus,
              utm_source: utmParams.utm_source,
              utm_medium: utmParams.utm_medium,
              utm_campaign: utmParams.utm_campaign,
              tracking_link_id: matchedClick?.tracking_link_id,
              click_id: matchedClick?.click_id,
              campaign_id: campaignId,
              inflow_path: inflowPath,
              ordered_at: order.orderDate || new Date().toISOString(),
              synced_at: new Date().toISOString(),
              metadata: order
            })
            .select()
            .single()

          totalSynced++

          // 클릭 매칭 처리
          if (matchedClick && newOrder) {
            totalMatched++

            await supabase
              .from('tracking_link_clicks')
              .update({
                is_converted: true,
                converted_order_id: newOrder.id,
                converted_at: new Date().toISOString()
              })
              .eq('id', matchedClick.id)

            // 추적 링크/캠페인 통계 업데이트
            if (campaignId) {
              const { data: campaign } = await supabase
                .from('campaigns')
                .select('conversions, revenue, spent')
                .eq('id', campaignId)
                .single()

              if (campaign) {
                const newRevenue = (campaign.revenue || 0) + order.totalPaymentAmount
                const roas = campaign.spent > 0 ? Math.round((newRevenue / campaign.spent) * 100) : 0

                await supabase
                  .from('campaigns')
                  .update({
                    conversions: (campaign.conversions || 0) + 1,
                    revenue: newRevenue,
                    roas
                  })
                  .eq('id', campaignId)
              }
            }

            // 주문 알림 발송
            await sendOrderAlert(platform.user_id, order, profit, supabase)
          }
        }

        // 마지막 동기화 시간 업데이트
        await supabase
          .from('platforms')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', platform.id)

      } catch (err) {
        console.error(`[Cron] Platform ${platform.id} error:`, err)
      }
    }

    console.log(`[Cron] Sync complete: ${totalSynced} orders, ${totalMatched} matched`)

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      matched: totalMatched
    })

  } catch (error) {
    console.error('[Cron] Sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

function parseUtm(inflowPath: string) {
  const result: Record<string, string | undefined> = {}
  try {
    if (inflowPath.includes('utm_')) {
      const url = new URL(inflowPath.startsWith('http') ? inflowPath : `https://d.com?${inflowPath}`)
      result.utm_source = url.searchParams.get('utm_source') || undefined
      result.utm_medium = url.searchParams.get('utm_medium') || undefined
      result.utm_campaign = url.searchParams.get('utm_campaign') || undefined
    }
  } catch {}
  return result
}

async function sendOrderAlert(userId: string, order: any, profit: number, supabase: ReturnType<typeof getSupabaseAdmin>) {
  try {
    const { data: settings } = await supabase
      .from('alert_settings')
      .select('kakao_enabled, kakao_phone')
      .eq('user_id', userId)
      .single()

    if (!settings?.kakao_enabled || !settings?.kakao_phone) return

    // 간단한 주문 알림 (실제로는 알림톡 API 호출)
    console.log(`[Alert] Order notification for user ${userId}: ${order.productName}, profit: ${profit}`)

  } catch (err) {
    console.error('[Alert] Send error:', err)
  }
}
