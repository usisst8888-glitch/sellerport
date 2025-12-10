/**
 * 네이버 데이터 동기화 API
 * POST /api/naver/sync
 *
 * 네이버 스마트스토어에서 상품 및 주문 데이터를 동기화합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNaverClient } from '@/lib/naver/commerce-api'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { platformId, syncType = 'all' } = await request.json()

    if (!platformId) {
      return NextResponse.json({ error: 'platformId가 필요합니다' }, { status: 400 })
    }

    // 플랫폼 정보 조회
    const { data: platform, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('id', platformId)
      .eq('user_id', user.id)
      .single()

    if (platformError || !platform) {
      return NextResponse.json({ error: '플랫폼을 찾을 수 없습니다' }, { status: 404 })
    }

    if (platform.status !== 'connected') {
      return NextResponse.json({ error: '플랫폼이 연동되지 않았습니다. 먼저 검증을 완료해주세요.' }, { status: 400 })
    }

    // 네이버 API 클라이언트 생성
    const naverClient = createNaverClient(
      platform.application_id,
      platform.application_secret
    )

    const results = {
      products: { synced: 0, errors: 0 },
      orders: { synced: 0, errors: 0 }
    }

    // 상품 동기화
    if (syncType === 'all' || syncType === 'products') {
      try {
        const productsResponse = await naverClient.getProducts(0, 100)
        const products = productsResponse.contents || []

        for (const product of products) {
          try {
            await supabase
              .from('products')
              .upsert({
                user_id: user.id,
                platform_id: platformId,
                platform_type: 'naver',
                external_product_id: product.originProductNo.toString(),
                name: product.name,
                price: product.salePrice,
                stock: product.stockQuantity,
                status: product.channelProducts?.[0]?.statusType || 'unknown',
                image_url: product.images?.representativeImage?.url || null,
                synced_at: new Date().toISOString()
              }, {
                onConflict: 'platform_id,external_product_id'
              })

            results.products.synced++
          } catch (err) {
            console.error('Product sync error:', err)
            results.products.errors++
          }
        }
      } catch (err) {
        console.error('Products fetch error:', err)
      }
    }

    // 주문 동기화 (최근 7일)
    if (syncType === 'all' || syncType === 'orders') {
      try {
        const ordersResponse = await naverClient.getNewOrders()
        const orders = ordersResponse.data?.contents || []

        for (const order of orders) {
          try {
            await supabase
              .from('orders')
              .upsert({
                user_id: user.id,
                platform_id: platformId,
                platform_type: 'naver',
                external_order_id: order.orderId,
                product_order_id: order.productOrderId,
                product_name: order.productName,
                quantity: order.quantity,
                total_amount: order.totalPaymentAmount,
                product_price: order.productPrice,
                shipping_fee: order.shippingFee,
                status: order.productOrderStatus,
                order_date: order.orderDate,
                inflow_path: order.inflowPathType || null,
                synced_at: new Date().toISOString()
              }, {
                onConflict: 'platform_id,external_order_id,product_order_id'
              })

            results.orders.synced++
          } catch (err) {
            console.error('Order sync error:', err)
            results.orders.errors++
          }
        }
      } catch (err) {
        console.error('Orders fetch error:', err)
      }
    }

    // 마지막 동기화 시간 업데이트
    await supabase
      .from('platforms')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', platformId)

    return NextResponse.json({
      success: true,
      message: '동기화가 완료되었습니다',
      results
    })

  } catch (error) {
    console.error('Naver sync error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
