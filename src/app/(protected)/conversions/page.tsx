'use client'

import { useState, useEffect } from 'react'
import { Select } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

interface TrackingLink {
  id: string
  name: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  target_url: string
  tracking_url: string
  pixel_shop_url: string | null
  go_url: string | null
  clicks: number
  conversions: number
  revenue: number
  ad_spend: number
  status: string
  created_at: string
  products?: {
    id: string
    name: string
    image_url: string | null
    price: number
    cost: number
  } | null
}

interface Product {
  id: string
  name: string
  external_product_id: string
  price: number
  cost: number
  image_url: string | null
  platform_type: string
  platform_id: string
  platforms?: {
    id: string
    platform_type: string
    platform_name: string
  } | null
}

interface Platform {
  id: string
  platform_type: string
  platform_name: string
  status: string
}

// ROAS 기준 신호등 색상 반환
function getSignalLight(roas: number): { color: string; bg: string; text: string; label: string } {
  if (roas >= 300) return { color: 'emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '🟢 좋음' }
  if (roas >= 150) return { color: 'amber', bg: 'bg-amber-500/20', text: 'text-amber-400', label: '🟡 보통' }
  return { color: 'red', bg: 'bg-red-500/20', text: 'text-red-400', label: '🔴 주의' }
}

export default function ConversionsPage() {
  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 폼 상태
  const [formData, setFormData] = useState({
    platformId: '',
    productId: '',
    utmSource: 'naver',
    utmMedium: 'paid', // 'paid' 또는 'direct'
    utmCampaign: '',
    targetUrl: '',
    name: '',
    adSpend: 0 // 광고비
  })

  // 광고비 수정 모달
  const [editingLink, setEditingLink] = useState<TrackingLink | null>(null)
  const [editAdSpend, setEditAdSpend] = useState(0)

  // 추적 링크 수정 모달
  const [editingLinkFull, setEditingLinkFull] = useState<TrackingLink | null>(null)
  const [editForm, setEditForm] = useState({ name: '', status: 'active' })
  const [updating, setUpdating] = useState(false)

  // 삭제 확인 모달
  const [deletingLink, setDeletingLink] = useState<TrackingLink | null>(null)
  const [deleting, setDeleting] = useState(false)

  // 상품 선택 시 목적지 URL 자동 생성
  const generateProductUrl = (product: Product): string => {
    const platformType = product.platform_type || product.platforms?.platform_type

    if (platformType === 'naver') {
      // 네이버 스마트스토어 상품 URL
      // external_product_id가 originProductNo인 경우
      return `https://smartstore.naver.com/products/${product.external_product_id}`
    } else if (platformType === 'coupang') {
      return `https://www.coupang.com/vp/products/${product.external_product_id}`
    } else if (platformType === 'custom') {
      // 자체 사이트의 경우 기본 URL 반환 안함
      return ''
    }
    return ''
  }

  // 상품 선택 핸들러
  const handleProductSelect = (productId: string) => {
    const selectedProduct = products.find(p => p.id === productId)
    if (selectedProduct) {
      const url = generateProductUrl(selectedProduct)
      setFormData({
        ...formData,
        productId,
        targetUrl: url,
        name: formData.name || selectedProduct.name // 이름이 비어있으면 상품명 사용
      })
    } else {
      setFormData({ ...formData, productId: '', targetUrl: '' })
    }
  }

  const fetchTrackingLinks = async () => {
    try {
      const response = await fetch('/api/tracking-links')
      const result = await response.json()
      if (result.success) {
        setTrackingLinks(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch tracking links:', error)
    } finally {
      setLoading(false)
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

  const fetchPlatforms = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('platforms')
        .select('*')
        .eq('status', 'connected')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch platforms:', error)
        return
      }
      setPlatforms(data || [])
    } catch (error) {
      console.error('Failed to fetch platforms:', error)
    }
  }

  // 광고비 업데이트
  const handleUpdateAdSpend = async () => {
    if (!editingLink) return

    try {
      const response = await fetch(`/api/tracking-links/${editingLink.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adSpend: editAdSpend })
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: '광고비가 업데이트되었습니다' })
        setEditingLink(null)
        fetchTrackingLinks()
      } else {
        setMessage({ type: 'error', text: result.error || '업데이트에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '업데이트 중 오류가 발생했습니다' })
    }
  }

  // 추적 링크 수정
  const handleUpdateTrackingLink = async () => {
    if (!editingLinkFull) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/tracking-links/${editingLinkFull.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          status: editForm.status
        })
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: '추적 링크가 수정되었습니다' })
        setEditingLinkFull(null)
        fetchTrackingLinks()
      } else {
        setMessage({ type: 'error', text: result.error || '수정에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '수정 중 오류가 발생했습니다' })
    } finally {
      setUpdating(false)
    }
  }

  // 추적 링크 삭제
  const handleDeleteTrackingLink = async () => {
    if (!deletingLink) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/tracking-links/${deletingLink.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: '추적 링크가 삭제되었습니다' })
        setDeletingLink(null)
        fetchTrackingLinks()
      } else {
        setMessage({ type: 'error', text: result.error || '삭제에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '삭제 중 오류가 발생했습니다' })
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    fetchTrackingLinks()
    fetchProducts()
    fetchPlatforms()
  }, [])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreateTrackingLink = async () => {
    if (!formData.utmCampaign || !formData.targetUrl) {
      setMessage({ type: 'error', text: '캠페인 이름과 목적지 URL을 입력해주세요' })
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
          name: formData.name || `${formData.utmSource} - ${formData.utmCampaign}`,
          adSpend: formData.adSpend || 0
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: '추적 링크가 발급되었습니다' })
        setShowCreateModal(false)
        setFormData({
          platformId: '',
          productId: '',
          utmSource: 'naver',
          utmMedium: 'paid',
          utmCampaign: '',
          targetUrl: '',
          name: '',
          adSpend: 0
        })
        fetchTrackingLinks()
      } else {
        setMessage({ type: 'error', text: result.error || '추적 링크 발급에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '추적 링크 발급 중 오류가 발생했습니다' })
    } finally {
      setCreating(false)
    }
  }

  const totalClicks = trackingLinks.reduce((sum, s) => sum + (s.clicks || 0), 0)
  const totalConversions = trackingLinks.reduce((sum, s) => sum + (s.conversions || 0), 0)
  const totalRevenue = trackingLinks.reduce((sum, s) => sum + (s.revenue || 0), 0)
  const totalAdSpend = trackingLinks.reduce((sum, s) => sum + (s.ad_spend || 0), 0)
  const avgConversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00'
  const totalRoas = totalAdSpend > 0 ? Math.round((totalRevenue / totalAdSpend) * 100) : 0
  const activeLinks = trackingLinks.filter(s => s.status === 'active').length

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">전환 추적</h1>
          <p className="text-slate-400 mt-1">추적 링크로 광고 전환을 정확히 추적하세요</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 추적 링크 발급
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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">활성 링크</p>
          <p className="text-2xl font-bold text-white mt-1">{activeLinks}<span className="text-sm font-normal text-slate-400 ml-1">개</span></p>
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
          <p className="text-xs text-slate-500 uppercase tracking-wider">총 광고비</p>
          <p className="text-2xl font-bold text-white mt-1">{totalAdSpend.toLocaleString()}<span className="text-sm font-normal text-slate-400 ml-1">원</span></p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">총 매출</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{totalRevenue.toLocaleString()}<span className="text-sm font-normal text-slate-400 ml-1">원</span></p>
        </div>
        <div className={`rounded-xl border p-4 ${totalRoas >= 300 ? 'bg-emerald-500/10 border-emerald-500/30' : totalRoas >= 150 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <p className="text-xs text-slate-500 uppercase tracking-wider">전체 ROAS</p>
          <p className={`text-2xl font-bold mt-1 ${totalRoas >= 300 ? 'text-emerald-400' : totalRoas >= 150 ? 'text-amber-400' : 'text-red-400'}`}>
            {totalRoas}%
            <span className="text-sm font-normal ml-1">{totalRoas >= 300 ? '🟢' : totalRoas >= 150 ? '🟡' : '🔴'}</span>
          </p>
        </div>
      </div>

      {/* 추적 링크 가이드 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/30 to-slate-800/40 border border-blue-500/20 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            추적 링크란?
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            추적 링크는 광고에서 얼마나 팔렸는지 정확히 알 수 있게 해주는 특수 링크입니다. 광고마다 다른 링크를 사용하세요.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-blue-400 font-medium mb-1">트래픽 출처</p>
              <p className="text-sm text-slate-300">어디서 유입? (네이버, 구글, 메타)</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-blue-400 font-medium mb-1">매체 유형</p>
              <p className="text-sm text-slate-300">어떤 광고? (검색광고, 디스플레이, SNS)</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-xs text-blue-400 font-medium mb-1">캠페인 이름</p>
              <p className="text-sm text-slate-300">무슨 목적? (여름세일, 신제품출시)</p>
            </div>
          </div>
        </div>
      </div>

      {/* 추적 링크 목록 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">발급된 추적 링크</h2>
          <p className="text-sm text-slate-400 mt-0.5">각 추적 링크별 전환 추적 현황</p>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : trackingLinks.length > 0 ? (
            trackingLinks.map((link) => {
              const conversionRate = link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(2) : '0.00'
              const linkRoas = link.ad_spend > 0 ? Math.round((link.revenue / link.ad_spend) * 100) : 0
              const signal = getSignalLight(linkRoas)
              return (
                <div key={link.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {/* ROAS 신호등 */}
                        {link.ad_spend > 0 && (
                          <span className={`px-2 py-0.5 text-xs rounded ${signal.bg} ${signal.text}`}>
                            {signal.label} {linkRoas}%
                          </span>
                        )}
                        <span className="px-2 py-0.5 text-xs font-mono bg-slate-700 text-slate-300 rounded">
                          {link.id}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          link.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {link.status === 'active' ? '활성' : '비활성'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-white mb-1">{link.name}</p>
                      {link.products?.name && (
                        <p className="text-xs text-slate-500">🛒 {link.products.name}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <p className="text-sm font-medium text-white">{(link.clicks || 0).toLocaleString()}</p>
                        <p className="text-xs text-slate-500">클릭</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-emerald-400">{link.conversions || 0}</p>
                        <p className="text-xs text-slate-500">전환</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-400">{(link.revenue || 0).toLocaleString()}원</p>
                        <p className="text-xs text-slate-500">매출</p>
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            setEditingLink(link)
                            setEditAdSpend(link.ad_spend || 0)
                          }}
                          className="text-sm font-medium text-white hover:text-blue-400 transition-colors"
                        >
                          {(link.ad_spend || 0).toLocaleString()}원
                        </button>
                        <p className="text-xs text-slate-500">광고비 ✏️</p>
                      </div>
                      {/* 수정/삭제 버튼 */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingLinkFull(link)
                            setEditForm({ name: link.name, status: link.status })
                          }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="추적 링크 수정"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDeletingLink(link)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="추적 링크 삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* UTM 정보 및 URL */}
                  <div className="mt-4 p-3 bg-slate-900/50 rounded-xl space-y-3">
                    {/* 픽셀샵 URL (광고용) */}
                    {link.pixel_shop_url && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            광고용 URL (픽셀샵)
                          </p>
                          <button
                            onClick={() => copyToClipboard(link.pixel_shop_url!, `${link.id}-pixel`)}
                            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
                          >
                            {copiedId === `${link.id}-pixel` ? '복사됨 ✓' : '복사'}
                          </button>
                        </div>
                        <p className="text-xs font-mono text-purple-300/70 break-all">{link.pixel_shop_url}</p>
                        <p className="text-xs text-slate-600 mt-1">메타/구글 광고에 사용 (사용자 클릭 후 이동)</p>
                      </div>
                    )}

                    {/* Go URL (유기적 채널용) */}
                    {link.go_url && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            {link.pixel_shop_url ? '블로그/SNS용 URL' : '추적 URL'}
                          </p>
                          <button
                            onClick={() => copyToClipboard(link.go_url!, `${link.id}-go`)}
                            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                          >
                            {copiedId === `${link.id}-go` ? '복사됨 ✓' : '복사'}
                          </button>
                        </div>
                        <p className="text-xs font-mono text-emerald-300/70 break-all">{link.go_url}</p>
                        <p className="text-xs text-slate-600 mt-1">블로그/인플루언서에 사용 (즉시 리다이렉트)</p>
                      </div>
                    )}

                    {/* 기존 tracking_url (pixel/go가 없는 경우) */}
                    {!link.pixel_shop_url && !link.go_url && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-slate-500">추적 URL</p>
                          <button
                            onClick={() => copyToClipboard(link.tracking_url, link.id)}
                            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                          >
                            {copiedId === link.id ? '복사됨 ✓' : '복사'}
                          </button>
                        </div>
                        <p className="text-xs font-mono text-slate-400 break-all">{link.tracking_url}</p>
                      </div>
                    )}

                    {/* 추적 태그 */}
                    <div className="flex gap-2 pt-2 border-t border-white/5">
                      <span className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
                        출처: {link.utm_source}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
                        매체: {link.utm_medium}
                      </span>
                      <span className="px-2 py-0.5 text-xs bg-slate-700/50 text-slate-400 rounded">
                        캠페인: {link.utm_campaign}
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
              <p className="text-slate-400 mb-2">아직 발급된 추적 링크가 없습니다</p>
              <p className="text-sm text-slate-500 mb-4">새 추적 링크를 발급하고 전환을 추적하세요</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                첫 추적 링크 발급하기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 추적 링크 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">새 추적 링크 발급</h3>
              <p className="text-sm text-slate-400 mt-1">광고 전환을 추적할 새 추적 링크를 만드세요</p>
            </div>

            <div className="p-6 space-y-4">
              {/* 플랫폼 선택 - 맨 위 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  판매 플랫폼 선택 *
                </label>
                {platforms.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {platforms.map(platform => (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, platformId: platform.id, productId: '', targetUrl: '' })}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.platformId === platform.id
                            ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                            : 'border-white/10 bg-slate-900/50 hover:border-white/20 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* 플랫폼 아이콘 */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            platform.platform_type === 'naver' ? 'bg-green-500/20' :
                            platform.platform_type === 'coupang' ? 'bg-red-500/20' : 'bg-slate-500/20'
                          }`}>
                            {platform.platform_type === 'naver' ? (
                              <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
                              </svg>
                            ) : platform.platform_type === 'coupang' ? (
                              <span className="text-red-400 font-bold text-sm">C</span>
                            ) : (
                              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${
                              formData.platformId === platform.id ? 'text-white' : 'text-slate-200'
                            }`}>
                              {platform.platform_name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {platform.platform_type === 'naver' ? '스마트스토어' :
                               platform.platform_type === 'coupang' ? '쿠팡 마켓플레이스' : platform.platform_type}
                            </p>
                          </div>
                          {/* 선택 표시 체크 */}
                          {formData.platformId === platform.id && (
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
                    <p className="text-sm text-amber-400 mb-2">연동된 플랫폼이 없습니다</p>
                    <p className="text-xs text-slate-400">
                      먼저 <a href="/platforms" className="text-blue-400 hover:underline">플랫폼 연동</a>을 완료해주세요.
                    </p>
                  </div>
                )}
              </div>

              {/* 상품 선택 - 플랫폼 선택 후 표시 */}
              {formData.platformId && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    추적할 상품 선택 *
                  </label>
                  {(() => {
                    // 선택된 플랫폼의 상품만 필터링
                    const filteredProducts = products.filter(p => p.platform_id === formData.platformId)

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
                                        {selected.platforms?.platform_name || selected.platform_type} · {selected.price.toLocaleString()}원
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
                          <p className="text-sm text-amber-400 mb-2">선택한 플랫폼에 상품이 없습니다</p>
                          <p className="text-xs text-slate-400">
                            <a href="/platforms" className="text-blue-400 hover:underline">플랫폼 관리</a>에서 상품을 동기화해주세요.
                          </p>
                        </div>
                      )
                    }
                  })()}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">추적 링크 이름 (선택)</label>
                <input
                  type="text"
                  placeholder="예: 네이버 겨울 세일 캠페인"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

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
                  {formData.productId ? '상품 선택 시 자동으로 설정됩니다. 직접 수정도 가능합니다.' : '클릭 시 이동할 상품 페이지 URL'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">트래픽 출처</label>
                <Select
                  value={formData.utmSource}
                  onChange={(e) => setFormData({ ...formData, utmSource: e.target.value })}
                >
                  <option value="naver">네이버</option>
                  <option value="google">구글</option>
                  <option value="meta">메타 (페이스북/인스타)</option>
                  <option value="kakao">카카오</option>
                  <option value="youtube">유튜브</option>
                  <option value="tiktok">틱톡</option>
                  <option value="blog">블로그</option>
                  <option value="instagram">인스타그램</option>
                  <option value="cafe">카페/커뮤니티</option>
                  <option value="direct">다이렉트 (직접 유입)</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">광고 유형</label>
                <div className="grid grid-cols-2 gap-3">
                  {/* 유료 광고 버튼 */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, utmMedium: 'paid', adSpend: 0 })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.utmMedium === 'paid'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-slate-900/50 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.utmMedium === 'paid' ? 'border-blue-500' : 'border-slate-500'
                      }`}>
                        {formData.utmMedium === 'paid' && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                      </div>
                      <span className="text-white font-medium">유료 광고</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      네이버 검색광고, 구글 애즈, 메타 광고, 카카오모먼트 등 광고 플랫폼에서 집행하는 광고
                    </p>
                  </button>

                  {/* 직접 광고 버튼 */}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, utmMedium: 'direct', adSpend: 0 })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.utmMedium === 'direct'
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-white/10 bg-slate-900/50 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.utmMedium === 'direct' ? 'border-emerald-500' : 'border-slate-500'
                      }`}>
                        {formData.utmMedium === 'direct' && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        )}
                      </div>
                      <span className="text-white font-medium">직접 광고</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      인플루언서 협찬, 블로그 체험단, 내 SNS 채널, 이메일, SMS 등 직접 운영하는 마케팅
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">캠페인 이름 *</label>
                <input
                  type="text"
                  placeholder="예: winter_sale_2024"
                  value={formData.utmCampaign}
                  onChange={(e) => setFormData({ ...formData, utmCampaign: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 광고비 - 직접 광고 선택 시에만 표시 */}
              {formData.utmMedium === 'direct' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">광고비 (선택)</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.adSpend || ''}
                      onChange={(e) => setFormData({ ...formData, adSpend: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">이 채널에 투입한 비용이 있다면 입력하세요 (ROAS 계산에 사용)</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateTrackingLink}
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
                ) : '추적 링크 발급'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 광고비 수정 모달 */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">광고비 수정</h3>
              <p className="text-sm text-slate-400 mt-1">{editingLink.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">광고비</label>
                <div className="relative">
                  <input
                    type="number"
                    value={editAdSpend}
                    onChange={(e) => setEditAdSpend(Number(e.target.value))}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                </div>
              </div>

              {/* 예상 ROAS 표시 */}
              {editAdSpend > 0 && (
                <div className="p-3 rounded-xl bg-slate-900/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">예상 ROAS</span>
                    <span className={`font-medium ${
                      Math.round((editingLink.revenue / editAdSpend) * 100) >= 300 ? 'text-emerald-400' :
                      Math.round((editingLink.revenue / editAdSpend) * 100) >= 150 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {Math.round((editingLink.revenue / editAdSpend) * 100)}%
                      {Math.round((editingLink.revenue / editAdSpend) * 100) >= 300 ? ' 🟢' :
                       Math.round((editingLink.revenue / editAdSpend) * 100) >= 150 ? ' 🟡' : ' 🔴'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => setEditingLink(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateAdSpend}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 추적 링크 수정 모달 */}
      {editingLinkFull && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">추적 링크 수정</h3>
              <p className="text-sm text-slate-400 mt-1">추적 링크 정보를 수정합니다</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">추적 링크 이름</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">상태</label>
                <Select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </Select>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/50">
                <p className="text-xs text-slate-500 mb-2">추적 링크 정보</p>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-400">ID: <span className="text-white font-mono">{editingLinkFull.id}</span></p>
                  <p className="text-slate-400">출처: <span className="text-white">{editingLinkFull.utm_source}</span></p>
                  <p className="text-slate-400">매체: <span className="text-white">{editingLinkFull.utm_medium}</span></p>
                  <p className="text-slate-400">캠페인: <span className="text-white">{editingLinkFull.utm_campaign}</span></p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => setEditingLinkFull(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateTrackingLink}
                disabled={updating}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
              >
                {updating ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deletingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">추적 링크 삭제</h3>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">{deletingLink.name}</p>
                  <p className="text-sm text-slate-400">이 추적 링크를 삭제하시겠습니까?</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                삭제하면 이 추적 링크의 모든 추적 데이터가 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => setDeletingLink(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteTrackingLink}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
