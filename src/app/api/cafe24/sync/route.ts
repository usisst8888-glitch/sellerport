/**
 * 카페24 데이터 동기화 API
 * POST /api/cafe24/sync
 *
 * 카페24 쇼핑몰에서 상품, 주문 데이터를 동기화합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCafe24Client } from '@/lib/cafe24/commerce-api'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { siteId, syncType = 'all' } = await request.json()

    if (!siteId) {
      return NextResponse.json({ error: 'siteId가 필요합니다' }, { status: 400 })
    }

    // 사이트 정보 조회
    const { data: site, error: siteError } = await supabase
      .from('my_sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: '사이트를 찾을 수 없습니다' }, { status: 404 })
    }

    if (site.site_type !== 'cafe24') {
      return NextResponse.json({ error: '카페24 사이트가 아닙니다' }, { status: 400 })
    }

    if (site.status !== 'connected' || !site.access_token) {
      return NextResponse.json({ error: '사이트가 연동되지 않았습니다' }, { status: 400 })
    }

    // 카페24 API 클라이언트 생성
    const cafe24Client = createCafe24Client(site.store_id, site.access_token)

    const results = {
      products: { synced: 0, errors: 0 },
      orders: { synced: 0, errors: 0 }
    }

    // 토큰 만료 체크 및 갱신
    if (site.token_expires_at && new Date(site.token_expires_at) < new Date()) {
      try {
        const newToken = await cafe24Client.refreshAccessToken(site.refresh_token)
        await supabase
          .from('my_sites')
          .update({
            access_token: newToken.access_token,
            refresh_token: newToken.refresh_token,
            token_expires_at: newToken.expires_at
          })
          .eq('id', siteId)

        cafe24Client.setAccessToken(newToken.access_token)
      } catch (e) {
        console.error('Token refresh failed:', e)
        return NextResponse.json({ error: '토큰이 만료되었습니다. 다시 연동해주세요.' }, { status: 401 })
      }
    }

    // 상품 동기화
    if (syncType === 'all' || syncType === 'products') {
      try {
        console.log('========== 카페24 상품 동기화 시작 ==========')

        const productsResponse = await cafe24Client.getProducts(100, 0)
        const products = productsResponse.products || []

        console.log(`조회된 상품 수: ${products.length}`)

        for (const product of products) {
          try {
            await supabase
              .from('products')
              .upsert({
                user_id: user.id,
                my_site_id: siteId,
                site_type: 'cafe24',
                external_product_id: product.product_no.toString(),
                name: product.product_name,
                price: parseFloat(product.price) || 0,
                stock: product.quantity || 0,
                status: product.selling === 'T' ? 'SALE' : 'OUTOFSTOCK',
                image_url: product.detail_image || product.list_image || null,
                synced_at: new Date().toISOString()
              }, {
                onConflict: 'my_site_id,external_product_id'
              })

            results.products.synced++
            console.log(`상품 동기화 성공: ${product.product_name} (${product.product_no})`)
          } catch (err) {
            console.error('Product sync error:', err)
            results.products.errors++
          }
        }

        console.log('========== 카페24 상품 동기화 완료 ==========')
      } catch (err) {
        console.error('Products fetch error:', err)
      }
    }

    // 주문 동기화 (최근 7일)
    if (syncType === 'all' || syncType === 'orders') {
      try {
        console.log('========== 카페24 주문 동기화 시작 ==========')

        const ordersResponse = await cafe24Client.getRecentOrders()
        const orders = ordersResponse.orders || []

        console.log(`조회된 주문 수: ${orders.length}`)

        for (const order of orders) {
          try {
            // 추적 링크 매칭 시도 (주문 아이템별로)
            for (const item of order.items || []) {
              let trackingLinkId: string | null = null

              // 해당 상품에 연결된 추적 링크 찾기
              const { data: productWithLink } = await supabase
                .from('products')
                .select('id')
                .eq('my_site_id', siteId)
                .eq('external_product_id', item.product_no.toString())
                .single()

              if (productWithLink) {
                const { data: trackingLink } = await supabase
                  .from('tracking_links')
                  .select('id')
                  .eq('user_id', user.id)
                  .eq('product_id', productWithLink.id)
                  .eq('status', 'active')
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single()

                if (trackingLink) {
                  trackingLinkId = trackingLink.id
                }
              }

              // 최근 클릭 기록으로 매칭 시도
              if (!trackingLinkId) {
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
                const { data: recentClick } = await supabase
                  .from('tracking_link_clicks')
                  .select('tracking_link_id')
                  .eq('user_id', user.id)
                  .gte('clicked_at', sevenDaysAgo)
                  .order('clicked_at', { ascending: false })
                  .limit(1)
                  .single()

                if (recentClick) {
                  trackingLinkId = recentClick.tracking_link_id
                }
              }

              const totalAmount = parseFloat(item.payment_amount) || 0

              await supabase
                .from('orders')
                .upsert({
                  user_id: user.id,
                  my_site_id: siteId,
                  site_type: 'cafe24',
                  external_order_id: order.order_id,
                  product_order_id: item.order_item_code,
                  product_name: item.product_name,
                  quantity: item.quantity,
                  total_amount: totalAmount,
                  product_price: parseFloat(item.product_price) || 0,
                  shipping_fee: parseFloat(order.total_shipping_fee) / (order.items?.length || 1),
                  status: item.order_status,
                  order_date: order.order_date,
                  tracking_link_id: trackingLinkId,
                  synced_at: new Date().toISOString()
                }, {
                  onConflict: 'my_site_id,external_order_id,product_order_id'
                })

              // 추적 링크가 매칭된 경우 전환/매출 업데이트
              if (trackingLinkId) {
                const { data: currentLink } = await supabase
                  .from('tracking_links')
                  .select('conversions, revenue')
                  .eq('id', trackingLinkId)
                  .single()

                if (currentLink) {
                  await supabase
                    .from('tracking_links')
                    .update({
                      conversions: (currentLink.conversions || 0) + 1,
                      revenue: (currentLink.revenue || 0) + totalAmount
                    })
                    .eq('id', trackingLinkId)
                }
              }

              results.orders.synced++
            }

            console.log(`주문 동기화 성공: ${order.order_id}`)
          } catch (err) {
            console.error('Order sync error:', err)
            results.orders.errors++
          }
        }

        console.log('========== 카페24 주문 동기화 완료 ==========')
      } catch (err) {
        console.error('Orders fetch error:', err)
      }
    }

    // 마지막 동기화 시간 업데이트
    await supabase
      .from('my_sites')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', siteId)

    return NextResponse.json({
      success: true,
      message: '동기화가 완료되었습니다',
      results
    })

  } catch (error) {
    console.error('Cafe24 sync error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
