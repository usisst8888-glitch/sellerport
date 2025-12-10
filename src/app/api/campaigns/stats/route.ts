/**
 * 캠페인 통계 API
 * GET /api/campaigns/stats - 전체 캠페인 통계 (대시보드용)
 * POST /api/campaigns/stats - 캠페인 성과 업데이트 (일별)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 신호등 판정 함수
function getTrafficLight(roas: number): 'green' | 'yellow' | 'red' {
  if (roas >= 300) return 'green'
  if (roas >= 150) return 'yellow'
  return 'red'
}

// 전체 캠페인 통계 조회 (대시보드용)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today' // today, 7days, 30days

    // 기간 설정
    const now = new Date()
    let startDate: Date

    switch (period) {
      case '7days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
        break
      case 'today':
      default:
        startDate = new Date(now)
        startDate.setHours(0, 0, 0, 0)
        break
    }

    // 활성 캠페인 조회
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'running')

    if (campaignsError) {
      console.error('Campaigns fetch error:', campaignsError)
      return NextResponse.json({ error: '캠페인 조회에 실패했습니다' }, { status: 500 })
    }

    // 전체 통계 계산
    const totalSpent = campaigns?.reduce((sum, c) => sum + (c.spent || 0), 0) || 0
    const totalRevenue = campaigns?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0
    const totalClicks = campaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0
    const totalConversions = campaigns?.reduce((sum, c) => sum + (c.conversions || 0), 0) || 0
    const totalImpressions = campaigns?.reduce((sum, c) => sum + (c.impressions || 0), 0) || 0

    const overallRoas = totalSpent > 0 ? Math.round((totalRevenue / totalSpent) * 100) : 0
    const conversionRate = totalClicks > 0 ? Math.round((totalConversions / totalClicks) * 100 * 100) / 100 : 0 // 소수점 2자리

    // 신호등별 캠페인 수
    const lightCounts = {
      green: campaigns?.filter(c => getTrafficLight(c.roas || 0) === 'green').length || 0,
      yellow: campaigns?.filter(c => getTrafficLight(c.roas || 0) === 'yellow').length || 0,
      red: campaigns?.filter(c => getTrafficLight(c.roas || 0) === 'red').length || 0
    }

    // 빨간불 캠페인 목록 (즉시 조치 필요)
    const redLightCampaigns = campaigns
      ?.filter(c => getTrafficLight(c.roas || 0) === 'red')
      .map(c => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        roas: c.roas,
        spent: c.spent,
        revenue: c.revenue
      })) || []

    // 플랫폼별 통계
    const platformStats: Record<string, { spent: number; revenue: number; roas: number; count: number }> = {}
    campaigns?.forEach(c => {
      if (!platformStats[c.platform]) {
        platformStats[c.platform] = { spent: 0, revenue: 0, roas: 0, count: 0 }
      }
      platformStats[c.platform].spent += c.spent || 0
      platformStats[c.platform].revenue += c.revenue || 0
      platformStats[c.platform].count += 1
    })

    // 플랫폼별 ROAS 계산
    Object.keys(platformStats).forEach(platform => {
      const stats = platformStats[platform]
      stats.roas = stats.spent > 0 ? Math.round((stats.revenue / stats.spent) * 100) : 0
    })

    return NextResponse.json({
      success: true,
      data: {
        period,
        overview: {
          totalCampaigns: campaigns?.length || 0,
          activeCampaigns: campaigns?.filter(c => c.status === 'running').length || 0,
          totalSpent,
          totalRevenue,
          totalClicks,
          totalConversions,
          totalImpressions,
          overallRoas,
          conversionRate,
          overallLight: getTrafficLight(overallRoas)
        },
        lightCounts,
        redLightCampaigns,
        platformStats
      }
    })

  } catch (error) {
    console.error('Campaign stats error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 캠페인 성과 업데이트 (일별 기록)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const {
      campaignId,
      date, // YYYY-MM-DD 형식
      spent = 0,
      impressions = 0,
      clicks = 0,
      conversions = 0,
      revenue = 0
    } = body

    if (!campaignId || !date) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
    }

    // 캠페인 존재 확인
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    // ROAS 계산
    const roas = spent > 0 ? Math.round((revenue / spent) * 100) : 0

    // 일별 통계 upsert
    const { data: stats, error } = await supabase
      .from('campaign_daily_stats')
      .upsert({
        campaign_id: campaignId,
        user_id: user.id,
        date,
        spent,
        impressions,
        clicks,
        conversions,
        revenue,
        roas
      }, {
        onConflict: 'campaign_id,date'
      })
      .select()
      .single()

    if (error) {
      console.error('Campaign stats update error:', error)
      return NextResponse.json({ error: '통계 업데이트에 실패했습니다' }, { status: 500 })
    }

    // 캠페인 전체 통계도 업데이트
    const { data: allStats } = await supabase
      .from('campaign_daily_stats')
      .select('spent, impressions, clicks, conversions, revenue')
      .eq('campaign_id', campaignId)

    if (allStats) {
      const totalSpent = allStats.reduce((sum, s) => sum + (s.spent || 0), 0)
      const totalRevenue = allStats.reduce((sum, s) => sum + (s.revenue || 0), 0)
      const totalClicks = allStats.reduce((sum, s) => sum + (s.clicks || 0), 0)
      const totalConversions = allStats.reduce((sum, s) => sum + (s.conversions || 0), 0)
      const totalImpressions = allStats.reduce((sum, s) => sum + (s.impressions || 0), 0)
      const totalRoas = totalSpent > 0 ? Math.round((totalRevenue / totalSpent) * 100) : 0

      await supabase
        .from('campaigns')
        .update({
          spent: totalSpent,
          revenue: totalRevenue,
          clicks: totalClicks,
          conversions: totalConversions,
          impressions: totalImpressions,
          roas: totalRoas
        })
        .eq('id', campaignId)
    }

    return NextResponse.json({
      success: true,
      data: stats
    })

  } catch (error) {
    console.error('Campaign stats update API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
