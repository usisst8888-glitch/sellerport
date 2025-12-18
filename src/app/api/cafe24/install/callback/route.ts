/**
 * 카페24 앱스토어 설치 OAuth 콜백
 * GET /api/cafe24/install/callback?code=xxx&state=xxx
 *
 * 카페24 OAuth 인증 완료 후 리다이렉트되는 엔드포인트
 * - 토큰 발급
 * - 스토어 정보 저장 (회원가입 없이)
 * - 설치 완료 페이지로 이동
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 서버 사이드에서 직접 Supabase 클라이언트 생성 (service role key 사용)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Cafe24TokenResponse {
  access_token: string
  expires_at: string
  refresh_token: string
  refresh_token_expires_at: string
  client_id: string
  mall_id: string
  user_id: string
  scopes: string[]
  issued_at: string
  shop_no?: string
}

export async function GET(request: NextRequest) {
  try {
    // 파라미터 확인
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const error = request.nextUrl.searchParams.get('error')
    const errorDescription = request.nextUrl.searchParams.get('error_description')

    console.log('[Cafe24 Install Callback] 파라미터:', { code: code?.slice(0, 10) + '...', state, error })

    if (error) {
      console.error('[Cafe24 Install Callback] OAuth 오류:', error, errorDescription)
      return NextResponse.redirect(
        new URL(`/cafe24/install-error?error=${encodeURIComponent(errorDescription || error)}`, request.url)
      )
    }

    if (!code || !state) {
      console.error('[Cafe24 Install Callback] 필수 파라미터 누락')
      return NextResponse.redirect(
        new URL('/cafe24/install-error?error=인증 정보가 없습니다', request.url)
      )
    }

    // state 디코딩
    let stateData: { mall_id: string; type: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      console.error('[Cafe24 Install Callback] state 디코딩 실패')
      return NextResponse.redirect(
        new URL('/cafe24/install-error?error=잘못된 인증 요청입니다', request.url)
      )
    }

    const { mall_id } = stateData
    console.log(`[Cafe24 Install Callback] mall_id: ${mall_id}`)

    // Authorization Code로 Access Token 발급
    const tokenData = await exchangeToken(mall_id, code)
    console.log(`[Cafe24 Install Callback] 토큰 발급 성공: ${mall_id}`)

    // 스토어 정보 조회
    let storeName = mall_id
    let shopNo = '1'
    try {
      const storeInfo = await getStoreInfo(mall_id, tokenData.access_token)
      storeName = storeInfo.shop_name || mall_id
      console.log(`[Cafe24 Install Callback] 스토어 정보: ${storeName}`)
    } catch (e) {
      console.warn('[Cafe24 Install Callback] 스토어 정보 조회 실패:', e)
    }

    if (tokenData.shop_no) {
      shopNo = tokenData.shop_no
    }

    // cafe24_installations 테이블에 저장 (회원가입 전 설치 정보)
    const { data: existingInstall } = await supabaseAdmin
      .from('cafe24_installations')
      .select('id')
      .eq('mall_id', mall_id)
      .single()

    if (existingInstall) {
      // 기존 설치 정보 업데이트
      await supabaseAdmin
        .from('cafe24_installations')
        .update({
          shop_no: shopNo,
          store_name: storeName,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: tokenData.expires_at,
          refresh_token_expires_at: tokenData.refresh_token_expires_at,
          scopes: tokenData.scopes,
          status: 'installed',
          installed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingInstall.id)

      console.log(`[Cafe24 Install Callback] 설치 정보 업데이트: ${mall_id}`)
    } else {
      // 새 설치 정보 생성
      await supabaseAdmin
        .from('cafe24_installations')
        .insert({
          mall_id,
          shop_no: shopNo,
          store_name: storeName,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: tokenData.expires_at,
          refresh_token_expires_at: tokenData.refresh_token_expires_at,
          scopes: tokenData.scopes,
          status: 'installed',
          installed_at: new Date().toISOString()
        })

      console.log(`[Cafe24 Install Callback] 새 설치 정보 생성: ${mall_id}`)
    }

    // 설치 완료 페이지로 리다이렉트 (회원가입/로그인 유도)
    return NextResponse.redirect(
      new URL(`/cafe24/install-complete?mall_id=${mall_id}&store_name=${encodeURIComponent(storeName)}`, request.url)
    )

  } catch (error) {
    console.error('[Cafe24 Install Callback] Error:', error)
    const errorMessage = error instanceof Error ? error.message : '앱 설치에 실패했습니다'
    return NextResponse.redirect(
      new URL(`/cafe24/install-error?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}

/**
 * Authorization Code로 Access Token 발급
 */
async function exchangeToken(mallId: string, code: string): Promise<Cafe24TokenResponse> {
  const clientId = process.env.CAFE24_CLIENT_ID!
  const clientSecret = process.env.CAFE24_CLIENT_SECRET!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sellerport.app'}/api/cafe24/install/callback`

  const url = `https://${mallId}.cafe24api.com/api/v2/oauth/token`

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri
  })

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  console.log(`[Cafe24 Token] 토큰 요청: ${mallId}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('[Cafe24 Token] Error:', data)
    throw new Error(data.error_description || data.error || 'Token exchange failed')
  }

  return data as Cafe24TokenResponse
}

/**
 * 스토어 정보 조회
 */
async function getStoreInfo(mallId: string, accessToken: string): Promise<{ mall_id: string; shop_name: string }> {
  const url = `https://${mallId}.cafe24api.com/api/v2/admin/store`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Cafe24-Api-Version': '2024-06-01'
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || 'Store info fetch failed')
  }

  return data.store
}
