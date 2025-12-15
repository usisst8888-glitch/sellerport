import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Google OAuth 연동 시작 - 사용자를 Google 로그인 페이지로 리다이렉트
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

    if (!GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: 'Google Client ID not configured' }, { status: 500 })
    }

    // Google Ads API 접근에 필요한 scope
    const scopes = [
      'https://www.googleapis.com/auth/adwords',           // Google Ads API
      'https://www.googleapis.com/auth/userinfo.email',    // 이메일 정보
      'https://www.googleapis.com/auth/userinfo.profile',  // 프로필 정보
    ].join(' ')

    // state에 user_id 저장 (보안상 서명된 토큰 사용 권장)
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
    })).toString('base64')

    // Google OAuth URL 생성
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', GOOGLE_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('access_type', 'offline')  // refresh_token 받기 위해 필요
    authUrl.searchParams.set('prompt', 'consent')       // 항상 동의 화면 표시 (refresh_token 보장)

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Google OAuth start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
