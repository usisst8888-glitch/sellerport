/**
 * 추적 링크 로딩 페이지
 * 쿠키 저장 후 목적지로 이동
 */

import { createClient } from '@supabase/supabase-js'
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { isbot } from 'isbot'
import { Metadata } from 'next'
import LoadingAnimation from './loading-animation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PageProps {
  params: Promise<{ id: string }>
}

// 동적 메타데이터 생성 (OG 이미지 설정)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: trackingLinkId } = await params

  const { data: trackingLink } = await supabase
    .from('tracking_links')
    .select('id, post_name, thumbnail_url, utm_campaign')
    .eq('id', trackingLinkId)
    .single()

  if (!trackingLink) {
    return {
      title: '페이지 이동 중...',
    }
  }

  const title = trackingLink.post_name || trackingLink.utm_campaign || '페이지 이동 중...'
  const description = '잠시만 기다려주세요. 곧 상품 페이지로 이동합니다.'

  const metadata: Metadata = {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }

  // 썸네일이 있으면 OG 이미지로 설정
  if (trackingLink.thumbnail_url) {
    metadata.openGraph = {
      ...metadata.openGraph,
      images: [
        {
          url: trackingLink.thumbnail_url,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    }
    metadata.twitter = {
      ...metadata.twitter,
      images: [trackingLink.thumbnail_url],
    }
  }

  return metadata
}

export default async function GoPage({ params }: PageProps) {
  const { id: trackingLinkId } = await params
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''

  // 추적 링크 조회 (user_id 포함하여 Pixel 조회용)
  const { data: trackingLink, error } = await supabase
    .from('tracking_links')
    .select('id, target_url, utm_source, utm_medium, utm_campaign, status, user_id')
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

  // UTM 파라미터 추가
  if (trackingLink.utm_source) targetUrl.searchParams.set('utm_source', trackingLink.utm_source)
  if (trackingLink.utm_medium) targetUrl.searchParams.set('utm_medium', trackingLink.utm_medium)
  if (trackingLink.utm_campaign) targetUrl.searchParams.set('utm_campaign', trackingLink.utm_campaign)

  // 스마트스토어(네이버)인 경우에만 NT 파라미터 추가
  const isSmartStore = targetUrl.hostname.includes('smartstore.naver.com') ||
                       targetUrl.hostname.includes('brand.naver.com')

  if (isSmartStore) {
    // 네이버 전환 추적용 NT 파라미터 추가 (UTM에서 매핑)
    // nt_source: 광고 매체 (meta, google, naver 등)
    // nt_medium: 광고 유형 (paid, cpc, organic 등)
    // nt_detail: 광고 소재/캠페인 상세
    if (trackingLink.utm_source) targetUrl.searchParams.set('nt_source', trackingLink.utm_source)
    if (trackingLink.utm_medium) targetUrl.searchParams.set('nt_medium', trackingLink.utm_medium)
    if (trackingLink.utm_campaign) targetUrl.searchParams.set('nt_detail', trackingLink.utm_campaign)
  }

  // 봇/크롤러인 경우 바로 리다이렉트 (로딩 페이지 없이)
  if (isbot(userAgent)) {
    const clickId = `sp_bot_${Date.now()}`
    targetUrl.searchParams.set('sp_click', clickId)
    redirect(targetUrl.toString())
  }

  // 셀러의 Meta Pixel ID 조회 (ad_channels.metadata.default_pixel_id)
  let pixelId: string | undefined
  if (trackingLink.user_id) {
    const { data: adChannel } = await supabase
      .from('ad_channels')
      .select('metadata')
      .eq('user_id', trackingLink.user_id)
      .eq('channel_type', 'meta')
      .eq('status', 'connected')
      .limit(1)
      .single()

    if (adChannel?.metadata?.default_pixel_id) {
      pixelId = adChannel.metadata.default_pixel_id
    }
  }

  return (
    <LoadingAnimation
      trackingLinkId={trackingLinkId}
      targetUrl={targetUrl.toString()}
      pixelId={pixelId}
    />
  )
}
