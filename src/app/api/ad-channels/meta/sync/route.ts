import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshMetaToken } from '@/lib/meta/refresh-token'

interface MetaInsightData {
  date_start: string
  date_stop: string
  spend: string
  impressions: string
  clicks: string
  actions?: Array<{
    action_type: string
    value: string
  }>
}

interface MetaCampaign {
  id: string
  name: string
  status: string
  insights?: {
    data: MetaInsightData[]
  }
}

interface MetaCampaignsResponse {
  data: MetaCampaign[]
  paging?: {
    cursors: {
      after: string
    }
    next?: string
  }
}

// Meta 광고비 동기화
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId, dateFrom, dateTo } = body

    // 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'meta')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // 토큰 만료 체크 및 자동 갱신
    let accessToken = channel.access_token
    const tokenExpiresAt = channel.token_expires_at ? new Date(channel.token_expires_at) : null
    const now = new Date()

    if (tokenExpiresAt) {
      // 이미 만료된 경우
      if (tokenExpiresAt < now) {
        // 토큰 갱신 시도
        const refreshResult = await refreshMetaToken(channelId, accessToken, supabase)

        if (refreshResult.success && refreshResult.accessToken) {
          accessToken = refreshResult.accessToken
        } else {
          // 갱신 실패 - 재연결 필요
          await supabase
            .from('ad_channels')
            .update({ status: 'token_expired' })
            .eq('id', channelId)

          return NextResponse.json({
            error: 'Token expired, please reconnect',
            needsReconnect: true
          }, { status: 401 })
        }
      }
      // 7일 이내 만료 예정인 경우 미리 갱신
      else if (tokenExpiresAt.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000) {
        const refreshResult = await refreshMetaToken(channelId, accessToken, supabase)
        if (refreshResult.success && refreshResult.accessToken) {
          accessToken = refreshResult.accessToken
          console.log('Meta token refreshed proactively for channel:', channelId)
        }
      }
    }
    const adAccountId = channel.metadata?.ad_account_id || `act_${channel.account_id}`

    // 날짜 범위 설정 (기본: 최근 7일)
    const today = new Date()
    const from = dateFrom || new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0]
    const to = dateTo || new Date().toISOString().split('T')[0]

    // Meta API로 캠페인별 광고비 가져오기
    const insightsUrl = new URL(`https://graph.facebook.com/v18.0/${adAccountId}/campaigns`)
    insightsUrl.searchParams.set('access_token', accessToken)
    insightsUrl.searchParams.set('fields', 'id,name,status,insights.time_range({"since":"' + from + '","until":"' + to + '"}).time_increment(1){spend,impressions,clicks,actions}')
    insightsUrl.searchParams.set('limit', '100')

    const response = await fetch(insightsUrl.toString())
    const data: MetaCampaignsResponse = await response.json()

    if (!data.data) {
      console.error('Meta API error:', data)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

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

    for (const campaign of data.data) {
      if (campaign.insights?.data) {
        for (const insight of campaign.insights.data) {
          // 전환 수 추출
          let conversions = 0
          let conversionValue = 0
          if (insight.actions) {
            const purchaseAction = insight.actions.find(
              a => a.action_type === 'purchase' || a.action_type === 'omni_purchase'
            )
            if (purchaseAction) {
              conversions = parseInt(purchaseAction.value) || 0
            }
          }

          spendRecords.push({
            ad_channel_id: channelId,
            user_id: user.id,
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            date: insight.date_start,
            spend: Math.round(parseFloat(insight.spend) * 100) / 100, // 소수점 2자리
            impressions: parseInt(insight.impressions) || 0,
            clicks: parseInt(insight.clicks) || 0,
            conversions,
            conversion_value: conversionValue,
            raw_data: insight as unknown as Record<string, unknown>,
          })
        }
      }
    }

    // 기존 데이터 삭제 후 새 데이터 삽입 (upsert)
    if (spendRecords.length > 0) {
      // 중복 방지를 위해 upsert 사용
      const { error: upsertError } = await supabase
        .from('ad_spend_daily')
        .upsert(spendRecords, {
          onConflict: 'ad_channel_id,campaign_id,date',
          ignoreDuplicates: false,
        })

      if (upsertError) {
        console.error('Failed to save ad spend:', upsertError)
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 })
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
      campaigns: data.data.length,
      dateRange: { from, to },
    })
  } catch (error) {
    console.error('Meta sync error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 })
    }

    // 날짜 범위 설정 (기본: 최근 30일)
    const today = new Date()
    const from = dateFrom || new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0]
    const to = dateTo || new Date().toISOString().split('T')[0]

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
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // 집계
    const totalSpend = spendData?.reduce((sum, d) => sum + (d.spend || 0), 0) || 0
    const totalImpressions = spendData?.reduce((sum, d) => sum + (d.impressions || 0), 0) || 0
    const totalClicks = spendData?.reduce((sum, d) => sum + (d.clicks || 0), 0) || 0
    const totalConversions = spendData?.reduce((sum, d) => sum + (d.conversions || 0), 0) || 0

    return NextResponse.json({
      data: spendData,
      summary: {
        totalSpend,
        totalImpressions,
        totalClicks,
        totalConversions,
        ctr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0',
        cpc: totalClicks > 0 ? Math.round(totalSpend / totalClicks) : 0,
      },
      dateRange: { from, to },
    })
  } catch (error) {
    console.error('Meta stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
