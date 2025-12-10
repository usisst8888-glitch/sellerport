'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Slot {
  id: string
  name: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  target_url: string
  tracking_url: string
  clicks: number
  conversions: number
  status: string
  created_at: string
  products?: {
    name: string
    image_url: string | null
  } | null
}

interface Product {
  id: string
  name: string
  external_product_id: string
}

export default function ConversionsPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 폼 상태
  const [formData, setFormData] = useState({
    productId: '',
    utmSource: 'naver',
    utmMedium: 'cpc',
    utmCampaign: '',
    targetUrl: '',
    name: ''
  })

  const fetchSlots = async () => {
    try {
      const response = await fetch('/api/slots')
      const result = await response.json()
      if (result.success) {
        setSlots(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, external_product_id')
      .order('name')
    setProducts(data || [])
  }

  useEffect(() => {
    fetchSlots()
    fetchProducts()
  }, [])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreateSlot = async () => {
    if (!formData.utmCampaign || !formData.targetUrl) {
      setMessage({ type: 'error', text: '캠페인 이름과 목적지 URL을 입력해주세요' })
      return
    }

    setCreating(true)
    setMessage(null)

    try {
      const response = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formData.productId || null,
          utmSource: formData.utmSource,
          utmMedium: formData.utmMedium,
          utmCampaign: formData.utmCampaign,
          targetUrl: formData.targetUrl,
          name: formData.name || `${formData.utmSource} - ${formData.utmCampaign}`
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: '슬롯이 발급되었습니다' })
        setShowCreateModal(false)
        setFormData({
          productId: '',
          utmSource: 'naver',
          utmMedium: 'cpc',
          utmCampaign: '',
          targetUrl: '',
          name: ''
        })
        fetchSlots()
      } else {
        setMessage({ type: 'error', text: result.error || '슬롯 발급에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '슬롯 발급 중 오류가 발생했습니다' })
    } finally {
      setCreating(false)
    }
  }

  const totalClicks = slots.reduce((sum, s) => sum + (s.clicks || 0), 0)
  const totalConversions = slots.reduce((sum, s) => sum + (s.conversions || 0), 0)
  const avgConversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00'
  const activeSlots = slots.filter(s => s.status === 'active').length

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">전환 추적</h1>
          <p className="text-slate-400 mt-1">슬롯과 UTM 태그로 광고 전환을 정확히 추적하세요</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 슬롯 발급
        </button>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">활성 슬롯</p>
          <p className="text-2xl font-bold text-white mt-1">{activeSlots}<span className="text-sm font-normal text-slate-400 ml-1">개</span></p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">총 클릭</p>
          <p className="text-2xl font-bold text-white mt-1">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">총 전환</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{totalConversions.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">평균 전환율</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{avgConversionRate}%</p>
        </div>
      </div>

      {/* UTM 가이드 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/30 to-slate-800/40 border border-blue-500/20 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            UTM 태그란?
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            UTM 태그는 광고 링크에 붙이는 추적 코드입니다. 어떤 광고에서 얼마나 팔렸는지 정확히 알 수 있습니다.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-blue-400 font-medium mb-1">utm_source</p>
              <p className="text-sm text-slate-300">트래픽 출처 (naver, google, meta)</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-blue-400 font-medium mb-1">utm_medium</p>
              <p className="text-sm text-slate-300">매체 유형 (cpc, display, social)</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-blue-400 font-medium mb-1">utm_campaign</p>
              <p className="text-sm text-slate-300">캠페인 이름 (여름세일, 신제품출시)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 슬롯 목록 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">발급된 슬롯</h2>
          <p className="text-sm text-slate-400 mt-0.5">각 슬롯별 전환 추적 현황</p>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : slots.length > 0 ? (
            slots.map((slot) => {
              const conversionRate = slot.clicks > 0 ? ((slot.conversions / slot.clicks) * 100).toFixed(2) : '0.00'
              return (
                <div key={slot.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 text-xs font-mono bg-slate-700 text-slate-300 rounded">
                          {slot.id}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          slot.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {slot.status === 'active' ? '활성' : '비활성'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white mb-1">{slot.name}</p>
                      {slot.products?.name && (
                        <p className="text-xs text-slate-500">{slot.products.name}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-sm font-medium text-white">{(slot.clicks || 0).toLocaleString()}</p>
                        <p className="text-xs text-slate-500">클릭</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-400">{slot.conversions || 0}</p>
                        <p className="text-xs text-slate-500">전환</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-400">{conversionRate}%</p>
                        <p className="text-xs text-slate-500">전환율</p>
                      </div>
                    </div>
                  </div>

                  {/* UTM 정보 */}
                  <div className="mt-4 p-3 bg-slate-900/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-slate-500">추적 URL</p>
                      <button
                        onClick={() => copyToClipboard(slot.tracking_url, slot.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === slot.id ? (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            복사됨
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            복사
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs font-mono text-slate-400 break-all">{slot.tracking_url}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
                        {slot.utm_source}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
                        {slot.utm_medium}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
                        {slot.utm_campaign}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <p className="text-slate-400 mb-2">아직 발급된 슬롯이 없습니다</p>
              <p className="text-sm text-slate-500 mb-4">새 슬롯을 발급하고 전환을 추적하세요</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                첫 슬롯 발급하기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 슬롯 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">새 슬롯 발급</h3>
              <p className="text-sm text-slate-400 mt-1">광고 전환을 추적할 새 슬롯을 만드세요</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">슬롯 이름 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 네이버 겨울 세일 캠페인"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">목적지 URL *</label>
                <input
                  type="url"
                  placeholder="https://smartstore.naver.com/mystore/products/1234567890"
                  value={formData.targetUrl}
                  onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">클릭 시 이동할 상품 페이지 URL</p>
              </div>

              {products.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">상품 연결 (선택)</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="">상품 선택 안함</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">트래픽 소스 (utm_source)</label>
                <select
                  value={formData.utmSource}
                  onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="naver">네이버</option>
                  <option value="google">구글</option>
                  <option value="meta">메타 (페이스북/인스타)</option>
                  <option value="kakao">카카오</option>
                  <option value="youtube">유튜브</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">매체 유형 (utm_medium)</label>
                <select
                  value={formData.utmMedium}
                  onChange={(e) => setFormData({ ...formData, utmMedium: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="cpc">CPC (클릭당 과금)</option>
                  <option value="cpm">CPM (노출당 과금)</option>
                  <option value="display">디스플레이</option>
                  <option value="social">소셜</option>
                  <option value="email">이메일</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">캠페인 이름 (utm_campaign) *</label>
                <input
                  type="text"
                  placeholder="예: winter_sale_2024"
                  value={formData.utmCampaign}
                  onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateSlot}
                disabled={creating || !formData.utmCampaign || !formData.targetUrl}
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
                ) : '슬롯 발급'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
