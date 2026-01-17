'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

interface LoadingAnimationProps {
  trackingLinkId: string
  targetUrl: string
  pixelId?: string // 사용자별 Meta Pixel ID (없으면 기본값 사용)
}

// 쿠키 읽기 헬퍼
function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

// URL에서 fbclid 추출하여 fbc 쿠키 생성
function generateFbc(): string | null {
  const urlParams = new URLSearchParams(window.location.search)
  const fbclid = urlParams.get('fbclid')
  if (fbclid) {
    // fbc 형식: fb.{subdomain_index}.{creation_time}.{fbclid}
    const creationTime = Math.floor(Date.now() / 1000)
    return `fb.1.${creationTime}.${fbclid}`
  }
  return null
}

export default function LoadingAnimation({ trackingLinkId, targetUrl, pixelId }: LoadingAnimationProps) {
  const [isReady, setIsReady] = useState(false)
  const [pixelLoaded, setPixelLoaded] = useState(false)

  // 기본 Pixel ID (환경변수 또는 하드코딩)
  const META_PIXEL_ID = pixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID || '2313945845720098'

  useEffect(() => {
    // 클릭 ID 생성
    const clickId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    // 쿠키 설정 (30일)
    const maxAge = 60 * 60 * 24 * 30
    document.cookie = `sp_tracking_link=${trackingLinkId}; max-age=${maxAge}; path=/; SameSite=Lax`
    document.cookie = `sp_click_id=${clickId}; max-age=${maxAge}; path=/; SameSite=Lax`
    document.cookie = `sp_click_time=${Date.now()}; max-age=${maxAge}; path=/; SameSite=Lax`

    // fbc 쿠키 생성 (fbclid가 있는 경우 - Meta 광고 클릭 시)
    const fbc = generateFbc()
    if (fbc) {
      document.cookie = `_fbc=${fbc}; max-age=${maxAge}; path=/; SameSite=Lax`
    }

    // Meta Pixel이 로드될 때까지 약간 대기 후 쿠키 수집
    const collectAndSend = () => {
      // _fbp는 Meta Pixel이 자동 생성, _fbc는 위에서 생성 또는 기존 값
      const fbp = getCookie('_fbp')
      const finalFbc = getCookie('_fbc') || fbc

      // 클릭 기록 API 호출 (fbc, fbp 포함)
      fetch('/api/tracking-clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingLinkId,
          clickId,
          referer: document.referrer || null,
          fbp: fbp || null,
          fbc: finalFbc || null,
        }),
      }).catch(console.error)
    }

    // Pixel 로드 후 500ms 대기하여 _fbp 쿠키 생성 시간 확보
    if (pixelLoaded) {
      setTimeout(collectAndSend, 500)
    } else {
      // Pixel이 아직 안 로드됐으면 1초 후 시도
      setTimeout(collectAndSend, 1000)
    }

    // 목적지 URL에 sp_click 파라미터 추가
    const finalUrl = new URL(targetUrl)
    finalUrl.searchParams.set('sp_click', clickId)

    // 1.5초 후 이동
    setIsReady(true)
    const timer = setTimeout(() => {
      window.location.href = finalUrl.toString()
    }, 1500)

    return () => clearTimeout(timer)
  }, [trackingLinkId, targetUrl, pixelLoaded])

  return (
    <>
      {/* Meta Pixel Script */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onLoad={() => setPixelLoaded(true)}
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
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
        {/* 애니메이션 컨테이너 */}
        <div className="relative w-32 h-32 mb-8">
          {/* 외곽 회전 원 */}
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 border-r-blue-500 animate-spin" />

          {/* 중간 회전 원 (반대 방향) */}
          <div
            className="absolute inset-2 rounded-full border-4 border-transparent border-b-cyan-400 border-l-blue-500 animate-spin"
            style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
          />

          {/* 내부 회전 원 */}
          <div
            className="absolute inset-4 rounded-full border-4 border-transparent border-t-pink-400 border-r-orange-400 animate-spin"
            style={{ animationDuration: '2s' }}
          />

          {/* 중앙 화살표 아이콘 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* 삼각형 화살표 */}
              <svg
                viewBox="0 0 24 24"
                className="w-10 h-10 text-white animate-pulse"
                fill="currentColor"
              >
                {/* 둥근 삼각형 화살표 */}
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14v-4H7l5-6 5 6h-4v4h-2z" />
              </svg>

              {/* 글로우 효과 */}
              <div className="absolute inset-0 blur-md opacity-50">
                <svg
                  viewBox="0 0 24 24"
                  className="w-10 h-10 text-pink-500"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14v-4H7l5-6 5 6h-4v4h-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 텍스트 */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2 animate-pulse">
            쇼핑몰로 이동중
          </h1>
          <div className="flex items-center justify-center gap-1">
            <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>

        {/* 진행 바 */}
        <div className="mt-8 w-64 h-1 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-pink-500 via-blue-500 to-cyan-400 rounded-full"
            style={{
              animation: isReady ? 'progress 1.5s ease-out forwards' : 'none',
            }}
          />
        </div>

        <style jsx>{`
          @keyframes progress {
            from {
              width: 0%;
            }
            to {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </>
  )
}
