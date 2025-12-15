import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 권한 체크
    const { data: profile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.user_type)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 쿼리 파라미터
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const utmSource = searchParams.get('utm_source')
    const refererDomain = searchParams.get('referer_domain')
    const deviceType = searchParams.get('device_type')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const adminSupabase = createAdminClient()

    // 쿼리 빌드
    let query = adminSupabase
      .from('site_visits')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // 필터 적용
    if (utmSource) {
      query = query.eq('utm_source', utmSource)
    }
    if (refererDomain) {
      query = query.ilike('referer_domain', `%${refererDomain}%`)
    }
    if (deviceType) {
      query = query.eq('device_type', deviceType)
    }
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo + 'T23:59:59')
    }

    // 페이지네이션
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, count, error } = await query

    if (error) {
      console.error('Failed to fetch visits:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 통계 요약
    const statsQuery = adminSupabase
      .from('site_visits')
      .select('id, utm_source, device_type, created_at')

    // 동일 필터 적용
    let statsQueryFiltered = statsQuery
    if (dateFrom) {
      statsQueryFiltered = statsQueryFiltered.gte('created_at', dateFrom)
    }
    if (dateTo) {
      statsQueryFiltered = statsQueryFiltered.lte('created_at', dateTo + 'T23:59:59')
    }

    const { data: allVisits } = await statsQueryFiltered

    // 오늘 방문자 수
    const today = new Date().toISOString().split('T')[0]
    const todayVisits = allVisits?.filter(v => v.created_at?.startsWith(today)).length || 0

    // 고유 UTM 소스
    const utmSources = [...new Set(allVisits?.map(v => v.utm_source).filter(Boolean) || [])]

    // 디바이스 분포
    const deviceStats = {
      mobile: allVisits?.filter(v => v.device_type === 'mobile').length || 0,
      desktop: allVisits?.filter(v => v.device_type === 'desktop').length || 0,
      tablet: allVisits?.filter(v => v.device_type === 'tablet').length || 0,
    }

    return NextResponse.json({
      success: true,
      data,
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page,
      stats: {
        todayVisits,
        totalVisits: allVisits?.length || 0,
        utmSources,
        deviceStats,
      }
    })
  } catch (error) {
    console.error('Visits API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
