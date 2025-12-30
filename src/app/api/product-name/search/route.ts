/**
 * 상품명 검색 API
 * POST /api/product-name/search
 *
 * 네이버/쿠팡에서 키워드로 상품을 검색하여 상품명 리스트를 추출합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SearchResult {
  productName: string
  price?: number
  platform: 'naver' | 'coupang'
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { platform, keyword } = await request.json()

    if (!platform || !keyword) {
      return NextResponse.json({ error: '플랫폼과 키워드가 필요합니다' }, { status: 400 })
    }

    if (!['naver', 'coupang'].includes(platform)) {
      return NextResponse.json({ error: '지원하지 않는 플랫폼입니다' }, { status: 400 })
    }

    const results: SearchResult[] = []

    if (platform === 'naver') {
      // 네이버 쇼핑 검색 API 사용
      const naverResults = await searchNaverProducts(keyword)
      results.push(...naverResults)
    } else if (platform === 'coupang') {
      // 쿠팡 검색 (웹 크롤링 대신 간단한 방식 사용)
      const coupangResults = await searchCoupangProducts(keyword)
      results.push(...coupangResults)
    }

    return NextResponse.json({
      success: true,
      data: {
        platform,
        keyword,
        products: results
      }
    })

  } catch (error) {
    console.error('Product search error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

/**
 * 네이버 쇼핑 검색 API
 */
async function searchNaverProducts(keyword: string): Promise<SearchResult[]> {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('Naver API credentials not configured')
    // 네이버 API 키가 없으면 빈 배열 반환
    return []
  }

  try {
    const response = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(keyword)}&display=20&sort=sim`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    )

    if (!response.ok) {
      console.error('Naver API error:', await response.text())
      return []
    }

    const data = await response.json()

    return (data.items || []).map((item: { title: string; lprice: string }) => ({
      productName: item.title.replace(/<[^>]*>/g, ''), // HTML 태그 제거
      price: parseInt(item.lprice) || 0,
      platform: 'naver' as const
    }))
  } catch (error) {
    console.error('Naver search error:', error)
    return []
  }
}

/**
 * 쿠팡 상품 검색
 * 쿠팡은 공식 검색 API가 없으므로 대체 방식 사용
 */
async function searchCoupangProducts(keyword: string): Promise<SearchResult[]> {
  // 쿠팡 Partners API를 사용하거나, 웹 스크래핑이 필요
  // 현재는 환경변수로 쿠팡 API 키가 설정되어 있지 않으므로
  // 대체 데이터 또는 빈 배열 반환

  const accessKey = process.env.COUPANG_ACCESS_KEY
  const secretKey = process.env.COUPANG_SECRET_KEY

  if (!accessKey || !secretKey) {
    console.log('Coupang API credentials not configured')
    // 쿠팡 API 키가 없으면 네이버에서 쿠팡 상품을 검색하는 대체 방법 사용
    return await searchCoupangViaNaverShopping(keyword)
  }

  // 쿠팡 Partners API 구현 (API 키가 있는 경우)
  try {
    // 쿠팡 API 호출 로직
    return []
  } catch (error) {
    console.error('Coupang search error:', error)
    return []
  }
}

/**
 * 네이버 쇼핑에서 쿠팡 상품 검색 (대체 방법)
 */
async function searchCoupangViaNaverShopping(keyword: string): Promise<SearchResult[]> {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return []
  }

  try {
    // "쿠팡"을 키워드에 추가하여 쿠팡 상품 검색
    const response = await fetch(
      `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(keyword)}&display=20&sort=sim&exclude=used`,
      {
        headers: {
          'X-Naver-Client-Id': clientId,
          'X-Naver-Client-Secret': clientSecret,
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const data = await response.json()

    // 쿠팡에서 판매하는 상품만 필터링하거나, 모든 결과 반환
    return (data.items || [])
      .filter((item: { mallName: string }) =>
        item.mallName?.toLowerCase().includes('coupang') ||
        item.mallName?.toLowerCase().includes('쿠팡')
      )
      .slice(0, 20)
      .map((item: { title: string; lprice: string }) => ({
        productName: item.title.replace(/<[^>]*>/g, ''),
        price: parseInt(item.lprice) || 0,
        platform: 'coupang' as const
      }))
  } catch (error) {
    console.error('Coupang via Naver search error:', error)
    return []
  }
}
