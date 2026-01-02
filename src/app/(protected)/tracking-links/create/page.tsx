'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface MySite {
  id: string
  site_type: string
  site_name: string
  store_id?: string | null
  status: string
}

interface AdChannel {
  id: string
  channel_type: string
  channel_name: string
  status: string
}

interface Product {
  id: string
  name: string
  external_product_id: string
  price: number
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

const siteTypeMap: Record<string, { logo: string; label: string }> = {
  naver: { logo: '/site_logo/smartstore.png', label: '스마트스토어' },
  cafe24: { logo: '/site_logo/cafe24.png', label: '카페24' },
  imweb: { logo: '/site_logo/imweb.png', label: '아임웹' },
}

const channelTypeMap: Record<string, { icon: string; label: string }> = {
  meta: { icon: '/channel_logo/meta.png', label: 'Meta (API 연동)' },
  meta_paid: { icon: '/channel_logo/meta.png', label: 'Meta 유료광고' },
  naver_blog: { icon: '/channel_logo/naver_blog.png', label: '네이버 블로그' },
  tiktok: { icon: '/channel_logo/tiktok.png', label: 'TikTok' },
  youtube: { icon: '/channel_logo/youtube.png', label: 'YouTube' },
  instagram: { icon: '/channel_logo/insta.png', label: 'Instagram' },
  thread: { icon: '/channel_logo/thread.png', label: 'Threads' },
  influencer: { icon: '/channel_logo/influencer.png', label: '인플루언서/체험단' },
}

export default function CreateTrackingLinkPage() {
  const router = useRouter()
  const supabase = createClient()

  // 단계
  const [step, setStep] = useState(1)

  // 데이터
  const [mySites, setMySites] = useState<MySite[]>([])
  const [adChannels, setAdChannels] = useState<AdChannel[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // 선택
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [selectedChannelId, setSelectedChannelId] = useState('')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [linkMode, setLinkMode] = useState<'product' | 'manual'>('product')
  const [targetUrl, setTargetUrl] = useState('')
  const [linkName, setLinkName] = useState('')
  const [productSearchQuery, setProductSearchQuery] = useState('')

  // 상태
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 생성된 링크
  const [createdLink, setCreatedLink] = useState<{ goUrl: string; trackingUrl: string } | null>(null)

  // 내사이트 목록 불러오기
  const fetchMySites = async () => {
    try {
      const { data, error } = await supabase
        .from('my_sites')
        .select('*')
        .eq('status', 'connected')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMySites(data || [])
    } catch (error) {
      console.error('Failed to fetch my sites:', error)
    }
  }

  // 광고 채널 목록 불러오기
  const fetchAdChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_channels')
        .select('*')
        .in('status', ['active', 'connected'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setAdChannels(data || [])
    } catch (error) {
      console.error('Failed to fetch ad channels:', error)
    }
  }

  // 상품 목록 불러오기
  const fetchProducts = async (siteId: string) => {
    setLoadingProducts(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, my_sites(id, site_type, site_name, store_id)')
        .eq('my_site_id', siteId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setLoadingProducts(false)
    }
  }

  // 초기 로딩
  useEffect(() => {
    fetchMySites()
    fetchAdChannels()
  }, [])

  // 사이트 선택 시 상품 로드
  useEffect(() => {
    if (selectedSiteId) {
      fetchProducts(selectedSiteId)
    }
  }, [selectedSiteId])

  // 상품 URL 생성
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
    }
    return ''
  }

  // 선택된 채널 정보
  const selectedChannel = adChannels.find(c => c.id === selectedChannelId)

  // 추적링크 생성
  const handleCreateTrackingLink = async () => {
    if (!targetUrl.trim()) {
      setMessage({ type: 'error', text: '목적지 URL을 입력해주세요' })
      return
    }
    if (!linkName.trim()) {
      setMessage({ type: 'error', text: '링크 이름을 입력해주세요' })
      return
    }
    if (!selectedChannelId) {
      setMessage({ type: 'error', text: '광고 채널을 선택해주세요' })
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/tracking-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adChannelId: selectedChannelId,
          productId: selectedProductId || null,
          utmSource: selectedChannel?.channel_type || 'direct',
          utmMedium: 'social',
          utmCampaign: linkName,
          targetUrl: targetUrl,
          channelType: selectedChannel?.channel_type
        })
      })

      const result = await response.json()

      if (result.success) {
        setCreatedLink({
          goUrl: result.data.go_url,
          trackingUrl: result.trackingUrl
        })
        setStep(4) // 완료 단계
      } else {
        setMessage({ type: 'error', text: result.error || '추적링크 생성에 실패했습니다' })
      }
    } catch (error) {
      console.error('Failed to create tracking link:', error)
      setMessage({ type: 'error', text: '추적링크 생성 중 오류가 발생했습니다' })
    } finally {
      setSaving(false)
    }
  }

  // 클립보드 복사
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: 'success', text: '링크가 복사되었습니다!' })
  }

  // 메시지 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // 다음 단계로 이동 가능한지 체크
  const canProceedToStep2 = selectedSiteId !== ''
  const canProceedToStep3 = selectedChannelId !== ''
  const canCreate = targetUrl.trim() !== '' && linkName.trim() !== ''

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">추적링크 생성</h1>
        <p className="text-sm text-slate-400">광고에 사용할 추적링크를 생성합니다</p>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`p-4 rounded-lg mb-4 ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {message.text}
        </div>
      )}

      {/* 단계 표시 */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= s ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
            }`}>
              {step > s ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : s}
            </div>
            {s < 3 && (
              <div className={`w-12 h-0.5 ${step > s ? 'bg-blue-500' : 'bg-slate-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: 사이트 선택 */}
      {step === 1 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">1. 사이트 선택</h2>
          <p className="text-sm text-slate-400 mb-4">추적링크를 만들 쇼핑몰을 선택하세요</p>

          {mySites.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">연동된 쇼핑몰이 없습니다</p>
              <Link
                href="/my-sites"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium inline-block"
              >
                쇼핑몰 연동하기
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {mySites.map((site) => {
                const siteInfo = siteTypeMap[site.site_type] || { logo: '/site_logo/own_site.png', label: site.site_type }

                return (
                  <button
                    key={site.id}
                    onClick={() => setSelectedSiteId(site.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg transition-colors ${
                      selectedSiteId === site.id
                        ? 'bg-blue-600/20 border-2 border-blue-500'
                        : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700'
                    }`}
                  >
                    <Image
                      src={siteInfo.logo}
                      alt={siteInfo.label}
                      width={32}
                      height={32}
                      className="rounded"
                    />
                    <div className="text-left flex-1">
                      <p className="font-medium text-white">{site.site_name || site.store_id}</p>
                      <p className="text-sm text-slate-400">{siteInfo.label}</p>
                    </div>
                    {selectedSiteId === site.id && (
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedToStep2}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 2: 광고 채널 선택 */}
      {step === 2 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">2. 광고 채널 선택</h2>
          <p className="text-sm text-slate-400 mb-4">이 링크를 사용할 광고 채널을 선택하세요</p>

          {adChannels.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 mb-4">등록된 광고 채널이 없습니다</p>
              <Link
                href="/ad-channels"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium inline-block"
              >
                광고 채널 등록하기
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {adChannels.map((channel) => {
                const channelInfo = channelTypeMap[channel.channel_type] || { icon: '/channel_logo/custom.png', label: channel.channel_type }

                return (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannelId(channel.id)}
                    className={`w-full flex items-center gap-3 p-4 rounded-lg transition-colors ${
                      selectedChannelId === channel.id
                        ? 'bg-blue-600/20 border-2 border-blue-500'
                        : 'bg-slate-700/50 border-2 border-transparent hover:bg-slate-700'
                    }`}
                  >
                    <Image
                      src={channelInfo.icon}
                      alt={channelInfo.label}
                      width={32}
                      height={32}
                      className="rounded"
                    />
                    <div className="text-left flex-1">
                      <p className="font-medium text-white">{channel.channel_name}</p>
                      <p className="text-sm text-slate-400">{channelInfo.label}</p>
                    </div>
                    {selectedChannelId === channel.id && (
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"
            >
              이전
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedToStep3}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium"
            >
              다음
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 상품 선택 / URL 입력 */}
      {step === 3 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">3. 추적링크 생성</h2>

          {/* 링크 이름 */}
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1.5">링크 이름 *</label>
            <input
              type="text"
              placeholder="예: 12월 이벤트 상품"
              value={linkName}
              onChange={(e) => setLinkName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* 모드 선택 탭 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setLinkMode('product')
                setTargetUrl('')
              }}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                linkMode === 'product' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              상품에서 선택
            </button>
            <button
              onClick={() => {
                setLinkMode('manual')
                setSelectedProductId('')
                setTargetUrl('')
              }}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                linkMode === 'manual' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}
            >
              직접 입력
            </button>
          </div>

          {/* 직접 입력 모드 */}
          {linkMode === 'manual' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">목적지 URL *</label>
              <input
                type="text"
                placeholder="https://smartstore.naver.com/..."
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          {/* 상품에서 선택 모드 */}
          {linkMode === 'product' && (
            <div className="space-y-4">
              {loadingProducts ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : products.length > 0 ? (
                <>
                  {/* 상품 검색 */}
                  <div className="relative">
                    <input
                      type="text"
                      value={productSearchQuery}
                      onChange={(e) => setProductSearchQuery(e.target.value)}
                      placeholder="상품명 검색..."
                      className="w-full px-4 py-2 pl-10 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none text-sm"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {products
                      .filter(product =>
                        productSearchQuery === '' ||
                        product.name.toLowerCase().includes(productSearchQuery.toLowerCase())
                      )
                      .map((product) => (
                        <div
                          key={product.id}
                          onClick={() => {
                            setSelectedProductId(product.id)
                            setTargetUrl(generateProductUrl(product))
                          }}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedProductId === product.id
                              ? 'bg-blue-600/20 border border-blue-500'
                              : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
                          }`}
                        >
                          {product.image_url && (
                            <div className="relative w-12 h-12 flex-shrink-0">
                              <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                className="rounded-lg object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{product.name}</p>
                            {product.price && (
                              <p className="text-xs text-slate-400">{product.price.toLocaleString()}원</p>
                            )}
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedProductId === product.id
                              ? 'bg-blue-600 border-blue-600'
                              : 'border-slate-500'
                          }`}>
                            {selectedProductId === product.id && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  해당 쇼핑몰에 등록된 상품이 없습니다
                </div>
              )}

              {/* 선택된 URL 표시 */}
              {targetUrl && (
                <div className="p-3 bg-slate-700/30 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">목적지 URL</p>
                  <p className="text-sm text-white break-all">{targetUrl}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"
            >
              이전
            </button>
            <button
              onClick={handleCreateTrackingLink}
              disabled={saving || !canCreate}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium"
            >
              {saving ? '생성 중...' : '추적링크 생성'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: 완료 */}
      {step === 4 && createdLink && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">추적링크가 생성되었습니다!</h2>
            <p className="text-sm text-slate-400 mt-1">아래 링크를 복사해서 광고에 사용하세요</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-900 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-400">추적링크 (광고에 사용)</p>
                <button
                  onClick={() => copyToClipboard(createdLink.goUrl)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  복사
                </button>
              </div>
              <p className="text-white break-all font-mono text-sm">{createdLink.goUrl}</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setStep(1)
                setSelectedSiteId('')
                setSelectedChannelId('')
                setSelectedProductId('')
                setTargetUrl('')
                setLinkName('')
                setCreatedLink(null)
              }}
              className="flex-1 px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"
            >
              새 링크 만들기
            </button>
            <button
              onClick={() => router.push('/conversions')}
              className="flex-1 px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
            >
              광고 성과 보기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
