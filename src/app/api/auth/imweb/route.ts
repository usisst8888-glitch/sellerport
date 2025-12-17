/**
 * 아임웹 OAuth 인증 시작
 * GET /api/auth/imweb
 *
 * 사용자를 아임웹 인증 페이지로 리다이렉트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getImwebAuthUrl } from '@/lib/imweb/api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // state에 user_id를 포함 (콜백에서 사용)
    const state = Buffer.from(JSON.stringify({
      user_id: user.id,
      timestamp: Date.now()
    })).toString('base64')

    // 아임웹 인증 URL로 리다이렉트
    const authUrl = getImwebAuthUrl(state)

    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('Imweb auth error:', error)
    return NextResponse.json({ error: '인증 시작에 실패했습니다' }, { status: 500 })
  }
}
