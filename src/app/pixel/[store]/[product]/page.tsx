'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Image from 'next/image'

/**
 * 픽셀샵 페이지 (광고용 중간 페이지)
 *
 * URL: /pixel/{store}/{product}?slot=xxx
 *
 * 킵그로우 방식 참고:
 * - 스마트스토어 디자인 완전 복제
 * - 메타/구글 픽셀 설치
 * - 사용자 클릭 시 스마트스토어로 이동
 * - 자동 redirect 없음 (메타 정책 준수)
 */

interface ProductData {
  name: string
  price: number
  originalPrice?: number
  discount?: number
  image: string
  images?: string[]
  rating?: number
  reviewCount?: number
  storeName: string
  storeUrl: string
}

export default function PixelShopPage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const store = params.store as string
  const product = params.product as string
  const slotId = searchParams.get('slot')

  const [productData, setProductData] = useState<ProductData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cookieSaved, setCookieSaved] = useState(false)

  // 페이지 로드 시 쿠키 저장 및 상품 정보 로드
  useEffect(() => {
    // 1. 슬롯 ID 쿠키 저장 (30일)
    if (slotId) {
      document.cookie = `sp_slot=${slotId};max-age=${60 * 60 * 24 * 30};path=/;SameSite=Lax`
      document.cookie = `sp_click_time=${Date.now()};max-age=${60 * 60 * 24 * 30};path=/;SameSite=Lax`
      setCookieSaved(true)
    }

    // 2. 상품 정보 로드 (API에서 가져오기)
    loadProductData()
  }, [slotId, store, product])

  // Meta Pixel PageView 이벤트
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView')
      (window as any).fbq('track', 'ViewContent', {
        content_type: 'product',
        content_ids: [product],
        content_name: productData?.name || product,
        value: productData?.price || 0,
        currency: 'KRW'
      })
    }
  }, [productData])

  const loadProductData = async () => {
    try {
      setLoading(true)

      // API에서 상품 정보 가져오기
      const response = await fetch(`/api/pixel/product?store=${store}&product=${product}&slot=${slotId || ''}`)
      const data = await response.json()

      if (data.success) {
        setProductData(data.data)
      } else {
        // 기본 데이터로 표시 (API 없을 때)
        setProductData({
          name: '상품 정보를 불러오는 중...',
          price: 0,
          image: '/placeholder-product.png',
          storeName: store,
          storeUrl: `https://smartstore.naver.com/${store}/products/${product}`
        })
      }
    } catch (err) {
      console.error('Failed to load product:', err)
      // 에러 시에도 기본 데이터 표시
      setProductData({
        name: '상품으로 이동',
        price: 0,
        image: '/placeholder-product.png',
        storeName: store,
        storeUrl: `https://smartstore.naver.com/${store}/products/${product}`
      })
    } finally {
      setLoading(false)
    }
  }

  // 상품 클릭 (스마트스토어로 이동)
  const handleProductClick = () => {
    // Meta Pixel - InitiateCheckout 이벤트
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'InitiateCheckout', {
        content_type: 'product',
        content_ids: [product],
        content_name: productData?.name || product,
        value: productData?.price || 0,
        currency: 'KRW'
      })
    }

    // 클릭 기록 API 호출 (비동기)
    if (slotId) {
      fetch('/api/pixel/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId,
          store,
          product,
          action: 'click_to_store'
        })
      }).catch(console.error)
    }

    // 스마트스토어로 이동
    const targetUrl = productData?.storeUrl || `https://smartstore.naver.com/${store}/products/${product}`
    window.location.href = targetUrl
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">상품 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

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

      {/* 전체 페이지 클릭 영역 (킵그로우 방식) */}
      <div
        onClick={handleProductClick}
        className="min-h-screen bg-white"
        style={{ cursor: 'default' }} // cursor: pointer 없음 (킵그로우 방식)
      >
        {/* 네이버 스마트스토어 스타일 헤더 */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
          <div className="max-w-[1200px] mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-6 h-6 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              </svg>
              <span className="font-bold text-lg text-gray-900">{productData?.storeName || store}</span>
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
                {productData?.image && productData.image !== '/placeholder-product.png' ? (
                  <Image
                    src={productData.image}
                    alt={productData?.name || '상품 이미지'}
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
                {productData?.name || '상품명'}
              </h1>

              {/* 평점 */}
              {productData?.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-4 h-4 ${star <= Math.round(productData.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {productData.rating?.toFixed(1)} ({productData.reviewCount?.toLocaleString() || 0}개 리뷰)
                  </span>
                </div>
              )}

              {/* 가격 */}
              <div className="py-4 border-t border-gray-200">
                {productData?.discount && productData.discount > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-500 font-bold text-lg">{productData.discount}%</span>
                    <span className="text-gray-400 line-through text-sm">
                      {productData.originalPrice?.toLocaleString()}원
                    </span>
                  </div>
                )}
                <div className="text-3xl font-bold text-gray-900">
                  {productData?.price?.toLocaleString() || '가격 정보 없음'}
                  {productData?.price ? <span className="text-xl">원</span> : null}
                </div>
              </div>

              {/* 구매 버튼 */}
              <div className="space-y-3 pt-4">
                <button className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold text-lg rounded-lg transition-colors">
                  구매하기
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
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                화면을 터치하시면 스마트스토어로 이동합니다
              </p>
            </div>
          </div>
        </main>

        {/* 하단 고정 버튼 (모바일) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <button className="w-full py-4 bg-green-500 text-white font-bold text-lg rounded-lg">
            스마트스토어에서 구매하기
          </button>
        </div>
      </div>
    </>
  )
}
