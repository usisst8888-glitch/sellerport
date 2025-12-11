/**
 * 수익 통계 API
 * GET /api/profit/stats - 사용자의 수익 통계 반환
 *
 * 상품 목록, 주문 데이터 및 추적 링크 데이터를 기반으로 전체 수익 통계를 계산합니다.
 * 정산 API 연동 플랫폼(네이버 등)은 실제 정산금액 기반으로 계산합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculatePlatformFee } from '../platforms/route'

interface ProductStats {
  productId: string
  productName: string
  platform: string
  platformType: string
  sellingPrice: number
  cost: number
  platformFee: number
  margin: number
  marginRate: number
  salesCount: number
  totalRevenue: number
  totalProfit: number
  // 정산 기반 데이터
  hasSettlementData: boolean
  settlementAmount?: number
  actualCommission?: number
  actualCommissionRate?: number
}

interface TrackingLinkStats {
  trackingLinkId: string
  trackingLinkName: string
  clicks: number
  conversions: number
  revenue: number
  adSpend: number
  roas: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인 (필수 - 로그인한 사용자의 통계만 조회)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다'
      }, { status: 401 })
    }

    // 1. 상품 데이터 가져오기
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, platform_type, price, cost, platforms(platform_name)')
      .eq('user_id', user.id)

    if (productsError) {
      console.error('Products fetch error:', productsError)
      return NextResponse.json({
        success: false,
        error: '상품 데이터를 가져오는데 실패했습니다'
      }, { status: 500 })
    }

    // 2. 추적 링크 데이터 가져오기 (전환 추적)
    const { data: trackingLinks, error: trackingLinksError } = await supabase
      .from('tracking_links')
      .select('id, name, utm_source, utm_medium, utm_campaign, clicks, conversions, revenue, ad_spend, status, products(id, name, price, cost)')
      .eq('user_id', user.id)

    if (trackingLinksError) {
      console.error('Tracking links fetch error:', trackingLinksError)
      return NextResponse.json({
        success: false,
        error: '추적 링크 데이터를 가져오는데 실패했습니다'
      }, { status: 500 })
    }

    // 3. 주문 데이터 가져오기 (정산 정보 포함)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        product_name,
        total_amount,
        quantity,
        platform_type,
        settlement_amount,
        settlement_commission,
        settlement_commission_rate,
        platform_fee,
        shipping_fee,
        cost,
        order_status
      `)
      .eq('user_id', user.id)
      .not('order_status', 'in', '("cancelled","returned")')

    if (ordersError) {
      console.error('Orders fetch error:', ordersError)
    }

    // 3-1. 주문 기반 수익 통계 계산 (정산금액 우선 적용)
    const orderStats = {
      totalOrders: (orders || []).length,
      totalOrderRevenue: 0,
      totalSettlementAmount: 0,
      totalCommission: 0,
      totalOrderProfit: 0,
      ordersWithSettlement: 0,
      ordersWithoutSettlement: 0,
      avgCommissionRate: 0
    }

    let totalCommissionSum = 0
    let commissionCount = 0

    for (const order of (orders || [])) {
      orderStats.totalOrderRevenue += order.total_amount || 0

      if (order.settlement_amount !== null && order.settlement_amount !== undefined) {
        // 정산금액이 있는 경우 (네이버 등 API 연동 플랫폼)
        orderStats.ordersWithSettlement++
        orderStats.totalSettlementAmount += order.settlement_amount
        orderStats.totalCommission += order.settlement_commission || 0

        // 실제 정산 기반 순이익 계산
        // 순이익 = 정산금액 - 원가 - 배송비
        const orderCost = order.cost || 0
        const shippingCost = order.shipping_fee || 0
        const profit = order.settlement_amount - (orderCost * order.quantity) - shippingCost
        orderStats.totalOrderProfit += profit

        if (order.settlement_commission_rate) {
          totalCommissionSum += order.settlement_commission_rate
          commissionCount++
        }
      } else {
        // 정산금액이 없는 경우 (자체몰 등)
        orderStats.ordersWithoutSettlement++

        // 예상 수수료 기반 계산
        const feeCalc = calculatePlatformFee(
          order.platform_type || 'etc',
          null,
          null,
          order.total_amount || 0
        )
        const estimatedFee = feeCalc.totalFee
        orderStats.totalCommission += estimatedFee

        // 예상 순이익 = 주문금액 - 예상수수료 - 원가 - 배송비
        const orderCost = order.cost || 0
        const shippingCost = order.shipping_fee || 0
        const profit = (order.total_amount || 0) - estimatedFee - (orderCost * order.quantity) - shippingCost
        orderStats.totalOrderProfit += profit

        totalCommissionSum += feeCalc.feeRate
        commissionCount++
      }
    }

    orderStats.avgCommissionRate = commissionCount > 0
      ? Math.round((totalCommissionSum / commissionCount) * 100) / 100
      : 0

    // 4. 상품별 수익 통계 계산 (정산 정보 활용)
    const productStats: ProductStats[] = (products || []).map(product => {
      // 플랫폼 수수료 계산 (기본 설정 사용)
      const feeCalc = calculatePlatformFee(
        product.platform_type,
        null,
        null,
        product.price
      )
      const estimatedPlatformFee = feeCalc.totalFee

      // 기본 배송비 (실제 데이터가 있다면 해당 데이터 사용)
      const shippingCost = 3000

      const totalCost = product.cost + estimatedPlatformFee + shippingCost
      const margin = product.price - totalCost
      const marginRate = product.price > 0 ? (margin / product.price) * 100 : 0

      // 판매 수량 (실제 주문 데이터가 있다면 해당 데이터 사용, 없으면 기본 1)
      const salesCount = 1
      const totalRevenue = product.price * salesCount
      const totalProfit = margin * salesCount

      return {
        productId: product.id,
        productName: product.name,
        platform: (product.platforms as { platform_name?: string } | null)?.platform_name || product.platform_type,
        platformType: product.platform_type,
        sellingPrice: product.price,
        cost: product.cost,
        platformFee: estimatedPlatformFee,
        margin,
        marginRate,
        salesCount,
        totalRevenue,
        totalProfit,
        hasSettlementData: false // 상품별 집계에서는 아직 정산 데이터 미적용
      }
    })

    // 4. 추적 링크별 광고 통계 계산
    const trackingLinkStats: TrackingLinkStats[] = (trackingLinks || [])
      .filter(link => link.ad_spend > 0)
      .map(link => {
        const roas = link.ad_spend > 0 ? Math.round((link.revenue / link.ad_spend) * 100) : 0

        return {
          trackingLinkId: link.id,
          trackingLinkName: link.name,
          clicks: link.clicks || 0,
          conversions: link.conversions || 0,
          revenue: link.revenue || 0,
          adSpend: link.ad_spend || 0,
          roas
        }
      })

    // 5. 전체 통계 계산
    const totalProducts = productStats.length
    const totalRevenue = productStats.reduce((sum, p) => sum + p.totalRevenue, 0)
    const totalCost = productStats.reduce((sum, p) => sum + (p.cost * p.salesCount), 0)
    const totalPlatformFee = productStats.reduce((sum, p) => sum + p.platformFee, 0)
    const totalProfit = productStats.reduce((sum, p) => sum + p.totalProfit, 0)
    const avgMarginRate = totalProducts > 0
      ? productStats.reduce((sum, p) => sum + p.marginRate, 0) / totalProducts
      : 0

    // 광고 통계
    const totalAdSpend = trackingLinkStats.reduce((sum, s) => sum + s.adSpend, 0)
    const totalAdRevenue = trackingLinkStats.reduce((sum, s) => sum + s.revenue, 0)
    const totalConversions = trackingLinkStats.reduce((sum, s) => sum + s.conversions, 0)
    const totalClicks = trackingLinkStats.reduce((sum, s) => sum + s.clicks, 0)
    const overallRoas = totalAdSpend > 0 ? Math.round((totalAdRevenue / totalAdSpend) * 100) : 0
    const conversionRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 10000) / 100 : 0

    // 상위 성과 상품 (마진율 기준 Top 5)
    const topProducts = [...productStats]
      .sort((a, b) => b.marginRate - a.marginRate)
      .slice(0, 5)
      .map(p => ({
        name: p.productName,
        marginRate: Math.round(p.marginRate * 100) / 100,
        profit: p.margin
      }))

    // 상위 성과 추적 링크 (ROAS 기준 Top 5)
    const topTrackingLinks = [...trackingLinkStats]
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 5)
      .map(s => ({
        name: s.trackingLinkName,
        roas: s.roas,
        revenue: s.revenue,
        adSpend: s.adSpend
      }))

    // 6. 결과 반환
    // 주문 데이터가 있으면 주문 기반 통계 사용, 없으면 상품 기반 예상 통계 사용
    const hasOrderData = orderStats.totalOrders > 0
    const finalRevenue = hasOrderData ? orderStats.totalOrderRevenue : totalRevenue
    const finalProfit = hasOrderData ? orderStats.totalOrderProfit : totalProfit
    const finalPlatformFee = hasOrderData ? orderStats.totalCommission : totalPlatformFee

    const result = {
      // 전체 요약
      summary: {
        totalProducts,
        totalRevenue: finalRevenue,
        totalCost,
        totalPlatformFee: finalPlatformFee,
        totalProfit: finalProfit,
        avgMarginRate: Math.round(avgMarginRate * 100) / 100,
        totalAdSpend,
        totalAdRevenue,
        overallRoas,
        netProfitAfterAd: finalProfit - totalAdSpend
      },

      // 주문 기반 정산 통계 (NEW)
      orders: {
        totalOrders: orderStats.totalOrders,
        totalOrderRevenue: orderStats.totalOrderRevenue,
        totalSettlementAmount: orderStats.totalSettlementAmount,
        totalCommission: orderStats.totalCommission,
        avgCommissionRate: orderStats.avgCommissionRate,
        totalOrderProfit: orderStats.totalOrderProfit,
        ordersWithSettlement: orderStats.ordersWithSettlement,
        ordersWithoutSettlement: orderStats.ordersWithoutSettlement,
        settlementCoverage: orderStats.totalOrders > 0
          ? Math.round((orderStats.ordersWithSettlement / orderStats.totalOrders) * 100)
          : 0
      },

      // 광고 성과
      advertising: {
        totalAdSpend,
        totalAdRevenue,
        totalConversions,
        totalClicks,
        overallRoas,
        conversionRate,
        activeTrackingLinks: trackingLinkStats.length
      },

      // 상품 통계
      products: {
        total: totalProducts,
        stats: productStats,
        top: topProducts
      },

      // 추적 링크 통계
      trackingLinks: {
        total: trackingLinkStats.length,
        stats: trackingLinkStats,
        top: topTrackingLinks
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Stats calculation error:', error)
    const errorMessage = error instanceof Error ? error.message : '서버 오류가 발생했습니다'
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 })
  }
}
