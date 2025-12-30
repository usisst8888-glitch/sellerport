import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// 단일 셀러트리 조회
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: sellerTree, error } = await supabase
      .from('seller_trees')
      .select(`
        *,
        seller_tree_links (
          id,
          title,
          url,
          description,
          thumbnail_url,
          icon,
          tracking_link_id,
          display_order,
          is_active,
          click_count,
          created_at
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !sellerTree) {
      return NextResponse.json({ error: 'Seller tree not found' }, { status: 404 })
    }

    // 링크 정렬
    const sortedLinks = (sellerTree.seller_tree_links || [])
      .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)

    return NextResponse.json({
      ...sellerTree,
      seller_tree_links: sortedLinks
    })
  } catch (error) {
    console.error('Seller tree GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 셀러트리 업데이트
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      subtitle,
      profile_image_url,
      header_image_url,
      header_image_size,
      background_type,
      background_gradient,
      background_color,
      background_image_url,
      title_color,
      subtitle_color,
      button_color,
      button_text_color,
      button_text,
      link_layout,
      is_active,
      video_search_enabled,
      video_search_title,
      video_search_placeholder,
      video_search_button_text
    } = body

    // 소유권 확인
    const { data: existing } = await supabase
      .from('seller_trees')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'Seller tree not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    if (title !== undefined) updateData.title = title
    if (subtitle !== undefined) updateData.subtitle = subtitle
    if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url
    if (header_image_url !== undefined) updateData.header_image_url = header_image_url
    if (header_image_size !== undefined) updateData.header_image_size = header_image_size
    if (background_type !== undefined) updateData.background_type = background_type
    if (background_gradient !== undefined) updateData.background_gradient = background_gradient
    if (background_color !== undefined) updateData.background_color = background_color
    if (background_image_url !== undefined) updateData.background_image_url = background_image_url
    if (title_color !== undefined) updateData.title_color = title_color
    if (subtitle_color !== undefined) updateData.subtitle_color = subtitle_color
    if (button_color !== undefined) updateData.button_color = button_color
    if (button_text_color !== undefined) updateData.button_text_color = button_text_color
    if (button_text !== undefined) updateData.button_text = button_text
    if (link_layout !== undefined) updateData.link_layout = link_layout
    if (is_active !== undefined) updateData.is_active = is_active
    if (video_search_enabled !== undefined) updateData.video_search_enabled = video_search_enabled
    if (video_search_title !== undefined) updateData.video_search_title = video_search_title
    if (video_search_placeholder !== undefined) updateData.video_search_placeholder = video_search_placeholder
    if (video_search_button_text !== undefined) updateData.video_search_button_text = video_search_button_text

    console.log('Updating seller tree with data:', updateData)

    const { data: sellerTree, error } = await supabase
      .from('seller_trees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating seller tree:', error)
      return NextResponse.json({ error: `Failed to update seller tree: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json(sellerTree)
  } catch (error) {
    console.error('Seller tree PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 셀러트리 삭제
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 소유권 확인 및 삭제
    const { error } = await supabase
      .from('seller_trees')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting seller tree:', error)
      return NextResponse.json({ error: 'Failed to delete seller tree' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Seller tree DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
