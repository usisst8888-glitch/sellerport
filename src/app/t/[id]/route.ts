/**
 * 추적 링크 리다이렉트
 * GET /t/[trackingLinkId] - 클릭 추적 후 목적지 URL로 리다이렉트
 *
 * 이 엔드포인트는 광고 클릭을 추적하고 실제 상품 페이지로 리다이렉트합니다.
 * - 클릭 ID 생성 (주문 매칭용)
 * - _fbp 쿠키 저장 (Meta 어트리뷰션용)
 * - tracking_link_clicks 테이블에 상세 기록
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// 서버 측 Supabase 클라이언트 (서비스 롤 키 사용)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 클릭 ID 생성 (30일간 유효, 주문 매칭에 사용)
function generateClickId(): string {
  return `sp_${Date.now()}_${uuidv4().slice(0, 8)}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: trackingLinkId } = await params
  const clickId = generateClickId()

  try {
    // 추적 링크 조회
    const { data: trackingLink, error } = await supabase
      .from('tracking_links')
      .select('id, user_id, campaign_id, target_url, utm_source, utm_medium, utm_campaign, status, clicks')
      .eq('id', trackingLinkId)
      .single()

    if (error || !trackingLink) {
      return NextResponse.redirect(new URL('/404', request.url))
    }

    if (trackingLink.status !== 'active') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // 요청 정보 추출
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // 기존 쿠키에서 _fbp, _fbc 읽기
    const cookies = request.cookies
    const fbp = cookies.get('_fbp')?.value || null
    const fbc = cookies.get('_fbc')?.value || null

    // 클릭 수 증가 + 클릭 로그 기록 (병렬 처리)
    const recordClick = async () => {
      try {
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

        // 1. 클릭 상세 로그 저장 (모든 클릭 기록, is_unique 플래그로 구분)
        await supabase.from('tracking_link_clicks').insert({
          id: clickId,
          tracking_link_id: trackingLinkId,
          user_id: trackingLink.user_id,
          campaign_id: trackingLink.campaign_id,
          click_id: clickId,
          fbp: fbp,
          fbc: fbc,
          user_agent: userAgent.slice(0, 500),
          referer: referer.slice(0, 500),
          ip_address: ip,
          utm_source: trackingLink.utm_source,
          utm_medium: trackingLink.utm_medium,
          utm_campaign: trackingLink.utm_campaign,
          is_converted: false,
          is_unique: isUniqueClick,
          created_at: new Date().toISOString()
        })

        // 유효 클릭인 경우에만 클릭 수 증가
        if (isUniqueClick) {
          // 2. 추적 링크 클릭 수 증가
          await supabase
            .from('tracking_links')
            .update({
              clicks: (trackingLink.clicks || 0) + 1,
              last_click_at: new Date().toISOString()
            })
            .eq('id', trackingLinkId)

          // 3. 캠페인 클릭 수 증가
          if (trackingLink.campaign_id) {
            const { data: campaign } = await supabase
              .from('campaigns')
              .select('clicks')
              .eq('id', trackingLink.campaign_id)
              .single()

            if (campaign) {
              await supabase
                .from('campaigns')
                .update({ clicks: (campaign.clicks || 0) + 1 })
                .eq('id', trackingLink.campaign_id)
            }
          }
        }
      } catch (err) {
        console.error('Click record error:', err)
      }
    }

    // 비동기로 클릭 기록 (리다이렉트 블로킹 안함)
    recordClick().catch(console.error)

    // 목적지 URL에 파라미터 추가
    const targetUrl = new URL(trackingLink.target_url)
    targetUrl.searchParams.set('utm_source', trackingLink.utm_source)
    targetUrl.searchParams.set('utm_medium', trackingLink.utm_medium)
    targetUrl.searchParams.set('utm_campaign', trackingLink.utm_campaign)
    targetUrl.searchParams.set('sp_click', clickId)  // 셀러포트 클릭 ID

    // 리다이렉트 응답 생성
    const response = NextResponse.redirect(targetUrl.toString())

    // 클릭 ID 쿠키 설정 (30일 유효 - 어트리뷰션 윈도우)
    response.cookies.set('sp_click_id', clickId, {
      maxAge: 60 * 60 * 24 * 30, // 30일
      path: '/',
      httpOnly: false, // 클라이언트에서 읽을 수 있어야 함
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    // 추적 링크 ID도 저장 (주문 매칭용)
    response.cookies.set('sp_tracking_link_id', trackingLinkId, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response

  } catch (error) {
    console.error('Tracking redirect error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}
