/**
 * 카페24 OAuth 인증 시작
 * GET /api/auth/cafe24?mall_id=myshop
 *
 * 사용자를 카페24 인증 페이지로 리다이렉트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCafe24AuthUrl } from '@/lib/cafe24/commerce-api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // mall_id 파라미터 확인
    const mallId = request.nextUrl.searchParams.get('mall_id')
    if (!mallId) {
      return NextResponse.json({ error: 'mall_id가 필요합니다' }, { status: 400 })
    }

    // state에 user_id와 mall_id를 포함 (콜백에서 사용)
    const state = Buffer.from(JSON.stringify({
      user_id: user.id,
      mall_id: mallId,
      timestamp: Date.now()
    })).toString('base64')

    // 카페24 인증 URL로 리다이렉트
    const authUrl = getCafe24AuthUrl(mallId, state)

    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('Cafe24 auth error:', error)
    return NextResponse.json({ error: '인증 시작에 실패했습니다' }, { status: 500 })
  }
}
