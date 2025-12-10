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

    const { platformId } = await request.json()

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

    // 네이버 API 클라이언트 생성 및 토큰 발급 테스트
    const naverClient = createNaverClient(
      platform.application_id,
      platform.application_secret
    )

    try {
      // 토큰 발급 시도 - 성공하면 API 키가 유효함
      await naverClient.getAccessToken()

      // 연동 상태 업데이트
      await supabase
        .from('platforms')
        .update({
          status: 'connected',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', platformId)

      return NextResponse.json({
        success: true,
        message: '네이버 API 연동이 확인되었습니다'
      })

    } catch (apiError) {
      // API 호출 실패 - 키가 유효하지 않음
      await supabase
        .from('platforms')
        .update({ status: 'error' })
        .eq('id', platformId)

      return NextResponse.json({
        success: false,
        error: '네이버 API 인증에 실패했습니다. API 키를 확인해주세요.'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Naver verify error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
