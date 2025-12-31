import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string; trackingLinkId: string }>
}

// 영상번호 상품 삭제
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: sellerTreeId, trackingLinkId } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 셀러트리 소유권 확인
    const { data: sellerTree } = await supabase
      .from('seller_trees')
      .select('id')
      .eq('id', sellerTreeId)
      .eq('user_id', user.id)
      .single()

    if (!sellerTree) {
      return NextResponse.json({ error: 'Seller tree not found' }, { status: 404 })
    }

    // 추적 링크 삭제 (소유권 확인 포함)
    const { error } = await supabase
      .from('tracking_links')
      .delete()
      .eq('id', trackingLinkId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Tracking link delete error:', error)
      return NextResponse.json({ error: 'Failed to delete video product' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Video product DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 영상번호 상품 수정
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: sellerTreeId, trackingLinkId } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 셀러트리 소유권 확인
    const { data: sellerTree } = await supabase
      .from('seller_trees')
      .select('id')
      .eq('id', sellerTreeId)
      .eq('user_id', user.id)
      .single()

    if (!sellerTree) {
      return NextResponse.json({ error: 'Seller tree not found' }, { status: 404 })
    }

    const body = await request.json()
    const { postName, status } = body

    const updateData: Record<string, unknown> = {}
    if (postName !== undefined) updateData.post_name = postName
    if (status !== undefined) updateData.status = status

    const { data: trackingLink, error } = await supabase
      .from('tracking_links')
      .update(updateData)
      .eq('id', trackingLinkId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Tracking link update error:', error)
      return NextResponse.json({ error: 'Failed to update video product' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: trackingLink })
  } catch (error) {
    console.error('Video product PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
