/**
 * 주문 동기화 Cron Job
 * 5분마다 실행되어 모든 연결된 사이트의 주문을 동기화합니다.
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
    // 모든 연결된 사이트 조회
    const { data: sites, error: siteError } = await supabase
      .from('my_sites')
      .select('*')
      .eq('status', 'connected')

    if (siteError || !sites) {
      console.error('[Cron] Site fetch error:', siteError)
      return NextResponse.json({ error: 'Site fetch failed' }, { status: 500 })
    }

    console.log(`[Cron] Found ${sites.length} connected sites`)

    let totalSynced = 0
    let totalMatched = 0

    for (const site of sites) {
      if (site.site_type !== 'naver') continue

      try {
        const client = createNaverClient(
          site.application_id,
          site.application_secret
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
            .eq('my_site_id', site.id)
            .eq('external_order_id', order.orderId)
            .eq('product_order_id', order.productOrderId || order.orderId)
            .single()

          if (existing) continue

          // 상품 찾기
          const { data: product } = await supabase
            .from('products')
            .select('id, cost')
            .eq('my_site_id', site.id)
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
              .eq('user_id', site.user_id)
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

            // 캠페인 테이블 삭제됨 - ad_channels로 대체됨
          }
        }

        // 마지막 동기화 시간 업데이트
        await supabase
          .from('my_sites')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', site.id)

      } catch (err) {
        console.error(`[Cron] Site ${site.id} error:`, err)
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
