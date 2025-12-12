/**
 * 브릿지샵 클릭 기록 API
 * POST /api/bridge/click
 *
 * 브릿지샵에서 스마트스토어로 이동할 때 클릭 기록
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { trackingLinkId, store, product, action } = body

    if (!trackingLinkId) {
      return NextResponse.json({
        success: false,
        error: 'trackingLinkId is required'
      }, { status: 400 })
    }

    // 추적 링크 조회
    const { data: trackingLink, error: trackingLinkError } = await supabase
      .from('tracking_links')
      .select('id, user_id, clicks')
      .eq('id', trackingLinkId)
      .single()

    if (trackingLinkError || !trackingLink) {
      return NextResponse.json({
        success: false,
        error: 'Tracking link not found'
      }, { status: 404 })
    }

    // 요청 정보
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // 쿠키에서 _fbp 읽기
    const cookies = request.cookies
    const fbp = cookies.get('_fbp')?.value || null
    const fbc = cookies.get('_fbc')?.value || null

    // 클릭 수 증가
    await supabase
      .from('tracking_links')
      .update({
        clicks: (trackingLink.clicks || 0) + 1,
        last_click_at: new Date().toISOString()
      })
      .eq('id', trackingLinkId)

    // 클릭 로그 저장
    const clickId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    await supabase.from('tracking_link_clicks').insert({
      tracking_link_id: trackingLinkId,
      user_id: trackingLink.user_id,
      click_id: clickId,
      fbp: fbp,
      fbc: fbc,
      user_agent: userAgent.slice(0, 500),
      referer: referer.slice(0, 500),
      ip_address: ip,
      metadata: {
        store,
        product,
        action,
        source: 'bridge_shop'
      }
    })

    return NextResponse.json({
      success: true,
      clickId
    })

  } catch (error) {
    console.error('Bridge click API error:', error)
    return NextResponse.json({
      success: false,
      error: '클릭 기록에 실패했습니다'
    }, { status: 500 })
  }
}
