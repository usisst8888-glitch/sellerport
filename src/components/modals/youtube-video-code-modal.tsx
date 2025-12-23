'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'

// tracking_links 테이블에서 video_code가 있는 것을 영상번호로 사용
interface YoutubeVideoCode {
  id: string
  video_code: string
  post_name: string | null
  target_url: string
  store_slug: string | null
  status: string
  created_at: string
}

interface Product {
  id: string
  name: string
  price: number
  image_url: string | null
  external_product_id: string
  my_sites?: {
    id: string
    site_type: string
    site_name: string
    store_id?: string | null
  } | null
}

interface YoutubeVideoCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

// 영상번호 생성 (A001~Z999)
function generateNextVideoCode(existingCodes: string[]): string {
  if (existingCodes.length === 0) {
    return 'A001'
  }

  const sortedCodes = existingCodes.sort((a, b) => {
    const letterA = a.charAt(0)
    const letterB = b.charAt(0)
    const numA = parseInt(a.slice(1))
    const numB = parseInt(b.slice(1))

    if (letterA !== letterB) {
      return letterA.localeCompare(letterB)
    }
    return numA - numB
  })

  const lastCode = sortedCodes[sortedCodes.length - 1]
  const letter = lastCode.charAt(0)
  const num = parseInt(lastCode.slice(1))

  if (num < 999) {
    return `${letter}${String(num + 1).padStart(3, '0')}`
  } else if (letter < 'Z') {
    return `${String.fromCharCode(letter.charCodeAt(0) + 1)}001`
  } else {
    return 'Z999'
  }
}

