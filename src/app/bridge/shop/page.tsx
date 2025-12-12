'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

/**
 * 범용 브릿지샵 페이지 (구글/메타/틱톡 광고용)
 * 판매 플랫폼별 디자인 적용
 */

interface TrackingLinkData {
  id: string
  name: string
  target_url: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  products?: {
    id: string
    name: string
    image_url: string | null
    price: number
    platform_type: string
    platforms?: {
      id: string
      platform_type: string
      platform_name: string
    } | null
  } | null
}

// 플랫폼별 테마 설정
const platformThemes = {
  naver: {
    name: '스마트스토어',
    primaryColor: 'bg-green-500',
    primaryHover: 'hover:bg-green-600',
    textColor: 'text-green-500',
    borderColor: 'border-green-500',
    bgGradient: 'from-green-50 to-white',
    buttonText: '스마트스토어에서 구매하기',
    logo: (
      <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
      </svg>
    )
  },
  coupang: {
    name: '쿠팡',
    primaryColor: 'bg-[#E31837]',
    primaryHover: 'hover:bg-[#C41230]',
    textColor: 'text-[#E31837]',
    borderColor: 'border-[#E31837]',
    bgGradient: 'from-red-50 to-white',
    buttonText: '쿠팡에서 구매하기',
    logo: (
      <div className="w-8 h-8 bg-[#E31837] rounded-lg flex items-center justify-center">
        <span className="text-white font-bold text-lg">C</span>
      </div>
    )
  },
  cafe24: {
    name: '쇼핑몰',
    primaryColor: 'bg-blue-600',
    primaryHover: 'hover:bg-blue-700',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-600',
    bgGradient: 'from-blue-50 to-white',
    buttonText: '쇼핑몰에서 구매하기',
    logo: (
      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  },
  custom: {
    name: '쇼핑몰',
    primaryColor: 'bg-slate-800',
    primaryHover: 'hover:bg-slate-900',
    textColor: 'text-slate-800',
    borderColor: 'border-slate-800',
    bgGradient: 'from-slate-50 to-white',
    buttonText: '상품 보러가기',
    logo: (
      <svg className="w-6 h-6 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    )
  }
}

type PlatformType = keyof typeof platformThemes

function BridgeShopPage() {
  const searchParams = useSearchParams()
  const trackingLinkId = searchParams.get('tl')

  const [trackingLink, setTrackingLink] = useState<TrackingLinkData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!trackingLinkId) {
      setError('추적 링크 ID가 없습니다')
      setLoading(false)
      return
    }

    // 쿠키 저장 (30일)
    document.cookie = `sp_tracking_link=${trackingLinkId};max-age=${60 * 60 * 24 * 30};path=/;SameSite=Lax`
    document.cookie = `sp_click_time=${Date.now()};max-age=${60 * 60 * 24 * 30};path=/;SameSite=Lax`

    loadTrackingLink()
  }, [trackingLinkId])

  // Meta Pixel PageView 이벤트
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq && trackingLink) {
      (window as any).fbq('track', 'PageView')
      (window as any).fbq('track', 'ViewContent', {
        content_type: 'product',
        content_ids: [trackingLink.id],
        content_name: trackingLink.products?.name || trackingLink.name,
        value: trackingLink.products?.price || 0,
        currency: 'KRW'
      })
    }
  }, [trackingLink])

  const loadTrackingLink = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bridge/tracking-link?tl=${trackingLinkId}`)
      const data = await response.json()

      if (data.success) {
        setTrackingLink(data.data)
      } else {
        setError(data.error || '추적 링크를 찾을 수 없습니다')
      }
    } catch (err) {
      console.error('Failed to load tracking link:', err)
      setError('추적 링크를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 클릭 시 목적지로 이동
  const handleClick = async () => {
    if (!trackingLink) return

    // Meta Pixel - InitiateCheckout 이벤트
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_type: 'product',
        content_ids: [trackingLink.id],
        content_name: trackingLink.products?.name || trackingLink.name,
        value: trackingLink.products?.price || 0,
        currency: 'KRW'
      })
    }

    // 클릭 기록 (비동기)
    fetch('/api/bridge/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackingLinkId: trackingLink.id,
        action: 'click_to_store'
      })
    }).catch(console.error)

    // 목적지 URL로 이동 (UTM 파라미터 추가)
    const targetUrl = new URL(trackingLink.target_url)
    targetUrl.searchParams.set('utm_source', trackingLink.utm_source)
    targetUrl.searchParams.set('utm_medium', trackingLink.utm_medium)
    targetUrl.searchParams.set('utm_campaign', trackingLink.utm_campaign)
    targetUrl.searchParams.set('sp_click', trackingLink.id)

    window.location.href = targetUrl.toString()
  }

  // 플랫폼 타입 결정
  const getPlatformType = (): PlatformType => {
    const platformType = trackingLink?.products?.platform_type ||
                        trackingLink?.products?.platforms?.platform_type

    if (platformType === 'naver') return 'naver'
    if (platformType === 'coupang') return 'coupang'
    if (platformType === 'cafe24') return 'cafe24'
    return 'custom'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">상품 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !trackingLink) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-gray-600">{error || '페이지를 찾을 수 없습니다'}</p>
        </div>
      </div>
    )
  }

  const product = trackingLink.products
  const platformType = getPlatformType()
  const theme = platformThemes[platformType]
  const storeName = product?.platforms?.platform_name || theme.name

  return (
    <>
      {/* Meta Pixel Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
          `
        }}
      />

      {/* 전체 페이지 클릭 영역 */}
      <div
        onClick={handleClick}
        className={`min-h-screen bg-gradient-to-b ${theme.bgGradient}`}
        style={{ cursor: 'default' }}
      >
        {/* 플랫폼별 헤더 */}
        <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
          <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme.logo}
              <span className="font-bold text-lg text-gray-900">{storeName}</span>
            </div>
            <div className="flex items-center gap-4">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </header>

        {/* 상품 상세 */}
        <main className="max-w-[1200px] mx-auto">
          <div className="flex flex-col lg:flex-row gap-8 p-4">
            {/* 상품 이미지 */}
            <div className="flex-1">
              <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                {product?.image_url ? (
                  <Image
                    src={product.image_url}
                    alt={product.name || '상품 이미지'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* 상품 정보 */}
            <div className="flex-1 space-y-4">
              {/* 상품명 */}
              <h1 className="text-xl lg:text-2xl font-medium text-gray-900">
                {product?.name || trackingLink.name}
              </h1>

              {/* 가격 */}
              <div className="py-4 border-t border-gray-200">
                <div className={`text-3xl font-bold ${theme.textColor}`}>
                  {product?.price ? (
                    <>
                      {product.price.toLocaleString()}
                      <span className="text-xl">원</span>
                    </>
                  ) : (
                    '가격 정보 없음'
                  )}
                </div>
              </div>

              {/* 구매 버튼 */}
              <div className="space-y-3 pt-4">
                <button className={`w-full py-4 ${theme.primaryColor} ${theme.primaryHover} text-white font-bold text-lg rounded-lg transition-colors`}>
                  {theme.buttonText}
                </button>
                <div className="flex gap-3">
                  <button className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                    장바구니
                  </button>
                  <button className="py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* 배송 정보 */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className={`w-5 h-5 ${theme.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>오늘 출발</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>무료배송</span>
                </div>
              </div>
            </div>
          </div>

          {/* 안내 문구 */}
          <div className="p-4 mb-8">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-500">
                화면을 터치하시면 {storeName}로 이동합니다
              </p>
            </div>
          </div>
        </main>

        {/* 하단 고정 버튼 (모바일) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <button className={`w-full py-4 ${theme.primaryColor} text-white font-bold text-lg rounded-lg`}>
            {theme.buttonText}
          </button>
        </div>
      </div>
    </>
  )
}

// Suspense로 감싸는 기본 내보내기
export default function BridgeShopPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <BridgeShopPage />
    </Suspense>
  )
}
