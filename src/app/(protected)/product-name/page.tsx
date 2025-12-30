'use client'

import { useState } from 'react'

interface SearchResult {
  productName: string
  price?: number
  platform: 'naver' | 'coupang'
}

interface GeneratedName {
  name: string
  charCount: number
}

export default function ProductNamePage() {
  const [platform, setPlatform] = useState<'naver' | 'coupang'>('naver')
  const [keyword, setKeyword] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [generatedNames, setGeneratedNames] = useState<GeneratedName[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 상품 검색
  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('키워드를 입력해주세요')
      return
    }

    setError(null)
    setIsSearching(true)
    setSearchResults([])
    setGeneratedNames([])

    try {
      const response = await fetch('/api/product-name/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, keyword: keyword.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '검색 중 오류가 발생했습니다')
      }

      setSearchResults(data.data.products || [])

      if (data.data.products.length === 0) {
        setError('검색 결과가 없습니다. 다른 키워드로 시도해주세요.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다')
    } finally {
      setIsSearching(false)
    }
  }

  // 상품명 생성
  const handleGenerate = async () => {
    if (searchResults.length === 0) {
      setError('먼저 상품을 검색해주세요')
      return
    }

    setError(null)
    setIsGenerating(true)

    try {
      const productNames = searchResults.map(r => r.productName)

      const response = await fetch('/api/product-name/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          keyword: keyword.trim(),
          productNames,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '상품명 생성 중 오류가 발생했습니다')
      }

      setGeneratedNames(data.data.generatedNames || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '상품명 생성 중 오류가 발생했습니다')
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
            네이버/쿠팡 베스트셀러 분석으로 SEO 최적화된 상품명을 자동 생성합니다
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
                  onClick={() => setPlatform('coupang')}
                  className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="예: 에어팟 케이스, 텀블러, 가습기 등"
                  className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium rounded-xl transition-all flex items-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      검색 중...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      검색
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                검색된 상품 ({searchResults.length}개)
              </h2>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-purple-600/25"
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
                    AI 상품명 생성
                  </>
                )}
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
              {searchResults.map((result, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-700/30 rounded-lg border border-white/5"
                >
                  <p className="text-sm text-slate-300 line-clamp-1">
                    {result.productName}
                  </p>
                  {result.price && (
                    <p className="text-xs text-slate-500 mt-1">
                      {result.price.toLocaleString()}원
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 생성된 상품명 */}
        {generatedNames.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
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
                        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold text-white">
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
        {searchResults.length === 0 && !isSearching && (
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
              플랫폼을 선택하고 키워드를 입력하면<br />
              경쟁 상품을 분석하여 SEO 최적화된 상품명을 추천해드립니다
            </p>
          </div>
        )}
    </div>
  )
}
