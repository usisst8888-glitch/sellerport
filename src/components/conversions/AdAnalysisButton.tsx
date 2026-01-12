'use client'

import { useState } from 'react'
import { AdAnalysisModal } from './AdAnalysisModal'

interface AdAnalysisButtonProps {
  platform: 'instagram' | 'youtube' | 'meta'
  contentType: 'image' | 'carousel' | 'reels' | 'video'
  // Instagram / Meta
  imageUrls?: string[]
  videoUrl?: string
  // YouTube
  youtubeUrl?: string
  // Meta 캠페인 (크리에이티브 동적 로드용)
  metaChannelId?: string
  metaCampaignId?: string
  // 성과 지표
  metrics: {
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    revenue: number
    adSpend: number
    roas: number
  }
  // 추가 정보
  campaignName?: string
  postName?: string
  // 스타일
  className?: string
  size?: 'sm' | 'md'
}

export function AdAnalysisButton({
  platform,
  contentType,
  imageUrls,
  videoUrl,
  youtubeUrl,
  metaChannelId,
  metaCampaignId,
  metrics,
  campaignName,
  postName,
  className = '',
  size = 'sm',
}: AdAnalysisButtonProps) {
  const [showModal, setShowModal] = useState(false)

  const sizeClasses = size === 'sm'
    ? 'px-2 py-1 text-xs'
    : 'px-3 py-1.5 text-sm'

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`
          ${sizeClasses}
          bg-gradient-to-r from-purple-500/20 to-blue-500/20
          hover:from-purple-500/30 hover:to-blue-500/30
          border border-purple-500/30 hover:border-purple-500/50
          text-purple-300 hover:text-purple-200
          rounded-lg font-medium
          transition-all duration-200
          flex items-center gap-1.5
          ${className}
        `}
      >
        <svg
          className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}
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
        AI 분석
      </button>

      {showModal && (
        <AdAnalysisModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          platform={platform}
          contentType={contentType}
          imageUrls={imageUrls}
          videoUrl={videoUrl}
          youtubeUrl={youtubeUrl}
          metaChannelId={metaChannelId}
          metaCampaignId={metaCampaignId}
          metrics={metrics}
          campaignName={campaignName}
          postName={postName}
        />
      )}
    </>
  )
}
