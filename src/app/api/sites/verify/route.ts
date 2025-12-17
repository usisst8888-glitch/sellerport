/**
 * 사이트 추적 코드 설치 검증 API
 * POST /api/sites/verify
 *
 * 일반 웹사이트(custom)의 추적 코드 설치 여부를 확인합니다.
 * landing_visits 테이블에서 해당 사이트의 방문 기록이 있는지 확인합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { siteId } = await request.json()

    if (!siteId) {
      return NextResponse.json({ error: 'siteId가 필요합니다' }, { status: 400 })
    }

    // 사이트 정보 조회
    const { data: site, error: siteError } = await supabase
      .from('my_sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: '사이트를 찾을 수 없습니다' }, { status: 404 })
    }

    // 네이버 스마트스토어는 별도 검증 API 사용
    if (site.site_type === 'naver') {
      return NextResponse.json({
        error: '네이버 스마트스토어는 /api/naver/verify를 사용하세요'
      }, { status: 400 })
    }

    // 해당 사용자의 landing_visits에서 방문 기록 확인
    const { data: visits, error: visitsError } = await supabase
      .from('landing_visits')
      .select('id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (visitsError) {
      console.error('Visits query error:', visitsError)
      return NextResponse.json({ error: '검증 중 오류가 발생했습니다' }, { status: 500 })
    }

    // 방문 기록이 있으면 추적 코드가 설치된 것
    if (visits && visits.length > 0) {
      // 연동 상태 업데이트
      await supabase
        .from('my_sites')
        .update({
          status: 'connected',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', siteId)

      return NextResponse.json({
        success: true,
        verified: true,
        message: '추적 코드가 정상적으로 설치되어 있습니다',
        lastVisit: visits[0].created_at
      })
    } else {
      // 방문 기록이 없으면 추적 코드 미설치 또는 방문자 없음
      return NextResponse.json({
        success: true,
        verified: false,
        message: '아직 추적 코드를 통한 방문이 감지되지 않았습니다. 추적 코드를 설치하고 사이트를 방문해보세요.'
      })
    }

  } catch (error) {
    console.error('Site verify error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
