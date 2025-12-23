'use client'

/**
 * 스토어별 영상번호 검색 페이지
 * /v/tripjoy 형식으로 접근
 * 시청자가 쇼츠에서 본 영상번호를 입력하여 상품 페이지로 이동
 */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function StoreVideoCodeSearchPage() {
  const params = useParams()
  const slug = params.slug as string
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [storeValid, setStoreValid] = useState<boolean | null>(null)
  const [storeName, setStoreName] = useState<string>('')
  const router = useRouter()

  // 스토어 유효성 확인
  useEffect(() => {
    const checkStore = async () => {
      try {
        const response = await fetch(`/api/youtube/video-codes/store/${slug}`)
        const result = await response.json()
        if (result.success) {
          setStoreValid(true)
          setStoreName(result.storeName || slug)
        } else {
          setStoreValid(false)
        }
      } catch {
        setStoreValid(false)
      }
    }
    checkStore()
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const normalizedCode = code.toUpperCase().trim()

    // 형식 검증
    const codePattern = /^[A-Z]\d{3}$/
    if (!codePattern.test(normalizedCode)) {
      setError('영상번호는 A001~Z999 형식입니다')
      return
    }

    setLoading(true)

    // 영상번호 페이지로 이동 (서버에서 리다이렉트 처리)
    router.push(`/v/${slug}/${normalizedCode}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    // 영문자 + 숫자 4자리까지만 허용
    if (/^[A-Z]?\d{0,3}$/.test(value) || value === '') {
      setCode(value)
      setError('')
    }
  }

  // 스토어 확인 중
  if (storeValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        <p className="mt-4 text-slate-400">로딩 중...</p>
      </div>
    )
  }

  // 존재하지 않는 스토어
  if (storeValid === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700 flex items-center justify-center">
          <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">존재하지 않는 페이지</h1>
        <p className="text-slate-400 text-sm">주소를 다시 확인해주세요</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* 로고 */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500 flex items-center justify-center">
          <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">영상번호 검색</h1>
        <p className="text-slate-400 text-sm">
          <span className="text-red-400 font-medium">{storeName}</span> 쇼츠에서 안내받은 영상번호를 입력하세요
        </p>
      </div>

      {/* 검색 폼 */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <div className="relative">
          <input
            type="text"
            value={code}
            onChange={handleInputChange}
            placeholder="A001"
            maxLength={4}
            autoFocus
            className="w-full h-16 px-6 rounded-2xl bg-slate-800 border-2 border-slate-700 text-white text-center font-mono text-3xl placeholder:text-slate-600 focus:border-red-500 focus:outline-none transition-colors"
          />
        </div>

        {error && (
          <p className="mt-3 text-center text-red-400 text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={code.length < 4 || loading}
          className="w-full h-14 mt-4 rounded-2xl bg-red-500 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              이동 중...
            </>
          ) : (
            <>
              상품 보러가기
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </form>

      {/* 안내 */}
      <div className="mt-12 text-center">
        <p className="text-slate-500 text-xs">
          영상에서 &quot;A001&quot; 같은 번호를 찾아 입력해주세요
        </p>
      </div>

      {/* 푸터 */}
      <div className="absolute bottom-4 text-center">
        <p className="text-slate-600 text-xs">
          Powered by SellerPort
        </p>
      </div>
    </div>
  )
}
