/**
 * 클릭 기록 API
 * POST /api/tracking-clicks
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
    const { trackingLinkId, clickId, referer, fbp: clientFbp, fbc: clientFbc } = body

    if (!trackingLinkId || !clickId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 추적 링크 조회
    const { data: trackingLink, error } = await supabase
      .from('tracking_links')
      .select('id, user_id, utm_source, utm_medium, utm_campaign, clicks')
      .eq('id', trackingLinkId)
      .single()

    if (error || !trackingLink) {
      return NextResponse.json({ error: 'Tracking link not found' }, { status: 404 })
    }

    // 요청 정보
    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // fbc/fbp: 클라이언트에서 보낸 값 우선, 없으면 서버 쿠키에서 읽기
    const cookies = request.cookies
    const fbp = clientFbp || cookies.get('_fbp')?.value || null
    const fbc = clientFbc || cookies.get('_fbc')?.value || null

    // 유효 클릭 체크 (같은 IP + User Agent가 1시간 내 클릭한 적 있는지)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const { data: recentClick } = await supabase
      .from('tracking_link_clicks')
      .select('id')
      .eq('tracking_link_id', trackingLinkId)
      .eq('ip_address', ip)
      .eq('user_agent', userAgent.slice(0, 500))
      .gte('clicked_at', oneHourAgo)
      .limit(1)
      .single()

    const isUniqueClick = !recentClick

    // 클릭 로그 저장
    await supabase.from('tracking_link_clicks').insert({
      tracking_link_id: trackingLinkId,
      user_id: trackingLink.user_id,
      click_id: clickId,
      fbp: fbp,
      fbc: fbc,
      user_agent: userAgent.slice(0, 500),
      referer: (referer || '').slice(0, 500),
      ip_address: ip,
      utm_source: trackingLink.utm_source,
      utm_medium: trackingLink.utm_medium,
      utm_campaign: trackingLink.utm_campaign,
      is_unique: isUniqueClick,
      metadata: {
        source: 'loading_page',
        type: 'organic'
      }
    })

    // 유효 클릭인 경우에만 클릭 수 증가
    if (isUniqueClick) {
      await supabase
        .from('tracking_links')
        .update({
          clicks: (trackingLink.clicks || 0) + 1,
          last_click_at: new Date().toISOString()
        })
        .eq('id', trackingLinkId)
    }

    return NextResponse.json({ success: true, isUnique: isUniqueClick })

  } catch (error) {
    console.error('Tracking click API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
