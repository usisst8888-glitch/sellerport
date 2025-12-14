/**
 * 브릿지샵용 추적 링크 정보 조회 API
 * GET /api/bridge/tracking-link?tl=TL-XXXXXXXX
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const trackingLinkId = request.nextUrl.searchParams.get('tl')

    if (!trackingLinkId) {
      return NextResponse.json({ error: '추적 링크 ID가 필요합니다' }, { status: 400 })
    }

    // 추적 링크 조회 (상품 및 플랫폼 정보 포함)
    const { data: trackingLink, error } = await supabase
      .from('tracking_links')
      .select(`
        id,
        name,
        target_url,
        utm_source,
        utm_medium,
        utm_campaign,
        status,
        products (
          id,
          name,
          image_url,
          price,
          site_type,
          my_sites (
            id,
            site_type,
            site_name
          )
        )
      `)
      .eq('id', trackingLinkId)
      .single()

    if (error || !trackingLink) {
      return NextResponse.json({ error: '추적 링크를 찾을 수 없습니다' }, { status: 404 })
    }

    if (trackingLink.status !== 'active') {
      return NextResponse.json({ error: '비활성화된 추적 링크입니다' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: trackingLink
    })

  } catch (error) {
    console.error('Bridge tracking link API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
