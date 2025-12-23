/**
 * 추적 링크 로딩 페이지
 * 쿠키 저장 후 목적지로 이동
 */

import { createClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { isbot } from 'isbot'
import LoadingAnimation from './loading-animation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function GoPage({ params }: PageProps) {
  const { id: trackingLinkId } = await params
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''

  // 추적 링크 조회
  const { data: trackingLink, error } = await supabase
    .from('tracking_links')
    .select('id, target_url, utm_source, utm_medium, utm_campaign, status')
    .eq('id', trackingLinkId)
    .single()

  if (error || !trackingLink) {
    notFound()
  }

  if (trackingLink.status !== 'active') {
    redirect('/')
  }

  // 목적지 URL 생성
  const targetUrl = new URL(trackingLink.target_url)
  if (trackingLink.utm_source) targetUrl.searchParams.set('utm_source', trackingLink.utm_source)
  if (trackingLink.utm_medium) targetUrl.searchParams.set('utm_medium', trackingLink.utm_medium)
  if (trackingLink.utm_campaign) targetUrl.searchParams.set('utm_campaign', trackingLink.utm_campaign)

  // 봇/크롤러인 경우 바로 리다이렉트 (로딩 페이지 없이)
  if (isbot(userAgent)) {
    const clickId = `sp_bot_${Date.now()}`
    targetUrl.searchParams.set('sp_click', clickId)
    redirect(targetUrl.toString())
  }

  return (
    <LoadingAnimation
      trackingLinkId={trackingLinkId}
      targetUrl={targetUrl.toString()}
    />
  )
}
