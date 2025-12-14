/**
 * 네이버 API 테스트 엔드포인트
 * GET /api/naver/test?siteId=xxx
 *
 * 인증 및 상품 조회 API를 테스트합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createNaverClient } from '@/lib/naver/commerce-api'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')

    if (!siteId) {
      // siteId가 없으면 사용자의 네이버 사이트 목록 조회
      const { data: sites } = await supabase
        .from('my_sites')
        .select('id, site_name, site_type, status, application_id')
        .eq('user_id', user.id)
        .eq('site_type', 'naver')

      return NextResponse.json({
        message: 'siteId 파라미터를 추가해주세요',
        availableSites: sites
      })
    }

    // 사이트 정보 조회
    const { data: site, error: siteError } = await supabase
      .from('my_sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: '사이트를 찾을 수 없습니다' }, { status: 404 })
    }

    const results: Record<string, unknown> = {
      site: {
        id: site.id,
        name: site.site_name,
        status: site.status,
        applicationId: site.application_id,
        applicationSecretLength: site.application_secret?.length
      }
    }

    // 네이버 API 클라이언트 생성
    const naverClient = createNaverClient(
      site.application_id,
      site.application_secret
    )

    // 1. 인증 토큰 테스트
    try {
      console.log('=== 토큰 발급 테스트 시작 ===')
      const token = await naverClient.getAccessToken()
      results.tokenTest = {
        success: true,
        tokenLength: token.length,
        tokenPreview: token.substring(0, 20) + '...'
      }
      console.log('토큰 발급 성공:', token.substring(0, 20) + '...')
    } catch (error) {
      results.tokenTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
      console.error('토큰 발급 실패:', error)
      // 토큰 발급 실패 시 여기서 리턴
      return NextResponse.json(results)
    }

    // 2. 상품 조회 테스트
    try {
      console.log('=== 상품 조회 테스트 시작 ===')
      // 페이지는 1부터 시작 (API 스펙에 따름)
      const productsResponse = await naverClient.getProducts(1, 10)

      // 상품 정보 추출
      const productList = (productsResponse.contents || []).map(content => {
        const cp = content.channelProducts?.[0]
        return {
          originProductNo: content.originProductNo,
          name: cp?.name,
          salePrice: cp?.salePrice,
          stockQuantity: cp?.stockQuantity,
          statusType: cp?.statusType,
          imageUrl: cp?.representativeImage?.url
        }
      })

      results.productsTest = {
        success: true,
        page: productsResponse.page,
        size: productsResponse.size,
        totalElements: productsResponse.totalElements,
        totalPages: productsResponse.totalPages,
        contentsCount: productsResponse.contents?.length ?? 0,
        products: productList
      }
      console.log('상품 조회 응답:', JSON.stringify(results.productsTest, null, 2))
    } catch (error) {
      results.productsTest = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
      console.error('상품 조회 실패:', error)
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Naver test error:', error)
    return NextResponse.json({
      error: '서버 오류가 발생했습니다',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
