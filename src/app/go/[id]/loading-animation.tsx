'use client'

import { useEffect, useState } from 'react'

interface LoadingAnimationProps {
  trackingLinkId: string
  targetUrl: string
}

export default function LoadingAnimation({ trackingLinkId, targetUrl }: LoadingAnimationProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // 클릭 ID 생성
    const clickId = `sp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`

    // 쿠키 설정 (30일)
    const maxAge = 60 * 60 * 24 * 30
    document.cookie = `sp_tracking_link=${trackingLinkId}; max-age=${maxAge}; path=/; SameSite=Lax`
    document.cookie = `sp_click_id=${clickId}; max-age=${maxAge}; path=/; SameSite=Lax`
    document.cookie = `sp_click_time=${Date.now()}; max-age=${maxAge}; path=/; SameSite=Lax`

    // 클릭 기록 API 호출
    fetch('/api/tracking-clicks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackingLinkId,
        clickId,
        referer: document.referrer || null,
      }),
    }).catch(console.error)

    // 목적지 URL에 sp_click 파라미터 추가
    const finalUrl = new URL(targetUrl)
    finalUrl.searchParams.set('sp_click', clickId)

    // 1.5초 후 이동
    setIsReady(true)
    const timer = setTimeout(() => {
      window.location.href = finalUrl.toString()
    }, 1500)

    return () => clearTimeout(timer)
  }, [trackingLinkId, targetUrl])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
      {/* 애니메이션 컨테이너 */}
      <div className="relative w-32 h-32 mb-8">
        {/* 외곽 회전 원 */}
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 border-r-purple-500 animate-spin" />

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
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>

      {/* 진행 바 */}
      <div className="mt-8 w-64 h-1 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 rounded-full"
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
  )
}
