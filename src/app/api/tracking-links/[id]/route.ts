/**
 * 추적 링크 상세 API
 * GET /api/tracking-links/[id] - 추적 링크 상세 조회
 * PATCH /api/tracking-links/[id] - 추적 링크 수정
 * DELETE /api/tracking-links/[id] - 추적 링크 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 추적 링크 상세 조회
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

    const { data: trackingLink, error } = await supabase
      .from('tracking_links')
      .select(`
        *,
        products (
          name,
          image_url,
          price
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !trackingLink) {
      return NextResponse.json({ error: '추적 링크를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: trackingLink })

  } catch (error) {
    console.error('Tracking link detail error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 추적 링크 수정
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
    const { name, status, targetUrl, adSpend, productId, targetRoasGreen, targetRoasYellow } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (status !== undefined) updateData.status = status
    if (targetUrl !== undefined) updateData.target_url = targetUrl
    if (adSpend !== undefined) updateData.ad_spend = adSpend
    if (productId !== undefined) updateData.product_id = productId
    if (targetRoasGreen !== undefined) updateData.target_roas_green = targetRoasGreen
    if (targetRoasYellow !== undefined) updateData.target_roas_yellow = targetRoasYellow

    const { data: trackingLink, error } = await supabase
      .from('tracking_links')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Tracking link update error:', error)
      return NextResponse.json({ error: '추적 링크 수정에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: trackingLink })

  } catch (error) {
    console.error('Tracking link update API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 추적 링크 삭제
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
      .from('tracking_links')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Tracking link delete error:', error)
      return NextResponse.json({ error: '추적 링크 삭제에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Tracking link delete API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
