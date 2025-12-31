import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'
import { extractOgImage } from '@/lib/utils/og-image'

interface RouteContext {
  params: Promise<{ id: string }>
}

// 영상번호 상품 목록 조회
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: sellerTreeId } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 셀러트리 소유권 확인
    const { data: sellerTree } = await supabase
      .from('seller_trees')
      .select('id, slug')
      .eq('id', sellerTreeId)
      .eq('user_id', user.id)
      .single()

    if (!sellerTree) {
      return NextResponse.json({ error: 'Seller tree not found' }, { status: 404 })
    }

    // 해당 사용자의 영상번호가 있는 추적 링크 조회
    const { data: videoProducts, error } = await supabase
      .from('tracking_links')
      .select(`
        id,
        video_code,
        target_url,
        post_name,
        thumbnail_url,
        product_id,
        utm_source,
        status,
        clicks,
        conversions,
        created_at,
        products (
          id,
          name,
          image_url,
          price,
          my_site_id,
          my_sites (
            id,
            site_type,
            site_name
          )
        )
      `)
      .eq('user_id', user.id)
      .not('video_code', 'is', null)
      .order('video_code', { ascending: true })

    if (error) {
      console.error('Video products fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch video products' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: videoProducts || [] })
  } catch (error) {
    console.error('Video products GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


// 영상번호 상품 등록
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: sellerTreeId } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 셀러트리 소유권 확인
    const { data: sellerTree } = await supabase
      .from('seller_trees')
      .select('id, slug')
      .eq('id', sellerTreeId)
      .eq('user_id', user.id)
      .single()

    if (!sellerTree) {
      return NextResponse.json({ error: 'Seller tree not found' }, { status: 404 })
    }

    const body = await request.json()
    const { productId, targetUrl, postName, videoCode: customVideoCode } = body

    if (!targetUrl) {
      return NextResponse.json({ error: 'Target URL is required' }, { status: 400 })
    }

    // 영상번호 필수 검증
    const videoCode = customVideoCode?.trim()
    if (!videoCode) {
      return NextResponse.json({ error: '영상번호를 입력해주세요' }, { status: 400 })
    }

    // 영상번호 길이 검증 (1~20자)
    if (videoCode.length > 20) {
      return NextResponse.json({ error: '영상번호는 20자 이내로 입력해주세요' }, { status: 400 })
    }

    // 중복 확인
    const { data: existingLink } = await supabase
      .from('tracking_links')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_code', videoCode)
      .single()

    if (existingLink) {
      return NextResponse.json({ error: '이미 사용 중인 영상번호입니다' }, { status: 400 })
    }

    // 추적 링크 ID 생성
    const trackingLinkId = `TL-${nanoid(8).toUpperCase()}`

    // 트래킹 URL 생성
    const trackingBaseUrl = process.env.NEXT_PUBLIC_TRACKING_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const goUrl = `${trackingBaseUrl}/go/${trackingLinkId}`

    // 썸네일 자동 추출
    let thumbnailUrl = null
    if (targetUrl) {
      thumbnailUrl = await extractOgImage(targetUrl)
    }

    // 상품 정보 조회 (productId가 있는 경우)
    let productInfo = null
    let siteType = null
    if (productId) {
      const { data: product } = await supabase
        .from('products')
        .select(`
          id,
          name,
          image_url,
          my_site_id,
          my_sites (
            id,
            site_type,
            site_name
          )
        `)
        .eq('id', productId)
        .single()

      if (product) {
        productInfo = product
        thumbnailUrl = product.image_url || thumbnailUrl
        // my_sites가 배열일 수 있으므로 처리
        const mySite = Array.isArray(product.my_sites) ? product.my_sites[0] : product.my_sites
        siteType = mySite?.site_type
      }
    }

    // UTM 파라미터 설정 (플랫폼별)
    const utmSource = 'seller_tree'
    const utmMedium = 'video_search'
    const utmCampaign = videoCode

    // 추적 링크 생성
    const { data: trackingLink, error } = await supabase
      .from('tracking_links')
      .insert({
        id: trackingLinkId,
        user_id: user.id,
        product_id: productId || null,
        target_url: targetUrl,
        tracking_url: goUrl,
        go_url: goUrl,
        video_code: videoCode,
        store_slug: sellerTree.slug,
        post_name: postName || productInfo?.name || null,
        thumbnail_url: thumbnailUrl,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        channel_type: 'seller_tree',
        status: 'active',
        clicks: 0,
        conversions: 0,
        revenue: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Tracking link create error:', error)
      return NextResponse.json({ error: 'Failed to create video product' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...trackingLink,
        siteType,
        product: productInfo
      }
    })
  } catch (error) {
    console.error('Video product POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
