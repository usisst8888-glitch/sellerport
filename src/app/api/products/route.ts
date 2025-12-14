/**
 * 상품 API
 * GET /api/products - 상품 목록 조회
 * POST /api/products - 상품 수동 등록 (원가 입력용)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 상품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const siteId = searchParams.get('siteId')
    const status = searchParams.get('status')

    // 상품 목록 조회
    let query = supabase
      .from('products')
      .select(`
        *,
        my_sites (
          id,
          site_type,
          site_name,
          store_id
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (siteId) {
      query = query.eq('my_site_id', siteId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Products fetch error:', error)
      return NextResponse.json({ error: '상품 조회에 실패했습니다' }, { status: 500 })
    }

    // 각 상품의 캠페인 수 조회
    const productsWithStats = await Promise.all(
      (products || []).map(async (product) => {
        const { count: campaignCount } = await supabase
          .from('campaigns')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', product.id)

        // 마진 계산 (원가가 있는 경우)
        const margin = product.cost > 0
          ? Math.round(((product.price - product.cost) / product.price) * 100)
          : null

        return {
          ...product,
          campaignCount: campaignCount || 0,
          margin
        }
      })
    )

    return NextResponse.json({ success: true, data: productsWithStats })

  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 상품 수동 등록 (원가 입력용)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const {
      siteId,
      externalProductId,
      name,
      price,
      cost = 0,
      stock = 0,
      category,
      imageUrl
    } = body

    if (!siteId || !name || !price) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
    }

    // 사이트 존재 확인
    const { data: site, error: siteError } = await supabase
      .from('my_sites')
      .select('id, site_type')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .single()

    if (siteError || !site) {
      return NextResponse.json({ error: '사이트를 찾을 수 없습니다' }, { status: 404 })
    }

    // 상품 생성
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        user_id: user.id,
        my_site_id: siteId,
        site_type: site.site_type,
        external_product_id: externalProductId || `manual_${Date.now()}`,
        name,
        price,
        cost,
        stock,
        category: category || null,
        image_url: imageUrl || null,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      console.error('Product create error:', error)
      return NextResponse.json({ error: '상품 등록에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: product
    })

  } catch (error) {
    console.error('Product create API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
