'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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

interface InstagramAccount {
  id: string
  instagram_username: string | null
  instagram_name: string | null
  instagram_user_id: string
  status: string
}

interface MySite {
  id: string
  site_type: string
  site_name: string
  store_id: string | null
  status: string
}

export default function InstagramDmAddPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editingTrackingLinkId = searchParams.get('edit')

  const [form, setForm] = useState({
    triggerKeywords: '',
    dmMessage: '',
    followMessage: '',
    targetUrl: '',
    selectedProductId: ''
  })
  const [urlInputMode, setUrlInputMode] = useState<'product' | 'manual'>('product')
  const [triggerAllComments, setTriggerAllComments] = useState(false)
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Instagram 계정
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null)

  // 게시물 선택
  const [media, setMedia] = useState<InstagramMedia[]>([])
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null)
  const [selectedMediaCaption, setSelectedMediaCaption] = useState<string | null>(null)
  const [showMediaModal, setShowMediaModal] = useState(false)
  const [loadingMedia, setLoadingMedia] = useState(false)

  // 내 사이트 목록
  const [mySites, setMySites] = useState<MySite[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null) // null = "사이트 선택 없음"

  // 상품 목록
  const [products, setProducts] = useState<Product[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false)
  const [isSiteDropdownOpen, setIsSiteDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const siteDropdownRef = useRef<HTMLDivElement>(null)

  // 수정 모드용 DM 설정 ID
  const [dmSettingId, setDmSettingId] = useState<string | null>(null)

  const isEditMode = !!editingTrackingLinkId

  // 선택된 상품
  const selectedProduct = products.find(p => p.id === form.selectedProductId)

  // site_type을 로고 파일명으로 매핑
  const getSiteLogoName = (siteType: string): string => {
    const logoMap: Record<string, string> = {
      'naver': 'smartstore',
      'cafe24': 'cafe24',
      'imweb': 'imweb',
      'godomall': 'godomall',
      'makeshop': 'makeshop',
    }
    return logoMap[siteType] || 'own_site'
  }

  // site_type을 표시용 이름으로 매핑
  const getSiteDisplayName = (siteType: string): string => {
    const displayMap: Record<string, string> = {
      'naver': '스마트스토어',
      'cafe24': 'Cafe24',
      'imweb': '아임웹',
      'godomall': '고도몰',
      'makeshop': '메이크샵',
    }
    return displayMap[siteType] || siteType
  }

  // 상품 URL 가져오기
  const getProductUrl = (product: Product): string => {
    return product.product_url || ''
  }

  // 필터된 상품 목록
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  // Instagram 계정 불러오기
  const fetchInstagramAccounts = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/instagram-dm')
        return
      }

      const { data: accounts } = await supabase
        .from('instagram_accounts')
        .select('id, instagram_username, instagram_name, instagram_user_id, status')
        .eq('user_id', user.id)
        .eq('status', 'connected')

      if (accounts && accounts.length > 0) {
        setInstagramAccounts(accounts)
        setSelectedAccountId(accounts[0].id)
      } else {
        // Instagram 연결이 없으면 목록 페이지로 이동
        router.push('/instagram-dm')
      }
    } catch (error) {
      console.error('Failed to fetch Instagram accounts:', error)
    }
  }, [router])

  // 내 사이트 목록 불러오기
  const fetchMySites = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: sites } = await supabase
        .from('my_sites')
        .select('id, site_type, site_name, store_id, status')
        .eq('user_id', user.id)
        .eq('status', 'connected')

      if (sites) {
        setMySites(sites)
      }
    } catch (error) {
      console.error('Failed to fetch my sites:', error)
    }
  }, [])

  // 상품 목록 불러오기 (선택된 사이트 기반)
  const fetchProducts = useCallback(async (siteId?: string | null) => {
    setProductsLoading(true)
    try {
      const url = siteId ? `/api/products?my_site_id=${siteId}` : '/api/products'
      const response = await fetch(url)
      const result = await response.json()
      if (result.success && result.data) {
        setProducts(result.data)
      } else {
        setProducts([])
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    } finally {
      setProductsLoading(false)
    }
  }, [])

  // 기존 DM 설정 불러오기
  const fetchExistingDmSettings = useCallback(async () => {
    if (!editingTrackingLinkId) return

    try {
      const response = await fetch(`/api/instagram/dm-settings?trackingLinkId=${editingTrackingLinkId}`)
      const result = await response.json()

      if (result.success && result.data) {
        const settings = result.data
        const keywords = settings.trigger_keywords || []
        const isAllComments = keywords.length === 1 && keywords[0] === '*'

        setForm({
          triggerKeywords: isAllComments ? '*' : keywords.join(', '),
          dmMessage: settings.dm_message || '',
          followMessage: settings.follow_cta_message || '',
          targetUrl: settings.tracking_links?.target_url || '',
          selectedProductId: ''
        })
        setTriggerAllComments(isAllComments)
        setSelectedMediaId(settings.instagram_media_id || null)
        setSelectedMediaUrl(settings.instagram_media_url || null)
        setSelectedMediaCaption(settings.instagram_caption || null)
        setDmSettingId(settings.id)
      }
    } catch (error) {
      console.error('Failed to fetch DM settings:', error)
      setMessage({ type: 'error', text: '설정을 불러오는데 실패했습니다' })
    }
  }, [editingTrackingLinkId])

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await fetchInstagramAccounts()
      await fetchMySites()
      if (editingTrackingLinkId) {
        await fetchExistingDmSettings()
      }
      setLoading(false)
    }
    loadData()
  }, [fetchInstagramAccounts, fetchMySites, editingTrackingLinkId, fetchExistingDmSettings])

  // 사이트 선택 변경 시 상품 목록 다시 불러오기
  useEffect(() => {
    if (selectedSiteId) {
      fetchProducts(selectedSiteId)
    } else {
      // 사이트 선택 없음일 때는 상품 목록 비움
      setProducts([])
    }
    // 사이트 변경 시 선택된 상품 초기화
    setForm(prev => ({ ...prev, selectedProductId: '' }))
  }, [selectedSiteId, fetchProducts])

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false)
      }
      if (siteDropdownRef.current && !siteDropdownRef.current.contains(event.target as Node)) {
        setIsSiteDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 사이트 선택 없음이면 자동으로 직접 입력 모드로 전환
  useEffect(() => {
    if (selectedSiteId === null) {
      setUrlInputMode('manual')
    }
  }, [selectedSiteId])

  // 게시물 목록 불러오기
  const fetchMedia = async () => {
    if (!selectedAccountId) return
    setLoadingMedia(true)
    try {
      const response = await fetch(`/api/instagram/media?instagramAccountId=${selectedAccountId}`)
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
    if (selectedSiteId && urlInputMode === 'product') {
      // 사이트 선택됨 + 상품 선택 모드
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
      // 사이트 선택 없음 또는 직접 입력 모드
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
          router.push('/instagram-dm')
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
          router.push('/instagram-dm')
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/instagram-dm')}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden">
            <img src="/channel_logo/insta.png" alt="Instagram" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {isEditMode ? 'DM 설정 수정' : 'DM 자동발송 추가'}
            </h1>
            <p className="text-sm text-slate-400">
              {isEditMode ? '기존 DM 설정을 수정합니다' : '댓글 트리거로 자동 DM 발송'}
            </p>
          </div>
        </div>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`p-4 rounded-xl text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'}`}>
          {message.text}
        </div>
      )}

      {/* 폼 */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-6">
        {/* 1. 게시물 선택 */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs mr-2">1</span>
            게시물 선택
            {isEditMode && <span className="ml-2 text-xs text-slate-500">(변경 불가)</span>}
          </label>
          {selectedMediaId ? (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-700/50 border border-slate-600">
              {(media.find(m => m.id === selectedMediaId) || selectedMediaUrl) && (
                <>
                  <div className="w-16 h-16 rounded-lg bg-slate-600 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">
                      {media.find(m => m.id === selectedMediaId)?.caption?.slice(0, 50) || selectedMediaCaption?.slice(0, 50) || '캡션 없음'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {selectedMediaId}</p>
                  </div>
                  {!isEditMode && (
                    <button onClick={() => { setSelectedMediaId(null); setSelectedMediaUrl(null); setSelectedMediaCaption(null) }} className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg">
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
              className="w-full p-6 rounded-xl bg-slate-700/30 border-2 border-dashed border-slate-600 text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">게시물 선택하기</span>
            </button>
          )}
        </div>

        {/* 2. 트리거 키워드 */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs mr-2">2</span>
            댓글 트리거 키워드
          </label>

          {/* 모든 댓글 토글 스위치 */}
          <button
            type="button"
            onClick={() => {
              const newValue = !triggerAllComments
              setTriggerAllComments(newValue)
              if (newValue) {
                setForm({ ...form, triggerKeywords: '*' })
              } else {
                setForm({ ...form, triggerKeywords: '' })
              }
            }}
            className={`flex items-center gap-3 w-full p-3 rounded-xl border transition-all mb-3 ${
              triggerAllComments
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
            }`}
          >
            {/* 토글 스위치 */}
            <div className={`relative w-11 h-6 rounded-full transition-colors ${
              triggerAllComments ? 'bg-blue-500' : 'bg-slate-600'
            }`}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                triggerAllComments ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-medium ${triggerAllComments ? 'text-white' : 'text-slate-400'}`}>
                모든 댓글에 반응하기
              </p>
              <p className="text-xs text-slate-500">
                {triggerAllComments ? '아무 댓글이나 달면 DM이 발송됩니다' : '특정 키워드가 포함된 댓글에만 반응'}
              </p>
            </div>
            {triggerAllComments && (
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          {!triggerAllComments && (
            <input
              type="text"
              placeholder="예: 링크, 구매, 정보 (쉼표로 구분)"
              value={form.triggerKeywords}
              onChange={(e) => setForm({ ...form, triggerKeywords: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          )}
        </div>

        {/* 3. 팔로우 요청 메시지 */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs mr-2">3</span>
            팔로우 요청 메시지
            <span className="ml-2 text-xs text-blue-400">(첫 번째 DM)</span>
          </label>
          <textarea
            rows={3}
            placeholder="안녕하세요! 댓글 감사합니다 🙏&#10;&#10;링크를 받으시려면 팔로우 후 아래 버튼을 눌러주세요!"
            value={form.followMessage}
            onChange={(e) => setForm({ ...form, followMessage: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none resize-none"
          />
          <p className="text-xs text-slate-500 mt-2">댓글 작성자에게 먼저 발송됩니다. &quot;팔로우 했어요&quot; 버튼이 자동 포함됩니다.</p>
        </div>

        {/* 4. 팔로워용 DM 메시지 */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs mr-2">4</span>
            팔로워용 메시지
            <span className="ml-2 text-xs text-green-400">(두 번째 DM)</span>
          </label>
          <textarea
            rows={3}
            placeholder="감사합니다! 요청하신 링크 보내드립니다 👇"
            value={form.dmMessage}
            onChange={(e) => setForm({ ...form, dmMessage: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none resize-none"
          />
          <p className="text-xs text-slate-500 mt-2">팔로우 확인 후 발송됩니다. 메시지 끝에 목적지 URL이 자동 추가됩니다.</p>
        </div>

        {/* 5. 사이트 선택 */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs mr-2">5</span>
            사이트 선택
            {isEditMode && <span className="ml-2 text-xs text-slate-500">(변경 불가)</span>}
          </label>

          {!isEditMode && (
            <div ref={siteDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setIsSiteDropdownOpen(!isSiteDropdownOpen)}
                className={`w-full h-12 px-4 rounded-xl border text-left flex items-center justify-between ${
                  selectedSiteId
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                }`}
              >
                {selectedSiteId ? (
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-slate-600 flex items-center justify-center">
                      <img
                        src={`/site_logo/${getSiteLogoName(mySites.find(s => s.id === selectedSiteId)?.site_type || '')}.png`}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {mySites.find(s => s.id === selectedSiteId)?.site_name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400">사이트 선택 없음 (직접 입력)</span>
                )}
                <svg className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isSiteDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isSiteDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 rounded-xl bg-slate-700 border border-slate-600 shadow-xl">
                  <div className="max-h-64 overflow-y-auto">
                    {/* 사이트 선택 없음 옵션 */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSiteId(null)
                        setIsSiteDropdownOpen(false)
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-600/50 border-b border-slate-600 text-left ${
                        selectedSiteId === null ? 'bg-blue-500/10' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">사이트 선택 없음</p>
                        <p className="text-xs text-slate-400">URL 직접 입력</p>
                      </div>
                      {selectedSiteId === null && (
                        <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>

                    {/* 사이트 목록 */}
                    {mySites.length === 0 ? (
                      <div className="p-4 text-center text-sm text-slate-400">
                        연결된 사이트가 없습니다
                      </div>
                    ) : (
                      mySites.map((site) => (
                        <button
                          key={site.id}
                          type="button"
                          onClick={() => {
                            setSelectedSiteId(site.id)
                            setIsSiteDropdownOpen(false)
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-600/50 border-b border-slate-600 last:border-b-0 text-left ${
                            selectedSiteId === site.id ? 'bg-blue-500/10' : ''
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-600 flex items-center justify-center">
                            <img
                              src={`/site_logo/${getSiteLogoName(site.site_type)}.png`}
                              alt={site.site_name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{site.site_name}</p>
                            <p className="text-xs text-slate-400">{getSiteDisplayName(site.site_type)}</p>
                          </div>
                          {selectedSiteId === site.id && (
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
            </div>
          )}

          {isEditMode && (
            <div className="h-12 px-4 rounded-xl bg-slate-700/50 border border-slate-600 flex items-center text-white opacity-50">
              사이트 선택 변경 불가
            </div>
          )}
        </div>

        {/* 6. 목적지 URL */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs mr-2">6</span>
            목적지 URL
            {isEditMode && <span className="ml-2 text-xs text-slate-500">(변경 불가)</span>}
          </label>

          {/* 사이트가 선택된 경우: 상품 선택 / 직접 입력 탭 */}
          {!isEditMode && selectedSiteId && (
            <>
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setUrlInputMode('product')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                    urlInputMode === 'product'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  상품 선택
                </button>
                <button
                  type="button"
                  onClick={() => setUrlInputMode('manual')}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                    urlInputMode === 'manual'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600'
                  }`}
                >
                  직접 입력
                </button>
              </div>

              {/* 상품 선택 모드 */}
              {urlInputMode === 'product' && (
                <div ref={dropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                    className={`w-full h-12 px-4 rounded-xl border text-left flex items-center justify-between ${
                      selectedProduct
                        ? 'bg-green-500/10 border-green-500/30'
                        : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
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

                  {isProductDropdownOpen && (
                    <div className="absolute z-50 w-full bottom-full mb-2 rounded-xl bg-slate-700 border border-slate-600 shadow-xl">
                      <div className="max-h-64 overflow-y-auto">
                        {productsLoading ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="p-4 text-center text-sm text-slate-400">
                            {products.length === 0 ? '해당 사이트에 상품이 없습니다' : '검색 결과가 없습니다'}
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
                                <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
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
                      <div className="p-2 border-t border-slate-600">
                        <input
                          type="text"
                          placeholder="상품명 검색..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none text-sm"
                        />
                      </div>
                    </div>
                  )}

                  {selectedProduct && (
                    <p className="text-xs text-slate-500 mt-2 truncate">
                      URL: {getProductUrl(selectedProduct) || '상품 URL 없음'}
                    </p>
                  )}
                </div>
              )}

              {/* 직접 입력 모드 (사이트 선택됨) */}
              {urlInputMode === 'manual' && (
                <input
                  type="url"
                  placeholder="https://smartstore.naver.com/..."
                  value={form.targetUrl}
                  onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              )}
            </>
          )}

          {/* 사이트 선택 없음인 경우: 직접 입력만 */}
          {!isEditMode && selectedSiteId === null && (
            <input
              type="url"
              placeholder="https://smartstore.naver.com/..."
              value={form.targetUrl}
              onChange={(e) => setForm({ ...form, targetUrl: e.target.value })}
              className="w-full h-12 px-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
            />
          )}

          {/* 수정 모드일 때 */}
          {isEditMode && (
            <>
              <input
                type="url"
                value={form.targetUrl}
                disabled
                className="w-full h-12 px-4 rounded-xl bg-slate-700/50 border border-slate-600 text-white opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-2">목적지 URL을 변경하려면 새 추적링크를 생성하세요</p>
            </>
          )}
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push('/instagram-dm')}
          className="flex-1 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            creating ||
            !form.dmMessage ||
            !form.triggerKeywords ||
            !form.followMessage ||
            (!isEditMode && selectedSiteId && urlInputMode === 'product' && !form.selectedProductId) ||
            (!isEditMode && (selectedSiteId === null || urlInputMode === 'manual') && !form.targetUrl)
          }
          className="flex-1 h-12 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {creating ? '저장 중...' : (isEditMode ? '수정 완료' : 'DM 자동발송 설정')}
        </button>
      </div>

      {/* 게시물 선택 모달 */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-slate-700">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="font-bold text-white">게시물 선택</h3>
              <button onClick={() => setShowMediaModal(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
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
    </div>
  )
}
