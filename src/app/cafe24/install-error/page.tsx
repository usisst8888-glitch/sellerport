'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function InstallErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
          {/* 에러 아이콘 */}
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            설치 실패
          </h1>

          <p className="text-slate-400 mb-6">
            앱 설치 중 문제가 발생했습니다.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-left">
              <h3 className="text-sm font-medium text-red-400 mb-1">오류 내용</h3>
              <p className="text-sm text-slate-300">{decodeURIComponent(error)}</p>
            </div>
          )}

          <div className="bg-slate-900/50 rounded-xl p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-slate-300 mb-3">해결 방법</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                카페24 앱스토어에서 다시 설치를 시도해주세요.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                문제가 지속되면 고객센터로 문의해주세요.
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <a
              href="https://store.cafe24.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              카페24 앱스토어로 돌아가기
            </a>

            <Link
              href="/"
              className="block w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
            >
              셀러포트 홈으로
            </Link>
          </div>
        </div>

        {/* 로고 */}
        <div className="text-center mt-6">
          <span className="text-slate-500 text-sm">Powered by</span>
          <Link href="/" className="block text-white font-bold text-lg mt-1">
            셀러포트
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function InstallErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    }>
      <InstallErrorContent />
    </Suspense>
  )
}
