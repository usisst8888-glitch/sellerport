/**
 * 네이버 API 연동 검증 API
 * POST /api/naver/verify
 *
 * 저장된 API 키로 실제 네이버 API 호출이 가능한지 검증합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNaverClient } from '@/lib/naver/commerce-api'

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

    // 네이버 API 클라이언트 생성 및 토큰 발급 테스트
    const naverClient = createNaverClient(
      site.application_id,
      site.application_secret
    )

    try {
      // 토큰 발급 시도 - 성공하면 API 키가 유효함
      await naverClient.getAccessToken()

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
        message: '네이버 API 연동이 확인되었습니다'
      })

    } catch (apiError) {
      // API 호출 실패 - 키가 유효하지 않음
      console.error('Naver API 인증 실패:', apiError)
      console.error('사용된 Application ID:', site.application_id)
      console.error('사용된 Application Secret (앞 10자):', site.application_secret?.substring(0, 10))

      await supabase
        .from('my_sites')
        .update({ status: 'error' })
        .eq('id', siteId)

      const errorMessage = apiError instanceof Error ? apiError.message : '알 수 없는 오류'
      return NextResponse.json({
        success: false,
        error: `네이버 API 인증에 실패했습니다: ${errorMessage}`
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Naver verify error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
