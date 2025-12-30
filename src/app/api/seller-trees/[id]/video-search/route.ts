import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// 영상번호로 상품 검색
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: sellerTreeId } = await context.params
    const { searchParams } = new URL(request.url)
    const videoCode = searchParams.get('code')?.toUpperCase()

    if (!videoCode) {
      return NextResponse.json({ error: 'Video code is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // 셀러트리 정보 조회 (user_id 확인용)
    const { data: sellerTree } = await supabase
      .from('seller_trees')
      .select('id, user_id, video_search_enabled')
      .eq('id', sellerTreeId)
      .eq('is_active', true)
      .single()

    if (!sellerTree) {
      return NextResponse.json({ error: 'Seller tree not found' }, { status: 404 })
    }

    if (!sellerTree.video_search_enabled) {
      return NextResponse.json({ error: 'Video search is not enabled' }, { status: 400 })
    }

    // 해당 사용자의 추적 링크에서 영상번호로 검색
    const { data: trackingLink } = await supabase
      .from('tracking_links')
      .select(`
        id,
        target_url,
        video_code,
        post_name,
        thumbnail_url,
        product_id,
        products (
          id,
          name,
          image_url,
          price
        )
      `)
      .eq('user_id', sellerTree.user_id)
      .eq('video_code', videoCode)
      .eq('status', 'active')
      .single()

    if (!trackingLink) {
      return NextResponse.json({
        found: false,
        message: '해당 영상번호를 찾을 수 없습니다'
      })
    }

    // products는 단일 객체 또는 배열일 수 있음
    const product = Array.isArray(trackingLink.products)
      ? trackingLink.products[0]
      : trackingLink.products

    return NextResponse.json({
      found: true,
      data: {
        target_url: trackingLink.target_url,
        title: trackingLink.post_name || product?.name || '상품 보기',
        thumbnail_url: trackingLink.thumbnail_url || product?.image_url,
        price: product?.price
      }
    })
  } catch (error) {
    console.error('Video search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
