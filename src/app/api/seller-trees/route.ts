import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 셀러트리 목록 조회 또는 슬러그로 단일 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')

    // 슬러그로 공개 조회 (인증 불필요)
    if (slug) {
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
            click_count
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error || !sellerTree) {
        return NextResponse.json({ error: 'Seller tree not found' }, { status: 404 })
      }

      // 조회수 증가
      await supabase
        .from('seller_trees')
        .update({ view_count: (sellerTree.view_count || 0) + 1 })
        .eq('id', sellerTree.id)

      // 활성 링크만 정렬해서 반환
      const activeLinks = (sellerTree.seller_tree_links || [])
        .filter((link: { is_active: boolean }) => link.is_active)
        .sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)

      return NextResponse.json({
        ...sellerTree,
        seller_tree_links: activeLinks
      })
    }

    // 인증된 사용자의 셀러트리 목록 조회
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: sellerTrees, error } = await supabase
      .from('seller_trees')
      .select(`
        *,
        seller_tree_links (count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching seller trees:', error)
      return NextResponse.json({ error: 'Failed to fetch seller trees' }, { status: 500 })
    }

    return NextResponse.json(sellerTrees || [])
  } catch (error) {
    console.error('Seller trees GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 새 셀러트리 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { slug, title, subtitle } = body

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    // 슬러그 형식 검증 (영문, 숫자, 하이픈만 허용)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({
        error: 'Slug can only contain lowercase letters, numbers, and hyphens'
      }, { status: 400 })
    }

    // 슬러그 중복 확인
    const { data: existing } = await supabase
      .from('seller_trees')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }

    // 셀러트리 생성
    const { data: sellerTree, error } = await supabase
      .from('seller_trees')
      .insert({
        user_id: user.id,
        slug,
        title: title || null,
        subtitle: subtitle || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating seller tree:', error)
      return NextResponse.json({ error: 'Failed to create seller tree' }, { status: 500 })
    }

    return NextResponse.json(sellerTree, { status: 201 })
  } catch (error) {
    console.error('Seller trees POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
