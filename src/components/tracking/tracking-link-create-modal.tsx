'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Select } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface Product {
  id: string
  name: string
  external_product_id: string
  price: number
  cost: number
  image_url: string | null
  site_type: string
  my_site_id: string
  my_sites?: {
    id: string
    site_type: string
    site_name: string
    store_id?: string | null
  } | null
}

interface MySite {
  id: string
  site_type: string
  site_name: string
  store_id?: string | null
  status: string
  metadata?: {
    conversion_type?: 'shopping' | 'signup' | 'db'
  } | null
}

interface TrackingLinkCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function TrackingLinkCreateModal({ isOpen, onClose, onSuccess }: TrackingLinkCreateModalProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [mySites, setMySites] = useState<MySite[]>([])
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const [formData, setFormData] = useState({
    siteId: '',
    productId: '',
    utmSource: 'naver',
    utmMedium: 'paid',
    utmCampaign: '',
    targetUrl: '',
    adSpend: 0,
    targetRoasGreen: 300,
    targetRoasYellow: 150
  })

  // 상품 선택 시 목적지 URL 자동 생성
  const generateProductUrl = (product: Product): string => {
    const siteType = product.site_type || product.my_sites?.site_type
    const storeId = product.my_sites?.store_id

    if (siteType === 'naver') {
      if (storeId) {
        return `https://smartstore.naver.com/${storeId}/products/${product.external_product_id}`
      }
      return `https://smartstore.naver.com/products/${product.external_product_id}`
    } else if (siteType === 'coupang') {
      return `https://www.coupang.com/vp/products/${product.external_product_id}`
    } else if (siteType === 'custom') {
      return ''
    }
    return ''
  }

  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId)
    if (selectedProduct) {
      const url = generateProductUrl(selectedProduct)
      setFormData({
        ...formData,
        productId,
        targetUrl: url
      })
    } else {
      setFormData({ ...formData, productId: '', targetUrl: '' })
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products')
      const result = await response.json()
      if (result.success) {
        setProducts(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const fetchMySites = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('my_sites')
        .select('*')
        .eq('status', 'connected')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch my sites:', error)
        return
      }
      setMySites(data || [])
    } catch (error) {
      console.error('Failed to fetch my sites:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchProducts()
      fetchMySites()
    }
  }, [isOpen])

  // 메시지 3초 후 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleCreateTrackingLink = async () => {
    if (!formData.utmCampaign || !formData.targetUrl) {
      setMessage({ type: 'error', text: '추적 링크 이름과 목적지 URL을 입력해주세요' })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/tracking-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formData.productId || null,
          utmSource: formData.utmSource,
          utmMedium: formData.utmMedium,
          utmCampaign: formData.utmCampaign,
          targetUrl: formData.targetUrl,
          adSpend: formData.adSpend || 0,
          targetRoasGreen: formData.targetRoasGreen,
          targetRoasYellow: formData.targetRoasYellow
        })
      })

      const result = await response.json()

      if (result.success) {
        setFormData({
          siteId: '',
          productId: '',
          utmSource: 'naver',
          utmMedium: 'paid',
          utmCampaign: '',
          targetUrl: '',
          adSpend: 0,
          targetRoasGreen: 300,
          targetRoasYellow: 150
        })
        onSuccess?.()
        onClose()
      } else {
        setMessage({ type: 'error', text: result.error || '추적 링크 발급에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '추적 링크 발급 중 오류가 발생했습니다' })
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex-shrink-0">
          <h3 className="text-lg font-semibold text-white">새 추적 링크 발급</h3>
          <p className="text-sm text-slate-400 mt-1">광고 전환을 추적할 새 추적 링크를 만드세요</p>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`mx-6 mt-4 p-3 rounded-xl border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <div className="flex items-center gap-2 text-sm">
              {message.type === 'success' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* 내 사이트 선택 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              내 사이트 선택 *
            </label>
            {mySites.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {mySites.map(site => (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        siteId: site.id,
                        productId: '',
                        targetUrl: ''
                      })
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.siteId === site.id
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                        : 'border-white/10 bg-slate-900/50 hover:border-white/20 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        site.site_type === 'naver' ? 'bg-green-500/20' :
                        site.site_type === 'coupang' ? 'bg-red-500/20' : 'bg-slate-500/20'
                      }`}>
                        {site.site_type === 'naver' ? (
                          <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
                          </svg>
                        ) : site.site_type === 'coupang' ? (
                          <span className="text-red-400 font-bold text-sm">C</span>
                        ) : (
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${
                          formData.siteId === site.id ? 'text-white' : 'text-slate-200'
                        }`}>
                          {site.site_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {site.site_type === 'naver' ? '스마트스토어' :
                           site.site_type === 'coupang' ? '쿠팡 마켓플레이스' :
                           site.site_type === 'custom' ? '일반 웹사이트' : site.site_type}
                        </p>
                      </div>
                      {formData.siteId === site.id && (
                        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-400 mb-2">연동된 사이트가 없습니다</p>
                <p className="text-xs text-slate-400">
                  먼저 <a href="/quick-start" className="text-blue-400 hover:underline">빠른 시작</a>에서 사이트를 연동해주세요.
                </p>
              </div>
            )}
          </div>

          {/* 상품 선택 */}
          {formData.siteId && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                추적할 상품 선택 *
              </label>
              {(() => {
                const filteredProducts = products.filter(p => p.my_site_id === formData.siteId)

                if (filteredProducts.length > 0) {
                  return (
                    <div className="space-y-2">
                      <Select
                        value={formData.productId}
                        onChange={(e) => handleProductSelect(e.target.value)}
                      >
                        <option value="">상품을 선택하세요</option>
                        {filteredProducts.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} ({product.price.toLocaleString()}원)
                          </option>
                        ))}
                      </Select>
                      {formData.productId && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          {(() => {
                            const selected = products.find(p => p.id === formData.productId)
                            return selected ? (
                              <>
                                {selected.image_url && (
                                  <img src={selected.image_url} alt={selected.name} className="w-12 h-12 rounded-lg object-cover" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{selected.name}</p>
                                  <p className="text-xs text-slate-400">
                                    {selected.my_sites?.site_name || selected.site_type} · {selected.price.toLocaleString()}원
                                  </p>
                                </div>
                              </>
                            ) : null
                          })()}
                        </div>
                      )}
                    </div>
                  )
                } else {
                  return (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <p className="text-sm text-amber-400 mb-2">선택한 사이트에 상품이 없습니다</p>
                      <p className="text-xs text-slate-400">
                        <a href="/my-sites" className="text-blue-400 hover:underline">내 사이트</a>에서 상품을 동기화해주세요.
                      </p>
                    </div>
                  )
                }
              })()}
            </div>
          )}

          {/* 추적 링크 이름 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">추적 링크 이름 *</label>
            <input
              type="text"
              placeholder="예: 인스타_겨울세일_2024"
              value={formData.utmCampaign}
              onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-slate-500 mt-1">추적 링크를 구분할 수 있는 이름을 입력하세요</p>
          </div>

          {/* 목적지 URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              목적지 URL *
              {formData.productId && <span className="text-xs text-blue-400 ml-2">(자동 설정됨)</span>}
            </label>
            <input
              type="url"
              placeholder="https://smartstore.naver.com/mystore/products/1234567890"
              value={formData.targetUrl}
              onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
            />
            <p className="text-xs text-slate-500 mt-1">
              {formData.productId
                ? '상품 선택 시 자동으로 설정됩니다. 직접 수정도 가능합니다.'
                : '클릭 시 이동할 상품 페이지 URL'}
            </p>
          </div>

          {/* 유입 경로 선택 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">유입 경로 선택 *</label>
            <p className="text-xs text-slate-500 mb-3">이 추적 링크를 어디서 사용할 예정인가요?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { value: 'instagram', label: '인스타그램', icon: '/channel_logo/insta.png' },
                { value: 'youtube', label: '유튜브', icon: '/channel_logo/youtube.png' },
                { value: 'blog', label: '블로그', icon: '/channel_logo/naver_blog.png' },
                { value: 'meta', label: '메타 광고', icon: '/channel_logo/meta.png' },
                { value: 'google', label: '구글 광고', icon: '/channel_logo/google_ads.png' },
                { value: 'naver', label: '네이버 광고', icon: '/channel_logo/naver_search.png' },
                { value: 'tiktok', label: '틱톡', icon: '/channel_logo/tiktok.png' },
                { value: 'influencer', label: '인플루언서', icon: '/channel_logo/influencer.png' },
                { value: 'thread', label: '스레드', icon: '/channel_logo/thread.png' },
                { value: 'experience', label: '체험단', icon: '/channel_logo/experience.png' },
                { value: 'toss', label: '토스', icon: '/channel_logo/toss.png' },
                { value: 'etc', label: '기타', icon: null },
              ].map((source) => (
                <button
                  key={source.value}
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    utmSource: source.value,
                    utmMedium: ['meta', 'google', 'naver', 'tiktok', 'toss'].includes(source.value) ? 'paid' : 'organic'
                  })}
                  className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2 ${
                    formData.utmSource === source.value
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-slate-900/50 hover:border-white/20'
                  }`}
                >
                  {source.icon ? (
                    <Image src={source.icon} alt={source.label} width={24} height={24} className="rounded" />
                  ) : (
                    <span className="w-6 h-6 flex items-center justify-center text-slate-400 text-lg">+</span>
                  )}
                  <span className="text-sm text-white">{source.label}</span>
                </button>
              ))}
            </div>
            {formData.utmSource && ['meta', 'google', 'naver', 'tiktok', 'toss'].includes(formData.utmSource) && (
              <p className="text-xs text-blue-400 mt-3">
                광고 채널을 연동하면 광고비가 자동으로 수집되어 ROAS를 확인할 수 있어요
              </p>
            )}
          </div>

          {/* ROAS 기준 설정 */}
          <div className="p-4 rounded-xl bg-slate-900/30 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">ROAS 신호등 기준 설정</label>
                <p className="text-xs text-slate-500 mt-0.5">이 추적 링크의 광고 효율 기준을 설정하세요</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 mb-2">
                  초록불 기준
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.targetRoasGreen}
                    onChange={(e) => setFormData({ ...formData, targetRoasGreen: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
                    min="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">이상이면 효율 좋음</p>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-amber-400 mb-2">
                  노란불 기준
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.targetRoasYellow}
                    onChange={(e) => setFormData({ ...formData, targetRoasYellow: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none transition-colors"
                    min="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">%</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">이상이면 보통, 미만이면 주의</p>
              </div>
            </div>

            {formData.targetRoasGreen <= formData.targetRoasYellow && (
              <div className="mt-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400">초록불 기준은 노란불 기준보다 높아야 합니다</p>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-white/5">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400">
                  {formData.targetRoasGreen}%+
                </span>
                <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400">
                  {formData.targetRoasYellow}%~{formData.targetRoasGreen - 1}%
                </span>
                <span className="px-2 py-1 rounded bg-red-500/10 text-red-400">
                  {formData.targetRoasYellow}% 미만
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 flex gap-3 justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleCreateTrackingLink}
            disabled={creating || !formData.utmCampaign || !formData.targetUrl || formData.targetRoasGreen <= formData.targetRoasYellow}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                발급 중...
              </>
            ) : '추적 링크 발급'}
          </button>
        </div>
      </div>
    </div>
  )
}
