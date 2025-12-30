import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string }>
}

// 셀러트리 링크 목록 조회
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
      .select('id')
      .eq('id', sellerTreeId)
      .eq('user_id', user.id)
      .single()

    if (!sellerTree) {
      return NextResponse.json({ error: 'Seller tree not found' }, { status: 404 })
    }

    const { data: links, error } = await supabase
      .from('seller_tree_links')
      .select('*')
      .eq('seller_tree_id', sellerTreeId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching links:', error)
      return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 })
    }

    return NextResponse.json(links || [])
  } catch (error) {
    console.error('Links GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 새 링크 추가
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
      .select('id')
      .eq('id', sellerTreeId)
      .eq('user_id', user.id)
      .single()

    if (!sellerTree) {
      return NextResponse.json({ error: 'Seller tree not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, url, description, thumbnail_url, icon, tracking_link_id, display_order } = body

    if (!title || !url) {
      return NextResponse.json({ error: 'Title and URL are required' }, { status: 400 })
    }

    // 현재 최대 display_order 가져오기
    const { data: maxOrderResult } = await supabase
      .from('seller_tree_links')
      .select('display_order')
      .eq('seller_tree_id', sellerTreeId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = display_order ?? ((maxOrderResult?.display_order ?? -1) + 1)

    const { data: link, error } = await supabase
      .from('seller_tree_links')
      .insert({
        seller_tree_id: sellerTreeId,
        title,
        url,
        description: description || null,
        thumbnail_url: thumbnail_url || null,
        icon: icon || null,
        tracking_link_id: tracking_link_id || null,
        display_order: nextOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating link:', error)
      return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
    }

    return NextResponse.json(link, { status: 201 })
  } catch (error) {
    console.error('Links POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 링크 순서 일괄 업데이트
export async function PUT(request: NextRequest, context: RouteContext) {
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
      .select('id')
      .eq('id', sellerTreeId)
      .eq('user_id', user.id)
      .single()

    if (!sellerTree) {
      return NextResponse.json({ error: 'Seller tree not found' }, { status: 404 })
    }

    const body = await request.json()
    const { links } = body // [{ id: 'xxx', display_order: 0 }, ...]

    if (!Array.isArray(links)) {
      return NextResponse.json({ error: 'Links array is required' }, { status: 400 })
    }

    // 순서 일괄 업데이트
    for (const link of links) {
      await supabase
        .from('seller_tree_links')
        .update({ display_order: link.display_order })
        .eq('id', link.id)
        .eq('seller_tree_id', sellerTreeId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Links PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
