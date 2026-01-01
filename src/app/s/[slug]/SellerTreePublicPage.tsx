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

interface Module {
  id: string
  type: 'divider' | 'text'
  content?: string
  color?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  style?: 'solid' | 'dashed' | 'dotted' | 'circle' | 'diamond'
  position: string
}

interface SellerTree {
  id: string
  slug: string
  title?: string
  subtitle?: string
  profile_image_url?: string
  show_profile_image?: boolean
  header_image_url?: string
  header_image_size?: 'small' | 'medium' | 'large'
  background_type: 'gradient' | 'color' | 'image' | 'solid'
  background_gradient?: string
  background_color?: string
  background_image_url?: string
  title_color: string
  subtitle_color: string
  button_color: string
  button_text_color: string
  button_text: string
  link_layout?: 'single' | 'double'
  link_style?: 'list' | 'card'
  seller_tree_links: SellerTreeLink[]
  video_search_enabled?: boolean
  video_search_title?: string
  video_search_placeholder?: string
  video_search_button_text?: string
  search_button_color?: string
  search_icon_color?: string
  search_title_color?: string
  search_placeholder_color?: string
  modules?: Module[]
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

  const modules = sellerTree.modules || []

  // 구분선 스타일 렌더링
  const renderDivider = (module: Module) => {
    const color = module.color || '#000000'
    const style = module.style || 'solid'

    switch (style) {
      case 'dashed':
        return (
          <div className="w-full flex justify-center py-3">
            <div className="w-[90%] h-[2px] opacity-70" style={{ borderTop: `2px dashed ${color}` }} />
          </div>
        )
      case 'dotted':
        return (
          <div className="w-full flex justify-center py-3">
            <div className="w-[90%] h-[2px] opacity-70" style={{ borderTop: `2px dotted ${color}` }} />
          </div>
        )
      case 'circle':
        return (
          <div className="w-full flex items-center justify-center py-3 gap-0">
            <div className="flex-1 max-w-[40%] h-[1px] opacity-60" style={{ backgroundColor: color }} />
            <div className="w-2 h-2 rounded-full mx-2 opacity-80" style={{ backgroundColor: color }} />
            <div className="flex-1 max-w-[40%] h-[1px] opacity-60" style={{ backgroundColor: color }} />
          </div>
        )
      case 'diamond':
        return (
          <div className="w-full flex items-center justify-center py-3 gap-0">
            <div className="flex-1 max-w-[40%] h-[1px] opacity-60" style={{ backgroundColor: color }} />
            <div className="w-2 h-2 rotate-45 mx-2 opacity-80" style={{ backgroundColor: color }} />
            <div className="flex-1 max-w-[40%] h-[1px] opacity-60" style={{ backgroundColor: color }} />
          </div>
        )
      default: // solid
        return (
          <div className="w-full flex justify-center py-3">
            <div className="w-[90%] h-[1px] rounded-full opacity-60" style={{ backgroundColor: color }} />
          </div>
        )
    }
  }

  const renderModulesByPosition = (position: string) => {
    return modules.filter(m => m.position === position).map(module => (
      module.type === 'divider' ? (
        <div key={module.id}>{renderDivider(module)}</div>
      ) : (
        <p
          key={module.id}
          className={`w-full text-center py-2 ${
            module.size === 'xs' ? 'text-xs' :
            module.size === 'sm' ? 'text-sm' :
            module.size === 'md' ? 'text-base' : 'text-lg'
          }`}
          style={{ color: module.color || '#FFFFFF' }}
        >
          {module.content}
        </p>
      )
    ))
  }

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

  // 헤더 이미지 높이 클래스
  const headerHeightClass = sellerTree.header_image_size === 'small' ? 'h-24' :
    sellerTree.header_image_size === 'large' ? 'h-48' : 'h-32'

