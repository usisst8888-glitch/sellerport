'use client'

import { useState, useEffect } from 'react'

type TrafficLight = 'green' | 'yellow' | 'red' | 'gray'
type CampaignStatus = 'running' | 'paused' | 'stopped'

interface Campaign {
  id: string
  name: string
  platform: string
  status: CampaignStatus
  daily_budget: number
  spent: number
  clicks: number
  conversions: number
  revenue: number
  roas: number
  product_id: string
}

interface Product {
  id: string
  name: string
  platform_type: string
  category: string | null
  price: number
  cost: number
  stock: number
  image_url: string | null
  campaigns?: Campaign[]
  campaignCount?: number
  margin?: number | null
}

// 캠페인별 ROAS로 효율 상태 계산
function getCampaignStatus(roas: number): TrafficLight {
  if (roas >= 300) return 'green'
  if (roas >= 150) return 'yellow'
  if (roas > 0) return 'red'
  return 'gray'
}

function getStatusColor(status: TrafficLight) {
  switch (status) {
    case 'green': return 'bg-emerald-500'
    case 'yellow': return 'bg-amber-500'
    case 'red': return 'bg-red-500 animate-pulse'
    default: return 'bg-slate-500'
  }
}

function getStatusBadge(status: TrafficLight) {
  switch (status) {
    case 'green': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '효율 좋음' }
    case 'yellow': return { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '주의 필요' }
    case 'red': return { bg: 'bg-red-500/20', text: 'text-red-400', label: '개선 필요' }
    default: return { bg: 'bg-slate-500/20', text: 'text-slate-400', label: '데이터 없음' }
  }
}

function getAdStatusStyle(status: CampaignStatus) {
  switch (status) {
    case 'running': return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '운영중', dot: 'bg-emerald-500' }
    case 'paused': return { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '일시중지', dot: 'bg-amber-500' }
    case 'stopped': return { bg: 'bg-red-500/20', text: 'text-red-400', label: '중단됨', dot: 'bg-red-500' }
    default: return { bg: 'bg-slate-500/20', text: 'text-slate-400', label: '없음', dot: 'bg-slate-500' }
  }
}

