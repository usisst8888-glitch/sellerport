/**
 * 대시보드 통계 API
 * GET /api/dashboard/stats
 *
 * 추적 링크 기반 통합 통계 제공
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 추적 링크 목록 조회
    const { data: trackingLinks, error: trackingLinksError } = await supabase
      .from('tracking_links')
      .select(`
        id,
        post_name,
        utm_source,
        utm_medium,
        utm_campaign,
        target_url,
        clicks,
        conversions,
        revenue,
        ad_spend,
        status,
        created_at,
        target_roas_green,
        target_roas_yellow,
        products (
          id,
          name,
          image_url,
          price,
          cost
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (trackingLinksError) {
      console.error('Tracking links fetch error:', trackingLinksError)
      return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 })
    }

    const linkList = trackingLinks || []

    // ROAS 기반 신호등 판정 (추적 링크별 개별 기준 적용)
    const linksWithLight = linkList.map(link => {
      const roas = link.ad_spend > 0 ? Math.round((link.revenue / link.ad_spend) * 100) : 0
      // 개별 기준이 없으면 기본값 사용 (초록: 300%, 노란: 150%)
      const greenThreshold = link.target_roas_green ?? 300
      const yellowThreshold = link.target_roas_yellow ?? 150

      let trafficLight: 'green' | 'yellow' | 'red' | 'gray' = 'gray'
      if (roas >= greenThreshold) trafficLight = 'green'
      else if (roas >= yellowThreshold) trafficLight = 'yellow'
      else if (roas > 0) trafficLight = 'red'

      return {
        ...link,
        roas,
        trafficLight,
        targetRoasGreen: greenThreshold,
        targetRoasYellow: yellowThreshold
      }
    })

    // 신호등 통계
    const greenCount = linksWithLight.filter(s => s.trafficLight === 'green').length
    const yellowCount = linksWithLight.filter(s => s.trafficLight === 'yellow').length
    const redCount = linksWithLight.filter(s => s.trafficLight === 'red').length

    // 전체 통계
    const totalClicks = linkList.reduce((sum, s) => sum + (s.clicks || 0), 0)
    const totalConversions = linkList.reduce((sum, s) => sum + (s.conversions || 0), 0)
    const totalAdSpend = linkList.reduce((sum, s) => sum + (s.ad_spend || 0), 0)
    const totalRevenue = linkList.reduce((sum, s) => sum + (s.revenue || 0), 0)
    const averageRoas = totalAdSpend > 0 ? Math.round((totalRevenue / totalAdSpend) * 100) : 0
    const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00'

    // 간단 순이익 (광고비만 차감)
    const profit = totalRevenue - totalAdSpend

    // 빨간불 추적 링크
    const redLightLinks = linksWithLight.filter(s => s.trafficLight === 'red')

    // 오늘 통계 (최근 24시간)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: todayConversions } = await supabase
      .from('ad_performance')
      .select('order_amount')
      .eq('user_id', user.id)
      .gte('converted_at', today.toISOString())

    const todayRevenue = (todayConversions || []).reduce((sum, c) => sum + (c.order_amount || 0), 0)
    const todayConversionCount = todayConversions?.length || 0

    // 설정 상태 확인
    // 1. 사이트 연동 확인
    const { data: mySites } = await supabase
      .from('my_shoppingmall')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('status', 'connected')
      .limit(1)
    const hasSiteConnected = (mySites?.length || 0) > 0

    // 2. 추적 링크 생성 확인
    const hasTrackingLinkCreated = linkList.length > 0

    // 3. 광고채널 연동 확인
    const { data: adChannels } = await supabase
      .from('ad_channels')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'connected')
      .limit(1)
    const hasAdChannelConnected = (adChannels?.length || 0) > 0

    const setupProgress = {
      siteConnected: hasSiteConnected,
      adChannelConnected: hasAdChannelConnected,
      trackingLinkCreated: hasTrackingLinkCreated,
      allCompleted: hasSiteConnected && hasAdChannelConnected && hasTrackingLinkCreated
    }

    return NextResponse.json({
      success: true,
      data: {
        // 신호등 카운트
        signalCounts: {
          green: greenCount,
          yellow: yellowCount,
          red: redCount
        },

        // 전체 통계
        totals: {
          trackingLinks: linkList.length,
          clicks: totalClicks,
          conversions: totalConversions,
          adSpend: totalAdSpend,
          revenue: totalRevenue,
          roas: averageRoas,
          conversionRate: parseFloat(conversionRate),
          profit
        },

        // 오늘 통계
        today: {
          conversions: todayConversionCount,
          revenue: todayRevenue
        },

        // 추적 링크 목록 (신호등 포함)
        trackingLinks: linksWithLight.slice(0, 20),

        // 빨간불 추적 링크
        redLightLinks: redLightLinks.slice(0, 5),

        // 설정 진행 상태
        setupProgress
      }
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
