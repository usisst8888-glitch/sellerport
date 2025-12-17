/**
 * 네이버 데이터 동기화 API
 * POST /api/naver/sync
 *
 * 네이버 스마트스토어에서 상품, 주문, 정산 데이터를 동기화합니다.
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

    if (site.status !== 'connected') {
      return NextResponse.json({ error: '사이트가 연동되지 않았습니다. 먼저 검증을 완료해주세요.' }, { status: 400 })
    }

    // 네이버 API 클라이언트 생성
    const naverClient = createNaverClient(
      site.application_id,
      site.application_secret
    )

    const results = {
      products: { synced: 0, errors: 0 },
      orders: { synced: 0, errors: 0 },
      settlements: { synced: 0, errors: 0 }
    }

    // 상품 동기화
    if (syncType === 'all' || syncType === 'products') {
      try {
        console.log('========== 상품 동기화 시작 ==========')
        console.log('Site ID:', siteId)
        console.log('Application ID:', site.application_id)

        // 페이지 1부터 시작 (API 스펙에 따름)
        const productsResponse = await naverClient.getProducts(1, 100)
        console.log('상품 API 응답 - totalElements:', productsResponse.totalElements)
        console.log('상품 API 응답 - contents 수:', productsResponse.contents?.length || 0)

        const productContents = productsResponse.contents || []
        console.log(`조회된 상품 수: ${productContents.length}`)

        // 각 content에서 channelProducts를 추출하여 처리
        for (const content of productContents) {
          // channelProducts 배열에서 첫 번째 채널 상품 정보 사용 (보통 STOREFARM)
          const channelProduct = content.channelProducts?.[0]
          if (!channelProduct) {
            console.log(`상품 ${content.originProductNo}: channelProducts 없음, 건너뜀`)
            continue
          }

          try {
            // 할인가가 있으면 할인가 사용, 없으면 정상가 사용
            const actualPrice = channelProduct.discountedPrice ?? channelProduct.salePrice

            await supabase
              .from('products')
              .upsert({
                user_id: user.id,
                my_site_id: siteId,
                site_type: 'naver',
                external_product_id: content.originProductNo.toString(),
                name: channelProduct.name,
                price: actualPrice,
                stock: channelProduct.stockQuantity,
                status: channelProduct.statusType || 'unknown',
                image_url: channelProduct.representativeImage?.url || null,
                synced_at: new Date().toISOString()
              }, {
                onConflict: 'my_site_id,external_product_id'
              })

            results.products.synced++
            console.log(`상품 동기화 성공: ${channelProduct.name} (${content.originProductNo})`)
          } catch (err) {
            console.error('Product sync error:', err)
            results.products.errors++
          }
        }
        console.log('========== 상품 동기화 완료 ==========')
      } catch (err) {
        console.error('Products fetch error:', err)
      }
    }

    // 주문 동기화 (최근 7일) + 정산 데이터 조회
    if (syncType === 'all' || syncType === 'orders') {
      try {
        const ordersResponse = await naverClient.getNewOrders()
        const orders = ordersResponse.data?.contents || []

        // 정산 정보를 조회할 상품주문번호 수집
        const productOrderIds: string[] = []

        for (const order of orders) {
          try {
            // 추적 링크 매칭 시도
            let trackingLinkId: string | null = null

            // 해당 상품에 연결된 추적 링크 찾기
            const { data: productWithLink } = await supabase
              .from('products')
              .select('id')
              .eq('my_site_id', siteId)
              .eq('external_product_id', order.originProductNo?.toString())
              .single()

            if (productWithLink) {
              // 해당 상품에 연결된 최근 클릭 추적 링크 조회
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

            // 상품별 매칭이 안 되면 최근 클릭 기록으로 매칭
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

            await supabase
              .from('orders')
              .upsert({
                user_id: user.id,
                my_site_id: siteId,
                site_type: 'naver',
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
                tracking_link_id: trackingLinkId,
                synced_at: new Date().toISOString()
              }, {
                onConflict: 'my_site_id,external_order_id,product_order_id'
              })

            // 추적 링크가 매칭된 경우 tracking_links의 전환/매출 업데이트
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
                    revenue: (currentLink.revenue || 0) + order.totalPaymentAmount
                  })
                  .eq('id', trackingLinkId)
              }
            }

            // 정산 조회 대상 추가 (구매확정된 주문만)
            if (['PURCHASE_DECIDED', 'DELIVERED', 'PURCHASE_DECISION_REQUEST'].includes(order.productOrderStatus)) {
              productOrderIds.push(order.productOrderId)
            }

            results.orders.synced++
          } catch (err) {
            console.error('Order sync error:', err)
            results.orders.errors++
          }
        }

        // 정산 정보 동기화 (syncType이 all 또는 settlements인 경우)
        if ((syncType === 'all' || syncType === 'settlements') && productOrderIds.length > 0) {
          try {
            const settlements = await naverClient.getSettlementsByProductOrderIds(productOrderIds)

            for (const settlement of settlements) {
              try {
                // 해당 주문의 정산 정보 업데이트
                await supabase
                  .from('orders')
                  .update({
                    settlement_amount: settlement.settlementAmount,
                    settlement_commission: settlement.totalCommission,
                    settlement_commission_rate: settlement.commissionRate,
                    settlement_status: settlement.settleStatus,
                    settlement_expect_date: settlement.settleExpectDate,
                    settlement_synced_at: new Date().toISOString(),
                    // 실제 수수료를 platform_fee에도 저장
                    platform_fee: settlement.totalCommission
                  })
                  .eq('my_site_id', siteId)
                  .eq('product_order_id', settlement.productOrderId)

                results.settlements.synced++
              } catch (err) {
                console.error('Settlement sync error:', err)
                results.settlements.errors++
              }
            }
          } catch (err) {
            console.error('Settlements fetch error:', err)
          }
        }
      } catch (err) {
        console.error('Orders fetch error:', err)
      }
    }

    // 정산 전용 동기화 (기존 주문의 정산 정보만 업데이트)
    if (syncType === 'settlements') {
      try {
        // 정산 정보가 없는 주문 조회
        const { data: ordersWithoutSettlement } = await supabase
          .from('orders')
          .select('product_order_id')
          .eq('my_site_id', siteId)
          .eq('site_type', 'naver')
          .is('settlement_amount', null)
          .not('product_order_id', 'is', null)
          .limit(100)

        if (ordersWithoutSettlement && ordersWithoutSettlement.length > 0) {
          const productOrderIds = ordersWithoutSettlement.map(o => o.product_order_id).filter(Boolean)

          if (productOrderIds.length > 0) {
            const settlements = await naverClient.getSettlementsByProductOrderIds(productOrderIds)

            for (const settlement of settlements) {
              try {
                await supabase
                  .from('orders')
                  .update({
                    settlement_amount: settlement.settlementAmount,
                    settlement_commission: settlement.totalCommission,
                    settlement_commission_rate: settlement.commissionRate,
                    settlement_status: settlement.settleStatus,
                    settlement_expect_date: settlement.settleExpectDate,
                    settlement_synced_at: new Date().toISOString(),
                    platform_fee: settlement.totalCommission
                  })
                  .eq('my_site_id', siteId)
                  .eq('product_order_id', settlement.productOrderId)

                results.settlements.synced++
              } catch (err) {
                console.error('Settlement sync error:', err)
                results.settlements.errors++
              }
            }
          }
        }
      } catch (err) {
        console.error('Settlements sync error:', err)
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
    console.error('Naver sync error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
