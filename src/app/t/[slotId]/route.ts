/**
 * 슬롯 추적 리다이렉트
 * GET /t/[slotId] - 클릭 추적 후 목적지 URL로 리다이렉트
 *
 * 이 엔드포인트는 광고 클릭을 추적하고 실제 상품 페이지로 리다이렉트합니다.
 * - 클릭 ID 생성 (주문 매칭용)
 * - _fbp 쿠키 저장 (Meta 어트리뷰션용)
 * - slot_clicks 테이블에 상세 기록
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
  { params }: { params: Promise<{ slotId: string }> }
) {
  const { slotId } = await params
  const clickId = generateClickId()

  try {
    // 슬롯 조회
    const { data: slot, error } = await supabase
      .from('slots')
      .select('id, user_id, campaign_id, target_url, utm_source, utm_medium, utm_campaign, status, clicks')
      .eq('id', slotId)
      .single()

    if (error || !slot) {
      return NextResponse.redirect(new URL('/404', request.url))
    }

    if (slot.status !== 'active') {
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
        // 1. 슬롯 클릭 수 증가
        await supabase
          .from('slots')
          .update({
            clicks: (slot.clicks || 0) + 1,
            last_click_at: new Date().toISOString()
          })
          .eq('id', slotId)

        // 2. 클릭 상세 로그 저장
        await supabase.from('slot_clicks').insert({
          id: clickId,
          slot_id: slotId,
          user_id: slot.user_id,
          campaign_id: slot.campaign_id,
          click_id: clickId,
          fbp: fbp,
          fbc: fbc,
          user_agent: userAgent.slice(0, 500),
          referer: referer.slice(0, 500),
          ip_address: ip,
          utm_source: slot.utm_source,
          utm_medium: slot.utm_medium,
          utm_campaign: slot.utm_campaign,
          is_converted: false,
          created_at: new Date().toISOString()
        })

        // 3. 캠페인 클릭 수 증가
        if (slot.campaign_id) {
          const { data: campaign } = await supabase
            .from('campaigns')
            .select('clicks')
            .eq('id', slot.campaign_id)
            .single()

          if (campaign) {
            await supabase
              .from('campaigns')
              .update({ clicks: (campaign.clicks || 0) + 1 })
              .eq('id', slot.campaign_id)
          }
        }
      } catch (err) {
        console.error('Click record error:', err)
      }
    }

    // 비동기로 클릭 기록 (리다이렉트 블로킹 안함)
    recordClick().catch(console.error)

    // 목적지 URL에 파라미터 추가
    const targetUrl = new URL(slot.target_url)
    targetUrl.searchParams.set('utm_source', slot.utm_source)
    targetUrl.searchParams.set('utm_medium', slot.utm_medium)
    targetUrl.searchParams.set('utm_campaign', slot.utm_campaign)
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

    // 슬롯 ID도 저장 (주문 매칭용)
    response.cookies.set('sp_slot_id', slotId, {
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
