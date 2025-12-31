'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Module, SellerTreeLink } from './types'

interface PreviewSectionProps {
  // 기본 정보
  slug: string
  title: string
  subtitle: string
  profileImageUrl: string
  headerImageUrl: string
  showHeaderImage: boolean
  headerImageSize: 'small' | 'medium' | 'large'

  // 배경 설정
  backgroundType: 'solid' | 'gradient'
  backgroundColor: string
  gradientColor1: string
  gradientColor2: string
  gradientAngle: number

  // 색상 설정
  titleColor: string
  subtitleColor: string
  buttonColor: string
  buttonTextColor: string

  // 레이아웃 설정
  linkLayout: 'single' | 'double'
  linkStyle: 'list' | 'card'

  // 검색 설정
  videoSearchEnabled: boolean
  videoSearchTitle: string
  videoSearchPlaceholder: string
  searchButtonColor: string
  searchIconColor: string
  searchTitleColor: string
  searchPlaceholderColor: string

  // 데이터
  links: SellerTreeLink[]
  modules: Module[]
  elementOrder: string[]

  // 드래그 상태
  draggedElement: string | null
  dragOverElement: string | null
  setDraggedElement: (id: string | null) => void
  setDragOverElement: (id: string | null) => void
  moveElement: (fromId: string, toId: string) => void
}

