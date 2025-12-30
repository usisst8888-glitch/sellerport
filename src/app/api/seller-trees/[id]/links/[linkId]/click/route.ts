import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteContext {
  params: Promise<{ id: string; linkId: string }>
}

// 링크 클릭 추적 (인증 불필요 - 공개 페이지에서 호출)
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { linkId } = await context.params
    const supabase = await createClient()

    // 클릭 카운트 증가
    const { data: link, error } = await supabase
      .from('seller_tree_links')
      .select('click_count, tracking_link_id')
      .eq('id', linkId)
      .single()

    if (error || !link) {
      return NextResponse.json({ error: 'Link not found' }, { status: 404 })
    }

    // 클릭 수 업데이트
    await supabase
      .from('seller_tree_links')
      .update({ click_count: (link.click_count || 0) + 1 })
      .eq('id', linkId)

    // 추적 링크가 연동되어 있으면 해당 링크의 클릭도 증가
    if (link.tracking_link_id) {
      const { data: trackingLink } = await supabase
        .from('tracking_links')
        .select('clicks')
        .eq('id', link.tracking_link_id)
        .single()

      if (trackingLink) {
        await supabase
          .from('tracking_links')
          .update({ clicks: (trackingLink.clicks || 0) + 1 })
          .eq('id', link.tracking_link_id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Link click tracking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
