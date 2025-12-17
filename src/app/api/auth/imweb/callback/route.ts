/**
 * 아임웹 OAuth 콜백
 * GET /api/auth/imweb/callback?code=xxx&state=xxx&siteCode=xxx
 *
 * 아임웹에서 인증 완료 후 리다이렉트되는 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeImwebToken, createImwebClient } from '@/lib/imweb/api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 파라미터 확인
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const siteCode = request.nextUrl.searchParams.get('siteCode')
    const error = request.nextUrl.searchParams.get('error')
    const errorCode = request.nextUrl.searchParams.get('errorCode')

    if (error || errorCode) {
      console.error('Imweb auth error:', error || errorCode)
      return NextResponse.redirect(
        new URL(`/my-sites?error=${encodeURIComponent('아임웹 인증이 취소되었습니다')}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/my-sites?error=인증 정보가 없습니다', request.url)
      )
    }

    // state 디코딩
    let stateData: { user_id: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(
        new URL('/my-sites?error=잘못된 인증 요청입니다', request.url)
      )
    }

    const { user_id } = stateData

    // 현재 로그인 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== user_id) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Authorization Code로 Access Token 발급
    const tokenData = await exchangeImwebToken(code)

    // siteCode가 없으면 에러 (아임웹은 siteCode가 필수)
    if (!siteCode) {
      return NextResponse.redirect(
        new URL('/my-sites?error=사이트 코드가 없습니다', request.url)
      )
    }

    // 사이트 정보 조회
    const imwebClient = createImwebClient(tokenData.accessToken, siteCode)
    let siteName = siteCode
    let siteDomain = ''
    try {
      const siteInfo = await imwebClient.getSiteInfo()
      siteName = siteInfo.data.site_name || siteCode
      siteDomain = siteInfo.data.domain || ''
    } catch (e) {
      console.warn('사이트 정보 조회 실패:', e)
    }

    // my_sites에 저장 또는 업데이트
    const { data: existingSite } = await supabase
      .from('my_sites')
      .select('id')
      .eq('user_id', user_id)
      .eq('site_type', 'imweb')
      .eq('store_id', siteCode)
      .single()

    if (existingSite) {
      // 기존 사이트 업데이트
      await supabase
        .from('my_sites')
        .update({
          site_name: siteName,
          store_url: siteDomain ? `https://${siteDomain}` : null,
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
          status: 'connected',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', existingSite.id)
    } else {
      // 새 사이트 생성
      await supabase
        .from('my_sites')
        .insert({
          user_id,
          site_type: 'imweb',
          site_name: siteName,
          store_id: siteCode,
          store_url: siteDomain ? `https://${siteDomain}` : null,
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
          status: 'connected'
        })
    }

    // 성공 시 내 사이트 페이지로 리다이렉트
    return NextResponse.redirect(
      new URL(`/my-sites?success=${encodeURIComponent('아임웹 연동이 완료되었습니다')}`, request.url)
    )

  } catch (error) {
    console.error('Imweb callback error:', error)
    const errorMessage = error instanceof Error ? error.message : '아임웹 연동에 실패했습니다'
    return NextResponse.redirect(
      new URL(`/my-sites?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}
