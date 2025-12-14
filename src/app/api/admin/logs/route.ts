/**
 * 관리자 - 유입 로그 API
 * GET /api/admin/logs - 추적 링크 클릭 로그 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 현재 사용자가 관리자/매니저인지 확인
    const { data: currentProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json({ error: '프로필 조회에 실패했습니다' }, { status: 500 })
    }

    if (!currentProfile || !['admin', 'manager'].includes(currentProfile.user_type)) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // 쿼리 파라미터 파싱
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const ip = searchParams.get('ip')
    const referer = searchParams.get('referer')
    const converted = searchParams.get('converted')

    const offset = (page - 1) * limit

    // 먼저 전체 개수 조회
    let countQuery = supabaseAdmin
      .from('tracking_link_clicks')
      .select('*', { count: 'exact', head: true })

    if (ip) {
      countQuery = countQuery.ilike('ip_address', `%${ip}%`)
    }
    if (referer) {
      countQuery = countQuery.ilike('referer', `%${referer}%`)
    }
    if (converted === 'true') {
      countQuery = countQuery.eq('is_converted', true)
    } else if (converted === 'false') {
      countQuery = countQuery.eq('is_converted', false)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Count query error:', countError)
      return NextResponse.json({ error: '로그 개수 조회에 실패했습니다' }, { status: 500 })
    }

    // 클릭 로그 조회
    let query = supabaseAdmin
      .from('tracking_link_clicks')
      .select(`
        id,
        tracking_link_id,
        ip_address,
        user_agent,
        referer,
        fbp,
        fbc,
        click_id,
        is_converted,
        converted_at,
        created_at,
        tracking_links (
          id,
          name,
          user_id
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (ip) {
      query = query.ilike('ip_address', `%${ip}%`)
    }
    if (referer) {
      query = query.ilike('referer', `%${referer}%`)
    }
    if (converted === 'true') {
      query = query.eq('is_converted', true)
    } else if (converted === 'false') {
      query = query.eq('is_converted', false)
    }

    const { data: clicks, error } = await query

    if (error) {
      console.error('Clicks fetch error:', error)
      return NextResponse.json({ error: '로그 조회에 실패했습니다' }, { status: 500 })
    }

    // 사용자 정보 조회 (user_id로 이메일 가져오기)
    type TrackingLinkJoin = { id: string; name: string; user_id: string } | null
    const userIds = [...new Set(
      clicks?.map(c => {
        const link = c.tracking_links as unknown as TrackingLinkJoin
        return link?.user_id
      }).filter((id): id is string => !!id)
    )]

    let userEmails: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .in('id', userIds)

      if (profiles) {
        userEmails = profiles.reduce((acc, p) => {
          acc[p.id] = p.email
          return acc
        }, {} as Record<string, string>)
      }
    }

    // 응답 데이터 변환
    const formattedLogs = clicks?.map(click => {
      const trackingLink = click.tracking_links as unknown as TrackingLinkJoin
      return {
        id: click.id,
        tracking_link_id: click.tracking_link_id,
        tracking_link_name: trackingLink?.name || '',
        user_email: trackingLink?.user_id ? userEmails[trackingLink.user_id] || '' : '',
        ip_address: click.ip_address,
        user_agent: click.user_agent,
        referer: click.referer,
        fbp: click.fbp,
        fbc: click.fbc,
        click_id: click.click_id,
        is_converted: click.is_converted,
        converted_at: click.converted_at,
        created_at: click.created_at
      }
    }) || []

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      success: true,
      data: formattedLogs,
      total: count || 0,
      page,
      limit,
      totalPages
    })

  } catch (error) {
    console.error('Admin logs API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
