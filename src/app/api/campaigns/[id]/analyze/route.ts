/**
 * 캠페인 AI 분석 API
 * GET /api/campaigns/[id]/analyze - 캠페인 최적화 제안 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateOptimizationTips, CampaignMetrics } from '@/lib/ai/optimization-tips'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 캠페인 조회
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    // 최근 30일 주문 데이터 조회
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount')
      .eq('campaign_id', id)
      .gte('ordered_at', thirtyDaysAgo.toISOString())
      .in('order_status', ['paid', 'shipping', 'delivered'])

    // 추적 링크 클릭 데이터 조회
    const { data: clicks } = await supabase
      .from('tracking_link_clicks')
      .select('id')
      .eq('campaign_id', id)
      .gte('created_at', thirtyDaysAgo.toISOString())

    // 메트릭스 계산
    const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
    const conversions = orders?.length || 0
    const totalClicks = clicks?.length || campaign.clicks || 0
    const spent = campaign.spent || 0
    const impressions = campaign.impressions || totalClicks * 50 // 추정치 (CTR 2% 가정)

    const metrics: CampaignMetrics = {
      roas: spent > 0 ? Math.round((totalRevenue / spent) * 100) : 0,
      ctr: impressions > 0 ? (totalClicks / impressions) * 100 : 0,
      cvr: totalClicks > 0 ? (conversions / totalClicks) * 100 : 0,
      spent,
      revenue: totalRevenue,
      clicks: totalClicks,
      impressions,
      conversions,
      avgOrderValue: conversions > 0 ? Math.round(totalRevenue / conversions) : 0
    }

    // AI 최적화 제안 생성
    const tips = generateOptimizationTips(metrics)

    // 신호등 상태 결정
    let trafficLight: 'green' | 'yellow' | 'red'
    if (metrics.roas >= 300) {
      trafficLight = 'green'
    } else if (metrics.roas >= 150) {
      trafficLight = 'yellow'
    } else {
      trafficLight = 'red'
    }

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          trafficLight
        },
        metrics: {
          roas: metrics.roas,
          ctr: parseFloat(metrics.ctr.toFixed(2)),
          cvr: parseFloat(metrics.cvr.toFixed(2)),
          spent: metrics.spent,
          revenue: metrics.revenue,
          clicks: metrics.clicks,
          impressions: metrics.impressions,
          conversions: metrics.conversions,
          avgOrderValue: metrics.avgOrderValue
        },
        tips: tips.map(tip => ({
          type: tip.type,
          priority: tip.priority,
          title: tip.title,
          description: tip.description,
          expectedImpact: tip.expectedImpact,
          actionItems: tip.actionItems
        })),
        analyzedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Campaign analyze API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
