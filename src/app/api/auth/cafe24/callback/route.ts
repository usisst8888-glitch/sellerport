/**
 * 카페24 OAuth 콜백
 * GET /api/auth/cafe24/callback?code=xxx&state=xxx
 *
 * 카페24에서 인증 완료 후 리다이렉트되는 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { exchangeCafe24Token, createCafe24Client } from '@/lib/cafe24/commerce-api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 파라미터 확인
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const error = request.nextUrl.searchParams.get('error')

    if (error) {
      console.error('Cafe24 auth error:', error)
      return NextResponse.redirect(
        new URL(`/my-shoppingmall?error=${encodeURIComponent('카페24 인증이 취소되었습니다')}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/my-shoppingmall?error=인증 정보가 없습니다', request.url)
      )
    }

    // state 디코딩
    let stateData: { user_id: string; mall_id: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(
        new URL('/my-shoppingmall?error=잘못된 인증 요청입니다', request.url)
      )
    }

    const { user_id, mall_id } = stateData

    // 현재 로그인 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user || user.id !== user_id) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Authorization Code로 Access Token 발급
    const tokenData = await exchangeCafe24Token(mall_id, code)

    // 스토어 정보 조회
    const cafe24Client = createCafe24Client(mall_id, tokenData.access_token)
    let storeName = mall_id
    try {
      const storeInfo = await cafe24Client.getStoreInfo()
      storeName = storeInfo.store.shop_name || mall_id
    } catch (e) {
      console.warn('스토어 정보 조회 실패:', e)
    }

    // my_shoppingmall에 저장 또는 업데이트
    const { data: existingSite } = await supabase
      .from('my_shoppingmall')
      .select('id')
      .eq('user_id', user_id)
      .eq('site_type', 'cafe24')
      .eq('store_id', mall_id)
      .single()

    if (existingSite) {
      // 기존 사이트 업데이트
      await supabase
        .from('my_shoppingmall')
        .update({
          site_name: storeName,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: tokenData.expires_at,
          status: 'connected',
          last_sync_at: new Date().toISOString()
        })
        .eq('id', existingSite.id)
    } else {
      // 새 사이트 생성
      await supabase
        .from('my_shoppingmall')
        .insert({
          user_id,
          site_type: 'cafe24',
          site_name: storeName,
          store_id: mall_id,
          store_url: `https://${mall_id}.cafe24.com`,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          token_expires_at: tokenData.expires_at,
          status: 'connected'
        })
    }

    // 성공 시 내 쇼핑몰 페이지로 리다이렉트
    return NextResponse.redirect(
      new URL(`/my-shoppingmall?success=${encodeURIComponent('카페24 연동이 완료되었습니다')}`, request.url)
    )

  } catch (error) {
    console.error('Cafe24 callback error:', error)
    const errorMessage = error instanceof Error ? error.message : '카페24 연동에 실패했습니다'
    return NextResponse.redirect(
      new URL(`/my-shoppingmall?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}