export function YoutubeVideoCodeModal({ isOpen, onClose, onSuccess }: YoutubeVideoCodeModalProps) {
  const [savedStoreSlug, setSavedStoreSlug] = useState('')

  const [form, setForm] = useState({
    videoCode: '',
    videoTitle: '',
    selectedProductId: ''
  })
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [existingCodes, setExistingCodes] = useState<YoutubeVideoCode[]>([])
  const [copiedUrl, setCopiedUrl] = useState(false)

  // 상품 목록
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 검색 페이지 URL (스토어 슬러그 포함)
  const searchPageUrl = typeof window !== 'undefined' && savedStoreSlug
    ? `${window.location.origin}/v/${savedStoreSlug}`
    : ''

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

  // 기존 영상번호 목록 불러오기
  const fetchExistingCodes = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/youtube/video-codes')
      const result = await response.json()

      if (result.success) {
        setExistingCodes(result.data || [])

        // 스토어 슬러그는 항상 API에서 가져옴 (유튜브 채널명 기반 또는 store-{user_id})
        // 영상번호가 없어도 storeSlug는 항상 존재
        if (result.storeSlug) {
          setSavedStoreSlug(result.storeSlug)
        }

        if (result.data && result.data.length > 0) {
          // 다음 영상번호 자동 생성
          const codes = result.data.map((item: YoutubeVideoCode) => item.video_code)
          const nextCode = generateNextVideoCode(codes)
          setForm(prev => ({ ...prev, videoCode: nextCode }))
        } else {
          // 첫 설정
          setForm(prev => ({ ...prev, videoCode: 'A001' }))
        }
      }
    } catch (error) {
      console.error('Failed to fetch video codes:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 모달 열릴 때 데이터 불러오기
  useEffect(() => {
    if (isOpen) {
      fetchExistingCodes()
      fetchProducts()
    }
  }, [isOpen, fetchExistingCodes, fetchProducts])

  // 모달 닫힐 때 초기화 (savedStoreSlug는 유지)
  useEffect(() => {
    if (!isOpen) {
      setForm({ videoCode: '', videoTitle: '', selectedProductId: '' })
      setMessage(null)
      setCopiedUrl(false)
      setProductSearch('')
      setIsProductDropdownOpen(false)
      // savedStoreSlug는 초기화하지 않음 - 항상 유지
    }
  }, [isOpen])

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

  // 선택된 상품
  const selectedProduct = products.find(p => p.id === form.selectedProductId)

  // 상품 URL 생성 (스마트스토어)
  const getProductUrl = (product: Product): string => {
    const storeId = product.my_sites?.store_id
    if (storeId && product.external_product_id) {
      return `https://smartstore.naver.com/${storeId}/products/${product.external_product_id}`
    }
    return ''
  }

  // 필터된 상품 목록
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  // 영상번호 생성
  const handleSubmit = async () => {
    if (!form.videoCode) {
      setMessage({ type: 'error', text: '영상번호를 입력해주세요' })
      return
    }

    if (!form.selectedProductId || !selectedProduct) {
      setMessage({ type: 'error', text: '상품을 선택해주세요' })
      return
    }

    const targetUrl = getProductUrl(selectedProduct)
    if (!targetUrl) {
      setMessage({ type: 'error', text: '상품 URL을 생성할 수 없습니다' })
      return
    }

    // 영상번호 형식 검증 (A001~Z999)
    const codePattern = /^[A-Z]\d{3}$/
    if (!codePattern.test(form.videoCode)) {
      setMessage({ type: 'error', text: '영상번호는 A001~Z999 형식이어야 합니다' })
      return
    }

    setCreating(true)
    try {
      const response = await fetch('/api/youtube/video-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoCode: form.videoCode,
          videoTitle: form.videoTitle || selectedProduct.name,
          targetUrl: targetUrl
        })
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: `영상번호 ${form.videoCode} 생성 완료!` })
        // 목록 새로고침
        await fetchExistingCodes()
        // 폼 초기화 (영상번호는 다음 번호로)
        setForm(prev => ({ ...prev, videoTitle: '', selectedProductId: '' }))
        setProductSearch('')
        onSuccess()
      } else {
        setMessage({ type: 'error', text: result.error || '생성에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '오류가 발생했습니다' })
    } finally {
      setCreating(false)
    }
  }

  // URL 복사
  const copySearchUrl = () => {
    navigator.clipboard.writeText(searchPageUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <Image
                  src="/channel_logo/youtube.png"
                  alt="YouTube"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">유튜브 쇼츠 영상번호</h3>
                <p className="text-sm text-slate-400">영상번호를 추가하세요</p>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              <span className="ml-3 text-slate-400">불러오는 중...</span>
            </div>
          )}

          {/* 메시지 */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
              {message.text}
            </div>
          )}

          {!loading && (
            <>
              {/* 검색 페이지 URL 표시 (항상) */}
              {searchPageUrl && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white">영상번호 검색 페이지</p>
                    <button
                      onClick={copySearchUrl}
                      className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                    >
                      {copiedUrl ? '복사됨!' : 'URL 복사'}
                    </button>
                  </div>
                  <p className="text-sm text-slate-300 font-mono bg-slate-900/50 px-3 py-2 rounded-lg break-all">
                    {searchPageUrl}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    시청자에게 이 주소를 안내하세요. 영상번호를 입력하면 상품 페이지로 이동합니다.
                  </p>
                </div>
              )}

              {/* 상품 선택 */}
              <div ref={dropdownRef} className="relative">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs mr-2">1</span>
                  상품 선택
                </label>

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
                  <div className="absolute z-20 w-full mt-2 rounded-xl bg-slate-700 border border-slate-600 shadow-xl">
                    {/* 상품 검색 */}
                    <div className="p-2 border-b border-slate-600">
                      <input
                        type="text"
                        placeholder="상품명 검색..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {/* 상품 목록 */}
                    <div className="max-h-48 overflow-y-auto">
                      {productsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-500"></div>
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
                        filteredProducts.slice(0, 10).map((product) => (
                          <button
                            key={product.id}
                            onClick={() => {
                              setForm(prev => ({ ...prev, selectedProductId: product.id }))
                              setIsProductDropdownOpen(false)
                              setProductSearch('')
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-600/50 border-b border-slate-600 last:border-b-0 text-left ${
                              form.selectedProductId === product.id ? 'bg-red-500/10' : ''
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
                              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))
                      )}
                      {filteredProducts.length > 10 && (
                        <p className="text-center text-xs text-slate-500 py-2">
                          +{filteredProducts.length - 10}개 더 (검색으로 찾기)
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 영상번호 입력 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs mr-2">2</span>
                  영상번호
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="A001"
                    value={form.videoCode}
                    onChange={(e) => setForm({ ...form, videoCode: e.target.value.toUpperCase() })}
                    maxLength={4}
                    className="w-32 h-11 px-4 rounded-xl bg-slate-700 border border-slate-600 text-white text-center font-mono text-lg placeholder:text-slate-500 focus:border-red-500"
                  />
                  <div className="flex-1 flex items-center text-sm text-slate-400">
                    <span>형식: A001 ~ Z999</span>
                  </div>
                </div>
              </div>

              {/* 영상 제목 (선택) */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-xs mr-2">
3
                  </span>
                  영상 제목
                  <span className="ml-2 text-xs text-slate-500">(선택)</span>
                </label>
                <input
                  type="text"
                  placeholder="예: 겨울 패딩 추천 영상"
                  value={form.videoTitle}
                  onChange={(e) => setForm({ ...form, videoTitle: e.target.value })}
                  className="w-full h-11 px-4 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-red-500"
                />
                <p className="text-xs text-slate-500 mt-1">구분을 위한 메모용입니다</p>
              </div>

              {/* 기존 영상번호 목록 */}
              {existingCodes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    등록된 영상번호 ({existingCodes.length}개)
                  </label>
                  <div className="max-h-40 overflow-y-auto rounded-xl bg-slate-700/50 border border-slate-600">
                    {existingCodes.map((code) => (
                      <div key={code.id} className="flex items-center justify-between px-4 py-2.5 border-b border-slate-600 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-lg font-bold text-red-400">{code.video_code}</span>
                          <span className="text-sm text-slate-400 truncate max-w-[200px]">
                            {code.post_name || '제목 없음'}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${code.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-400'}`}>
                          {code.status === 'active' ? '활성' : '비활성'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 버튼 */}
        {!loading && (
          <div className="p-6 border-t border-slate-700 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium"
            >
              닫기
            </button>
            <button
              onClick={handleSubmit}
              disabled={creating || !form.videoCode || !form.selectedProductId}
              className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  영상번호 추가
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
