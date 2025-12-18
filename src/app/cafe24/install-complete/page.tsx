'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function InstallCompleteContent() {
  const searchParams = useSearchParams()
  const mallId = searchParams.get('mall_id')
  const storeName = searchParams.get('store_name')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center">
          {/* 성공 아이콘 */}
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">
            앱 설치 완료!
          </h1>

          <p className="text-slate-400 mb-6">
            <span className="text-green-400 font-medium">{storeName || mallId}</span> 쇼핑몰에
            <br />셀러포트가 성공적으로 설치되었습니다.
          </p>

          <div className="bg-slate-900/50 rounded-xl p-4 mb-6 text-left">
            <h3 className="text-sm font-medium text-slate-300 mb-3">다음 단계</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">1.</span>
                셀러포트 회원가입 또는 로그인
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">2.</span>
                내 사이트에서 카페24 쇼핑몰 연결
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">3.</span>
                추적 링크 생성 및 광고 전환 추적 시작
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href={`/signup?from=cafe24&mall_id=${mallId}`}
              className="block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              회원가입하고 시작하기
            </Link>

            <Link
              href={`/login?from=cafe24&mall_id=${mallId}`}
              className="block w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
            >
              이미 계정이 있어요
            </Link>
          </div>

          <p className="text-xs text-slate-500 mt-6">
            회원가입 후 자동으로 {storeName || mallId} 쇼핑몰과 연결됩니다.
          </p>
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

export default function InstallCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">로딩 중...</div>
      </div>
    }>
      <InstallCompleteContent />
    </Suspense>
  )
}
