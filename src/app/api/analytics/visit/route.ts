import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

// 브라우저/OS 파싱 헬퍼
function parseUserAgent(ua: string | null) {
  if (!ua) return { browser: null, os: null, deviceType: 'desktop' }

  let browser = null
  let os = null
  let deviceType = 'desktop'

  // 기기 타입
  if (/mobile/i.test(ua)) {
    deviceType = 'mobile'
  } else if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet'
  }

  // 브라우저 감지
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) {
    browser = 'Chrome'
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Safari'
  } else if (/firefox/i.test(ua)) {
    browser = 'Firefox'
  } else if (/edg/i.test(ua)) {
    browser = 'Edge'
  } else if (/opera|opr/i.test(ua)) {
    browser = 'Opera'
  }

  // OS 감지
  if (/windows/i.test(ua)) {
    os = 'Windows'
  } else if (/macintosh|mac os/i.test(ua)) {
    os = 'Mac'
  } else if (/iphone/i.test(ua)) {
    os = 'iOS'
  } else if (/ipad/i.test(ua)) {
    os = 'iPadOS'
  } else if (/android/i.test(ua)) {
    os = 'Android'
  } else if (/linux/i.test(ua)) {
    os = 'Linux'
  }

  return { browser, os, deviceType }
}

// 레퍼러에서 도메인 추출
function extractDomain(referer: string | null) {
  if (!referer) return null
  try {
    const url = new URL(referer)
    return url.hostname
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      pagePath,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      referer,
      visitorId,
      sessionId,
      userId
    } = body

    // 헤더에서 정보 추출
    const userAgent = request.headers.get('user-agent')
    const forwardedFor = request.headers.get('x-forwarded-for')
    const realIp = request.headers.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null

    // User Agent 파싱
    const { browser, os, deviceType } = parseUserAgent(userAgent)

    // 레퍼러 도메인 추출
    const refererDomain = extractDomain(referer)

    const supabase = createAdminClient()

    const { error } = await supabase.from('site_visits').insert({
      page_path: pagePath || '/',
      utm_source: utmSource || null,
      utm_medium: utmMedium || null,
      utm_campaign: utmCampaign || null,
      utm_content: utmContent || null,
      utm_term: utmTerm || null,
      referer: referer || null,
      referer_domain: refererDomain,
      user_agent: userAgent,
      device_type: deviceType,
      browser,
      os,
      ip_address: ipAddress,
      visitor_id: visitorId || null,
      session_id: sessionId || null,
      user_id: userId || null,
    })

    if (error) {
      console.error('Failed to log visit:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Visit log error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
