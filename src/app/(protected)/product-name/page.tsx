'use client'

import { useState } from 'react'

interface GeneratedName {
  name: string
  charCount: number
}

export default function ProductNamePage() {
  const [platform, setPlatform] = useState<'naver' | 'coupang'>('naver')
  const [keyword, setKeyword] = useState('')
  const [description, setDescription] = useState('')
  const [showDescription, setShowDescription] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // AI 상품명 생성 (백그라운드에서 검색 + 생성)
  const handleGenerate = async () => {
    if (!keyword.trim()) {
      setError('키워드를 입력해주세요')
      return
    }

    if (platform === 'coupang') {
      setError('쿠팡은 현재 준비중입니다. 네이버를 이용해주세요.')
      return
    }

    setError(null)
    setIsGenerating(true)
    setGeneratedNames([])

    try {
      // 1. 백그라운드에서 상품 검색
      const searchResponse = await fetch('/api/product-name/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, keyword: keyword.trim() }),
      })

      const searchData = await searchResponse.json()

      if (!searchResponse.ok) {
        throw new Error(searchData.error || '상품 검색 중 오류가 발생했습니다')
      }

      const products = searchData.data.products || []

      if (products.length === 0) {
        throw new Error('검색 결과가 없습니다. 다른 키워드로 시도해주세요.')
      }

      // 2. 검색된 상품으로 AI 상품명 생성
      const productNames = products.map((r: { productName: string }) => r.productName)

      const generateResponse = await fetch('/api/product-name/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          keyword: keyword.trim(),
          description: description.trim() || undefined,
          productNames,
        }),
      })

      const generateData = await generateResponse.json()

      if (!generateResponse.ok) {
        throw new Error(generateData.error || '상품명 생성 중 오류가 발생했습니다')
      }

      setGeneratedNames(generateData.data.generatedNames || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
  }

  // 복사 기능
  const handleCopy = async (name: string, index: number) => {
    try {
      await navigator.clipboard.writeText(name)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  return (
    <div className="space-y-6">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            AI 상품명 생성기
          </h1>
          <p className="text-slate-400 text-sm">
            네이버 베스트셀러 분석으로 SEO 최적화된 상품명을 자동 생성합니다
          </p>
        </div>

        {/* 플랫폼 선택 & 키워드 입력 */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 플랫폼 선택 */}
            <div className="flex-shrink-0">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                플랫폼 선택
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPlatform('naver')}
                  className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    platform === 'naver'
                      ? 'bg-green-600 text-white shadow-lg shadow-green-600/25'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.273 12.845L7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
                    </svg>
                    네이버
                  </span>
                </button>
                <button
                  onClick={() => {
                    setPlatform('coupang')
                    setError('쿠팡은 현재 준비중입니다. 네이버를 이용해주세요.')
                  }}
                  className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all relative ${
                    platform === 'coupang'
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                    </svg>
                    쿠팡
                  </span>
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] bg-yellow-500 text-black font-bold rounded">
                    준비중
                  </span>
                </button>
              </div>
            </div>

            {/* 키워드 입력 */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                검색 키워드
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleGenerate()}
                  placeholder="예: 에어팟 케이스, 텀블러, 가습기 등"
                  className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || platform === 'coupang'}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-600/25"
                >
                  {isGenerating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      생성 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      AI 생성
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 제품 설명 입력 (선택사항) */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowDescription(!showDescription)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showDescription ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              제품 설명 추가 (선택사항)
            </button>

            {showDescription && (
              <div className="mt-3">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="제품의 특징, 재질, 용도 등을 간단히 설명해주세요. (예: 실리콘 재질, 충격 보호, 무선충전 지원)"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  제품 설명을 입력하면 더 정확한 상품명을 생성합니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* 생성된 상품명 */}
        {generatedNames.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-500 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">
                AI 추천 상품명
              </h2>
              <span className="ml-auto text-xs text-slate-400">
                100자 이내 SEO 최적화
              </span>
            </div>

            <div className="space-y-3">
              {generatedNames.map((item, index) => (
                <div
                  key={index}
                  className="group p-4 bg-slate-700/40 hover:bg-slate-700/60 rounded-xl border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <span className="text-xs text-slate-400">
                          {item.charCount}자
                        </span>
                      </div>
                      <p className="text-white leading-relaxed">{item.name}</p>
                    </div>
                    <button
                      onClick={() => handleCopy(item.name, index)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        copiedIndex === index
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600 hover:text-white'
                      }`}
                    >
                      {copiedIndex === index ? (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          복사됨
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          복사
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 참고 안내 */}
            <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <p className="text-xs text-blue-300">
                <strong>TIP:</strong> 생성된 상품명은 참고용입니다.
                실제 등록 시 플랫폼 정책을 확인하고 필요에 따라 수정해주세요.
              </p>
            </div>
          </div>
        )}

        {/* 초기 안내 */}
        {generatedNames.length === 0 && !isGenerating && (
          <div className="bg-slate-800/30 border border-dashed border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              상품명 생성을 시작하세요
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              키워드를 입력하고 AI 생성 버튼을 누르면<br />
              경쟁 상품을 분석하여 SEO 최적화된 상품명을 추천해드립니다
            </p>
          </div>
        )}

        {/* 생성 중 로딩 */}
        {isGenerating && (
          <div className="bg-slate-800/30 border border-white/10 rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-300 mb-2">
              AI가 상품명을 생성하고 있어요
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              경쟁 상품을 분석하고 최적의 상품명을 만들고 있습니다.<br />
              잠시만 기다려주세요...
            </p>
          </div>
        )}
    </div>
  )
}
