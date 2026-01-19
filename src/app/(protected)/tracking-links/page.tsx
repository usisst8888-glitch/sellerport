'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface MyShoppingmall {
  id: string
  site_type: string
  site_name: string
  store_id?: string | null
  status: string
}

interface Product {
  id: string
  name: string
  external_product_id: string
  price: number
  cost: number
  image_url: string | null
  product_url: string | null
  my_shoppingmall_id: string
}

interface AdChannel {
  id: string
  channel_type: string
  channel_name: string
  account_name: string | null
  status: string
}

interface TrackingLink {
  id: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  target_url: string
  go_url: string | null
  channel_type: string | null
  post_name: string | null
  clicks: number
  conversions: number
  revenue: number
  status: string
  created_at: string
  thumbnail_url: string | null
  products?: {
    id: string
    name: string
    image_url: string | null
    price: number
  } | null
}

const siteTypeLabels: Record<string, string> = {
  smartstore: '스마트스토어',
  cafe24: 'Cafe24',
  imweb: '아임웹',
}

const channelTypeLabels: Record<string, string> = {
  meta: 'Meta 광고',
  instagram: '인스타그램',
}

export default function TrackingLinksPage() {
  const [shoppingmalls, setShoppingmalls] = useState<MyShoppingmall[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [adChannels, setAdChannels] = useState<AdChannel[]>([])
  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  // 폼 상태
  const [selectedShoppingmall, setSelectedShoppingmall] = useState<string>('')
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [campaignName, setCampaignName] = useState('')
  const [productSearch, setProductSearch] = useState('')

  // 모달
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (selectedShoppingmall) {
      fetchProducts(selectedShoppingmall)
    } else {
      setProducts([])
      setSelectedProduct('')
    }
  }, [selectedShoppingmall])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 쇼핑몰, 광고채널, 추적링크 모두 클라이언트 Supabase로 직접 조회
      const [shoppingmallsRes, channelsRes, linksRes] = await Promise.all([
        supabase
          .from('my_shoppingmall')
          .select('id, site_type, site_name, store_id, status')
          .eq('user_id', user.id)
          .in('status', ['connected', 'active'])
          .order('created_at', { ascending: false }),
        supabase
          .from('ad_channels')
          .select('id, channel_type, channel_name, account_name, status')
          .eq('user_id', user.id)
          .eq('status', 'connected')
          .order('created_at', { ascending: false }),
        supabase
          .from('tracking_links')
          .select(`
            *,
            products (
              id,
              name,
              image_url,
              price
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ])

      if (shoppingmallsRes.data) setShoppingmalls(shoppingmallsRes.data)
      if (channelsRes.data) setAdChannels(channelsRes.data)
      if (linksRes.data) setTrackingLinks(linksRes.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async (shoppingmallId: string) => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select('id, name, external_product_id, price, cost, image_url, product_url, my_shoppingmall_id')
        .eq('my_shoppingmall_id', shoppingmallId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (data) setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const handleCreateLink = async () => {
    if (!selectedProduct || !selectedChannel) {
      setMessage({ type: 'error', text: '상품과 광고 채널을 선택해주세요' })
      return
    }

    const product = products.find(p => p.id === selectedProduct)
    const channel = adChannels.find(c => c.id === selectedChannel)
    if (!product || !channel) return

    setCreating(true)
    try {
      const response = await fetch('/api/tracking-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          targetUrl: product.product_url || `https://smartstore.naver.com/${product.external_product_id}`,
          channelType: channel.channel_type,
          adChannelId: channel.id,
          utmSource: channel.channel_type,
          utmMedium: 'paid',
          utmCampaign: campaignName || product.name,
          postName: campaignName || product.name,
        })
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: '추적 링크가 생성되었습니다!' })
        setShowCreateModal(false)
        resetForm()
        fetchData()
      } else {
        setMessage({ type: 'error', text: result.error || '링크 생성에 실패했습니다' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '링크 생성 중 오류가 발생했습니다' })
    } finally {
      setCreating(false)
    }
  }

  const resetForm = () => {
    setSelectedShoppingmall('')
    setSelectedProduct('')
    setSelectedChannel('')
    setCampaignName('')
    setProductSearch('')
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const selectedProductData = products.find(p => p.id === selectedProduct)
  const selectedChannelData = adChannels.find(c => c.id === selectedChannel)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 메시지 */}
      {message && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg ${
          message.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        } text-white`}>
          {message.text}
        </div>
      )}

      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">추적 링크 관리</h1>
          <p className="text-slate-400 mt-1">광고별 유입과 전환을 추적하는 링크를 생성하세요</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          링크 생성
        </button>
      </div>

      {/* 연동 상태 안내 */}
      {(shoppingmalls.length === 0 || adChannels.length === 0) && (
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-1">먼저 연동이 필요합니다</h3>
              <p className="text-sm text-slate-400 mb-3">
                추적 링크를 생성하려면 쇼핑몰과 광고 채널을 연동해주세요.
              </p>
              <div className="flex gap-3">
                {shoppingmalls.length === 0 && (
                  <Link
                    href="/my-shoppingmall"
                    className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
                  >
                    쇼핑몰 연동하기
                  </Link>
                )}
                {adChannels.length === 0 && (
                  <Link
                    href="/ad-channels"
                    className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
                  >
                    광고 채널 연동하기
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 추적 링크 목록 */}
      <div className="rounded-2xl bg-slate-800/50 border border-white/5 overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h2 className="font-semibold text-white">생성된 추적 링크</h2>
          <p className="text-sm text-slate-400 mt-1">총 {trackingLinks.length}개</p>
        </div>

        {trackingLinks.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-slate-400 mb-2">아직 생성된 추적 링크가 없습니다</p>
            <p className="text-sm text-slate-500">위의 "링크 생성" 버튼을 눌러 첫 번째 추적 링크를 만들어보세요</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {trackingLinks.map((link) => (
              <div key={link.id} className="p-5 hover:bg-white/5 transition-colors">
                <div className="flex items-stretch gap-4">
                  {/* 썸네일 */}
                  <div className="w-28 rounded-xl overflow-hidden flex-shrink-0 bg-slate-700">
                    {link.thumbnail_url || link.products?.image_url ? (
                      <img
                        src={link.thumbnail_url || link.products?.image_url || ''}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-white truncate">{link.post_name || link.utm_campaign}</p>
                      {link.channel_type && (
                        <span className={`px-2 py-0.5 text-xs rounded flex-shrink-0 ${
                          link.channel_type === 'meta' ? 'bg-blue-500/20 text-blue-400' :
                          link.channel_type === 'instagram' ? 'bg-pink-500/20 text-pink-400' :
                          'bg-slate-500/20 text-slate-400'
                        }`}>
                          {channelTypeLabels[link.channel_type] || link.channel_type}
                        </span>
                      )}
                    </div>
                    {/* 링크 URL 강조 표시 */}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/80 border border-slate-700">
                      <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <code className="text-sm text-blue-400 font-mono truncate flex-1">{link.go_url}</code>
                      <button
                        onClick={() => copyToClipboard(link.go_url || '', link.id)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex-shrink-0 flex items-center gap-1.5 ${
                          copiedId === link.id
                            ? 'bg-emerald-500 text-white'
                            : 'bg-blue-500 hover:bg-blue-400 text-white'
                        }`}
                      >
                        {copiedId === link.id ? (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            복사됨!
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            복사
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      이 링크를 인스타그램, Meta 광고 등에 사용하세요
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* 광고 성과 관리로 이동 안내 */}
            <div className="p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white">링크를 광고에 사용하셨나요?</p>
                    <p className="text-sm text-slate-400">광고 성과 관리에서 클릭, 전환, 매출을 확인하세요</p>
                  </div>
                </div>
                <Link
                  href="/ad-performance"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  성과 확인하기
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 링크 생성 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl w-full max-w-xl border border-slate-700 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="p-5 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="font-bold text-white text-lg">추적 링크 생성</h3>
                <p className="text-sm text-slate-400 mt-0.5">상품과 광고 채널을 선택하세요</p>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); resetForm() }}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 바디 */}
            <div className="p-5 space-y-5 overflow-y-auto flex-1">
              {/* Step 1: 쇼핑몰 선택 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  1. 쇼핑몰 선택
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {shoppingmalls.map((mall) => (
                    <button
                      key={mall.id}
                      onClick={() => setSelectedShoppingmall(mall.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedShoppingmall === mall.id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                      }`}
                    >
                      <p className="font-medium text-white text-sm">{mall.site_name}</p>
                      <p className="text-xs text-slate-400">{siteTypeLabels[mall.site_type] || mall.site_type}</p>
                    </button>
                  ))}
                </div>
                {shoppingmalls.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">연동된 쇼핑몰이 없습니다</p>
                )}
              </div>

              {/* Step 2: 상품 선택 */}
              {selectedShoppingmall && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    2. 상품 선택
                  </label>
                  <input
                    type="text"
                    placeholder="상품명 검색..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none text-sm mb-2"
                  />
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-600 divide-y divide-slate-600">
                    {filteredProducts.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">
                        {products.length === 0 ? '상품이 없습니다' : '검색 결과가 없습니다'}
                      </p>
                    ) : (
                      filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => setSelectedProduct(product.id)}
                          className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                            selectedProduct === product.id ? 'bg-blue-500/10' : 'hover:bg-slate-700/50'
                          }`}
                        >
                          {product.image_url ? (
                            <img src={product.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center">
                              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{product.name}</p>
                            <p className="text-xs text-slate-400">{product.price.toLocaleString()}원</p>
                          </div>
                          {selectedProduct === product.id && (
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: 광고 채널 선택 */}
              {selectedProduct && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    3. 광고 채널 선택
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {adChannels.map((channel) => (
                      <button
                        key={channel.id}
                        onClick={() => setSelectedChannel(channel.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedChannel === channel.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-600 hover:border-slate-500 bg-slate-700/30'
                        }`}
                      >
                        <p className="font-medium text-white text-sm">
                          {channelTypeLabels[channel.channel_type] || channel.channel_type}
                        </p>
                        <p className="text-xs text-slate-400">{channel.account_name || channel.channel_name}</p>
                      </button>
                    ))}
                  </div>
                  {adChannels.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">연동된 광고 채널이 없습니다</p>
                  )}
                </div>
              )}

              {/* Step 4: 캠페인명 (선택) */}
              {selectedChannel && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    4. 캠페인명 (선택)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 1월 프로모션"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">비워두면 상품명이 사용됩니다</p>
                </div>
              )}

              {/* 미리보기 */}
              {selectedProduct && selectedChannel && (
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                  <p className="text-xs text-slate-500 mb-2">생성될 추적 링크 정보</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-16">상품</span>
                      <span className="text-sm text-white">{selectedProductData?.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-16">채널</span>
                      <span className="text-sm text-white">
                        {channelTypeLabels[selectedChannelData?.channel_type || ''] || selectedChannelData?.channel_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-16">캠페인</span>
                      <span className="text-sm text-white">{campaignName || selectedProductData?.name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="p-5 border-t border-slate-700 flex gap-3 flex-shrink-0">
              <button
                onClick={() => { setShowCreateModal(false); resetForm() }}
                className="flex-1 h-11 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateLink}
                disabled={!selectedProduct || !selectedChannel || creating}
                className="flex-1 h-11 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? '생성 중...' : '링크 생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
