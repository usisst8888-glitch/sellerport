import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Instagram OAuth 연동 시작 (Instagram Login 방식)
 *
 * 2024년 7월 출시된 "Instagram 로그인을 통한 Instagram API" 사용
 * Facebook 페이지 연결 없이 Instagram 프로페셔널 계정만으로 DM 자동발송 가능
 *
 * 필요한 권한:
 * - instagram_business_basic: Instagram 프로필 및 미디어 읽기
 * - instagram_business_manage_messages: DM 관리 (핵심!)
 * - instagram_business_manage_comments: 댓글 관리 (Webhook용)
 *
 * 참고: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // URL 파라미터에서 from과 siteId 가져오기
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from') || 'ad-channels'
    const siteId = searchParams.get('siteId')

    // Instagram App ID (Meta Developer Console에서 생성)
    const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID
    // Instagram 전용 콜백 URL
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/instagram/callback`

    if (!INSTAGRAM_APP_ID) {
      return NextResponse.json({ error: 'Instagram App ID not configured' }, { status: 500 })
    }

    // Instagram Login API 권한 목록 (Facebook Page 불필요)
    // https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login
    // 주의: Advanced Access 승인된 권한만 요청! (content_publish, insights는 승인 대기 중)
    const scopes = [
      'instagram_business_basic',            // Instagram 프로필 및 미디어 읽기
      'instagram_business_manage_messages',  // DM 관리 (핵심!)
      'instagram_business_manage_comments',  // 댓글 관리 (Webhook용)
    ].join(',')

    // state에 user_id, from, siteId 저장
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      type: 'instagram_login',
      from,
      siteId,
    })).toString('base64')

    // Instagram OAuth URL 생성 (Instagram Login 방식)
    // https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login#step-1--get-authorization
    const authUrl = new URL('https://www.instagram.com/oauth/authorize')
    authUrl.searchParams.set('client_id', INSTAGRAM_APP_ID)
    authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
    authUrl.searchParams.set('scope', scopes)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('state', state)

    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('Instagram OAuth start error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
