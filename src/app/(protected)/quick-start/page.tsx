'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

// 전환 목표 타입
type ConversionGoal = 'shopping' | 'signup' | 'consultation' | 'call' | null

// 사이트 타입
type SiteType = 'naver' | 'cafe24' | 'imweb' | 'custom' | null

// 광고 채널 타입
type AdChannel = 'meta' | 'google' | 'tiktok' | 'kakao' | 'blog' | 'influencer' | 'naver_search' | 'naver_gfa' | 'other' | null

interface MySite {
  id: string
  name: string
  site_type: string
  site_url?: string
  metadata?: Record<string, unknown>
}

interface Product {
  id: string
  name: string
  price: number
  image_url?: string
  site_type?: string
  external_product_id?: string
  my_sites?: {
    site_type: string
    external_shop_id?: string
  }
}

export default function QuickStartPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)

  // Step 1: 전환 목표
  const [conversionGoal, setConversionGoal] = useState<ConversionGoal>(null)

  // Step 2: 사이트 연동
  const [siteType, setSiteType] = useState<SiteType>(null)
  const [siteUrl, setSiteUrl] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [connectedSites, setConnectedSites] = useState<MySite[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState<string>('')

  // Step 2.5: 사이트 연동 폼 (inline)
  const [showSiteConnectForm, setShowSiteConnectForm] = useState(false)
  const [siteConnectStep, setSiteConnectStep] = useState<'form' | 'script'>('form')
  const [siteName, setSiteName] = useState('')
  const [siteConnectUrl, setSiteConnectUrl] = useState('')
  const [siteConnectPhone, setSiteConnectPhone] = useState('')
  const [storeId, setStoreId] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [cafe24MallId, setCafe24MallId] = useState('')
  const [connectLoading, setConnectLoading] = useState(false)
  const [connectError, setConnectError] = useState('')
  const [createdSiteId, setCreatedSiteId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [copiedScript, setCopiedScript] = useState(false)
  const [copiedEventCode, setCopiedEventCode] = useState(false)

  // Step 3: 광고 채널
  const [adChannel, setAdChannel] = useState<AdChannel>(null)

  // Step 4: 추적 링크 생성
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [trackingLinkName, setTrackingLinkName] = useState('')
  const [targetUrl, setTargetUrl] = useState('')

  // Step 5: 완료
  const [createdTrackingLink, setCreatedTrackingLink] = useState<{ goUrl: string; trackingUrl: string } | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    checkExistingData()
  }, [])

  const checkExistingData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    setUserId(user.id)

    // 연동된 사이트 확인 (connected, pending_verification, pending_script 모두 포함)
    const { data: sites } = await supabase
      .from('my_sites')
      .select('id, site_name, site_type, store_id, metadata, status')
      .eq('user_id', user.id)
      .in('status', ['connected', 'pending_verification', 'pending_script', 'active'])
      .order('created_at', { ascending: false })

    if (sites && sites.length > 0) {
      // MySite 인터페이스에 맞게 변환
      setConnectedSites(sites.map(site => ({
        id: site.id,
        name: site.site_name,
        site_type: site.site_type,
        site_url: site.store_id,
        metadata: site.metadata as Record<string, unknown> | undefined
      })))
    }

    setLoading(false)
  }

  // 상품 목록 가져오기
  const fetchProducts = async (siteId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('id, name, price, image_url, site_type, external_product_id, my_sites(site_type, external_shop_id)')
      .eq('my_site_id', siteId)
      .order('name')
      .limit(50)

    if (data) {
      setProducts(data as Product[])
    }
  }

  // 상품 URL 생성
  const generateProductUrl = (product: Product): string => {
    const siteTypeVal = product.site_type || product.my_sites?.site_type
    const externalId = product.external_product_id
    const shopId = product.my_sites?.external_shop_id

    if (siteTypeVal === 'naver' && externalId && shopId) {
      return `https://smartstore.naver.com/${shopId}/products/${externalId}`
    }
    if (siteTypeVal === 'cafe24' && externalId && shopId) {
      return `https://${shopId}.cafe24.com/product/detail.html?product_no=${externalId}`
    }
    if (siteTypeVal === 'imweb' && externalId) {
      return `https://imweb.me/product/${externalId}`
    }
    return ''
  }

  // 추적 링크 생성
  const createTrackingLink = async () => {
    if (!trackingLinkName) return

    setCreating(true)
    try {
      // 광고 채널에 따른 UTM 설정
      const utmSourceMap: Record<string, string> = {
        meta: 'meta',
        google: 'google',
        tiktok: 'tiktok',
        kakao: 'kakao',
        blog: 'blog',
        influencer: 'influencer',
        other: 'direct'
      }
      const utmMediumMap: Record<string, string> = {
        meta: 'paid',
        google: 'paid',
        tiktok: 'paid',
        kakao: 'paid',
        blog: 'organic',
        influencer: 'referral',
        other: 'referral'
      }

      const response = await fetch('/api/tracking-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId || null,
          utmSource: utmSourceMap[adChannel || 'other'],
          utmMedium: utmMediumMap[adChannel || 'other'],
          utmCampaign: trackingLinkName,
          targetUrl: targetUrl || siteUrl,
          adSpend: 0,
          targetRoasGreen: 300,
          targetRoasYellow: 150
        })
      })

      const result = await response.json()

      if (result.success) {
        setCreatedTrackingLink({
          goUrl: result.data.go_url,
          trackingUrl: result.data.tracking_url
        })
        setCurrentStep(5)
      } else {
        alert(result.error || '추적 링크 생성에 실패했습니다')
      }
    } catch {
      alert('추적 링크 생성 중 오류가 발생했습니다')
    } finally {
      setCreating(false)
    }
  }

  // Step 1에서 다음으로
  const handleStep1Next = () => {
    if (!conversionGoal) return
    setCurrentStep(2)
  }

  // Step 2에서 다음으로
  const handleStep2Next = () => {
    if (conversionGoal === 'call') {
      if (!phoneNumber) return
      // 전화 추적은 사이트 연동 없이 바로 광고 채널 선택으로
      setTargetUrl(`tel:${phoneNumber.replace(/-/g, '')}`)
      setCurrentStep(3)
    } else if (conversionGoal === 'shopping') {
      // 새 사이트 연동이 필요한 경우 (siteType 선택, selectedSiteId 없음)
      if (siteType && !selectedSiteId) {
        // 사이트 연동 폼을 inline으로 표시
        setShowSiteConnectForm(true)
        setSiteConnectStep('form')
        return
      }
      // 기존 사이트 선택된 경우
      if (!selectedSiteId) return
      fetchProducts(selectedSiteId)
      setCurrentStep(3)
    } else if (conversionGoal === 'signup' || conversionGoal === 'consultation') {
      // 새 사이트 연동이 필요한 경우 (아임웹 또는 자체몰)
      if (siteType && !selectedSiteId && !siteUrl) {
        setShowSiteConnectForm(true)
        setSiteConnectStep('form')
        return
      }
      // 기존 사이트 선택 또는 URL 직접 입력된 경우
      if (!selectedSiteId && !siteUrl) return
      if (siteUrl) {
        setTargetUrl(siteUrl)
      }
      setCurrentStep(3)
    } else {
      if (!siteUrl) return
      setTargetUrl(siteUrl)
      setCurrentStep(3)
    }
  }

  // Step 3에서 다음으로
  const handleStep3Next = () => {
    if (!adChannel) return

    // 네이버 검색광고/GFA는 추적 링크 필요 없음 - 바로 완료
    if (adChannel === 'naver_search' || adChannel === 'naver_gfa') {
      router.push('/ad-channels?from=quick-start')
      return
    }

    setCurrentStep(4)
  }

  // Step 4에서 추적 링크 생성
  const handleStep4Create = () => {
    if (!trackingLinkName) return

    // 쇼핑 전환인 경우 상품 선택 시 URL 설정
    if (conversionGoal === 'shopping' && selectedProductId) {
      const product = products.find(p => p.id === selectedProductId)
      if (product) {
        setTargetUrl(generateProductUrl(product))
      }
    }

    createTrackingLink()
  }

  // 클립보드 복사
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('복사되었습니다!')
  }

  // 전화번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  // 사이트 연동 처리 - 네이버
  const handleNaverConnect = async () => {
    if (!siteName.trim() || !storeId.trim() || !clientId.trim() || !clientSecret.trim()) {
      setConnectError('모든 필드를 입력해주세요')
      return
    }

    setConnectLoading(true)
    setConnectError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setConnectError('로그인이 필요합니다')
        setConnectLoading(false)
        return
      }

      const { data, error: insertError } = await supabase
        .from('my_sites')
        .insert({
          user_id: user.id,
          site_type: 'naver',
          site_name: siteName.trim(),
          store_id: storeId.trim().toLowerCase(),
          application_id: clientId.trim(),
          application_secret: clientSecret.trim(),
          status: 'pending_verification',
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.code === '23505') {
          setConnectError('이미 연동된 스토어입니다')
        } else {
          setConnectError('연동 중 오류가 발생했습니다')
        }
        setConnectLoading(false)
        return
      }

      // 성공 - 연동 완료 후 사이트 목록 새로고침 및 선택
      setSelectedSiteId(data.id)
      setShowSiteConnectForm(false)
      resetSiteConnectForm()
      await checkExistingData()
      fetchProducts(data.id)
      setCurrentStep(3)
    } catch (err) {
      console.error('Naver connect error:', err)
      setConnectError('연동 중 오류가 발생했습니다')
    } finally {
      setConnectLoading(false)
    }
  }

  // 사이트 연동 처리 - 카페24
  const handleCafe24Connect = () => {
    if (!cafe24MallId.trim()) {
      setConnectError('쇼핑몰 ID를 입력해주세요')
      return
    }

    if (!/^[a-zA-Z0-9-]+$/.test(cafe24MallId)) {
      setConnectError('쇼핑몰 ID는 영문, 숫자, 하이픈만 사용 가능합니다')
      return
    }

    setConnectLoading(true)
    // 카페24 OAuth 인증 페이지로 리다이렉트
    window.location.href = `/api/auth/cafe24?mall_id=${encodeURIComponent(cafe24MallId.trim())}`
  }

  // 사이트 연동 처리 - 아임웹
  const handleImwebConnect = () => {
    setConnectLoading(true)
    window.location.href = '/api/auth/imweb'
  }

  // 사이트 연동 처리 - 자체몰
  const handleCustomConnect = async () => {
    const isCallTracking = conversionGoal === 'call'

    if (isCallTracking) {
      if (!siteName.trim() || !siteConnectPhone.trim()) {
        setConnectError('모든 필드를 입력해주세요')
        return
      }
      const phoneDigits = siteConnectPhone.replace(/[^\d]/g, '')
      if (phoneDigits.length < 9) {
        setConnectError('올바른 전화번호를 입력해주세요')
        return
      }
    } else {
      if (!siteName.trim() || !siteConnectUrl.trim()) {
        setConnectError('모든 필드를 입력해주세요')
        return
      }
    }

    let formattedUrl = ''
    if (!isCallTracking) {
      formattedUrl = siteConnectUrl.trim()
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl
      }
    }

    setConnectLoading(true)
    setConnectError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setConnectError('로그인이 필요합니다')
        setConnectLoading(false)
        return
      }

      setUserId(user.id)

      const { data, error: insertError } = await supabase
        .from('my_sites')
        .insert({
          user_id: user.id,
          site_type: isCallTracking ? 'call' : 'custom',
          site_name: siteName.trim(),
          store_id: isCallTracking ? siteConnectPhone.replace(/[^\d]/g, '') : formattedUrl,
          status: isCallTracking ? 'connected' : 'pending_script',
          metadata: isCallTracking ? { phone_number: siteConnectPhone, conversion_type: 'call' } : { conversion_type: conversionGoal },
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.code === '23505') {
          setConnectError('이미 연동된 사이트입니다')
        } else {
          setConnectError('연동 중 오류가 발생했습니다')
        }
        setConnectLoading(false)
        return
      }

      setCreatedSiteId(data.id)
      if (isCallTracking) {
        // 전화 추적은 스크립트 설치가 필요없으므로 바로 완료
        setSelectedSiteId(data.id)
        setShowSiteConnectForm(false)
        resetSiteConnectForm()
        await checkExistingData()
        setCurrentStep(3)
      } else {
        // 스크립트 설치 단계로 이동
        setSiteConnectStep('script')
      }
    } catch (err) {
      console.error('Custom site connect error:', err)
      setConnectError('연동 중 오류가 발생했습니다')
    } finally {
      setConnectLoading(false)
    }
  }

  // 스크립트 설치 완료 후 처리
  const handleScriptComplete = async () => {
    if (createdSiteId) {
      setSelectedSiteId(createdSiteId)
    }
    setShowSiteConnectForm(false)
    resetSiteConnectForm()
    await checkExistingData()
    setCurrentStep(3)
  }

  // 사이트 연동 폼 초기화
  const resetSiteConnectForm = () => {
    setSiteName('')
    setSiteConnectUrl('')
    setSiteConnectPhone('')
    setStoreId('')
    setClientId('')
    setClientSecret('')
    setCafe24MallId('')
    setConnectError('')
    setSiteConnectStep('form')
    setCreatedSiteId(null)
    setCopiedScript(false)
    setCopiedEventCode(false)
  }

  // 추적 스크립트 생성
  const getTrackingScript = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sellerport.app'
    return `<!-- SellerPort 전환 추적 코드 -->
<script>
(function() {
  var sp = document.createElement('script');
  sp.type = 'text/javascript';
  sp.async = true;
  sp.src = '${baseUrl}/tracking.js';
  sp.setAttribute('data-user-id', '${userId || 'YOUR_USER_ID'}');
  sp.setAttribute('data-site-id', '${createdSiteId || 'SITE_ID'}');
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(sp, s);
})();
</script>
<!-- End SellerPort 추적 코드 -->`
  }

  // 전환 이벤트 코드 생성
  const getEventCode = () => {
    switch (conversionGoal) {
      case 'signup':
        return `// 회원가입 완료 시 호출
window.sellerport?.track('signup', {
  userId: '신규회원ID',      // 선택: 회원 고유 ID
  email: 'user@email.com'   // 선택: 회원 이메일
});`
      case 'consultation':
        return `// DB 수집(상담신청/문의) 완료 시 호출
window.sellerport?.track('lead', {
  formId: '폼ID',           // 선택: 폼 구분용 ID
  formName: '상담신청'       // 선택: 폼 이름
});`
      default: // shopping
        return `// 구매 완료 시 호출
window.sellerport?.track('conversion', {
  orderId: '주문번호',       // 필수: 주문 고유번호
  amount: 50000             // 필수: 결제금액
});`
    }
  }

  const getEventCodeLabel = () => {
    switch (conversionGoal) {
      case 'signup':
        return '회원가입 전환 추적 코드'
      case 'consultation':
        return 'DB 수집 전환 추적 코드'
      default:
        return '구매 전환 추적 코드'
    }
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(getTrackingScript())
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }

  const handleCopyEventCode = () => {
    navigator.clipboard.writeText(getEventCode())
    setCopiedEventCode(true)
    setTimeout(() => setCopiedEventCode(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">🚀 셀러포트 시작하기</h1>
        <p className="text-slate-400">
          5단계만 완료하면 광고 성과 추적을 시작할 수 있어요
        </p>
      </div>

      {/* 진행률 표시 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-300">설정 진행률</span>
          <span className="text-sm font-bold text-blue-400">STEP {currentStep}/5</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded-full transition-all ${
                step < currentStep
                  ? 'bg-green-500'
                  : step === currentStep
                    ? 'bg-blue-500'
                    : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* STEP 1: 전환 목표 선택 */}
      {currentStep === 1 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">STEP 1. 전환 목표 선택</h2>
            <p className="text-sm text-slate-400">어떤 행동을 전환으로 추적하고 싶으세요?</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* 쇼핑 전환 */}
            <button
              onClick={() => setConversionGoal('shopping')}
              className={`p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                conversionGoal === 'shopping'
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white">쇼핑 전환</div>
                <div className="text-xs text-slate-400">상품 구매 추적</div>
              </div>
            </button>

            {/* 회원가입 전환 */}
            <button
              onClick={() => setConversionGoal('signup')}
              className={`p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                conversionGoal === 'signup'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white">회원가입 전환</div>
                <div className="text-xs text-slate-400">회원가입 추적</div>
              </div>
            </button>

            {/* 상담신청 전환 */}
            <button
              onClick={() => setConversionGoal('consultation')}
              className={`p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                conversionGoal === 'consultation'
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white">상담신청 전환</div>
                <div className="text-xs text-slate-400">폼 제출 추적</div>
              </div>
            </button>

            {/* 전화연결 전환 */}
            <button
              onClick={() => setConversionGoal('call')}
              className={`p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
                conversionGoal === 'call'
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-white">전화연결 전환</div>
                <div className="text-xs text-slate-400">전화 클릭 추적</div>
              </div>
            </button>
          </div>

          <button
            onClick={handleStep1Next}
            disabled={!conversionGoal}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-colors"
          >
            다음 단계로
          </button>
        </div>
      )}

      {/* STEP 2: 판매처/사이트 연동 */}
      {currentStep === 2 && !showSiteConnectForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">STEP 2. 판매처/사이트 연동</h2>
            <p className="text-sm text-slate-400">
              {conversionGoal === 'shopping' && '어디서 상품을 판매하고 계신가요?'}
              {conversionGoal === 'signup' && '회원가입이 발생하는 사이트 URL을 입력해주세요'}
              {conversionGoal === 'consultation' && '상담신청 폼이 있는 사이트 URL을 입력해주세요'}
              {conversionGoal === 'call' && '연결할 전화번호를 입력해주세요'}
            </p>
          </div>

          {/* 쇼핑 전환: 판매처 선택 */}
          {conversionGoal === 'shopping' && (
            <div className="mb-6">
              {/* 연동된 사이트가 있으면 선택 가능 */}
              {connectedSites.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">연동된 사이트</label>
                  <div className="space-y-2">
                    {connectedSites.map((site) => (
                      <button
                        key={site.id}
                        onClick={() => {
                          setSelectedSiteId(site.id)
                          setSiteType(null)
                        }}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                          selectedSiteId === site.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                        }`}
                      >
                        <img
                          src={
                            site.site_type === 'naver' ? '/site_logo/smartstore.png' :
                            site.site_type === 'cafe24' ? '/site_logo/cafe24.png' :
                            site.site_type === 'imweb' ? '/site_logo/imweb.png' :
                            '/site_logo/own_site.png'
                          }
                          alt={site.site_type}
                          className="w-10 h-10 object-contain rounded-lg"
                        />
                        <div>
                          <div className="font-medium text-white">{site.name}</div>
                          <div className="text-xs text-slate-400">
                            {site.site_type === 'naver' && '네이버 스마트스토어'}
                            {site.site_type === 'cafe24' && '카페24'}
                            {site.site_type === 'imweb' && '아임웹'}
                            {site.site_type === 'custom' && '자체몰'}
                          </div>
                        </div>
                        {selectedSiteId === site.id && (
                          <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded">선택됨</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 새 사이트 연동 섹션 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {connectedSites.length > 0 ? '또는 새 사이트 연동' : '판매처 선택'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* 네이버 스마트스토어 */}
                  <button
                    onClick={() => {
                      setSiteType('naver')
                      setSelectedSiteId('')
                    }}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      siteType === 'naver'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                    }`}
                  >
                    <img src="/site_logo/smartstore.png" alt="네이버" className="w-10 h-10 object-contain rounded-lg" />
                    <div className="text-sm font-medium text-white text-left">네이버<br/>스마트스토어</div>
                  </button>

                  {/* 카페24 */}
                  <button
                    onClick={() => {
                      setSiteType('cafe24')
                      setSelectedSiteId('')
                    }}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      siteType === 'cafe24'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                    }`}
                  >
                    <img src="/site_logo/cafe24.png" alt="카페24" className="w-10 h-10 object-contain rounded-lg" />
                    <div className="text-sm font-medium text-white text-left">카페24</div>
                  </button>

                  {/* 아임웹 */}
                  <button
                    onClick={() => {
                      setSiteType('imweb')
                      setSelectedSiteId('')
                    }}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      siteType === 'imweb'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                    }`}
                  >
                    <img src="/site_logo/imweb.png" alt="아임웹" className="w-10 h-10 object-contain rounded-lg" />
                    <div className="text-sm font-medium text-white text-left">아임웹</div>
                  </button>

                  {/* 자체몰 */}
                  <button
                    onClick={() => {
                      setSiteType('custom')
                      setSelectedSiteId('')
                    }}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      siteType === 'custom'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                    }`}
                  >
                    <img src="/site_logo/own_site.png" alt="자체몰" className="w-10 h-10 object-contain rounded-lg" />
                    <div className="text-sm font-medium text-white text-left">자체몰</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 회원가입/상담신청: 사이트 선택 */}
          {(conversionGoal === 'signup' || conversionGoal === 'consultation') && (
            <div className="mb-6">
              {/* 연동된 사이트가 있으면 선택 가능 */}
              {connectedSites.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">연동된 사이트</label>
                  <div className="space-y-2">
                    {connectedSites.map((site) => (
                      <button
                        key={site.id}
                        onClick={() => {
                          setSelectedSiteId(site.id)
                          setSiteType(null)
                        }}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-3 ${
                          selectedSiteId === site.id
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                        }`}
                      >
                        <img
                          src={
                            site.site_type === 'naver' ? '/site_logo/smartstore.png' :
                            site.site_type === 'cafe24' ? '/site_logo/cafe24.png' :
                            site.site_type === 'imweb' ? '/site_logo/imweb.png' :
                            '/site_logo/own_site.png'
                          }
                          alt={site.site_type}
                          className="w-10 h-10 object-contain rounded-lg"
                        />
                        <div>
                          <div className="font-medium text-white">{site.name}</div>
                          <div className="text-xs text-slate-400">
                            {site.site_type === 'naver' && '네이버 스마트스토어'}
                            {site.site_type === 'cafe24' && '카페24'}
                            {site.site_type === 'imweb' && '아임웹'}
                            {site.site_type === 'custom' && '자체 제작 사이트'}
                          </div>
                        </div>
                        {selectedSiteId === site.id && (
                          <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded">선택됨</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 새 사이트 연동 섹션 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {connectedSites.length > 0 ? '또는 새 사이트 연동' : '사이트 선택'}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* 아임웹 */}
                  <button
                    onClick={() => {
                      setSiteType('imweb')
                      setSelectedSiteId('')
                    }}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      siteType === 'imweb'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                    }`}
                  >
                    <img src="/site_logo/imweb.png" alt="아임웹" className="w-10 h-10 object-contain rounded-lg" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">아임웹</div>
                      <div className="text-xs text-slate-400">{conversionGoal === 'signup' ? '회원가입 폼 추적' : 'DB 수집 폼 추적'}</div>
                    </div>
                  </button>

                  {/* 일반 웹사이트/블로그 */}
                  <button
                    onClick={() => {
                      setSiteType('custom')
                      setSelectedSiteId('')
                    }}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                      siteType === 'custom'
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                    }`}
                  >
                    <img src="/site_logo/own_site.png" alt="자체몰" className="w-10 h-10 object-contain rounded-lg" />
                    <div className="text-left">
                      <div className="text-sm font-medium text-white">일반 웹사이트/블로그</div>
                      <div className="text-xs text-slate-400">자체 제작 사이트</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 전화연결: 전화번호 입력 */}
          {conversionGoal === 'call' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">전화번호</label>
              <input
                type="tel"
                placeholder="010-1234-5678"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
            >
              이전
            </button>
            <button
              onClick={handleStep2Next}
              disabled={
                (conversionGoal === 'shopping' && !selectedSiteId && !siteType) ||
                ((conversionGoal === 'signup' || conversionGoal === 'consultation') && !siteUrl && !selectedSiteId && !siteType) ||
                (conversionGoal === 'call' && !phoneNumber)
              }
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-colors"
            >
              다음 단계로
            </button>
          </div>
        </div>
      )}

      {/* STEP 2.5: 사이트 연동 폼 (inline) */}
      {currentStep === 2 && showSiteConnectForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          {/* 네이버 스마트스토어 연동 */}
          {siteType === 'naver' && (
            <>
              <div className="mb-6 flex items-center gap-3">
                <Image src="/site_logo/smartstore.png" alt="네이버" width={40} height={40} className="rounded-lg" />
                <div>
                  <h2 className="text-lg font-semibold text-white">네이버 스마트스토어 연동</h2>
                  <p className="text-sm text-slate-400">네이버 커머스API센터에서 발급받은 인증 정보를 입력하세요</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {/* API 발급 안내 */}
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-400 mb-2">API 발급 방법</p>
                  <ol className="text-sm text-green-300 space-y-1 list-decimal list-inside">
                    <li>
                      <a href="https://apicenter.commerce.naver.com" target="_blank" rel="noopener noreferrer" className="text-green-400 underline hover:text-green-300">
                        네이버 커머스API센터
                      </a>{' '}접속
                    </li>
                    <li>스마트스토어 판매자 계정으로 로그인</li>
                    <li>애플리케이션 등록 → Client ID/Secret 발급</li>
                    <li>API 호출 IP에 <code className="bg-green-500/20 px-1 rounded text-green-300">34.64.115.226</code> 등록</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">스토어 별칭 *</label>
                  <input
                    type="text"
                    placeholder="예: 내 스마트스토어"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">스마트스토어 ID *</label>
                  <input
                    type="text"
                    placeholder="예: tripsim"
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    스마트스토어 URL에서 확인: smartstore.naver.com/<strong className="text-slate-300">스토어ID</strong>/products/...
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Application ID (Client ID) *</label>
                  <input
                    type="text"
                    placeholder="예: 5f0XZPkXRbvHEcaxEWKKg9"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Application Secret (Client Secret) *</label>
                  <input
                    type="password"
                    placeholder="발급받은 Secret 입력"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {connectError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{connectError}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSiteConnectForm(false)
                    resetSiteConnectForm()
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={handleNaverConnect}
                  disabled={connectLoading || !siteName.trim() || !storeId.trim() || !clientId.trim() || !clientSecret.trim()}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-colors"
                >
                  {connectLoading ? '연동 중...' : '연동하기'}
                </button>
              </div>
            </>
          )}

          {/* 카페24 연동 */}
          {siteType === 'cafe24' && (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center">
                  <Image src="/site_logo/cafe24.png" alt="카페24" width={32} height={32} className="object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">카페24 연동</h2>
                  <p className="text-sm text-slate-400">쇼핑몰을 셀러포트와 연결하세요</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-400 mb-2">연동 방법</p>
                  <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                    <li>카페24 쇼핑몰 ID를 입력하세요</li>
                    <li>카페24 로그인 후 앱 설치를 승인하세요</li>
                    <li>자동으로 상품과 주문이 동기화됩니다</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">카페24 쇼핑몰 ID *</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="myshop"
                      value={cafe24MallId}
                      onChange={(e) => {
                        setCafe24MallId(e.target.value)
                        setConnectError('')
                      }}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-slate-500 text-sm">.cafe24.com</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">카페24 관리자 URL에서 확인할 수 있습니다 (예: myshop.cafe24.com)</p>
                </div>

                {connectError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{connectError}</p>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-slate-900/50">
                  <p className="text-xs text-slate-500 mb-2">요청되는 권한</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">상품 조회</span>
                    <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">주문 조회</span>
                    <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">스토어 정보</span>
                    <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">매출 통계</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSiteConnectForm(false)
                    resetSiteConnectForm()
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={handleCafe24Connect}
                  disabled={connectLoading || !cafe24MallId.trim()}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-colors"
                >
                  {connectLoading ? '연동 중...' : '카페24로 연동하기'}
                </button>
              </div>
            </>
          )}

          {/* 아임웹 연동 */}
          {siteType === 'imweb' && (
            <>
              <div className="mb-6 flex items-center gap-3">
                <Image src="/site_logo/imweb.png" alt="아임웹" width={40} height={40} className="rounded-lg" />
                <div>
                  <h2 className="text-lg font-semibold text-white">아임웹 연동</h2>
                  <p className="text-sm text-slate-400">OAuth 2.0 인증</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <div className="flex gap-3">
                    <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-1">아임웹 계정으로 로그인</p>
                      <p className="text-blue-400/80">연동하기 버튼을 클릭하면 아임웹 로그인 페이지로 이동합니다. 로그인 후 권한을 승인하면 자동으로 연동이 완료됩니다.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-slate-300">연동 시 제공되는 기능</h3>
                  <div className="grid gap-2">
                    {['주문 데이터 실시간 동기화 (웹훅)', '회원가입 전환 추적 (웹훅)', '상품 데이터 자동 동기화', '추적 코드 자동 설치 (스크립트 API)'].map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-400">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-3 text-xs text-slate-400">
                  <p className="flex items-start gap-1.5">
                    <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>아임웹 사이트 관리자 계정으로 로그인해야 합니다. 연동 후 언제든지 해제할 수 있습니다.</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSiteConnectForm(false)
                    resetSiteConnectForm()
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={handleImwebConnect}
                  disabled={connectLoading}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {connectLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>연결 중...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span>아임웹으로 연동하기</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {/* 자체몰 연동 */}
          {siteType === 'custom' && siteConnectStep === 'form' && (
            <>
              <div className="mb-6 flex items-center gap-3">
                <Image src="/site_logo/own_site.png" alt="자체몰" width={40} height={40} className="rounded-lg" />
                <div>
                  <h2 className="text-lg font-semibold text-white">자체몰 연동</h2>
                  <p className="text-sm text-slate-400">스크립트 설치로 전환을 추적하세요</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                  <p className="text-sm font-medium text-white mb-2">연동 방법</p>
                  <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                    <li>사이트 정보 입력</li>
                    <li>추적 스크립트 복사</li>
                    <li>쇼핑몰 관리자에서 스크립트 설치</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">사이트 별칭 *</label>
                  <input
                    type="text"
                    placeholder="예: 내 회사 홈페이지"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">사이트 주소 *</label>
                  <input
                    type="text"
                    placeholder="example.com"
                    value={siteConnectUrl}
                    onChange={(e) => setSiteConnectUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">웹사이트 주소를 입력하세요 (예: mysite.com)</p>
                </div>

                {connectError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-400">{connectError}</p>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-slate-900/50">
                  <p className="text-xs text-slate-400 font-medium mb-2">연동 후 사용 가능한 기능</p>
                  <ul className="text-xs text-slate-500 space-y-1">
                    <li>- 광고 클릭 → 구매 전환 추적</li>
                    <li>- ROAS (광고비 대비 매출) 계산</li>
                    <li>- 광고 채널별 성과 분석</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowSiteConnectForm(false)
                    resetSiteConnectForm()
                  }}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  이전
                </button>
                <button
                  onClick={handleCustomConnect}
                  disabled={connectLoading || !siteName.trim() || !siteConnectUrl.trim()}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-colors"
                >
                  {connectLoading ? '연동 중...' : '다음'}
                </button>
              </div>
            </>
          )}

          {/* 자체몰 스크립트 설치 단계 */}
          {siteType === 'custom' && siteConnectStep === 'script' && (
            <>
              <div className="mb-6 flex items-center gap-3">
                <Image src="/site_logo/own_site.png" alt="자체몰" width={40} height={40} className="rounded-lg" />
                <div>
                  <h2 className="text-lg font-semibold text-white">추적 스크립트 설치</h2>
                  <p className="text-sm text-slate-400">추적 스크립트를 사이트에 설치하세요</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm font-medium text-amber-400 mb-2">스크립트 설치 방법</p>
                  <ol className="text-sm text-amber-300 space-y-1 list-decimal list-inside">
                    <li>웹사이트 관리자 페이지 또는 HTML 파일 접속</li>
                    <li>모든 페이지에 적용되는 &lt;head&gt; 태그 찾기</li>
                    <li>추적 스크립트 붙여넣기 후 저장/배포</li>
                  </ol>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-300">추적 스크립트</label>
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="px-3 py-1 text-xs rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                    >
                      {copiedScript ? '복사됨 ✓' : '복사하기'}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl overflow-x-auto border border-white/5">
                    <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">{getTrackingScript()}</pre>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">위 코드를 쇼핑몰의 모든 페이지에 적용되는 head 영역에 붙여넣으세요</p>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-amber-400">{getEventCodeLabel()} (필수)</p>
                    <button
                      type="button"
                      onClick={handleCopyEventCode}
                      className="px-3 py-1 text-xs rounded-lg border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 transition-colors"
                    >
                      {copiedEventCode ? '복사됨 ✓' : '복사하기'}
                    </button>
                  </div>
                  <p className="text-xs text-amber-300/80 mb-3">
                    {conversionGoal === 'signup' && '회원가입 완료 페이지 또는 회원가입 성공 시점에 아래 코드를 호출하세요'}
                    {conversionGoal === 'consultation' && '상담신청/문의 폼 제출 완료 시점에 아래 코드를 호출하세요'}
                    {conversionGoal === 'shopping' && '주문 완료 페이지에 아래 코드를 추가하면 구매 전환을 추적할 수 있습니다'}
                  </p>
                  <div className="p-3 bg-slate-950 rounded-lg overflow-x-auto border border-white/5">
                    <pre className="text-xs text-blue-400 whitespace-pre-wrap font-mono">{getEventCode()}</pre>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSiteConnectStep('form')}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
                >
                  뒤로
                </button>
                <button
                  onClick={handleScriptComplete}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
                >
                  완료
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* STEP 3: 광고 채널 선택 */}
      {currentStep === 3 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">STEP 3. 광고 채널 선택</h2>
            <p className="text-sm text-slate-400">이 링크를 어디에 사용하실 건가요?</p>
          </div>

          {/* 추적 링크 생성 (직접 추적) */}
          <div className="mb-6">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              추적 링크 생성 (직접 추적)
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'meta', icon: '📘', title: 'META', desc: '인스타/페북' },
                { id: 'google', icon: '🔴', title: '구글', desc: '유튜브' },
                { id: 'tiktok', icon: '🎵', title: '틱톡', desc: '' },
                { id: 'kakao', icon: '💬', title: '카카오', desc: '' },
                { id: 'blog', icon: '📝', title: '블로그', desc: '카페' },
                { id: 'influencer', icon: '⭐', title: '인플루언서', desc: '' },
                { id: 'other', icon: '🔗', title: '기타', desc: '' },
              ].map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setAdChannel(channel.id as AdChannel)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    adChannel === channel.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                  }`}
                >
                  <div className="text-xl mb-1">{channel.icon}</div>
                  <div className="text-sm font-medium text-white">{channel.title}</div>
                  {channel.desc && <div className="text-xs text-slate-400">{channel.desc}</div>}
                </button>
              ))}
            </div>
          </div>

          {/* API 연동만 (데이터 수집) */}
          <div className="mb-6">
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              API 연동만 (네이버 자체 전환 추적)
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'naver_search', icon: '🔍', title: '네이버 검색광고', desc: '추적 링크 불필요' },
                { id: 'naver_gfa', icon: '📊', title: '네이버 GFA', desc: '추적 링크 불필요' },
              ].map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setAdChannel(channel.id as AdChannel)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    adChannel === channel.id
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-slate-600 hover:border-slate-500 bg-slate-900/50'
                  }`}
                >
                  <div className="text-xl mb-1">{channel.icon}</div>
                  <div className="text-sm font-medium text-white">{channel.title}</div>
                  <div className="text-xs text-green-400">{channel.desc}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              ※ 네이버 광고는 자체 전환 추적을 제공하므로 API 연동만 하면 됩니다
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
            >
              이전
            </button>
            <button
              onClick={handleStep3Next}
              disabled={!adChannel}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-colors"
            >
              {adChannel === 'naver_search' || adChannel === 'naver_gfa'
                ? 'API 연동하러 가기'
                : '다음 단계로'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: 추적 링크 생성 */}
      {currentStep === 4 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">STEP 4. 추적 링크 생성</h2>
            <p className="text-sm text-slate-400">추적 링크를 만들어보세요</p>
          </div>

          {/* 쇼핑 전환: 상품 선택 */}
          {conversionGoal === 'shopping' && products.length > 0 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">상품 선택</label>
              <div className="max-h-48 overflow-y-auto space-y-2 p-2 bg-slate-900/30 rounded-xl">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProductId(product.id)
                      setTargetUrl(generateProductUrl(product))
                    }}
                    className={`w-full p-3 rounded-lg border transition-all text-left flex items-center gap-3 ${
                      selectedProductId === product.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 hover:border-slate-600 bg-slate-800'
                    }`}
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-700 rounded flex items-center justify-center text-slate-500">
                        🖼️
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{product.name}</div>
                      <div className="text-xs text-slate-400">{product.price.toLocaleString()}원</div>
                    </div>
                    {selectedProductId === product.id && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">선택됨</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 목적지 URL 표시 (쇼핑 외) */}
          {conversionGoal !== 'shopping' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">목적지 URL</label>
              <div className="px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600 text-slate-300 text-sm break-all">
                {targetUrl || siteUrl || phoneNumber}
              </div>
            </div>
          )}

          {/* 추적 링크 이름 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">추적 링크 이름 *</label>
            <input
              type="text"
              placeholder="예: 인스타_겨울세일_2024"
              value={trackingLinkName}
              onChange={(e) => setTrackingLinkName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">추적 링크를 구분할 수 있는 이름을 입력하세요</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
            >
              이전
            </button>
            <button
              onClick={handleStep4Create}
              disabled={!trackingLinkName || creating}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-xl transition-colors"
            >
              {creating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  생성 중...
                </span>
              ) : '추적 링크 생성'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: 완료 */}
      {currentStep === 5 && createdTrackingLink && (
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-white mb-2">완료! 추적 링크가 생성되었어요</h2>
            <p className="text-sm text-slate-300">
              이 링크를 {adChannel === 'meta' ? '메타 광고' : adChannel === 'google' ? '구글 광고' : '광고'}에 사용하세요!
            </p>
          </div>

          <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
            <label className="block text-xs font-medium text-slate-400 mb-2">📋 추적 링크</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={createdTrackingLink.goUrl}
                className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm"
              />
              <button
                onClick={() => copyToClipboard(createdTrackingLink.goUrl)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                복사
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 py-3 text-center bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors"
            >
              대시보드로 이동
            </Link>
            <button
              onClick={() => {
                setCurrentStep(1)
                setConversionGoal(null)
                setAdChannel(null)
                setTrackingLinkName('')
                setCreatedTrackingLink(null)
              }}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
            >
              추적 링크 더 만들기
            </button>
          </div>

          {/* 광고 채널 API 연동 유도 */}
          {['meta', 'google', 'tiktok', 'kakao'].includes(adChannel || '') && (
            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">광고 채널 API를 연동하면 광고비가 자동 수집돼요!</div>
                  <div className="text-xs text-slate-400">ROAS를 자동으로 계산하고 분석할 수 있어요</div>
                </div>
                <Link
                  href="/ad-channels?from=quick-start"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  연동하기
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 도움말 */}
      <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-white mb-1">도움이 필요하신가요?</h4>
            <p className="text-xs text-slate-400">
              설정 중 궁금한 점이 있으시면 언제든 문의해주세요. 카카오톡 채널 또는 이메일로 연락하실 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
