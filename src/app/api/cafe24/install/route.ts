/**
 * 카페24 앱스토어 설치 진입점
 * GET /api/cafe24/install?mall_id=xxx
 *
 * 카페24 앱스토어에서 앱 설치 시 이 URL로 리다이렉트됨
 * 자동으로 OAuth 인증 페이지로 이동
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // mall_id 파라미터 확인 (카페24가 전달)
    const mallId = request.nextUrl.searchParams.get('mall_id')

    if (!mallId) {
      console.error('[Cafe24 Install] mall_id 파라미터 누락')
      return NextResponse.json(
        { error: 'mall_id 파라미터가 필요합니다' },
        { status: 400 }
      )
    }

    console.log(`[Cafe24 Install] 앱 설치 시작: mall_id=${mallId}`)

    // OAuth 인증 URL 생성
    const clientId = process.env.CAFE24_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sellerport.app'}/api/cafe24/install/callback`
    const scope = 'mall.read_store,mall.read_product,mall.read_order,mall.read_salesreport'

    // state에 mall_id와 설치 정보 포함
    const state = Buffer.from(JSON.stringify({
      mall_id: mallId,
      type: 'install', // 앱스토어 설치임을 표시
      timestamp: Date.now()
    })).toString('base64')

    const authUrl = `https://${mallId}.cafe24api.com/api/v2/oauth/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `state=${state}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scope}`

    console.log(`[Cafe24 Install] OAuth 인증 페이지로 리다이렉트: ${mallId}`)

    // 카페24 OAuth 인증 페이지로 리다이렉트
    return NextResponse.redirect(authUrl)

  } catch (error) {
    console.error('[Cafe24 Install] Error:', error)
    return NextResponse.json(
      { error: '앱 설치 시작에 실패했습니다' },
      { status: 500 }
    )
  }
}
