'use client'

/**
 * 틱톡 스토어별 영상번호 검색 페이지
 * /tt/tiktok-store 형식으로 접근
 * 시청자가 틱톡에서 본 영상번호를 입력하여 상품 페이지로 이동
 */

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

interface QuickLink {
  id: string
  type: 'product' | 'custom'
  title: string
  url: string
  imageUrl?: string
}

interface StoreCustomization {
  background_type: 'gradient' | 'solid' | 'image'
  background_gradient: string
  background_color?: string
  background_image_url?: string
  header_image_url?: string
  header_image_size: 'small' | 'medium' | 'large'
  title_text?: string
  subtitle_text?: string
  button_gradient: string
  button_text?: string
  bg_color_hex?: string
  button_color_hex?: string
  title_color_hex?: string
  subtitle_color_hex?: string
  button_text_color_hex?: string
  input_bg_color_hex?: string
  input_text_color_hex?: string
  input_border_color_hex?: string
  input_show_border?: boolean
  quick_links?: QuickLink[]
  quick_link_bg_color_hex?: string
  quick_link_text_color_hex?: string
  quick_link_layout?: 'single' | 'double'
  // 비즈니스 제안 관련
  show_business_contact?: boolean
  business_contact_text?: string
  business_contact_url?: string
  business_contact_bg_color_hex?: string
  business_contact_text_color_hex?: string
}

