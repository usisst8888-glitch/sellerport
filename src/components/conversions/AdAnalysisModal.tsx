'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'

interface AdAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  platform: 'instagram' | 'meta'
  contentType: 'image' | 'carousel' | 'reels'
  imageUrls?: string[]
  videoUrl?: string
  // Meta 캠페인 (크리에이티브 동적 로드용)
  metaChannelId?: string
  metaCampaignId?: string
  metrics: {
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    revenue: number
    adSpend: number
    roas: number
  }
  campaignName?: string
  postName?: string
}

interface MetaCreative {
  adId: string
  adName: string
  creativeId: string
  type: 'image' | 'reels' | 'carousel'
  imageUrls: string[]
  videoUrl: string | null
  thumbnailUrl: string | null
}

export function AdAnalysisModal({
  isOpen,
  onClose,
  platform,
  contentType: initialContentType,
  imageUrls: initialImageUrls,
  videoUrl: initialVideoUrl,
  metaChannelId,
  metaCampaignId,
  metrics,
  campaignName,
  postName,
}: AdAnalysisModalProps) {
  const [loading, setLoading] = useState(false)
  const [loadingCreative, setLoadingCreative] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 동적으로 로드된 크리에이티브 정보
  const [contentType, setContentType] = useState(initialContentType)
  const [imageUrls, setImageUrls] = useState(initialImageUrls)
  const [videoUrl, setVideoUrl] = useState(initialVideoUrl)
  const [selectedCreative, setSelectedCreative] = useState<MetaCreative | null>(null)
  const [availableCreatives, setAvailableCreatives] = useState<MetaCreative[]>([])

  // 모달 열릴 때 Meta 크리에이티브 로드 또는 분석 시작
  useEffect(() => {
    if (isOpen && !analysis && !loading && !loadingCreative) {
      if (platform === 'meta' && metaChannelId && metaCampaignId && !initialImageUrls?.length && !initialVideoUrl) {
        // Meta 캠페인이고 크리에이티브 정보가 없으면 먼저 로드
        loadMetaCreatives()
      } else {
        // 크리에이티브 정보가 있으면 바로 분석
        runAnalysis()
      }
    }
  }, [isOpen])

  // Meta 캠페인의 크리에이티브 로드
  const loadMetaCreatives = async () => {
    setLoadingCreative(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/ad-channels/meta/creative?channelId=${metaChannelId}&campaignId=${metaCampaignId}`
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '크리에이티브를 가져오는데 실패했습니다.')
      }

      if (data.creatives && data.creatives.length > 0) {
        setAvailableCreatives(data.creatives)
        // 첫 번째 크리에이티브 선택
        const first = data.creatives[0]
        selectCreative(first)
      } else {
        // 크리에이티브가 없으면 성과 데이터만으로 분석
        runAnalysis()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '크리에이티브 로드 중 오류가 발생했습니다.')
    } finally {
      setLoadingCreative(false)
    }
  }

  // 크리에이티브 선택
  const selectCreative = (creative: MetaCreative) => {
    setSelectedCreative(creative)
    setContentType(creative.type)
    if (creative.type === 'reels' && creative.videoUrl) {
      setVideoUrl(creative.videoUrl)
      setImageUrls(undefined)
    } else {
      setImageUrls(creative.imageUrls.length > 0 ? creative.imageUrls : undefined)
      setVideoUrl(undefined)
    }
    // 선택 후 분석 시작
    setAnalysis(null)
    runAnalysisWithCreative(creative)
  }

  // 크리에이티브로 분석 실행
  const runAnalysisWithCreative = async (creative: MetaCreative) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ads/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          contentType: creative.type,
          imageUrls: creative.type !== 'reels' ? creative.imageUrls : undefined,
          videoUrl: creative.type === 'reels' ? creative.videoUrl : undefined,
          metrics,
          campaignName,
          postName: creative.adName || postName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '분석 중 오류가 발생했습니다.')
      }

      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ads/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          contentType,
          imageUrls,
          videoUrl,
          metrics,
          campaignName,
          postName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '분석 중 오류가 발생했습니다.')
      }

      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const platformLabel = platform === 'instagram' ? '인스타그램' : 'Meta 광고'
  const contentTypeLabel =
    contentType === 'carousel' ? '캐러셀' :
    contentType === 'reels' ? '릴스' : '피드'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-[#1a1a2e] border border-gray-700/50 rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500/20 to-blue-500/20 rounded-lg">
              <svg
                className="w-5 h-5 text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white text-left">AI 광고 분석</h2>
              <p className="text-sm text-gray-400">
                {platformLabel} {contentTypeLabel}
                {campaignName && ` · ${campaignName}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 크리에이티브 선택 (여러 개 있을 때) */}
        {availableCreatives.length > 1 && (
          <div className="px-6 py-3 bg-gray-800/50 border-b border-gray-700/30">
            <p className="text-xs text-gray-500 mb-2">광고 소재 선택</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {availableCreatives.map((creative) => (
                <button
                  key={creative.adId}
                  onClick={() => selectCreative(creative)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    selectedCreative?.adId === creative.adId
                      ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                      : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  {creative.adName || `광고 ${creative.adId.slice(-4)}`}
                  <span className="ml-1 opacity-60">({creative.type})</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 성과 요약 */}
        <div className="px-6 py-3 bg-gray-800/30 border-b border-gray-700/30">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">노출</span>
              <span className="text-white font-medium">{metrics.impressions.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">클릭</span>
              <span className="text-white font-medium">{metrics.clicks.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">CTR</span>
              <span className={`font-medium ${
                metrics.ctr >= 2 ? 'text-emerald-400' :
                metrics.ctr >= 1 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {metrics.ctr.toFixed(2)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">전환</span>
              <span className="text-white font-medium">{metrics.conversions}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">ROAS</span>
              <span className={`font-medium ${
                metrics.roas >= 300 ? 'text-emerald-400' :
                metrics.roas >= 150 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {metrics.roas.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* 분석 결과 */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(85vh-200px)]">
          {(loading || loadingCreative) && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/20 rounded-full" />
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="mt-4 text-gray-400">
                {loadingCreative ? '광고 소재를 가져오는 중...' : 'AI가 광고를 분석하고 있습니다...'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {loadingCreative ? 'Meta API에서 크리에이티브 로드 중' :
                  contentType === 'reels' ? '영상 프레임 추출 중...' : '이미지 분석 중...'}
              </p>
            </div>
          )}

          {error && !loading && !loadingCreative && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-red-500/10 rounded-full">
                <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="mt-4 text-red-400 font-medium">분석 실패</p>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <button
                onClick={() => selectedCreative ? runAnalysisWithCreative(selectedCreative) : runAnalysis()}
                className="mt-4 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {analysis && !loading && !loadingCreative && (
            <div className="space-y-4">
              {/* 분석한 이미지 미리보기 */}
              {imageUrls && imageUrls.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">분석한 광고 소재</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {imageUrls.map((url, idx) => (
                      <img
                        key={idx}
                        src={url}
                        alt={`광고 이미지 ${idx + 1}`}
                        className="w-24 h-24 object-cover rounded-lg border border-gray-700/50 flex-shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 분석 결과 */}
              <div className="prose prose-invert prose-sm max-w-none text-center">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-6 mb-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-lg font-semibold text-white mt-5 mb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-base font-medium text-blue-300 mt-4 mb-2">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-sm font-medium text-white mt-3 mb-1.5">{children}</h4>,
                    p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-3">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 space-y-1 mb-3">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside text-gray-300 space-y-1 mb-3">{children}</ol>,
                    li: ({ children }) => <li className="text-gray-300">{children}</li>,
                    strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="text-blue-300">{children}</em>,
                    code: ({ children }) => (
                      <code className="bg-gray-800 text-blue-300 px-1.5 py-0.5 rounded text-sm">{children}</code>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 py-1 bg-blue-500/5 rounded-r-lg my-3">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {analysis}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        {analysis && !loading && !loadingCreative && (
          <div className="px-6 py-3 border-t border-gray-700/50 flex justify-end gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(analysis)
              }}
              className="px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              복사
            </button>
            <button
              onClick={() => selectedCreative ? runAnalysisWithCreative(selectedCreative) : runAnalysis()}
              className="px-3 py-1.5 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              다시 분석
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
