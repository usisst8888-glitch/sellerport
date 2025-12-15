import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Meta OAuth 연동 시작 - 사용자를 Facebook 로그인 페이지로 리다이렉트
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const META_APP_ID = process.env.META_APP_ID
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

    if (!META_APP_ID) {
      return NextResponse.json({ error: 'Meta App ID not configured' }, { status: 500 })
    }

    // 필요한 권한들 (Meta Marketing API)
    // 참고: read_insights는 앱 검토 승인 후 사용 가능
    const scopes = [
      'ads_management',     // 광고 관리 (읽기/쓰기)
      'ads_read',           // 광고 읽기
      'business_management', // 비즈니스 관리
    ].join(',')

    // state에 user_id 저장 (보안상 서명된 토큰 사용 권장)
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    })).toString('base64')

    // Facebook OAuth URL 생성
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
    authUrl.searchParams.set('client_id', META_APP_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('response_type', 'code')

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Meta OAuth start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