function getPlatformIcon(platform: string) {
  switch (platform.toLowerCase()) {
    case '네이버':
    case 'naver': return '🟢'
    case '메타':
    case 'meta': return '🔵'
    case '구글':
    case 'google': return '🔴'
    case '쿠팡':
    case 'coupang': return '🟠'
    case '카카오':
    case 'kakao': return '🟡'
    default: return '⚪'
  }
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<TrafficLight | 'all'>('all')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showCreateAdModal, setShowCreateAdModal] = useState(false)
  const [showCreateProductModal, setShowCreateProductModal] = useState(false)

  // 캠페인 폼 상태
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    platform: '네이버',
    dailyBudget: 50000
  })

  // 데이터 로딩
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      if (data.success) {
        // 각 상품의 캠페인 조회
        const productsWithCampaigns = await Promise.all(
          data.data.map(async (product: Product) => {
            const campaignsRes = await fetch(`/api/campaigns?productId=${product.id}`)
            const campaignsData = await campaignsRes.json()
            return {
              ...product,
              campaigns: campaignsData.data || []
            }
          })
        )
        setProducts(productsWithCampaigns)
      }
    } catch (error) {
      console.error('상품 로딩 에러:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCampaignStatusChange = async (campaignId: string, newStatus: CampaignStatus) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchProducts() // 새로고침
      }
    } catch (error) {
      console.error('캠페인 상태 변경 에러:', error)
    }
  }

  const handleCreateCampaign = async () => {
    if (!selectedProduct) return

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          name: campaignForm.name,
          platform: campaignForm.platform,
          dailyBudget: campaignForm.dailyBudget
        })
      })

      if (res.ok) {
        setShowCreateAdModal(false)
        setCampaignForm({ name: '', platform: '네이버', dailyBudget: 50000 })
        fetchProducts()
      }
    } catch (error) {
      console.error('캠페인 생성 에러:', error)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
    const campaigns = product.campaigns || []
    const matchesFilter = filterStatus === 'all' ||
      campaigns.some(c => getCampaignStatus(c.roas) === filterStatus)
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">상품 관리</h1>
          <p className="text-slate-400 mt-1">등록된 상품의 광고 효율과 재고를 관리하세요</p>
        </div>
        <button
          onClick={() => setShowCreateProductModal(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          상품 추가
        </button>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="상품명으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilterStatus('green')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              filterStatus === 'green' ? 'bg-emerald-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            초록
          </button>
          <button
            onClick={() => setFilterStatus('yellow')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              filterStatus === 'yellow' ? 'bg-amber-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            노랑
          </button>
          <button
            onClick={() => setFilterStatus('red')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              filterStatus === 'red' ? 'bg-red-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-red-500" />
            빨강
          </button>
        </div>
      </div>

      {/* 상품 목록 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-400">상품 {filteredProducts.length}개</h2>
        </div>

        <div className="divide-y divide-white/5">
          {filteredProducts.map((product) => {
            const campaigns = product.campaigns || []
            const runningAds = campaigns.filter(c => c.status === 'running').length
            const greenAds = campaigns.filter(c => getCampaignStatus(c.roas) === 'green').length
            const yellowAds = campaigns.filter(c => getCampaignStatus(c.roas) === 'yellow').length
            const redAds = campaigns.filter(c => getCampaignStatus(c.roas) === 'red').length

            return (
              <div key={product.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start gap-4">
                  {/* 상품 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-white truncate">{product.name}</h3>
                      {/* 캠페인별 신호등 요약 */}
                      <div className="flex items-center gap-1">
                        {greenAds > 0 && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {greenAds}
                          </span>
                        )}
                        {yellowAds > 0 && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            {yellowAds}
                          </span>
                        )}
                        {redAds > 0 && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] rounded bg-red-500/20 text-red-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            {redAds}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mb-3">
                      {product.platform_type || '플랫폼 미연결'} · {product.category || '카테고리 없음'}
                      {product.margin && <span className="ml-2 text-emerald-400">마진 {product.margin}%</span>}
                    </p>

                    {/* 광고 캠페인 목록 */}
                    <div className="space-y-2">
                      {campaigns.map((campaign) => {
                        const adStyle = getAdStatusStyle(campaign.status)
                        const campaignStatus = getCampaignStatus(campaign.roas)
                        const campaignBadge = getStatusBadge(campaignStatus)
                        return (
                          <div key={campaign.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/50">
                            {/* 캠페인별 신호등 */}
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${getStatusColor(campaignStatus)}`} />
                            <span className="text-lg">{getPlatformIcon(campaign.platform)}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-medium text-white">{campaign.platform}</span>
                                <span className="text-xs text-slate-500">{campaign.name}</span>
                                <span className={`px-1.5 py-0.5 text-[10px] rounded ${adStyle.bg} ${adStyle.text} flex items-center gap-1`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${adStyle.dot}`} />
                                  {adStyle.label}
                                </span>
                                <span className={`px-1.5 py-0.5 text-[10px] rounded ${campaignBadge.bg} ${campaignBadge.text}`}>
                                  ROAS {campaign.roas}%
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                <span>예산 {campaign.daily_budget?.toLocaleString()}원</span>
                                <span>소진 {campaign.spent?.toLocaleString()}원</span>
                                <span>매출 {campaign.revenue?.toLocaleString()}원</span>
                                <span>전환 {campaign.conversions}</span>
                              </div>
                            </div>

                            {/* 광고 제어 버튼 */}
                            <div className="flex items-center gap-1">
                              {campaign.status === 'running' ? (
                                <button
                                  onClick={() => handleCampaignStatusChange(campaign.id, 'paused')}
                                  className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-colors"
                                  title="일시중지"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              ) : campaign.status === 'paused' ? (
                                <button
                                  onClick={() => handleCampaignStatusChange(campaign.id, 'running')}
                                  className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                                  title="재개"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              ) : null}
                              {campaign.status !== 'stopped' && (
                                <button
                                  onClick={() => handleCampaignStatusChange(campaign.id, 'stopped')}
                                  className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                                  title="중단"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      {/* 새 광고 추가 버튼 */}
                      <button
                        onClick={() => {
                          setSelectedProduct(product)
                          setShowCreateAdModal(true)
                        }}
                        className="w-full p-2 rounded-lg border border-dashed border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 text-slate-500 hover:text-blue-400 text-xs transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        새 광고 캠페인 추가
                      </button>
                    </div>
                  </div>

                  {/* 통계 */}
                  <div className="hidden md:flex items-center gap-6 text-right">
                    <div>
                      <p className="text-sm text-white">{runningAds}/{campaigns.length}</p>
                      <p className="text-xs text-slate-500">캠페인 운영</p>
                    </div>
                    <div>
                      <p className="text-sm text-white">{product.price?.toLocaleString()}원</p>
                      <p className="text-xs text-slate-500">판매가</p>
                    </div>
                    <div>
                      <p className="text-sm text-white">{product.stock}개</p>
                      <p className="text-xs text-slate-500">재고</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-slate-400 mb-2">
              {products.length === 0 ? '등록된 상품이 없습니다' : '검색 결과가 없습니다'}
            </p>
            <p className="text-sm text-slate-500">
              {products.length === 0 ? '플랫폼을 연동하거나 상품을 직접 추가하세요' : '다른 검색어나 필터를 시도해보세요'}
            </p>
          </div>
        )}
      </div>

      {/* 새 광고 생성 모달 */}
      {showCreateAdModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">새 광고 캠페인 생성</h3>
              <p className="text-sm text-slate-400 mt-1">{selectedProduct.name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">광고 플랫폼</label>
                <div className="grid grid-cols-3 gap-2">
                  {['네이버', '메타', '구글', '쿠팡', '카카오', '틱톡'].map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setCampaignForm(prev => ({ ...prev, platform }))}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                        campaignForm.platform === platform
                          ? 'bg-blue-500/20 border-blue-500/50 text-white'
                          : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-blue-500/30'
                      }`}
                    >
                      <span className="text-lg">{getPlatformIcon(platform)}</span>
                      <span className="text-sm">{platform}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">캠페인명</label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="예: product_campaign_2024"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">일일 예산</label>
                <div className="relative">
                  <input
                    type="number"
                    value={campaignForm.dailyBudget}
                    onChange={(e) => setCampaignForm(prev => ({ ...prev, dailyBudget: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 pr-12 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">원</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateAdModal(false)
                  setSelectedProduct(null)
                }}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateCampaign}
                disabled={!campaignForm.name}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                광고 생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상품 추가 안내 모달 */}
      {showCreateProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-white/10 shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">상품 추가</h3>
            <p className="text-slate-400 mb-6">
              상품은 플랫폼 연동 시 자동으로 동기화됩니다.<br />
              플랫폼을 먼저 연동해주세요.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCreateProductModal(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <a
                href="/platforms"
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                플랫폼 연동하기
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
