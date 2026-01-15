/**
 * 상품 상세 API
 * GET /api/products/[id] - 상품 상세 조회
 * PATCH /api/products/[id] - 상품 수정 (원가 등)
 * DELETE /api/products/[id] - 상품 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 상품 상세 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 상품 조회
    const { data: product, error } = await supabase
      .from('products')
      .select(`
        *,
        my_shoppingmall (
          id,
          site_type,
          site_name
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !product) {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 })
    }

    // 상품의 최근 주문 조회 (최근 10건)
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('id, product_name, quantity, total_amount, order_status, ordered_at')
      .eq('product_id', id)
      .order('ordered_at', { ascending: false })
      .limit(10)

    // 마진 계산
    const margin = product.cost > 0
      ? Math.round(((product.price - product.cost) / product.price) * 100)
      : null

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        margin,
        recentOrders: recentOrders || []
      }
    })

  } catch (error) {
    console.error('Product detail error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 상품 수정 (원가 등)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { name, price, cost, stock, category, status, imageUrl } = body

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (price !== undefined) updateData.price = price
    if (cost !== undefined) updateData.cost = cost
    if (stock !== undefined) updateData.stock = stock
    if (category !== undefined) updateData.category = category
    if (status !== undefined) updateData.status = status
    if (imageUrl !== undefined) updateData.image_url = imageUrl

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '수정할 항목이 없습니다' }, { status: 400 })
    }

    // 상품 수정
    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Product update error:', error)
      return NextResponse.json({ error: '상품 수정에 실패했습니다' }, { status: 500 })
    }

    // 마진 계산
    const margin = product.cost > 0
      ? Math.round(((product.price - product.cost) / product.price) * 100)
      : null

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        margin
      }
    })

  } catch (error) {
    console.error('Product update API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 상품 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Product delete error:', error)
      return NextResponse.json({ error: '상품 삭제에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Product delete API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
