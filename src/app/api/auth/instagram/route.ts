import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Instagram OAuth 연동 시작 - 사용자를 Facebook 로그인 페이지로 리다이렉트
// Instagram Graph API는 Facebook 로그인을 통해 접근합니다
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Instagram 전용 앱 사용 (Meta 광고 앱과 별도)
    const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`

    if (!INSTAGRAM_APP_ID) {
      return NextResponse.json({ error: 'Instagram App ID not configured' }, { status: 500 })
    }

    // Instagram Platform API 권한 (2024년 7월 신규 API)
    // instagram_business_basic: 프로필, 팔로워, 미디어 정보 접근
    // instagram_business_manage_insights: 인사이트 데이터 (도달, 노출, 참여율)
    const scopes = 'instagram_business_basic,instagram_business_manage_insights'

    // state에 user_id 저장
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      type: 'instagram', // Instagram 연동 표시
    })).toString('base64')

    // Instagram 비즈니스 로그인 URL 생성
    const authUrl = new URL('https://www.instagram.com/oauth/authorize')
    authUrl.searchParams.set('client_id', INSTAGRAM_APP_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('response_type', 'code')

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Instagram OAuth start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
