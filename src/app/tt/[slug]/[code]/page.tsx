/**
 * 틱톡 스토어별 영상번호 검색 결과 페이지
 * /tt/tiktok-store/A001 형식으로 접근
 * 쿠키 저장 후 목적지로 리다이렉트
 */

import { createClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { isbot } from 'isbot'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PageProps {
  params: Promise<{ slug: string; code: string }>
}

export default async function TiktokStoreVideoCodePage({ params }: PageProps) {
  const { slug, code: videoCode } = await params
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''

  // 영상번호 대문자로 변환
  const normalizedCode = videoCode.toUpperCase()

  // tracking_links에서 해당 스토어의 틱톡 영상번호 조회
  const { data: trackingLinkData, error } = await supabase
    .from('tracking_links')
    .select('id, video_code, target_url, user_id, store_slug')
    .eq('store_slug', slug)
    .eq('video_code', normalizedCode)
    .eq('channel_type', 'tiktok')
    .eq('status', 'active')
    .limit(1)

  if (error || !trackingLinkData || trackingLinkData.length === 0) {
    notFound()
  }

  const record = trackingLinkData[0]

  // 목적지 URL 생성
  let targetUrl = new URL(record.target_url)

  // 스마트스토어(네이버)인 경우 NT 파라미터 추가
  const isSmartStore = targetUrl.hostname.includes('smartstore.naver.com') ||
                       targetUrl.hostname.includes('brand.naver.com')

  // 클릭 ID 생성
  const clickId = `sp_tt_${slug}_${normalizedCode}_${Date.now().toString(36)}`

  // 스마트스토어는 NT 파라미터, 그 외는 UTM 파라미터 사용
  if (isSmartStore) {
    // 네이버 스마트스토어: NT 파라미터만 사용 (URL 경로는 그대로 유지)
    targetUrl.searchParams.set('nt_source', 'tiktok')
    targetUrl.searchParams.set('nt_medium', 'video')
    targetUrl.searchParams.set('nt_detail', `video_${normalizedCode.toLowerCase()}`)
    targetUrl.searchParams.set('nt_keyword', clickId)
  } else {
    // 그 외: UTM 파라미터 사용
    targetUrl.searchParams.set('utm_source', 'tiktok')
    targetUrl.searchParams.set('utm_medium', 'video')
    targetUrl.searchParams.set('utm_campaign', `video_${normalizedCode.toLowerCase()}`)
    // 공통 클릭 ID
    targetUrl.searchParams.set('sp_click', clickId)
  }

  // 봇인 경우 바로 리다이렉트
  if (isbot(userAgent)) {
    redirect(targetUrl.toString())
  }

  // 클릭 기록 저장
  try {
    await supabase
      .from('tracking_link_clicks')
      .insert({
        tracking_link_id: record.id,
        user_id: record.user_id,
        click_id: clickId,
        user_agent: userAgent,
        referrer: headersList.get('referer') || null
      })
  } catch {
    // 실패해도 무시
  }

  // 리다이렉트
  redirect(targetUrl.toString())
}
