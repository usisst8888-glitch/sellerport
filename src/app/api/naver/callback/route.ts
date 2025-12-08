import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // 에러 처리
  if (error) {
    return NextResponse.redirect(
      new URL(`/platforms?error=${encodeURIComponent('네이버 연동이 취소되었습니다')}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`/platforms?error=${encodeURIComponent('잘못된 요청입니다')}`, request.url)
    )
  }

  try {
    // state에서 스토어 이름 추출
    const stateData = JSON.parse(decodeURIComponent(state))
    const storeName = stateData.storeName

    // 토큰 요청 (GCP 프록시를 통해)
    const tokenResponse = await fetch(`${process.env.NAVER_PROXY_URL}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.NAVER_PROXY_API_KEY || '',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${request.nextUrl.origin}/api/naver/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      throw new Error('토큰 발급에 실패했습니다')
    }

    const tokenData = await tokenResponse.json()

    // Supabase에 저장
    const supabase = await createClient()

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(
        new URL(`/login?redirect=/platforms`, request.url)
      )
    }

    // 플랫폼 정보 저장
    const { error: insertError } = await supabase
      .from('platforms')
      .insert({
        user_id: user.id,
        platform_type: 'naver',
        platform_name: storeName,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        status: 'connected',
      })

    if (insertError) {
      throw insertError
    }

    // 성공 - 플랫폼 페이지로 리다이렉트
    return NextResponse.redirect(
      new URL(`/platforms?success=${encodeURIComponent('네이버 스마트스토어가 연동되었습니다')}`, request.url)
    )
  } catch (err) {
    console.error('Naver OAuth callback error:', err)
    return NextResponse.redirect(
      new URL(`/platforms?error=${encodeURIComponent('연동 중 오류가 발생했습니다')}`, request.url)
    )
  }
}
