import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface GoogleAdsMetricsRow {
  campaign: {
    resourceName: string
    id: string
    name: string
    status: string
  }
  metrics: {
    impressions: string
    clicks: string
    costMicros: string
    conversions: number
    conversionsValue: number
  }
  segments: {
    date: string
  }
}

interface GoogleAdsSearchResponse {
  results?: GoogleAdsMetricsRow[]
  nextPageToken?: string
}

interface GoogleTokenRefreshResponse {
  access_token: string
  expires_in: number
  token_type: string
}

// 토큰 갱신
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data: GoogleTokenRefreshResponse = await response.json()
    return data.access_token || null
  } catch (error) {
    console.error('Token refresh error:', error)
    return null
  }
}

// Google Ads 광고비 동기화
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
      .eq('channel_type', 'google_ads')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    let accessToken = channel.access_token
    const refreshToken = channel.refresh_token
    const customerId = channel.account_id

    // 토큰 만료 체크 및 갱신
    if (channel.token_expires_at && new Date(channel.token_expires_at) < new Date()) {
      if (refreshToken) {
        const newToken = await refreshAccessToken(refreshToken)
        if (newToken) {
          accessToken = newToken
          // 새 토큰 저장
          await supabase
            .from('ad_channels')
            .update({
              access_token: newToken,
              token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
            })
            .eq('id', channelId)
        } else {
          await supabase
            .from('ad_channels')
            .update({ status: 'token_expired' })
            .eq('id', channelId)
          return NextResponse.json({ error: 'Token refresh failed, please reconnect' }, { status: 401 })
        }
      } else {
        await supabase
          .from('ad_channels')
          .update({ status: 'token_expired' })
          .eq('id', channelId)
        return NextResponse.json({ error: 'Token expired, please reconnect' }, { status: 401 })
      }
    }

    const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    const GOOGLE_ADS_LOGIN_CUSTOMER_ID = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID

    if (!GOOGLE_ADS_DEVELOPER_TOKEN) {
      return NextResponse.json({ error: 'Developer token not configured' }, { status: 500 })
    }

    // 날짜 범위 설정 (기본: 최근 7일)
    const today = new Date()
    const defaultFrom = new Date(today)
    defaultFrom.setDate(today.getDate() - 7)
    const from = dateFrom || defaultFrom.toISOString().split('T')[0]
    const to = dateTo || new Date().toISOString().split('T')[0]

    // Google Ads API GAQL 쿼리로 캠페인별 일별 데이터 가져오기
    const query = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        segments.date
      FROM campaign
      WHERE segments.date BETWEEN '${from}' AND '${to}'
      ORDER BY segments.date DESC
    `

    const searchUrl = `https://googleads.googleapis.com/v18/customers/${customerId}/googleAds:search`

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
        'Content-Type': 'application/json',
        ...(GOOGLE_ADS_LOGIN_CUSTOMER_ID && {
          'login-customer-id': GOOGLE_ADS_LOGIN_CUSTOMER_ID,
        }),
      },
      body: JSON.stringify({ query }),
    })

    const data: GoogleAdsSearchResponse = await response.json()

    if (!response.ok) {
      console.error('Google Ads API error:', data)
      return NextResponse.json({
        error: 'Failed to fetch campaigns',
        details: data,
      }, { status: 500 })
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

    if (data.results) {
      for (const row of data.results) {
        const spend = parseInt(row.metrics.costMicros || '0') / 1000000 // micros to currency

        spendRecords.push({
          ad_channel_id: channelId,
          user_id: user.id,
          campaign_id: row.campaign.id,
          campaign_name: row.campaign.name,
          date: row.segments.date,
          spend: Math.round(spend * 100) / 100,
          impressions: parseInt(row.metrics.impressions || '0'),
          clicks: parseInt(row.metrics.clicks || '0'),
          conversions: Math.round(row.metrics.conversions || 0),
          conversion_value: Math.round((row.metrics.conversionsValue || 0) * 100) / 100,
          raw_data: row as unknown as Record<string, unknown>,
        })
      }
    }

    // 기존 데이터 삭제 후 새 데이터 삽입 (upsert)
    if (spendRecords.length > 0) {
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
      .update({
        last_sync_at: new Date().toISOString(),
        status: 'connected',
      })
      .eq('id', channelId)

    // 고유 캠페인 수 계산
    const uniqueCampaigns = new Set(spendRecords.map(r => r.campaign_id)).size

    return NextResponse.json({
      success: true,
      synced: spendRecords.length,
      campaigns: uniqueCampaigns,
      dateRange: { from, to },
    })
  } catch (error) {
    console.error('Google Ads sync error:', error)
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
    const defaultFrom = new Date(today)
    defaultFrom.setDate(today.getDate() - 30)
    const from = dateFrom || defaultFrom.toISOString().split('T')[0]
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
        roas: totalSpend > 0 ? (totalConversionValue / totalSpend * 100).toFixed(0) : '0',
      },
      dateRange: { from, to },
    })
  } catch (error) {
    console.error('Google Ads stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
