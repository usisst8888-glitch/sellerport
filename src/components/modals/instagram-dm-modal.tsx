'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'

interface InstagramMedia {
  id: string
  media_type: string
  media_url?: string
  thumbnail_url?: string
  permalink: string
  caption?: string
  timestamp: string
}

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

interface InstagramDmModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  instagramAccountId: string | null
  isConnected: boolean
  // 수정 모드용
  editingTrackingLinkId?: string | null
}

export function InstagramDmModal({ isOpen, onClose, onSuccess, instagramAccountId, isConnected, editingTrackingLinkId }: InstagramDmModalProps) {
  const [form, setForm] = useState({
    triggerKeywords: '',
    dmMessage: '',
    followMessage: '',
    targetUrl: '',
    selectedProductId: ''
  })
  const [urlInputMode, setUrlInputMode] = useState<'product' | 'manual'>('product')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [loading, setLoading] = useState(false)

  // 게시물 선택
  const [media, setMedia] = useState<InstagramMedia[]>([])
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null)
  const [selectedMediaCaption, setSelectedMediaCaption] = useState<string | null>(null)
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [loadingMedia, setLoadingMedia] = useState(false)

  // 상품 목록
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 수정 모드용 DM 설정 ID
  const [dmSettingId, setDmSettingId] = useState<string | null>(null)

  const isEditMode = !!editingTrackingLinkId

  // 선택된 상품
  const selectedProduct = products.find(p => p.id === form.selectedProductId)

  // 상품 URL 가져오기
  const getProductUrl = (product: Product): string => {
    return product.product_url || ''
  }

  // 필터된 상품 목록
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

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

  // 기존 DM 설정 불러오기
  const fetchExistingDmSettings = useCallback(async () => {
    if (!editingTrackingLinkId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/instagram/dm-settings?trackingLinkId=${editingTrackingLinkId}`)
      const result = await response.json()

      if (result.success && result.data) {
        const settings = result.data
        setForm({
          triggerKeywords: settings.trigger_keywords?.join(', ') || '',
          dmMessage: settings.dm_message || '',
          followMessage: settings.follow_cta_message || '',
          targetUrl: settings.tracking_links?.target_url || '',
          selectedProductId: ''
        })
        setSelectedMediaId(settings.instagram_media_id || null)
        setSelectedMediaUrl(settings.instagram_media_url || null)
        setSelectedMediaCaption(settings.instagram_caption || null)
        setDmSettingId(settings.id)
      }
    } catch (error) {
      console.error('Failed to fetch DM settings:', error)
      setMessage({ type: 'error', text: '설정을 불러오는데 실패했습니다' })
    } finally {
      setLoading(false)
    }
  }, [editingTrackingLinkId])

  // 모달 열릴 때 데이터 불러오기
  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      if (editingTrackingLinkId) {
        fetchExistingDmSettings()
      }
    }
  }, [isOpen, editingTrackingLinkId, fetchExistingDmSettings, fetchProducts])

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

  // 모달 닫힐 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setForm({ triggerKeywords: '', dmMessage: '', followMessage: '', targetUrl: '', selectedProductId: '' })
      setSelectedMediaId(null)
      setSelectedMediaUrl(null)
      setSelectedMediaCaption(null)
      setMessage(null)
      setDmSettingId(null)
      setUrlInputMode('product')
      setProductSearch('')
      setIsProductDropdownOpen(false)
    }
  }, [isOpen])

  // 상품이 없으면 자동으로 직접 입력 모드로 전환
  useEffect(() => {
    if (!productsLoading && products.length === 0) {
      setUrlInputMode('manual')
    }
  }, [products, productsLoading])

  // 게시물 목록 불러오기
  const fetchMedia = async () => {
    if (!instagramAccountId) return
    setLoadingMedia(true)
    try {
      const response = await fetch(`/api/instagram/media?instagramAccountId=${instagramAccountId}`)
      const result = await response.json()
      if (result.success) {
        setMedia(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch media:', error)
    } finally {
      setLoadingMedia(false)
    }
  }

  const openMediaModal = () => {
    setShowMediaModal(true)
    fetchMedia()
  }

  // DM 설정 생성 또는 수정
  const handleSubmit = async () => {
    if (!form.triggerKeywords || !form.dmMessage || !form.followMessage) {
      setMessage({ type: 'error', text: '모든 필드를 입력해주세요' })
      return
    }

    // 목적지 URL 결정
    let targetUrl = ''
    if (urlInputMode === 'product') {
      if (!selectedProduct) {
        setMessage({ type: 'error', text: '상품을 선택해주세요' })
        return
      }
      targetUrl = getProductUrl(selectedProduct)
      if (!targetUrl) {
        setMessage({ type: 'error', text: '상품 URL을 가져올 수 없습니다' })
        return
      }
    } else {
      if (!form.targetUrl) {
        setMessage({ type: 'error', text: '목적지 URL을 입력해주세요' })
        return
      }
      targetUrl = form.targetUrl
    }

    setCreating(true)
    try {
      const selectedMedia = media.find(m => m.id === selectedMediaId)

      if (isEditMode && dmSettingId) {
        // 수정 모드
        const response = await fetch(`/api/instagram/dm-settings/${dmSettingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            triggerKeywords: form.triggerKeywords.split(',').map(k => k.trim()).filter(k => k),
            dmMessage: form.dmMessage,
            followCtaMessage: form.followMessage,
          })
        })

        const result = await response.json()
        if (result.success) {
          onSuccess()
          onClose()
        } else {
          setMessage({ type: 'error', text: result.error || '수정에 실패했습니다' })
        }
      } else {
        // 생성 모드
        const response = await fetch('/api/tracking-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelType: 'instagram',
            postName: selectedMedia?.caption?.slice(0, 50) || 'Instagram DM',
            targetUrl: targetUrl,
            enableDmAutoSend: true,
            dmTriggerKeywords: form.triggerKeywords,
            dmMessage: form.dmMessage,
            requireFollow: true,
            followMessage: form.followMessage,
            instagramMediaId: selectedMediaId,
            instagramMediaUrl: selectedMedia?.permalink,
            instagramMediaType: selectedMedia?.media_type,
            instagramCaption: selectedMedia?.caption,
            instagramThumbnailUrl: selectedMedia?.thumbnail_url || selectedMedia?.media_url
          })
        })

        const result = await response.json()
        if (result.success) {
          onSuccess()
          onClose()
        } else {
          setMessage({ type: 'error', text: result.error || '설정에 실패했습니다' })
        }
      }
    } catch {
      setMessage({ type: 'error', text: '오류가 발생했습니다' })
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden">
                  <img src="/channel_logo/insta.png" alt="Instagram" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {isEditMode ? 'Instagram DM 설정 수정' : 'Instagram DM 자동발송'}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {isEditMode ? '기존 DM 설정을 수정합니다' : '댓글 트리거로 자동 DM 발송'}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* 로딩 상태 */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-slate-400">설정을 불러오는 중...</span>
              </div>
            )}

            {/* 에러 메시지 */}
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {message.text}
              </div>
            )}

            {/* Instagram 미연결 */}
            {!loading && !isConnected ? (
              <div className="p-6 rounded-xl bg-slate-700/50 border border-slate-600 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-white font-medium mb-2">Instagram 연결이 필요합니다</h4>
                <p className="text-sm text-slate-400 mb-4">DM 자동발송을 사용하려면 먼저 Instagram 비즈니스 계정을 연결해주세요</p>
                <Link href="/quick-start" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">
                  빠른 시작에서 연결하기
                </Link>
              </div>
            ) : !loading && (
              <>
                {/* 1. 게시물 선택 (수정 모드에서는 변경 불가) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs mr-2">1</span>
                    게시물 선택
                    {isEditMode && <span className="ml-2 text-xs text-slate-500">(변경 불가)</span>}
                  </label>
                  {selectedMediaId ? (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700 border border-slate-600">
                      {/* 새로 선택한 게시물 또는 기존 저장된 게시물 표시 */}
                      {(media.find(m => m.id === selectedMediaId) || selectedMediaUrl) && (
                        <>
                          {(media.find(m => m.id === selectedMediaId)?.thumbnail_url ||
                            media.find(m => m.id === selectedMediaId)?.media_url ||
                            selectedMediaUrl) && (
                            <div className="w-16 h-16 rounded-lg bg-slate-600 flex items-center justify-center overflow-hidden">
                              {media.find(m => m.id === selectedMediaId) ? (
                                <img
                                  src={media.find(m => m.id === selectedMediaId)?.thumbnail_url || media.find(m => m.id === selectedMediaId)?.media_url}
                                  alt="선택된 게시물"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {media.find(m => m.id === selectedMediaId)?.caption?.slice(0, 50) || selectedMediaCaption?.slice(0, 50) || '캡션 없음'}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">ID: {selectedMediaId}</p>
                          </div>
                          {/* 수정 모드가 아닐 때만 삭제 버튼 표시 */}
                          {!isEditMode && (
                            <button onClick={() => { setSelectedMediaId(null); setSelectedMediaUrl(null); setSelectedMediaCaption(null) }} className="p-2 text-slate-400 hover:text-white">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={openMediaModal}
                      disabled={isEditMode}
                      className="w-full p-4 rounded-xl bg-slate-700/50 border-2 border-dashed border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-slate-600 disabled:hover:text-slate-400"
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">게시물 선택하기</span>
                    </button>
                  )}
                </div>

                {/* 2. 트리거 키워드 */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs mr-2">2</span>
                    댓글 트리거 키워드
                  </label>
                  <input
                    type="text"
                    placeholder="예: 링크, 구매, 정보 (쉼표로 구분)"
                    value={form.triggerKeywords}
                    onChange={(e) => setForm({ ...form, triggerKeywords: e.target.value })}
                    className="w-full h-11 px-4 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                  />
                </div>

                {/* 3. 팔로우 요청 메시지 (첫 번째 DM) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs mr-2">3</span>
                    팔로우 요청 메시지
                    <span className="ml-2 text-xs text-blue-400">(첫 번째 DM)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="안녕하세요! 댓글 감사합니다 🙏&#10;&#10;링크를 받으시려면 팔로우 후 아래 버튼을 눌러주세요!"
                    value={form.followMessage}
                    onChange={(e) => setForm({ ...form, followMessage: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">댓글 작성자에게 먼저 발송됩니다. &quot;팔로우 했어요&quot; 버튼이 자동 포함됩니다.</p>
                </div>

                {/* 4. 팔로워용 DM 메시지 (두 번째 DM) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs mr-2">4</span>
                    팔로워용 메시지
                    <span className="ml-2 text-xs text-green-400">(두 번째 DM)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="감사합니다! 요청하신 링크 보내드립니다 👇"
                    value={form.dmMessage}
                    onChange={(e) => setForm({ ...form, dmMessage: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">팔로우 확인 후 발송됩니다. 메시지 끝에 목적지 URL이 자동 추가됩니다.</p>
                </div>

                {/* 5. 목적지 URL (수정 모드에서는 변경 불가) */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-xs mr-2">5</span>
                    목적지 URL
                    {isEditMode && <span className="ml-2 text-xs text-slate-500">(변경 불가)</span>}
                  </label>

                  {/* 모드 선택 탭 (수정 모드가 아닐 때만) */}
                  {!isEditMode && (
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => products.length > 0 && setUrlInputMode('product')}
                        disabled={products.length === 0}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          urlInputMode === 'product'
                            ? 'bg-blue-500 text-white'
                            : products.length === 0
                              ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        상품 선택 {products.length === 0 && '(등록 필요)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setUrlInputMode('manual')}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                          urlInputMode === 'manual'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                      >
                        직접 입력
                      </button>
                    </div>
                  )}

                  {/* 상품 선택 모드 */}
                  {urlInputMode === 'product' && !isEditMode && (
                    <div ref={dropdownRef} className="relative">
                      {/* 드롭다운 트리거 버튼 */}
                      <button
                        type="button"
                        onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                        className={`w-full h-11 px-4 rounded-xl border text-left flex items-center justify-between ${
                          selectedProduct
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-slate-700 border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        {selectedProduct ? (
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {selectedProduct.image_url && (
                              <img
                                src={selectedProduct.image_url}
                                alt={selectedProduct.name}
                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{selectedProduct.name}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400">상품을 선택하세요</span>
                        )}
                        <svg className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isProductDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* 드롭다운 메뉴 */}
                      {isProductDropdownOpen && (
                        <div className="absolute z-[60] w-full mt-2 rounded-xl bg-slate-700 border border-slate-600 shadow-xl">
                            {/* 상품 검색 */}
                            <div className="p-2 border-b border-slate-600">
                              <input
                                type="text"
                                placeholder="상품명 검색..."
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 text-sm"
                              />
                            </div>

                            {/* 상품 목록 */}
                            <div className="max-h-64 overflow-y-auto">
                              {productsLoading ? (
                                <div className="flex items-center justify-center py-4">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                                  <span className="ml-2 text-sm text-slate-400">상품 불러오는 중...</span>
                                </div>
                              ) : filteredProducts.length === 0 ? (
                                <div className="p-4 text-center text-sm text-slate-400">
                                  {products.length === 0 ? (
                                    <>연결된 스토어에 상품이 없습니다</>
                                  ) : (
                                    <>검색 결과가 없습니다</>
                                  )}
                                </div>
                              ) : (
                                filteredProducts.map((product) => (
                                  <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => {
                                      setForm(prev => ({ ...prev, selectedProductId: product.id }))
                                      setIsProductDropdownOpen(false)
                                      setProductSearch('')
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-600/50 border-b border-slate-600 last:border-b-0 text-left ${
                                      form.selectedProductId === product.id ? 'bg-blue-500/10' : ''
                                    }`}
                                  >
                                    {product.image_url ? (
                                      <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-white truncate">{product.name}</p>
                                      <p className="text-xs text-slate-400">{product.price.toLocaleString()}원</p>
                                    </div>
                                    {form.selectedProductId === product.id && (
                                      <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </button>
                                ))
                              )}
                            </div>
                        </div>
                      )}

                      {/* 선택된 상품 URL 미리보기 */}
                      {selectedProduct && (
                        <p className="text-xs text-slate-500 mt-2 truncate">
                          URL: {getProductUrl(selectedProduct) || '상품 URL 없음'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* 직접 입력 모드 */}
                  {urlInputMode === 'manual' && !isEditMode && (
                    <input
                      type="url"
                      placeholder="https://smartstore.naver.com/..."
                      value={form.targetUrl}
                      onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                      className="w-full h-11 px-4 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  )}

                  {/* 수정 모드일 때 */}
                  {isEditMode && (
                    <>
                      <input
                        type="url"
                        placeholder="https://smartstore.naver.com/..."
                        value={form.targetUrl}
                        disabled
                        className="w-full h-11 px-4 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <p className="text-xs text-slate-500 mt-1">목적지 URL을 변경하려면 새 추적링크를 생성하세요</p>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* 버튼 */}
          {isConnected && !loading && (
            <div className="p-6 border-t border-slate-700 flex gap-3">
              <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium">
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={creating || !form.dmMessage || !form.triggerKeywords || !form.followMessage || (!isEditMode && urlInputMode === 'product' && !form.selectedProductId) || (!isEditMode && urlInputMode === 'manual' && !form.targetUrl)}
                className="flex-1 h-11 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50"
              >
                {creating ? '저장 중...' : (isEditMode ? '수정 완료' : 'DM 자동발송 설정')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 게시물 선택 모달 */}
      {showMediaModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-slate-700">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white">게시물 선택</h3>
              <button onClick={() => setShowMediaModal(false)} className="text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {loadingMedia ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : media.length === 0 ? (
                <p className="text-center text-slate-400 py-8">게시물이 없습니다</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {media.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setSelectedMediaId(item.id); setShowMediaModal(false) }}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${selectedMediaId === item.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'} transition-colors`}
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.thumbnail_url || item.media_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm text-white truncate">
                          {item.caption?.slice(0, 60) || '캡션 없음'}
                          {item.caption && item.caption.length > 60 && '...'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500">
                            {new Date(item.timestamp).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-slate-600 text-slate-400">
                            {item.media_type === 'VIDEO' ? '릴스' : item.media_type === 'CAROUSEL_ALBUM' ? '캐러셀' : '피드'}
                          </span>
                        </div>
                      </div>
                      {selectedMediaId === item.id && (
                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