export default function PreviewSection({
  slug,
  title,
  subtitle,
  profileImageUrl,
  headerImageUrl,
  showHeaderImage,
  headerImageSize,
  backgroundType,
  backgroundColor,
  gradientColor1,
  gradientColor2,
  gradientAngle,
  titleColor,
  subtitleColor,
  buttonColor,
  buttonTextColor,
  linkLayout,
  linkStyle,
  videoSearchEnabled,
  videoSearchTitle,
  videoSearchPlaceholder,
  searchButtonColor,
  searchIconColor,
  searchTitleColor,
  searchPlaceholderColor,
  links,
  modules,
  elementOrder,
  draggedElement,
  dragOverElement,
  setDraggedElement,
  setDragOverElement,
  moveElement,
}: PreviewSectionProps) {
  // 헤더 이미지 높이 클래스
  const headerHeightClass = headerImageSize === 'small' ? 'h-16' :
    headerImageSize === 'large' ? 'h-32' : 'h-24'

  // 구분선 렌더링
  const renderDivider = (module: Module) => {
    const color = module.color || '#000000'
    const style = module.style || 'solid'

    switch (style) {
      case 'dashed':
        return (
          <div className="w-full flex justify-center py-2">
            <div className="w-[90%] h-[2px] opacity-70" style={{ borderTop: `2px dashed ${color}` }} />
          </div>
        )
      case 'dotted':
        return (
          <div className="w-full flex justify-center py-2">
            <div className="w-[90%] h-[2px] opacity-70" style={{ borderTop: `2px dotted ${color}` }} />
          </div>
        )
      case 'circle':
        return (
          <div className="w-full flex items-center justify-center py-2 gap-0">
            <div className="flex-1 max-w-[40%] h-[1px] opacity-60" style={{ backgroundColor: color }} />
            <div className="w-2 h-2 rounded-full mx-2 opacity-80" style={{ backgroundColor: color }} />
            <div className="flex-1 max-w-[40%] h-[1px] opacity-60" style={{ backgroundColor: color }} />
          </div>
        )
      case 'diamond':
        return (
          <div className="w-full flex items-center justify-center py-2 gap-0">
            <div className="flex-1 max-w-[40%] h-[1px] opacity-60" style={{ backgroundColor: color }} />
            <div className="w-2 h-2 rotate-45 mx-2 opacity-80" style={{ backgroundColor: color }} />
            <div className="flex-1 max-w-[40%] h-[1px] opacity-60" style={{ backgroundColor: color }} />
          </div>
        )
      default:
        return (
          <div className="w-full flex justify-center py-2">
            <div className="w-[90%] h-[1px] rounded-full opacity-60" style={{ backgroundColor: color }} />
          </div>
        )
    }
  }

  // 위치별 모듈 렌더링
  const renderModules = (position: string) => {
    const positionModules = modules.filter(m => m.position === position)
    if (positionModules.length === 0) return null

    return (
      <div>
        {positionModules.map((module) => (
          <div key={module.id}>
            {module.type === 'divider' ? renderDivider(module) : (
              <p
                className={`w-full text-center py-2 ${
                  module.size === 'xs' ? 'text-xs' :
                  module.size === 'sm' ? 'text-sm' :
                  module.size === 'md' ? 'text-base' : 'text-lg'
                }`}
                style={{ color: module.color || '#FFFFFF' }}
              >
                {module.content}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  // 드래그 가능한 요소 래퍼
  const DraggableElement = ({ id, children }: { id: string; children: React.ReactNode }) => {
    const isDragging = draggedElement === id
    const isDragOver = dragOverElement === id

    const draggedIndex = draggedElement ? elementOrder.indexOf(draggedElement) : -1
    const currentIndex = elementOrder.indexOf(id)
    const isMovingDown = draggedIndex < currentIndex

    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault()
      setDraggedElement(id)
    }

    const handleMouseUp = () => {
      if (draggedElement && dragOverElement && draggedElement !== dragOverElement) {
        moveElement(draggedElement, dragOverElement)
      }
      setDraggedElement(null)
      setDragOverElement(null)
    }

    const handleMouseEnter = () => {
      if (draggedElement && draggedElement !== id) {
        setDragOverElement(id)
      }
    }

    const handleMouseLeave = () => {
      if (dragOverElement === id) {
        setDragOverElement(null)
      }
    }

    return (
      <div
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="relative group select-none"
        style={{
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isDragging ? 'scale(1.02)' : isDragOver ? (isMovingDown ? 'translateY(-4px)' : 'translateY(4px)') : 'none',
          opacity: isDragging ? 0.7 : 1,
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: isDragging ? 100 : 1,
        }}
      >
        <div
          className="absolute -left-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ zIndex: 10 }}
        >
          <svg className="w-3 h-3 text-white/50" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6-12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm0 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/>
          </svg>
        </div>

        {isDragOver && (
          <div
            className={`absolute left-2 right-2 h-1 bg-blue-500 rounded-full ${
              isMovingDown ? '-bottom-1.5' : '-top-1.5'
            }`}
            style={{
              boxShadow: '0 0 10px 2px rgba(59, 130, 246, 0.7)',
              zIndex: 50,
              animation: 'pulse 1s ease-in-out infinite'
            }}
          />
        )}

        <div className={`relative rounded-xl transition-all duration-200 ${
          isDragging ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent bg-blue-500/10' : ''
        } ${isDragOver ? 'bg-blue-500/5' : ''}`}>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="lg:sticky lg:top-6 self-start">
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 text-center">미리보기</h2>

        {/* 모바일 형태 프레임 */}
        <div className="flex justify-center">
          <div className="w-[360px] h-[700px] rounded-[2.5rem] border-4 border-slate-600 overflow-hidden bg-black p-2 shadow-none">
            <div
              className="w-full h-full rounded-[2rem] overflow-hidden flex flex-col"
              style={{
                background: backgroundType === 'gradient'
                  ? `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`
                  : backgroundColor
              }}
            >
              {/* 상단 이미지 */}
              {showHeaderImage && (
                headerImageUrl ? (
                  <div className={`w-full ${headerHeightClass} flex-shrink-0 overflow-hidden rounded-t-[2rem] bg-slate-700`}>
                    <Image
                      src={headerImageUrl}
                      alt="Header"
                      width={320}
                      height={160}
                      className="w-full h-full object-cover"
                      loading="eager"
                      priority
                    />
                  </div>
                ) : (
                  <div className={`w-full ${headerHeightClass} flex-shrink-0 bg-white/20 border-b-2 border-dashed border-white/30 flex items-center justify-center rounded-t-[2rem]`}>
                    <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )
              )}

              {/* 컨텐츠 영역 */}
              <div
                className={`flex-1 ${showHeaderImage ? 'rounded-t-3xl -mt-4' : ''} relative p-4 overflow-y-scroll`}
                style={{
                  background: backgroundType === 'gradient'
                    ? `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})`
                    : backgroundColor
                }}
              >
                {/* 요소들을 elementOrder 순서대로 렌더링 */}
                {elementOrder.map((elementId) => {
                  switch (elementId) {
                    case 'header':
                      return (
                        <DraggableElement key={elementId} id={elementId}>
                          <div className="text-center mb-3">
                            {profileImageUrl && (
                              <div className="mb-2">
                                <div className="flex justify-center">
                                  <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-700">
                                    <Image
                                      src={profileImageUrl}
                                      alt="Profile"
                                      width={64}
                                      height={64}
                                      className="w-full h-full object-cover"
                                      loading="eager"
                                      priority
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                            <h3 className="text-xl font-bold mb-1" style={{ color: titleColor }}>
                              {title || slug}
                            </h3>
                            <p className="text-xs" style={{ color: subtitleColor }}>
                              {subtitle || '설명을 입력하세요'}
                            </p>
                          </div>
                        </DraggableElement>
                      )

                    case 'search':
                      return videoSearchEnabled ? (
                        <DraggableElement key={elementId} id={elementId}>
                          <div className="w-full mb-4 space-y-2">
                            <p className="text-xs font-medium text-center" style={{ color: searchTitleColor }}>
                              {videoSearchTitle}
                            </p>
                            <div className="flex gap-2">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  className="w-full px-4 py-3 rounded-xl bg-white text-slate-800 text-center font-mono text-sm transition-all"
                                  style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                                  disabled
                                />
                                <span
                                  className="absolute inset-0 flex items-center justify-center text-sm font-mono pointer-events-none"
                                  style={{ color: searchPlaceholderColor }}
                                >
                                  {videoSearchPlaceholder}
                                </span>
                              </div>
                              <button
                                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                                style={{ backgroundColor: searchButtonColor }}
                              >
                                <svg className="w-5 h-5" style={{ color: searchIconColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </DraggableElement>
                      ) : null

                    case 'links':
                      return (
                        <DraggableElement key={elementId} id={elementId}>
                          <div className={`w-full py-3 ${
                            linkLayout === 'double' ? 'grid grid-cols-2 gap-2' : 'space-y-2'
                          }`}>
                            {links.filter(l => l.is_active).map((link) => (
                              <div
                                key={link.id}
                                className={`rounded-xl overflow-hidden transition-all ${
                                  linkStyle === 'card' ? 'flex flex-col' : 'flex items-center gap-2.5 p-2.5'
                                }`}
                                style={{ backgroundColor: buttonColor, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
                              >
                                {link.thumbnail_url ? (
                                  <div className={`flex-shrink-0 ${
                                    linkStyle === 'card' ? 'w-full aspect-square' : 'w-10 h-10 rounded-lg overflow-hidden'
                                  }`}>
                                    <Image
                                      src={link.thumbnail_url}
                                      alt={link.title}
                                      width={linkStyle === 'card' ? 120 : 40}
                                      height={linkStyle === 'card' ? 120 : 40}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className={`flex items-center justify-center flex-shrink-0 ${
                                      linkStyle === 'card' ? 'w-full aspect-square' : 'w-10 h-10 rounded-lg'
                                    }`}
                                    style={{ backgroundColor: `${buttonTextColor}15` }}
                                  >
                                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: buttonTextColor }}>
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                  </div>
                                )}
                                <div className={`flex-1 min-w-0 overflow-hidden ${linkStyle === 'card' ? 'p-2' : ''}`}>
                                  <span
                                    className={`font-medium leading-snug overflow-hidden ${
                                      linkStyle === 'card'
                                        ? 'text-[10px] block text-center line-clamp-2'
                                        : 'text-xs block'
                                    }`}
                                    style={{
                                      color: buttonTextColor,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    {link.title}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {links.length === 0 && !videoSearchEnabled && (
                              <div className="text-center py-6 text-xs opacity-60" style={{ color: subtitleColor }}>
                                링크를 추가해주세요
                              </div>
                            )}
                          </div>
                        </DraggableElement>
                      )

                    default:
                      if (elementId.startsWith('module-')) {
                        const moduleId = elementId.replace('module-', '')
                        const module = modules.find(m => m.id === moduleId)
                        if (!module) return null

                        return (
                          <DraggableElement key={elementId} id={elementId}>
                            <div className="py-1">
                              {module.type === 'divider' ? renderDivider(module) : (
                                <p
                                  className={`w-full text-center py-2 ${
                                    module.size === 'xs' ? 'text-xs' :
                                    module.size === 'sm' ? 'text-sm' :
                                    module.size === 'md' ? 'text-base' : 'text-lg'
                                  }`}
                                  style={{ color: module.color || '#FFFFFF' }}
                                >
                                  {module.content}
                                </p>
                              )}
                            </div>
                          </DraggableElement>
                        )
                      }
                      return null
                  }
                })}

                {/* after-links 모듈 */}
                {renderModules('after-links')}

                {/* 푸터 */}
                <div className="mt-4 text-center">
                  <span className="text-[10px] opacity-40" style={{ color: subtitleColor }}>
                    Powered by 셀러포트
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 드래그 앤 드롭 안내 */}
        <div className="mt-3 flex items-center justify-center gap-2 text-slate-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span className="text-xs">각 요소를 드래그하여 순서를 변경할 수 있습니다</span>
        </div>
      </div>
    </div>
  )
}
