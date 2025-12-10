/**
 * 네이버 통계 조회 API
 * GET /api/naver/stats?platformId=xxx&startDate=xxx&endDate=xxx
 *
 * 특정 기간의 주문 통계를 조회합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNaverClient } from '@/lib/naver/commerce-api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('platformId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!platformId) {
      return NextResponse.json({ error: 'platformId가 필요합니다' }, { status: 400 })
    }

    // 플랫폼 정보 조회
    const { data: platform, error: platformError } = await supabase
      .from('platforms')
      .select('*')
      .eq('id', platformId)
      .eq('user_id', user.id)
      .single()

    if (platformError || !platform) {
      return NextResponse.json({ error: '플랫폼을 찾을 수 없습니다' }, { status: 404 })
    }

    if (platform.status !== 'connected') {
      return NextResponse.json({ error: '플랫폼이 연동되지 않았습니다' }, { status: 400 })
    }

    // 네이버 API 클라이언트 생성
    const naverClient = createNaverClient(
      platform.application_id,
      platform.application_secret
    )

    // 날짜 기본값 (오늘)
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0))
    const end = endDate ? new Date(endDate) : new Date()

    const stats = await naverClient.getOrderStats(start, end)

    return NextResponse.json({
      success: true,
      data: {
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        averageOrderValue: stats.totalOrders > 0 ? Math.round(stats.totalRevenue / stats.totalOrders) : 0,
        period: {
          start: start.toISOString(),
          end: end.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Naver stats error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
