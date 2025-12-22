import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Instagram OAuth 연동 시작
// DM 자동발송을 위해 Facebook Login을 통해 Instagram Graph API 접근
//
// 필요한 권한 (비즈니스용):
// - instagram_business_basic: Instagram 비즈니스 기본 프로필
// - instagram_business_manage_messages: DM 발송 (핵심!)
// - instagram_business_manage_comments: 댓글 읽기 (Webhook용)
// - pages_show_list: 연결된 페이지 목록
// - pages_read_engagement: 페이지 참여 데이터
// - business_management: 비즈니스 관리
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

    // Facebook App 사용 (Instagram Graph API는 Facebook Login 필요)
    const FB_APP_ID = process.env.META_APP_ID || process.env.INSTAGRAM_APP_ID
    // Meta 콜백 통합 사용 (Meta Console에 하나만 등록 가능)
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

    if (!FB_APP_ID) {
      return NextResponse.json({ error: 'Facebook App ID not configured' }, { status: 500 })
    }

    // DM 자동발송을 위한 권한 목록
    // ⚠️ 개발 모드: 테스터로 등록된 계정만 사용 가능
    // ⚠️ 라이브 모드: 앱 검수 통과 후 모든 사용자 사용 가능
    const scopes = [
      'public_profile',                           // 기본 프로필 (자동 부여)
      'pages_show_list',                          // 연결된 Facebook 페이지 목록
      'pages_read_engagement',                    // 페이지 참여 데이터
      'business_management',                      // 비즈니스 관리
      'instagram_business_basic',                 // Instagram 비즈니스 기본 프로필 (필수!)
      'instagram_business_manage_messages',       // DM 발송 (핵심!)
      'instagram_business_manage_comments',       // 댓글 읽기 (Webhook용)
    ].join(',')

    // state에 user_id, from, siteId 저장
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      type: 'instagram_dm',
      from,
      siteId,
    })).toString('base64')

    // Facebook OAuth URL 생성 (Instagram은 Facebook Login 사용)
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
    authUrl.searchParams.set('client_id', FB_APP_ID)
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
