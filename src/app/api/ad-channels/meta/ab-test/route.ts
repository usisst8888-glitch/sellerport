import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AdInsight {
  ad_id: string
  ad_name: string
  impressions: number
  clicks: number
  spend: number
  conversions: number
  ctr: number
  cpc: number
  roas: number
}

// A/B 테스트 성과 조회 API
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')
    const channelId = searchParams.get('channelId')

    if (!campaignId || !channelId) {
      return NextResponse.json({ error: '캠페인 ID와 채널 ID가 필요합니다' }, { status: 400 })
    }

    // 채널 정보 가져오기
    const { data: channel } = await supabase
      .from('ad_channels')
      .select('access_token, metadata')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .single()

    if (!channel) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다' }, { status: 404 })
    }

    // 캠페인 정보 가져오기
    const { data: campaign } = await supabase
      .from('meta_campaigns')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    // Meta API에서 광고별 성과 조회
    const accessToken = channel.access_token
    const adAccountId = channel.metadata?.ad_account_id || `act_${channel.metadata?.account_id}`

    // 캠페인의 광고들 성과 조회
    const adsResponse = await fetch(
      `https://graph.facebook.com/v21.0/${campaignId}/ads?fields=id,name,insights.date_preset(last_7d){impressions,clicks,spend,actions,action_values}&access_token=${accessToken}`
    )

    if (!adsResponse.ok) {
      const errorData = await adsResponse.json()
      return NextResponse.json({
        error: '광고 성과 조회에 실패했습니다',
        details: errorData.error?.message
      }, { status: 400 })
    }

    const adsData = await adsResponse.json()
    const adInsights: AdInsight[] = []

    for (const ad of adsData.data || []) {
      const insights = ad.insights?.data?.[0] || {}
      const impressions = parseInt(insights.impressions || '0')
      const clicks = parseInt(insights.clicks || '0')
      const spend = parseFloat(insights.spend || '0')

      // 전환 수 계산 (purchase 액션)
      const conversions = insights.actions?.find(
        (a: { action_type: string; value: string }) => a.action_type === 'purchase'
      )?.value || 0

      // 전환 가치 계산
      const conversionValue = insights.action_values?.find(
        (a: { action_type: string; value: string }) => a.action_type === 'purchase'
      )?.value || 0

      adInsights.push({
        ad_id: ad.id,
        ad_name: ad.name,
        impressions,
        clicks,
        spend,
        conversions: parseInt(conversions),
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        roas: spend > 0 ? (parseFloat(conversionValue) / spend) * 100 : 0,
      })
    }

    // 성과 비교 분석
    const sortedByRoas = [...adInsights].sort((a, b) => b.roas - a.roas)
    const sortedByCtr = [...adInsights].sort((a, b) => b.ctr - a.ctr)
    const sortedByCpc = [...adInsights].sort((a, b) => a.cpc - b.cpc)

    const winner = sortedByRoas[0]
    const totalSpend = adInsights.reduce((sum, ad) => sum + ad.spend, 0)
    const totalConversions = adInsights.reduce((sum, ad) => sum + ad.conversions, 0)

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        isABTest: campaign.is_ab_test,
        creativeCount: campaign.creative_count,
        status: campaign.status,
        createdAt: campaign.created_at,
      },
      insights: adInsights,
      analysis: {
        winner: winner ? {
          adId: winner.ad_id,
          adName: winner.ad_name,
          roas: winner.roas,
          reason: 'ROAS 기준 최고 성과',
        } : null,
        rankings: {
          byRoas: sortedByRoas.map(ad => ({ id: ad.ad_id, name: ad.ad_name, value: ad.roas })),
          byCtr: sortedByCtr.map(ad => ({ id: ad.ad_id, name: ad.ad_name, value: ad.ctr })),
          byCpc: sortedByCpc.map(ad => ({ id: ad.ad_id, name: ad.ad_name, value: ad.cpc })),
        },
        summary: {
          totalSpend,
          totalConversions,
          avgRoas: totalSpend > 0 ? adInsights.reduce((sum, ad) => sum + ad.roas, 0) / adInsights.length : 0,
          avgCtr: adInsights.reduce((sum, ad) => sum + ad.ctr, 0) / adInsights.length,
        },
      },
    })

  } catch (error) {
    console.error('A/B test insights error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