  return (
    <div className="min-h-screen flex flex-col items-center justify-center md:py-8 md:px-4 md:bg-white">
      {/* 모바일: 전체화면 / 데스크톱: 카드 형태 */}
      <div
        className="w-full md:max-w-md md:rounded-3xl overflow-hidden md:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
      >
        <div
          className="min-h-screen md:min-h-[600px] flex flex-col"
          style={getBackgroundStyle()}
        >
          {/* 상단 헤더 이미지 */}
          {sellerTree.header_image_url && (
            <div className={`w-full ${headerHeightClass} flex-shrink-0 overflow-hidden`}>
              <Image
                src={sellerTree.header_image_url}
                alt="Header"
                width={400}
                height={200}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          )}

          {/* 배경 이미지 오버레이 */}
          {sellerTree.background_type === 'image' && (
            <div className="absolute inset-0 bg-black/40 rounded-3xl" />
          )}

          <div className={`relative z-10 flex-1 space-y-6 p-6 ${sellerTree.header_image_url ? 'rounded-t-3xl -mt-4' : ''}`} style={sellerTree.header_image_url ? getBackgroundStyle() : undefined}>
            {/* 프로필 섹션 */}
            <div className="text-center space-y-3">
              {sellerTree.show_profile_image !== false && sellerTree.profile_image_url && (
                <div className="relative w-24 h-24 mx-auto">
                  <Image
                    src={sellerTree.profile_image_url}
                    alt={sellerTree.title || '프로필'}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
              )}

              {/* after-profile 위치 모듈 */}
              {renderModulesByPosition('after-profile')}

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

              {/* after-subtitle 위치 모듈 */}
              {renderModulesByPosition('after-subtitle')}
            </div>

            {/* 영상번호 검색 */}
            {sellerTree.video_search_enabled && (
              <div className="space-y-3">
                <p
                  className="text-sm font-medium text-center"
                  style={{ color: sellerTree.search_title_color || sellerTree.title_color }}
                >
                  {sellerTree.video_search_title || '영상번호 검색'}
                </p>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={videoCode}
                      onChange={(e) => {
                        setVideoCode(e.target.value.toUpperCase())
                        setSearchError('')
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder=""
                      className="w-full px-4 py-3 rounded-xl bg-white text-slate-800 text-center font-mono text-lg focus:outline-none transition-all"
                      style={{
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                      maxLength={10}
                    />
                    {!videoCode && (
                      <span
                        className="absolute inset-0 flex items-center justify-center font-mono text-lg pointer-events-none"
                        style={{ color: sellerTree.search_placeholder_color || '#94A3B8' }}
                      >
                        {sellerTree.video_search_placeholder || '영상번호를 입력하세요'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleVideoSearch}
                    disabled={searching || !videoCode.trim()}
                    className="w-14 h-14 rounded-xl font-medium transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: sellerTree.search_button_color || '#2563EB' }}
                  >
                    {searching ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" style={{ color: sellerTree.search_icon_color || '#FFFFFF' }} />
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

            {/* after-search 위치 모듈 */}
            {renderModulesByPosition('after-search')}

            {/* before-links 위치 모듈 */}
            {renderModulesByPosition('before-links')}

            {/* 링크 목록 */}
            <div className={`${
              sellerTree.link_layout === 'double' ? 'grid grid-cols-2 gap-3' : 'space-y-3'
            }`}>
              {sellerTree.seller_tree_links.map((link) => {
                const Icon = IconComponent(link.icon)
                const isCard = sellerTree.link_style === 'card'

                return (
                  <button
                    key={link.id}
                    onClick={() => handleLinkClick(link)}
                    className={`w-full rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg text-left overflow-hidden ${
                      isCard ? 'flex flex-col' : 'p-4 flex items-center gap-3'
                    }`}
                    style={{
                      backgroundColor: sellerTree.button_color,
                      color: sellerTree.button_text_color,
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    {link.thumbnail_url ? (
                      <div className={`relative flex-shrink-0 ${
                        isCard ? 'w-full aspect-square' : 'w-12 h-12'
                      }`}>
                        <Image
                          src={link.thumbnail_url}
                          alt={link.title}
                          fill
                          className={`object-cover ${isCard ? '' : 'rounded-lg'}`}
                        />
                      </div>
                    ) : (
                      <div
                        className={`flex-shrink-0 flex items-center justify-center ${
                          isCard ? 'w-full aspect-square' : 'w-12 h-12 rounded-lg'
                        }`}
                        style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <Icon className={isCard ? 'w-8 h-8' : 'w-5 h-5'} />
                      </div>
                    )}

                    <div className={`flex-1 min-w-0 overflow-hidden ${isCard ? 'p-3 text-center' : ''}`}>
                      <div
                        className={`font-medium ${isCard ? 'text-sm' : ''}`}
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {link.title}
                      </div>
                      {link.description && !isCard && (
                        <div
                          className="text-xs opacity-70"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {link.description}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* after-links 위치 모듈 */}
            {renderModulesByPosition('after-links')}

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
      </div>
    </div>
  )
}