export default function TiktokStoreVideoCodeSearchPage() {
  const params = useParams()
  const slug = params.slug as string
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [storeValid, setStoreValid] = useState<boolean | null>(null)
  const [storeName, setStoreName] = useState<string>('')
  const [customization, setCustomization] = useState<StoreCustomization | null>(null)
  const router = useRouter()

  // 스토어 유효성 확인 및 커스터마이징 로드
  useEffect(() => {
    const checkStore = async () => {
      try {
        const response = await fetch(`/api/tiktok/video-codes/store/${slug}`)
        const result = await response.json()
        if (result.success) {
          setStoreValid(true)
          setStoreName(result.storeName || slug)

          // 커스터마이징 로드
          try {
            const customRes = await fetch(`/api/store-customization?channel_type=tiktok&store_slug=${slug}`)
            const customResult = await customRes.json()
            console.log('Customization loaded:', customResult)
            if (customResult.success && customResult.data) {
              setCustomization(customResult.data)
            }
          } catch (err) {
            console.error('Customization load error:', err)
            // 커스터마이징 없으면 기본값 사용
          }
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
    router.push(`/tt/${slug}/${normalizedCode}`)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    // 영문자 + 숫자 4자리까지만 허용
    if (/^[A-Z]?\d{0,3}$/.test(value) || value === '') {
      setCode(value)
      setError('')
    }
  }

  // 기본값 (hex 색상)
  const bgColor = customization?.bg_color_hex || '#FECDD3'
  const buttonColor = customization?.button_color_hex || '#F43F5E'
  const titleColor = customization?.title_color_hex || '#1E293B'
  const subtitleColor = customization?.subtitle_color_hex || '#475569'
  const buttonTextColor = customization?.button_text_color_hex || '#FFFFFF'
  const headerSize = customization?.header_image_size || 'medium'
  const titleText = customization?.title_text || '영상번호 검색'
  const subtitleText = customization?.subtitle_text
  const inputBgColor = customization?.input_bg_color_hex || '#FFFFFF'
  const inputTextColor = customization?.input_text_color_hex || '#1E293B'
  const inputBorderColor = customization?.input_border_color_hex || '#E2E8F0'
  const inputShowBorder = customization?.input_show_border !== false
  const quickLinks = customization?.quick_links || []
  const quickLinkBgColor = customization?.quick_link_bg_color_hex || '#FFFFFF'
  const quickLinkTextColor = customization?.quick_link_text_color_hex || '#1E293B'
  const quickLinkLayout = customization?.quick_link_layout || 'single'

  // 상단 이미지 높이 클래스 (더 높게 조정)
  const headerHeightClass = headerSize === 'small' ? 'h-44' : headerSize === 'large' ? 'h-80' : 'h-60'

  // 스토어 확인 중
  if (storeValid === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
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
    <div className="min-h-screen bg-white flex items-start justify-center p-4 overflow-y-auto">
      {/* 모바일 프레임 컨테이너 */}
      <div
        className="w-full max-w-[430px] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: bgColor }}
      >
        {/* 상단 이미지 (배경 형태, 가로 전체, 높이 고정) */}
        {customization?.header_image_url ? (
          <div className={`w-full ${headerHeightClass} flex-shrink-0 overflow-hidden`}>
            <Image
              src={customization.header_image_url}
              alt="Store Image"
              width={800}
              height={400}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className={`w-full ${headerHeightClass} flex-shrink-0 bg-white/20 backdrop-blur-sm border-b-2 border-dashed border-white/30 flex items-center justify-center`}>
            <svg className="w-16 h-16 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* 컨텐츠 영역 */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 rounded-t-3xl -mt-4 relative z-10" style={{ backgroundColor: bgColor }}>
          {/* 비즈니스 제안 버튼 */}
          {customization?.show_business_contact && (
            <a
              href={customization.business_contact_url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-opacity hover:opacity-80 shadow-sm"
              style={{
                backgroundColor: customization.business_contact_bg_color_hex || '#1E293B',
                color: customization.business_contact_text_color_hex || '#FFFFFF'
              }}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {customization.business_contact_text || '비즈니스 제안'}
            </a>
          )}

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold mb-2" style={{ color: titleColor }}>{titleText}</h1>
            <p className="text-sm" style={{ color: subtitleColor }}>
              {subtitleText || '틱톡에서 안내받은 영상번호를 입력하세요'}
            </p>
          </div>

          {/* 검색 폼 */}
          <form onSubmit={handleSubmit} className="w-full max-w-sm px-2">
            <div className="flex gap-2 w-full">
              <input
                type="text"
                value={code}
                onChange={handleInputChange}
                placeholder="A001"
                maxLength={4}
                autoFocus
                className="min-w-0 flex-1 h-14 px-4 rounded-xl backdrop-blur-sm text-center font-mono text-2xl placeholder:opacity-50 focus:outline-none transition-colors shadow-sm"
                style={{
                  backgroundColor: inputBgColor,
                  color: inputTextColor,
                  border: inputShowBorder ? `2px solid ${inputBorderColor}` : 'none',
                }}
              />
              <button
                type="submit"
                disabled={code.length < 4 || loading}
                className="h-14 px-5 rounded-xl hover:opacity-90 disabled:bg-slate-300 disabled:text-slate-500 font-semibold text-base transition-all flex items-center justify-center shadow-md flex-shrink-0"
                style={{
                  backgroundColor: loading || code.length < 4 ? undefined : buttonColor,
                  color: loading || code.length < 4 ? undefined : buttonTextColor
                }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  '검색'
                )}
              </button>
            </div>

            {error && (
              <p className="mt-3 text-center text-red-500 text-sm">{error}</p>
            )}
          </form>

          {/* 안내 */}
          <div className="mt-12 text-center">
            <p className="text-slate-500 text-xs">
              영상에서 &quot;A001&quot; 같은 번호를 찾아 입력해주세요
            </p>
          </div>

          {/* 빠른 링크 */}
          {quickLinks.length > 0 && (
            <div className="mt-8 w-full">
              <div className={quickLinkLayout === 'double' ? 'grid grid-cols-2 gap-2' : 'space-y-2.5'}>
                {quickLinks.map((link: QuickLink) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex rounded-xl transition-all hover:opacity-80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${
                      quickLinkLayout === 'double'
                        ? 'flex-col'
                        : 'flex-row items-center gap-3 px-3 py-3'
                    }`}
                    style={{ backgroundColor: quickLinkBgColor }}
                  >
                    {link.imageUrl ? (
                      <Image
                        src={link.imageUrl}
                        alt={link.title}
                        width={120}
                        height={120}
                        className={`object-cover flex-shrink-0 ${
                          quickLinkLayout === 'double' ? 'w-full aspect-square' : 'w-14 h-14 rounded-xl'
                        }`}
                      />
                    ) : (
                      <div
                        className={`bg-white/60 flex items-center justify-center flex-shrink-0 ${
                          quickLinkLayout === 'double' ? 'w-full aspect-square' : 'w-14 h-14 rounded-xl'
                        }`}
                      >
                        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                    )}
                    <span
                      className={`font-medium leading-snug ${
                        quickLinkLayout === 'double'
                          ? 'text-sm w-full text-center p-2'
                          : 'text-sm line-clamp-2 flex-1'
                      }`}
                      style={{ color: quickLinkTextColor }}
                    >
                      {link.title}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="py-4 text-center">
          <p className="text-slate-400 text-xs">
            Powered by SellerPort
          </p>
        </div>
      </div>
    </div>
  )
}
