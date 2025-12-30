'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ExternalLink, Play, ShoppingBag, Link as LinkIcon, Instagram, Youtube, MessageCircle, Search } from 'lucide-react'

interface SellerTreeLink {
  id: string
  title: string
  url: string
  description?: string
  thumbnail_url?: string
  icon?: string
  tracking_link_id?: string
  display_order: number
  is_active: boolean
}

interface SellerTree {
  id: string
  slug: string
  title?: string
  subtitle?: string
  profile_image_url?: string
  background_type: 'gradient' | 'color' | 'image' | 'solid'
  background_gradient?: string
  background_color?: string
  background_image_url?: string
  title_color: string
  subtitle_color: string
  button_color: string
  button_text_color: string
  button_text: string
  seller_tree_links: SellerTreeLink[]
  video_search_enabled?: boolean
  video_search_title?: string
  video_search_placeholder?: string
  video_search_button_text?: string
}

interface Props {
  sellerTree: SellerTree
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shopping: ShoppingBag,
  link: LinkIcon,
  instagram: Instagram,
  youtube: Youtube,
  kakao: MessageCircle,
  play: Play,
}

export default function SellerTreePublicPage({ sellerTree }: Props) {
  const [clickedLinks, setClickedLinks] = useState<Set<string>>(new Set())
  const [videoCode, setVideoCode] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchResult, setSearchResult] = useState<{
    found: boolean
    data?: {
      target_url: string
      title: string
      thumbnail_url?: string
      price?: number
    }
  } | null>(null)

  const handleLinkClick = async (link: SellerTreeLink) => {
    // 클릭 추적
    if (!clickedLinks.has(link.id)) {
      setClickedLinks(prev => new Set(prev).add(link.id))

      try {
        await fetch(`/api/seller-trees/${sellerTree.id}/links/${link.id}/click`, {
          method: 'POST',
        })
      } catch (error) {
        console.error('Failed to track click:', error)
      }
    }

    // 링크 열기
    window.open(link.url, '_blank', 'noopener,noreferrer')
  }

  const handleVideoSearch = async () => {
    if (!videoCode.trim()) return

    setSearching(true)
    setSearchError('')
    setSearchResult(null)

    try {
      const response = await fetch(`/api/seller-trees/${sellerTree.id}/video-search?code=${encodeURIComponent(videoCode.trim())}`)
      const data = await response.json()

      if (response.ok) {
        setSearchResult(data)
        if (data.found && data.data?.target_url) {
          // 자동으로 이동
          window.location.href = data.data.target_url
        } else if (!data.found) {
          setSearchError(data.message || '해당 영상번호를 찾을 수 없습니다')
        }
      } else {
        setSearchError(data.error || '검색 중 오류가 발생했습니다')
      }
    } catch {
      setSearchError('검색 중 오류가 발생했습니다')
    } finally {
      setSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVideoSearch()
    }
  }

  // 배경 스타일 계산
  const getBackgroundStyle = () => {
    switch (sellerTree.background_type) {
      case 'gradient':
        return {
          background: sellerTree.background_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }
      case 'color':
      case 'solid':
        return {
          backgroundColor: sellerTree.background_color || '#1a1a2e',
        }
      case 'image':
        return {
          backgroundImage: `url(${sellerTree.background_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      default:
        return {
          backgroundColor: sellerTree.background_color || '#1a1a2e',
        }
    }
  }

  const IconComponent = (iconName?: string) => {
    if (!iconName) return ExternalLink
    return iconMap[iconName] || ExternalLink
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center py-8 px-4"
      style={getBackgroundStyle()}
    >
      {/* 배경 이미지 오버레이 */}
      {sellerTree.background_type === 'image' && (
        <div className="fixed inset-0 bg-black/40 -z-10" />
      )}

      <div className="w-full max-w-md space-y-6">
        {/* 프로필 섹션 */}
        <div className="text-center space-y-3">
          {sellerTree.profile_image_url && (
            <div className="relative w-24 h-24 mx-auto">
              <Image
                src={sellerTree.profile_image_url}
                alt={sellerTree.title || '프로필'}
                fill
                className="rounded-full object-cover"
              />
            </div>
          )}

          {sellerTree.title && (
            <h1
              className="text-2xl font-bold"
              style={{ color: sellerTree.title_color }}
            >
              {sellerTree.title}
            </h1>
          )}

          {sellerTree.subtitle && (
            <p
              className="text-sm"
              style={{ color: sellerTree.subtitle_color }}
            >
              {sellerTree.subtitle}
            </p>
          )}
        </div>

        {/* 영상번호 검색 */}
        {sellerTree.video_search_enabled && (
          <div className="space-y-3">
            <p
              className="text-sm font-medium text-center"
              style={{ color: sellerTree.title_color }}
            >
              {sellerTree.video_search_title || '영상번호 검색'}
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={videoCode}
                onChange={(e) => {
                  setVideoCode(e.target.value.toUpperCase())
                  setSearchError('')
                }}
                onKeyPress={handleKeyPress}
                placeholder={sellerTree.video_search_placeholder || '영상번호를 입력하세요'}
                className="flex-1 px-4 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-center font-mono text-lg placeholder-white/50 focus:outline-none focus:border-white/60"
                style={{ color: sellerTree.title_color }}
                maxLength={10}
              />
              <button
                onClick={handleVideoSearch}
                disabled={searching || !videoCode.trim()}
                className="px-5 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 flex items-center gap-2"
                style={{
                  backgroundColor: sellerTree.button_color,
                  color: sellerTree.button_text_color,
                }}
              >
                {searching ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    {sellerTree.video_search_button_text || '검색'}
                  </>
                )}
              </button>
            </div>
            {searchError && (
              <p className="text-sm text-center text-red-400">
                {searchError}
              </p>
            )}
            {searchResult?.found && searchResult.data && (
              <div
                className="p-4 rounded-xl text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
              >
                <p style={{ color: sellerTree.title_color }}>
                  이동 중...
                </p>
              </div>
            )}
          </div>
        )}

        {/* 링크 목록 */}
        <div className="space-y-3">
          {sellerTree.seller_tree_links.map((link) => {
            const Icon = IconComponent(link.icon)

            return (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link)}
                className="w-full p-4 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg flex items-center gap-3 text-left"
                style={{
                  backgroundColor: sellerTree.button_color,
                  color: sellerTree.button_text_color,
                }}
              >
                {link.thumbnail_url ? (
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={link.thumbnail_url}
                      alt={link.title}
                      fill
                      className="rounded-lg object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{link.title}</div>
                  {link.description && (
                    <div className="text-xs opacity-70 truncate">{link.description}</div>
                  )}
                </div>

                <ExternalLink className="w-4 h-4 flex-shrink-0 opacity-50" />
              </button>
            )
          })}
        </div>

        {/* 링크가 없고 영상번호 검색도 없을 때 */}
        {sellerTree.seller_tree_links.length === 0 && !sellerTree.video_search_enabled && (
          <div
            className="text-center py-12 opacity-70"
            style={{ color: sellerTree.subtitle_color }}
          >
            <LinkIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>등록된 링크가 없습니다</p>
          </div>
        )}

        {/* 푸터 */}
        <div className="text-center pt-8">
          <a
            href="https://sellerport.co.kr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs opacity-50 hover:opacity-70 transition-opacity"
            style={{ color: sellerTree.subtitle_color }}
          >
            Powered by 셀러포트
          </a>
        </div>
      </div>
    </div>
  )
}
