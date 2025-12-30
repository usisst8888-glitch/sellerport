import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string; linkId: string }>
}

// 개별 링크 수정
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id: sellerTreeId, linkId } = await context.params
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
    const { title, url, description, thumbnail_url, icon, tracking_link_id, display_order, is_active } = body

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (url !== undefined) updateData.url = url
    if (description !== undefined) updateData.description = description
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url
    if (icon !== undefined) updateData.icon = icon
    if (tracking_link_id !== undefined) updateData.tracking_link_id = tracking_link_id
    if (display_order !== undefined) updateData.display_order = display_order
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: link, error } = await supabase
      .from('seller_tree_links')
      .update(updateData)
      .eq('id', linkId)
      .eq('seller_tree_id', sellerTreeId)
      .select()
      .single()

    if (error) {
      console.error('Error updating link:', error)
      return NextResponse.json({ error: 'Failed to update link' }, { status: 500 })
    }

    return NextResponse.json(link)
  } catch (error) {
    console.error('Link PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 링크 삭제
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: sellerTreeId, linkId } = await context.params
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

    const { error } = await supabase
      .from('seller_tree_links')
      .delete()
      .eq('id', linkId)
      .eq('seller_tree_id', sellerTreeId)

    if (error) {
      console.error('Error deleting link:', error)
      return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Link DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
