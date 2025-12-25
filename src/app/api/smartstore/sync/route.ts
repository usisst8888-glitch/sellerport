/**
 * 스마트스토어 전환 데이터 동기화 API
 * POST /api/smartstore/sync
 *
 * smartstore_channel_stats의 데이터를 tracking_links와 매칭하여
 * 각 추적 링크의 전환/매출 데이터를 업데이트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // 쿠키 기반 인증 또는 Authorization 헤더 인증
    let user = null

    // 먼저 쿠키 기반 인증 시도
    const supabase = await createClient()
    const { data: { user: cookieUser } } = await supabase.auth.getUser()

    if (cookieUser) {
      user = cookieUser
    } else {
      // 쿠키 인증 실패 시 Authorization 헤더 확인
      const authHeader = request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: tokenUser } } = await supabaseAdmin.auth.getUser(token)
        user = tokenUser
      }
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    // 사용자의 추적 링크 조회
    const { data: trackingLinks, error: tlError } = await supabaseAdmin
      .from('tracking_links')
      .select('id, utm_source, utm_medium, utm_campaign')
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (tlError) {
      console.error('Tracking links fetch error:', tlError)
      return NextResponse.json({
        success: false,
        error: '추적 링크 조회 실패'
      }, { status: 500 })
    }

    if (!trackingLinks || trackingLinks.length === 0) {
      return NextResponse.json({
        success: true,
        message: '동기화할 추적 링크가 없습니다.',
        synced: 0
      })
    }

    // 사용자의 스마트스토어 채널 통계 조회 (최근 데이터)
    const { data: channelStats, error: statsError } = await supabaseAdmin
      .from('smartstore_channel_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('collected_at', { ascending: false })

    if (statsError) {
      console.error('Channel stats fetch error:', statsError)
      return NextResponse.json({
        success: false,
        error: '채널 통계 조회 실패'
      }, { status: 500 })
    }

    if (!channelStats || channelStats.length === 0) {
      return NextResponse.json({
        success: true,
        message: '동기화할 스마트스토어 데이터가 없습니다. Chrome 확장으로 먼저 데이터를 수집해주세요.',
        synced: 0
      })
    }

    // 날짜별로 그룹화하여 가장 최근 데이터 사용
    const latestStatsBySource = new Map<string, typeof channelStats[0]>()

    for (const stat of channelStats) {
      // nt_source + nt_medium 조합을 키로 사용
      const key = `${stat.nt_source}:${stat.nt_medium}`

      // 같은 소스+미디엄 조합의 데이터가 없거나 더 최근 데이터면 업데이트
      const existing = latestStatsBySource.get(key)
      if (!existing || new Date(stat.collected_at) > new Date(existing.collected_at)) {
        latestStatsBySource.set(key, stat)
      }
    }

    // 추적 링크와 채널 통계 매칭
    const updates: Array<{
      trackingLinkId: string
      conversions: number
      revenue: number
      clicks: number
      matchedSource: string
    }> = []

    for (const tl of trackingLinks) {
      // utm_source를 nt_source와 매칭
      // utm_medium을 nt_medium과 매칭
      const key = `${tl.utm_source}:${tl.utm_medium}`
      const matchedStat = latestStatsBySource.get(key)

      if (matchedStat) {
        updates.push({
          trackingLinkId: tl.id,
          conversions: matchedStat.orders || 0,
          revenue: Number(matchedStat.revenue) || 0,
          clicks: matchedStat.visits || 0,
          matchedSource: key
        })
      }
    }

    // 추적 링크 업데이트
    let syncedCount = 0
    for (const update of updates) {
      const { error: updateError } = await supabaseAdmin
        .from('tracking_links')
        .update({
          conversions: update.conversions,
          revenue: update.revenue,
          clicks: update.clicks
        })
        .eq('id', update.trackingLinkId)

      if (!updateError) {
        syncedCount++
      } else {
        console.error(`Update error for ${update.trackingLinkId}:`, updateError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `${syncedCount}개의 추적 링크가 동기화되었습니다.`,
      synced: syncedCount,
      total: trackingLinks.length,
      matched: updates.map(u => ({
        id: u.trackingLinkId,
        source: u.matchedSource,
        conversions: u.conversions,
        revenue: u.revenue
      }))
    })

  } catch (error) {
    console.error('Smartstore sync error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// GET: 매칭 현황 조회
export async function GET(request: NextRequest) {
  try {
    // 쿠키 기반 인증 또는 Authorization 헤더 인증
    let user = null

    const supabase = await createClient()
    const { data: { user: cookieUser } } = await supabase.auth.getUser()

    if (cookieUser) {
      user = cookieUser
    } else {
      const authHeader = request.headers.get('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: tokenUser } } = await supabaseAdmin.auth.getUser(token)
        user = tokenUser
      }
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    // 추적 링크 조회
    const { data: trackingLinks } = await supabaseAdmin
      .from('tracking_links')
      .select('id, utm_source, utm_medium, conversions, revenue, clicks')
      .eq('user_id', user.id)
      .eq('status', 'active')

    // 스마트스토어 통계 조회
    const { data: channelStats } = await supabaseAdmin
      .from('smartstore_channel_stats')
      .select('nt_source, nt_medium, orders, revenue, visits, collected_at')
      .eq('user_id', user.id)
      .order('collected_at', { ascending: false })
      .limit(100)

    // 유니크한 소스 목록
    const uniqueSources = [...new Set(channelStats?.map(s => s.nt_source) || [])]

    return NextResponse.json({
      success: true,
      trackingLinks: trackingLinks?.length || 0,
      channelStats: channelStats?.length || 0,
      availableSources: uniqueSources,
      lastCollected: channelStats?.[0]?.collected_at || null
    })

  } catch (error) {
    console.error('Smartstore sync GET error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
