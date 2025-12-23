import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Meta 광고 OAuth 연동 시작
 *
 * Meta 광고 계정 연동용 (Instagram DM은 별도 /api/auth/instagram 사용)
 *
 * 필요한 권한:
 * - ads_read: 광고 데이터 읽기 (성과, 지출, 픽셀 등)
 * - business_management: Business Manager 광고 계정 접근
 * - Ads Management Standard Access: 광고 관리 표준 액세스 (앱 레벨 설정)
 */
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

    // Meta 광고 계정 연동용 권한
    // Ads Management Standard Access는 앱 레벨에서 설정됨 (OAuth scope 아님)
    const scopes = [
      'ads_read',            // 광고 데이터 읽기 (성과, 지출, 픽셀 등)
      'business_management', // Business Manager 광고 계정 접근
    ].join(',')

    // state에 user_id 저장
    const state = Buffer.from(JSON.stringify({
      userId: user.id,
      timestamp: Date.now(),
      type: 'meta_ads',
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
