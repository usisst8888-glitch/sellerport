/**
 * 빠른 리다이렉트 (유기적 채널용)
 * GET /go/[trackingLinkId]
 *
 * URL: go.sellerport.app/{trackingLinkId}
 *
 * 블로그/SNS/인플루언서용 - 쿠키만 심고 0.5초 후 자동 이동
 * (광고용 브릿지샵과 달리 자동 redirect 가능)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: trackingLinkId } = await params

  try {
    // 추적 링크 조회
    const { data: trackingLink, error } = await supabase
      .from('tracking_links')
      .select('id, user_id, target_url, utm_source, utm_medium, utm_campaign, status, clicks')
      .eq('id', trackingLinkId)
      .single()

    if (error || !trackingLink) {
      return NextResponse.redirect(new URL('/404', request.url))
    }

    if (trackingLink.status !== 'active') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // 클릭 ID 생성
    const clickId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    // 요청 정보
    const userAgent = request.headers.get('user-agent') || ''
    const referer = request.headers.get('referer') || ''
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // 기존 쿠키
    const cookies = request.cookies
    const fbp = cookies.get('_fbp')?.value || null
    const fbc = cookies.get('_fbc')?.value || null

    // 셀러포트 도메인인지 체크
    const isSellerportDomain = (url: string) => {
      try {
        const hostname = new URL(url).hostname.toLowerCase()
        return hostname.includes('sellerport.app')
      } catch {
        return false
      }
    }

    // User Agent 파싱 헬퍼
    const parseUserAgent = (ua: string) => {
      let browser = null
      let os = null
      let deviceType = 'desktop'

      if (/mobile/i.test(ua)) {
        deviceType = 'mobile'
      } else if (/tablet|ipad/i.test(ua)) {
        deviceType = 'tablet'
      }

      if (/chrome/i.test(ua) && !/edg/i.test(ua)) {
        browser = 'Chrome'
      } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
        browser = 'Safari'
      } else if (/firefox/i.test(ua)) {
        browser = 'Firefox'
      } else if (/edg/i.test(ua)) {
        browser = 'Edge'
      }

      if (/windows/i.test(ua)) {
        os = 'Windows'
      } else if (/macintosh|mac os/i.test(ua)) {
        os = 'Mac'
      } else if (/iphone/i.test(ua)) {
        os = 'iOS'
      } else if (/android/i.test(ua)) {
        os = 'Android'
      }

      return { browser, os, deviceType }
    }

    // 레퍼러에서 도메인 추출
    const extractDomain = (ref: string) => {
      if (!ref) return null
      try {
        return new URL(ref).hostname
      } catch {
        return null
      }
    }

    // 클릭 기록 (비동기)
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

        // 클릭 로그 저장 (모든 클릭 기록, is_unique 플래그로 구분)
        await supabase.from('tracking_link_clicks').insert({
          tracking_link_id: trackingLinkId,
          user_id: trackingLink.user_id,
          click_id: clickId,
          fbp: fbp,
          fbc: fbc,
          user_agent: userAgent.slice(0, 500),
          referer: referer.slice(0, 500),
          ip_address: ip,
          utm_source: trackingLink.utm_source,
          utm_medium: trackingLink.utm_medium,
          utm_campaign: trackingLink.utm_campaign,
          is_unique: isUniqueClick,
          metadata: {
            source: 'go_redirect',
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

        // 셀러포트 도메인으로 가는 경우에만 site_visits에도 기록
        if (isSellerportDomain(trackingLink.target_url) && isUniqueClick) {
          const { browser, os, deviceType } = parseUserAgent(userAgent)
          const refererDomain = extractDomain(referer)
          const targetUrl = new URL(trackingLink.target_url)

          await supabase.from('site_visits').insert({
            page_path: targetUrl.pathname || '/',
            utm_source: trackingLink.utm_source || null,
            utm_medium: trackingLink.utm_medium || null,
            utm_campaign: trackingLink.utm_campaign || null,
            referer: referer || null,
            referer_domain: refererDomain,
            user_agent: userAgent.slice(0, 500),
            device_type: deviceType,
            browser,
            os,
            ip_address: ip,
            sp_click: clickId,
            tracking_link_id: trackingLinkId,
          })
        }
      } catch (err) {
        console.error('Click record error:', err)
      }
    }

    // 비동기로 클릭 기록
    recordClick().catch(console.error)

    // 목적지 URL에 파라미터 추가
    const targetUrl = new URL(trackingLink.target_url)
    if (trackingLink.utm_source) targetUrl.searchParams.set('utm_source', trackingLink.utm_source)
    if (trackingLink.utm_medium) targetUrl.searchParams.set('utm_medium', trackingLink.utm_medium)
    if (trackingLink.utm_campaign) targetUrl.searchParams.set('utm_campaign', trackingLink.utm_campaign)
    targetUrl.searchParams.set('sp_click', clickId)

    // 리다이렉트 응답 생성
    const response = NextResponse.redirect(targetUrl.toString())

    // 쿠키 설정 (30일)
    response.cookies.set('sp_tracking_link', trackingLinkId, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    response.cookies.set('sp_click_id', clickId, {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    response.cookies.set('sp_click_time', Date.now().toString(), {
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    return response

  } catch (error) {
    console.error('Go redirect error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}
