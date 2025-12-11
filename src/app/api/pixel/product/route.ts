/**
 * 픽셀샵 상품 정보 API
 * GET /api/pixel/product?store=xxx&product=xxx&slot=xxx
 *
 * 추적 링크 ID로 상품 정보를 가져오거나,
 * Commerce API에서 직접 상품 정보를 가져옵니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const store = searchParams.get('store')
    const product = searchParams.get('product')
    const trackingLinkId = searchParams.get('trackingLink')

    // 추적 링크 ID가 있으면 추적 링크에서 상품 정보 가져오기
    if (trackingLinkId) {
      const { data: trackingLink, error: trackingLinkError } = await supabase
        .from('tracking_links')
        .select(`
          id,
          name,
          target_url,
          products (
            id,
            name,
            price,
            cost,
            thumbnail_url,
            image_url,
            metadata
          )
        `)
        .eq('id', trackingLinkId)
        .single()

      if (trackingLink?.products) {
        const productData = trackingLink.products as any
        return NextResponse.json({
          success: true,
          data: {
            name: productData.name,
            price: productData.price,
            originalPrice: productData.metadata?.originalPrice || null,
            discount: productData.metadata?.discount || null,
            image: productData.image_url || productData.thumbnail_url || '/placeholder-product.png',
            images: productData.metadata?.images || [],
            rating: productData.metadata?.rating || null,
            reviewCount: productData.metadata?.reviewCount || null,
            storeName: store || '스마트스토어',
            storeUrl: trackingLink.target_url || `https://smartstore.naver.com/${store}/products/${product}`
          }
        })
      }
    }

    // 추적 링크에 상품이 없으면 Commerce API에서 가져오기 시도
    // (네이버 Commerce API 연동된 경우)
    // TODO: 실제 Commerce API 연동 시 구현

    // 기본 응답 (API 없을 때)
    return NextResponse.json({
      success: true,
      data: {
        name: '상품 상세 보기',
        price: 0,
        image: '/placeholder-product.png',
        storeName: store || '스마트스토어',
        storeUrl: `https://smartstore.naver.com/${store}/products/${product}`
      }
    })

  } catch (error) {
    console.error('Pixel product API error:', error)
    return NextResponse.json({
      success: false,
      error: '상품 정보를 가져오는데 실패했습니다'
    }, { status: 500 })
  }
}
