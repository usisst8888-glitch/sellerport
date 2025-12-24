'use client'

/**
 * 검색 랜딩 페이지 커스터마이징 페이지
 * /conversions/customize/youtube/store-slug 또는 /conversions/customize/tiktok/store-slug 형식
 * 좌측: 설정, 우측: 미리보기
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { HexColorPicker } from 'react-colorful'

// 상품 인터페이스
interface Product {
  id: string
  name: string
  price: number
  image_url: string | null
  external_product_id: string
  product_url: string | null
  my_sites?: {
    id: string
    site_type: string
    site_name: string
    store_id?: string | null
  } | null
}

// 추가된 링크 항목
interface AddedLink {
  id: string
  type: 'product' | 'custom'
  title: string
  url: string
  imageUrl?: string
  productId?: string
}

// 색상 선택 컴포넌트 (react-colorful + HEX 입력만)
function ColorPickerWithHex({
  value,
  onChange,
  className = ''
}: {
  value: string
  onChange: (hex: string) => void
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [localHex, setLocalHex] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const displayHex = localHex !== null ? localHex : value

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase()
    if (!val.startsWith('#')) {
      val = '#' + val.replace(/#/g, '')
    }
    val = '#' + val.slice(1).replace(/[^0-9A-F]/g, '').slice(0, 6)
    setLocalHex(val)

    if (/^#[0-9A-F]{6}$/i.test(val)) {
      onChange(val)
    }
  }

  const handleHexBlur = () => {
    setLocalHex(null)
  }

  const handlePickerChange = (hex: string) => {
    onChange(hex.toUpperCase())
    setLocalHex(null)
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 색상 미리보기 버튼 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-7 h-7 rounded-lg border border-slate-600 cursor-pointer flex-shrink-0 transition-transform hover:scale-105"
        style={{ backgroundColor: /^#[0-9A-F]{6}$/i.test(displayHex) ? displayHex : value }}
      />

      {/* 색상 피커 팝업 (react-colorful) - 왼쪽으로 열림 */}
      {isOpen && (
        <div className="absolute top-0 right-full mr-2 z-50 p-3 bg-slate-800 border border-slate-600 rounded-xl shadow-xl">
          <HexColorPicker
            color={/^#[0-9A-F]{6}$/i.test(displayHex) ? displayHex : value}
            onChange={handlePickerChange}
          />
          {/* HEX 입력 */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-400">HEX</span>
            <input
              type="text"
              value={displayHex}
              onChange={handleHexChange}
              onBlur={handleHexBlur}
              className="w-[168px] px-2 py-1.5 bg-slate-700 border border-slate-600 rounded text-sm text-white font-mono text-center"
            />
          </div>
        </div>
      )}
    </div>
  )
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
  quick_links?: AddedLink[]
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

export default function CustomizeLandingPage() {
  const router = useRouter()
  const params = useParams()
  const channelType = params.channelType as 'youtube' | 'tiktok'
  const storeSlug = params.storeSlug as string

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)

  // 상품 및 링크 추가 관련 상태
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const [addLinkType, setAddLinkType] = useState<'product' | 'custom'>('product')
  const [customLinkTitle, setCustomLinkTitle] = useState('')
  const [customLinkUrl, setCustomLinkUrl] = useState('')
  const [customLinkImageUrl, setCustomLinkImageUrl] = useState('')
  const [customLinkImageUploading, setCustomLinkImageUploading] = useState(false)
  const [addedLinks, setAddedLinks] = useState<AddedLink[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 기본값 설정
  const defaultBgColor = channelType === 'tiktok' ? '#FECDD3' : '#FECACA'
  const defaultButtonColor = channelType === 'tiktok' ? '#F43F5E' : '#F97316'

  const [customization, setCustomization] = useState<StoreCustomization>({
    background_type: 'solid',
    background_gradient: '',
    header_image_size: 'medium',
    button_gradient: '',
    bg_color_hex: defaultBgColor,
    button_color_hex: defaultButtonColor,
    input_bg_color_hex: 'rgba(255,255,255,0.5)',
    input_text_color_hex: '#1E293B',
    input_border_color_hex: 'rgba(255,255,255,0.6)',
    input_show_border: true,
    quick_link_bg_color_hex: 'rgba(255,255,255,0.4)',
    quick_link_text_color_hex: '#334155',
    quick_link_layout: 'single',
  })

  // 상품 목록 불러오기
  const fetchProducts = useCallback(async () => {
    setProductsLoading(true)
    try {
      const response = await fetch('/api/products')
      const result = await response.json()
      if (result.success && result.data) {
        setProducts(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setProductsLoading(false)
    }
  }, [])

  // 상품 URL 가져오기 (products 테이블에서)
  const getProductUrl = (product: Product): string => {
    return product.product_url || ''
  }

  // 스토어 타입 라벨
  const getSiteTypeLabel = (siteType?: string): string => {
    switch (siteType) {
      case 'smartstore': return '스마트스토어'
      case 'imweb': return '아임웹'
      case 'cafe24': return '카페24'
      default: return ''
    }
  }

  // 필터된 상품 목록
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  // 상품 추가
  const handleAddProduct = (product: Product) => {
    const url = getProductUrl(product)
    if (!url) {
      // 더 상세한 에러 메시지
      const siteType = product.my_sites?.site_type
      const storeId = product.my_sites?.store_id
      if (!product.my_sites) {
        alert('상품에 연결된 스토어 정보가 없습니다.')
      } else if (!storeId) {
        alert(`스토어 ID가 없습니다. (사이트 타입: ${siteType || '알 수 없음'})`)
      } else {
        alert('상품 URL을 생성할 수 없습니다.')
      }
      return
    }

    // 중복 체크
    if (addedLinks.some(link => link.productId === product.id)) {
      alert('이미 추가된 상품입니다')
      return
    }

    const newLink: AddedLink = {
      id: `product-${Date.now()}`,
      type: 'product',
      title: product.name,
      url: url,
      imageUrl: product.image_url || undefined,
      productId: product.id
    }

    setAddedLinks(prev => [...prev, newLink])
    setIsProductDropdownOpen(false)
    setProductSearch('')
  }

  // 직접 링크 추가
  const handleAddCustomLink = () => {
    if (!customLinkTitle.trim()) {
      alert('링크 제목을 입력해주세요')
      return
    }
    if (!customLinkUrl.trim()) {
      alert('URL을 입력해주세요')
      return
    }

    // URL 형식 검증
    try {
      new URL(customLinkUrl)
    } catch {
      alert('올바른 URL 형식이 아닙니다')
      return
    }

    const newLink: AddedLink = {
      id: `custom-${Date.now()}`,
      type: 'custom',
      title: customLinkTitle.trim(),
      url: customLinkUrl.trim(),
      imageUrl: customLinkImageUrl.trim() || undefined
    }

    setAddedLinks(prev => [...prev, newLink])
    setCustomLinkTitle('')
    setCustomLinkUrl('')
    setCustomLinkImageUrl('')
  }

  // 링크 삭제
  const handleRemoveLink = (id: string) => {
    setAddedLinks(prev => prev.filter(link => link.id !== id))
  }

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      setAddedLinks(prev => {
        const newLinks = [...prev]
        const [draggedItem] = newLinks.splice(draggedIndex, 1)
        newLinks.splice(dragOverIndex, 0, draggedItem)
        return newLinks
      })
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(`/api/store-customization?channel_type=${channelType}&store_slug=${storeSlug}`)
        const result = await response.json()
        if (result.success && result.data) {
          setCustomization(prev => ({ ...prev, ...result.data }))
          if (result.data.quick_links) {
            setAddedLinks(result.data.quick_links)
          }
        }
      } catch {
        // 에러 시 기본값 사용
      } finally {
        setLoading(false)
      }
    }
    loadData()
    fetchProducts()
  }, [channelType, storeSlug, fetchProducts])

  // 유효하지 않은 채널 타입 체크
  if (channelType !== 'youtube' && channelType !== 'tiktok') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-400">유효하지 않은 채널 타입입니다.</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
          >
            뒤로 가기
          </button>
        </div>
      </div>
    )
  }

  // 이미지 업로드 처리
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'store-customization')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success && result.url) {
        setCustomization(prev => ({
          ...prev,
          header_image_url: result.url
        }))
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.')
      }
    } catch {
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setUploading(false)
    }
  }

  // 빠른링크 이미지 업로드 처리
  const handleQuickLinkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCustomLinkImageUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'quick-links')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success && result.url) {
        setCustomLinkImageUrl(result.url)
      } else {
        alert(result.error || '이미지 업로드에 실패했습니다.')
      }
    } catch {
      alert('이미지 업로드 중 오류가 발생했습니다.')
    } finally {
      setCustomLinkImageUploading(false)
    }
  }

  // 저장 처리
  const handleSave = async () => {
    setSaving(true)
    try {
      // customization을 먼저 spread하고, channel_type/store_slug는 나중에 설정해서 덮어쓰기 방지
      const saveData = {
        ...customization,
        channel_type: channelType,
        store_slug: storeSlug,
        quick_links: addedLinks
      }
      console.log('Saving data:', saveData)
      console.log('storeSlug from URL:', storeSlug)

      const response = await fetch('/api/store-customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData)
      })

      const result = await response.json()
      console.log('Save result:', result)

      if (result.success) {
        alert('저장되었습니다!')
        router.back()
      } else {
        alert(result.error || '저장에 실패했습니다.')
      }
    } catch (err) {
      console.error('Save error:', err)
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 현재 색상값
  const bgColor = customization.bg_color_hex || defaultBgColor
  const buttonColor = customization.button_color_hex || defaultButtonColor
  const titleColor = customization.title_color_hex || '#1E293B'
  const subtitleColor = customization.subtitle_color_hex || '#475569'
  const buttonTextColor = customization.button_text_color_hex || '#FFFFFF'
  const inputBgColor = customization.input_bg_color_hex || '#FFFFFF'
  const inputTextColor = customization.input_text_color_hex || '#1E293B'
  const inputBorderColor = customization.input_border_color_hex || '#E2E8F0'
  const inputShowBorder = customization.input_show_border !== false

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="-m-4 md:-m-6 overflow-x-hidden">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-base font-semibold text-white">검색 페이지 꾸미기</h1>
              <p className="text-xs text-slate-400">
                {channelType === 'tiktok' ? '틱톡' : '유튜브'} 영상번호 검색 페이지
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장하기'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex min-h-[calc(100vh-120px)] overflow-x-hidden">
        {/* 좌측: 설정 패널 */}
        <div className="w-[500px] flex-shrink-0 border-r border-white/10 overflow-y-auto overflow-x-hidden">
          <div className="p-4 space-y-5">
            {/* 배경색 설정 */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-white">배경색</p>
              <ColorPickerWithHex
                value={bgColor}
                onChange={(hex) => setCustomization(prev => ({
                  ...prev,
                  bg_color_hex: hex
                }))}
              />
            </div>

            {/* 상단 이미지 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white">상단 이미지</p>
                <span className="text-xs text-slate-500">권장: 1200 x 400px</span>
              </div>

              {customization.header_image_url ? (
                <div className="space-y-2">
                  <div className="relative w-full h-16 rounded-lg overflow-hidden bg-slate-700">
                    <Image
                      src={customization.header_image_url}
                      alt="Header"
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => setCustomization(prev => ({ ...prev, header_image_url: undefined }))}
                      className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-red-500 rounded flex items-center justify-center transition-colors"
                    >
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">높이:</span>
                    {(['small', 'medium', 'large'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => setCustomization(prev => ({ ...prev, header_image_size: size }))}
                        className={`px-2 py-0.5 text-xs rounded transition-colors ${
                          customization.header_image_size === size
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {size === 'small' ? '작게' : size === 'medium' ? '보통' : '크게'}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <label className="block w-full p-2.5 rounded-lg border-2 border-dashed border-slate-600 hover:border-blue-500 hover:bg-slate-800/50 cursor-pointer transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="flex items-center gap-2.5">
                    {uploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm text-slate-400">업로드 중...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm text-slate-300">이미지 업로드</p>
                          <p className="text-xs text-slate-500">JPG, PNG, GIF, WebP</p>
                        </div>
                      </>
                    )}
                  </div>
                </label>
              )}
            </div>

            {/* 비즈니스 제안 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">비즈니스 제안</p>
                <button
                  type="button"
                  onClick={() => setCustomization(prev => ({ ...prev, show_business_contact: !prev.show_business_contact }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    customization.show_business_contact ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      customization.show_business_contact ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              {customization.show_business_contact && (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">버튼 텍스트</label>
                    <input
                      type="text"
                      value={customization.business_contact_text || ''}
                      onChange={(e) => setCustomization(prev => ({ ...prev, business_contact_text: e.target.value || undefined }))}
                      placeholder="비즈니스 제안"
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">링크 URL</label>
                    <input
                      type="url"
                      value={customization.business_contact_url || ''}
                      onChange={(e) => setCustomization(prev => ({ ...prev, business_contact_url: e.target.value || undefined }))}
                      placeholder="https://instagram.com/..."
                      className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-slate-400 mb-1">배경색</label>
                      <ColorPickerWithHex
                        value={customization.business_contact_bg_color_hex || '#1E293B'}
                        onChange={(hex) => setCustomization(prev => ({ ...prev, business_contact_bg_color_hex: hex }))}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-slate-400 mb-1">텍스트색</label>
                      <ColorPickerWithHex
                        value={customization.business_contact_text_color_hex || '#FFFFFF'}
                        onChange={(hex) => setCustomization(prev => ({ ...prev, business_contact_text_color_hex: hex }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 텍스트 설정 */}
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-white">텍스트 설정</p>
              <div>
                <label className="block text-xs text-slate-400 mb-1">타이틀</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customization.title_text || ''}
                    onChange={(e) => setCustomization(prev => ({ ...prev, title_text: e.target.value || undefined }))}
                    placeholder="영상속 번호입력"
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  />
                  <ColorPickerWithHex
                    value={titleColor}
                    onChange={(hex) => setCustomization(prev => ({ ...prev, title_color_hex: hex }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">서브타이틀</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customization.subtitle_text || ''}
                    onChange={(e) => setCustomization(prev => ({ ...prev, subtitle_text: e.target.value || undefined }))}
                    placeholder={`${channelType === 'tiktok' ? '틱톡' : '쇼츠'}에서 안내받은 영상속 번호를 입력해주세요`}
                    className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  />
                  <ColorPickerWithHex
                    value={subtitleColor}
                    onChange={(hex) => setCustomization(prev => ({ ...prev, subtitle_color_hex: hex }))}
                  />
                </div>
              </div>
            </div>

            {/* 버튼 설정 */}
            <div className="space-y-2.5">
              <p className="text-sm font-medium text-white">버튼 설정</p>
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">버튼 (검색)</label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">텍스트</span>
                    <ColorPickerWithHex
                      value={buttonTextColor}
                      onChange={(hex) => setCustomization(prev => ({ ...prev, button_text_color_hex: hex }))}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500">배경</span>
                    <ColorPickerWithHex
                      value={buttonColor}
                      onChange={(hex) => setCustomization(prev => ({
                        ...prev,
                        button_color_hex: hex
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 입력 필드 설정 */}
            <div>
              <p className="text-sm font-medium text-white mb-2">입력 필드 설정</p>
              <div className="flex items-center justify-end gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">배경</span>
                  <ColorPickerWithHex
                    value={inputBgColor}
                    onChange={(hex) => setCustomization(prev => ({ ...prev, input_bg_color_hex: hex }))}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">텍스트</span>
                  <ColorPickerWithHex
                    value={inputTextColor}
                    onChange={(hex) => setCustomization(prev => ({ ...prev, input_text_color_hex: hex }))}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">테두리</span>
                  <button
                    onClick={() => setCustomization(prev => ({ ...prev, input_show_border: !prev.input_show_border }))}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      inputShowBorder ? 'bg-blue-600' : 'bg-slate-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                        inputShowBorder ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  {inputShowBorder && (
                    <ColorPickerWithHex
                      value={inputBorderColor}
                      onChange={(hex) => setCustomization(prev => ({ ...prev, input_border_color_hex: hex }))}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 빠른 링크 추가 */}
            <div className="border-t border-slate-700 pt-5">
              <p className="text-sm font-medium text-white mb-3">빠른 링크 추가</p>
              <p className="text-xs text-slate-400 mb-3">영상번호 검색 외에 바로 이동할 수 있는 링크를 추가하세요</p>

              {/* 빠른 링크 스타일 설정 */}
              <div className="mb-4 p-3 rounded-lg bg-slate-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">레이아웃</span>
                  <div className="flex rounded-md bg-slate-600 p-0.5">
                    <button
                      type="button"
                      onClick={() => setCustomization(prev => ({ ...prev, quick_link_layout: 'single' }))}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        customization.quick_link_layout === 'single'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      1열
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomization(prev => ({ ...prev, quick_link_layout: 'double' }))}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        customization.quick_link_layout === 'double'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      2열
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">배경색</span>
                    <ColorPickerWithHex
                      value={customization.quick_link_bg_color_hex?.startsWith('rgba') ? '#FFFFFF' : (customization.quick_link_bg_color_hex || '#FFFFFF')}
                      onChange={(hex) => setCustomization(prev => ({ ...prev, quick_link_bg_color_hex: hex }))}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-400">글자색</span>
                    <ColorPickerWithHex
                      value={customization.quick_link_text_color_hex || '#334155'}
                      onChange={(hex) => setCustomization(prev => ({ ...prev, quick_link_text_color_hex: hex }))}
                    />
                  </div>
                </div>
              </div>

              {/* 타입 선택 탭 */}
              <div className="flex rounded-lg bg-slate-700 p-0.5 mb-3">
                <button
                  type="button"
                  onClick={() => setAddLinkType('product')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                    addLinkType === 'product'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  연동 상품
                </button>
                <button
                  type="button"
                  onClick={() => setAddLinkType('custom')}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                    addLinkType === 'custom'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  직접 입력
                </button>
              </div>

              {/* 연동 상품 선택 */}
              {addLinkType === 'product' && (
                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 hover:border-slate-500 text-left flex items-center justify-between"
                  >
                    <span className="text-sm text-slate-400">상품을 선택하세요</span>
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${isProductDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isProductDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 rounded-lg bg-slate-700 border border-slate-600 shadow-xl">
                      <div className="p-2 border-b border-slate-600">
                        <input
                          type="text"
                          placeholder="상품명 검색..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full h-8 px-3 rounded-md bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {productsLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="ml-2 text-xs text-slate-400">불러오는 중...</span>
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="p-4 text-center text-xs text-slate-400">
                            {products.length === 0 ? '연결된 스토어에 상품이 없습니다' : '검색 결과가 없습니다'}
                          </div>
                        ) : (
                          filteredProducts.slice(0, 10).map((product) => (
                            <button
                              key={product.id}
                              onClick={() => handleAddProduct(product)}
                              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-600/50 border-b border-slate-600 last:border-b-0 text-left"
                            >
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-md bg-slate-600 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white truncate">{product.name}</p>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400">{product.price.toLocaleString()}원</span>
                                  {product.my_sites?.site_type && (
                                    <span className="text-[10px] px-1 py-0.5 rounded bg-slate-600 text-slate-300">
                                      {getSiteTypeLabel(product.my_sites.site_type)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 직접 링크 입력 */}
              {addLinkType === 'custom' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="링크 제목 (예: 공식 홈페이지)"
                    value={customLinkTitle}
                    onChange={(e) => setCustomLinkTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm"
                  />
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={customLinkUrl}
                    onChange={(e) => setCustomLinkUrl(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 text-sm"
                  />
                  <div className="flex gap-2 items-center">
                    <label className="flex-1 h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm flex items-center cursor-pointer hover:bg-slate-600 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQuickLinkImageUpload}
                        className="hidden"
                        disabled={customLinkImageUploading}
                      />
                      {customLinkImageUploading ? (
                        <span className="text-slate-400">업로드 중...</span>
                      ) : customLinkImageUrl ? (
                        <div className="flex items-center gap-2 w-full">
                          <img src={customLinkImageUrl} alt="미리보기" className="w-6 h-6 rounded object-cover" />
                          <span className="text-slate-300 truncate flex-1">이미지 추가됨</span>
                          <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setCustomLinkImageUrl(''); }}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500">이미지 추가 (선택)</span>
                      )}
                    </label>
                    <button
                      onClick={handleAddCustomLink}
                      className="px-4 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex-shrink-0"
                    >
                      추가
                    </button>
                  </div>
                </div>
              )}

              {/* 추가된 링크 목록 */}
              {addedLinks.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs text-slate-400">추가된 링크 ({addedLinks.length}개) - 드래그하여 순서 변경</p>
                  {addedLinks.map((link, index) => (
                    <div
                      key={link.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDragLeave={handleDragLeave}
                      className={`flex items-center gap-2 p-2 rounded-lg bg-slate-700/50 border transition-all cursor-grab active:cursor-grabbing ${
                        draggedIndex === index
                          ? 'opacity-50 border-blue-500'
                          : dragOverIndex === index
                            ? 'border-blue-400 bg-blue-500/10'
                            : 'border-slate-600'
                      }`}
                    >
                      {/* 드래그 핸들 */}
                      <div className="flex-shrink-0 text-slate-500 hover:text-slate-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                      {link.imageUrl ? (
                        <img
                          src={link.imageUrl}
                          alt={link.title}
                          className="w-8 h-8 rounded-md object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-md bg-slate-600 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{link.title}</p>
                        <p className="text-[10px] text-slate-500 truncate">{link.url}</p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        link.type === 'product' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {link.type === 'product' ? '상품' : '링크'}
                      </span>
                      <button
                        onClick={() => handleRemoveLink(link.id)}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 우측: 미리보기 */}
        <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto overflow-x-hidden">
          <div className="w-full max-w-[430px]">
            <p className="text-xs text-slate-500 text-center mb-3">미리보기</p>
            <div
              className="rounded-2xl shadow-2xl transition-colors duration-150"
              style={{
                backgroundColor: bgColor,
              }}
            >
              <div className="flex flex-col">
              {/* 상단 이미지 */}
              {customization.header_image_url ? (
                <div className={`w-full flex-shrink-0 rounded-t-2xl ${
                  customization.header_image_size === 'small' ? 'h-28' :
                  customization.header_image_size === 'large' ? 'h-48' :
                  'h-36'
                } overflow-hidden`}>
                  <Image
                    src={customization.header_image_url}
                    alt="Header"
                    width={320}
                    height={160}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className={`w-full flex-shrink-0 rounded-t-2xl ${
                  customization.header_image_size === 'small' ? 'h-28' :
                  customization.header_image_size === 'large' ? 'h-48' :
                  'h-36'
                } bg-white/20 backdrop-blur-sm border-b-2 border-dashed border-white/30 flex items-center justify-center`}>
                  <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* 컨텐츠 영역 */}
              <div className="flex-1 flex flex-col items-center justify-center p-5 rounded-t-3xl -mt-4 relative z-10" style={{ backgroundColor: bgColor }}>
                {/* 비즈니스 제안 버튼 */}
                {customization.show_business_contact && (
                  <button
                    type="button"
                    className="mb-4 px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all duration-150 hover:opacity-80 shadow-sm"
                    style={{
                      backgroundColor: customization.business_contact_bg_color_hex || '#1E293B',
                      color: customization.business_contact_text_color_hex || '#FFFFFF'
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {customization.business_contact_text || '비즈니스 제안'}
                  </button>
                )}

                <h2
                  className="text-xl font-bold mb-1.5 text-center transition-colors duration-150"
                  style={{ color: titleColor }}
                >
                  {customization.title_text || '영상번호 검색'}
                </h2>
                <p
                  className="text-xs mb-6 text-center transition-colors duration-150"
                  style={{ color: subtitleColor }}
                >
                  {customization.subtitle_text || `${channelType === 'tiktok' ? '틱톡' : '쇼츠'}에서 안내받은 영상번호를 입력하세요`}
                </p>

                {/* 입력 필드 + 버튼 (미리보기) */}
                <div className="w-full max-w-sm flex gap-2">
                  <div
                    className="flex-1 h-14 px-4 rounded-xl shadow-sm flex items-center justify-center transition-all duration-150"
                    style={{
                      backgroundColor: inputBgColor,
                      border: inputShowBorder ? `2px solid ${inputBorderColor}` : 'none',
                    }}
                  >
                    <span className="font-mono text-2xl transition-colors duration-150" style={{ color: inputTextColor }}>A001</span>
                  </div>
                  <button
                    className="h-14 px-6 rounded-xl font-semibold text-base shadow-md transition-colors duration-150 flex-shrink-0"
                    style={{ backgroundColor: buttonColor, color: buttonTextColor }}
                  >
                    검색
                  </button>
                </div>

                {/* 빠른 링크 미리보기 (검색 영역 바깥) */}
                {addedLinks.length > 0 && (
                  <div className={`w-full mt-6 ${
                    customization.quick_link_layout === 'double'
                      ? 'grid grid-cols-2 gap-2'
                      : 'space-y-2.5'
                  }`}>
                    {addedLinks.map((link) => (
                      <div
                        key={link.id}
                        className={`rounded-xl backdrop-blur-sm transition-colors duration-150 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${
                          customization.quick_link_layout === 'double'
                            ? 'flex flex-col'
                            : 'flex flex-row items-center gap-3 px-3 py-3'
                        }`}
                        style={{ backgroundColor: customization.quick_link_bg_color_hex || 'rgba(255,255,255,0.4)' }}
                      >
                        {link.imageUrl ? (
                          <img
                            src={link.imageUrl}
                            alt={link.title}
                            className={`object-cover flex-shrink-0 ${
                              customization.quick_link_layout === 'double' ? 'w-full aspect-square rounded-t-xl' : 'w-14 h-14 rounded-xl'
                            }`}
                          />
                        ) : (
                          <div
                            className={`bg-white/60 flex items-center justify-center flex-shrink-0 ${
                              customization.quick_link_layout === 'double' ? 'w-full aspect-square rounded-t-xl' : 'w-14 h-14 rounded-xl'
                            }`}
                          >
                            <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </div>
                        )}
                        <span
                          className={`font-medium leading-snug transition-colors duration-150 ${
                            customization.quick_link_layout === 'double'
                              ? 'text-xs w-full text-center p-2'
                              : 'text-sm line-clamp-2 flex-1'
                          }`}
                          style={{ color: customization.quick_link_text_color_hex || '#334155' }}
                        >
                          {link.title}
                        </span>
                        {customization.quick_link_layout !== 'double' && (
                          <svg
                            className="w-5 h-5 flex-shrink-0"
                            style={{ color: customization.quick_link_text_color_hex || '#334155' }}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 푸터 */}
              <div className="py-3 text-center">
                <p className="text-slate-400 text-[10px]">Powered by SellerPort</p>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
