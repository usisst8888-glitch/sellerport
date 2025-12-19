import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NaverGFAAPI, NaverGFAError, getGFADateRange } from '@/lib/naver/gfa-api'

interface AdChannelMetadata {
  secretKey: string
  customerId: string
}

// 네이버 GFA 광고비 동기화
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, dateFrom, dateTo } = body

    if (!channelId) {
      return NextResponse.json({ error: '채널 ID가 필요합니다.' }, { status: 400 })
    }

    // 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'naver_gfa')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다.' }, { status: 404 })
    }

    const metadata = channel.metadata as AdChannelMetadata
    if (!metadata?.secretKey || !metadata?.customerId) {
      return NextResponse.json({ error: '채널 메타데이터가 올바르지 않습니다.' }, { status: 400 })
    }

    // 네이버 GFA API 클라이언트 생성
    const gfaApi = new NaverGFAAPI({
      customerId: metadata.customerId,
      apiKey: channel.access_token,
      secretKey: metadata.secretKey,
    })

    // 날짜 범위 설정 (기본: 최근 7일)
    const defaultRange = getGFADateRange(7)
    const from = dateFrom || defaultRange.dateStart
    const to = dateTo || defaultRange.dateEnd

    // 캠페인 목록 가져오기
    const campaigns = await gfaApi.getCampaigns()

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        campaigns: 0,
        message: '동기화할 캠페인이 없습니다.',
        dateRange: { from, to },
      })
    }

    // 캠페인 ID 목록 추출
    const campaignIds = campaigns.map(c => c.campaignId)

    // 캠페인별 일별 통계 가져오기
    const stats = await gfaApi.getCampaignStats(campaignIds, from, to)

    // 캠페인 ID를 이름으로 매핑
    const campaignNameMap = new Map(
      campaigns.map(c => [c.campaignId, c.campaignName])
    )

    // 일별 광고비 데이터 저장
    const spendRecords: Array<{
      ad_channel_id: string
      user_id: string
      campaign_id: string
      campaign_name: string
      date: string
      spend: number
      impressions: number
      clicks: number
      conversions: number
      conversion_value: number
      raw_data: Record<string, unknown>
    }> = []

    for (const stat of stats) {
      spendRecords.push({
        ad_channel_id: channelId,
        user_id: user.id,
        campaign_id: stat.campaignId,
        campaign_name: campaignNameMap.get(stat.campaignId) || stat.campaignId,
        date: stat.statDate,
        spend: stat.cost || 0,
        impressions: stat.impressions || 0,
        clicks: stat.clicks || 0,
        conversions: stat.conversions || 0,
        conversion_value: stat.conversionValue || 0,
        raw_data: stat as unknown as Record<string, unknown>,
      })
    }

    // 기존 데이터와 병합 (upsert)
    if (spendRecords.length > 0) {
      const { error: upsertError } = await supabase
        .from('ad_spend_daily')
        .upsert(spendRecords, {
          onConflict: 'ad_channel_id,campaign_id,date',
          ignoreDuplicates: false,
        })

      if (upsertError) {
        console.error('Failed to save ad spend:', upsertError)
        return NextResponse.json({ error: '데이터 저장에 실패했습니다.' }, { status: 500 })
      }
    }

    // 채널 마지막 동기화 시간 업데이트
    await supabase
      .from('ad_channels')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', channelId)

    return NextResponse.json({
      success: true,
      synced: spendRecords.length,
      campaigns: campaigns.length,
      dateRange: { from, to },
    })
  } catch (error) {
    console.error('Naver GFA sync error:', error)

    if (error instanceof NaverGFAError) {
      return NextResponse.json(
        { error: error.getUserMessage() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 특정 채널의 광고비 통계 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channelId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (!channelId) {
      return NextResponse.json({ error: '채널 ID가 필요합니다.' }, { status: 400 })
    }

    // 날짜 범위 설정 (기본: 최근 30일)
    const defaultRange = getGFADateRange(30)
    const from = dateFrom || defaultRange.dateStart
    const to = dateTo || defaultRange.dateEnd

    // 광고비 데이터 조회
    const { data: spendData, error } = await supabase
      .from('ad_spend_daily')
      .select('*')
      .eq('ad_channel_id', channelId)
      .eq('user_id', user.id)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })

    if (error) {
      return NextResponse.json({ error: '데이터 조회에 실패했습니다.' }, { status: 500 })
    }

    // 집계
    const totalSpend = spendData?.reduce((sum, d) => sum + (d.spend || 0), 0) || 0
    const totalImpressions = spendData?.reduce((sum, d) => sum + (d.impressions || 0), 0) || 0
    const totalClicks = spendData?.reduce((sum, d) => sum + (d.clicks || 0), 0) || 0
    const totalConversions = spendData?.reduce((sum, d) => sum + (d.conversions || 0), 0) || 0
    const totalConversionValue = spendData?.reduce((sum, d) => sum + (d.conversion_value || 0), 0) || 0

    return NextResponse.json({
      data: spendData,
      summary: {
        totalSpend,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalConversionValue,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0',
        cpc: totalClicks > 0 ? Math.round(totalSpend / totalClicks) : 0,
        cpm: totalImpressions > 0 ? Math.round(totalSpend / totalImpressions * 1000) : 0,
        roas: totalSpend > 0 ? ((totalConversionValue / totalSpend) * 100).toFixed(2) : '0',
      },
      dateRange: { from, to },
    })
  } catch (error) {
    console.error('Naver GFA stats error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
