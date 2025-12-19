'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

// 사이트 타입
type SiteType = 'naver' | 'cafe24' | 'imweb' | 'custom' | null

// 광고 채널 타입
type AdChannel = 'naver_search' | 'naver_gfa' | 'meta' | 'google' | 'tiktok' | 'kakao' | null

interface MySite {
  id: string
  site_name: string
  site_type: string
  store_id?: string | null
  status: string
}

interface AdChannelData {
  id: string
  channel_type: string
  channel_name: string
  account_name: string | null
  status: string
}

export default function QuickStartPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)

  // 연결된 데이터
  const [connectedSites, setConnectedSites] = useState<MySite[]>([])
  const [connectedAdChannels, setConnectedAdChannels] = useState<AdChannelData[]>([])

  // Step 1: 쇼핑몰 연동
  const [siteType, setSiteType] = useState<SiteType>(null)
  const [showSiteForm, setShowSiteForm] = useState(false)
  const [siteName, setSiteName] = useState('')
  const [storeId, setStoreId] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [cafe24MallId, setCafe24MallId] = useState('')
  const [siteConnectLoading, setSiteConnectLoading] = useState(false)
  const [siteConnectError, setSiteConnectError] = useState('')

  // Step 2: 광고 채널 연동
  const [adChannel, setAdChannel] = useState<AdChannel>(null)
  const [showAdForm, setShowAdForm] = useState(false)
  const [naverCustomerId, setNaverCustomerId] = useState('')
  const [naverApiKey, setNaverApiKey] = useState('')
  const [naverSecretKey, setNaverSecretKey] = useState('')
  const [naverAccountName, setNaverAccountName] = useState('')
  const [adConnectLoading, setAdConnectLoading] = useState(false)
  const [adConnectError, setAdConnectError] = useState('')

  // 삭제 관련 상태
  const [deletingSite, setDeletingSite] = useState<MySite | null>(null)
  const [deletingAdChannel, setDeletingAdChannel] = useState<AdChannelData | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

    // 연결된 사이트 조회
    const { data: sites } = await supabase
      .from('my_sites')
      .select('id, site_name, site_type, store_id, status')
      .eq('user_id', user.id)
      .in('status', ['connected', 'active', 'pending_verification', 'pending_script'])
      .order('created_at', { ascending: false })

    if (sites && sites.length > 0) {
      setConnectedSites(sites)
    }

    // 연결된 광고 채널 조회
    const { data: channels } = await supabase
      .from('ad_channels')
      .select('id, channel_type, channel_name, account_name, status')
      .eq('user_id', user.id)
      .eq('status', 'connected')
      .order('created_at', { ascending: false })

    if (channels && channels.length > 0) {
      setConnectedAdChannels(channels)
    }

    setLoading(false)
  }

  // 쇼핑몰 연동
  const handleSiteConnect = async () => {
    if (!siteType) return

    setSiteConnectLoading(true)
    setSiteConnectError('')

    try {
      if (siteType === 'naver') {
        // 네이버 스마트스토어 연동
        if (!storeId || !clientId || !clientSecret) {
          setSiteConnectError('모든 필수 항목을 입력해주세요.')
          setSiteConnectLoading(false)
          return
        }

        const response = await fetch('/api/naver/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: clientId,
            applicationSecret: clientSecret,
            storeId: storeId,
            siteName: siteName || `스마트스토어 (${storeId})`,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setSiteConnectError(data.error || '연동에 실패했습니다.')
          setSiteConnectLoading(false)
          return
        }

        // 성공
        await checkExistingData()
        setShowSiteForm(false)
        resetSiteForm()

      } else if (siteType === 'cafe24') {
        // 카페24 OAuth 연동
        if (!cafe24MallId) {
          setSiteConnectError('쇼핑몰 ID를 입력해주세요.')
          setSiteConnectLoading(false)
          return
        }

        window.location.href = `/api/auth/cafe24?mall_id=${cafe24MallId}&from=quick-start`
        return

      } else if (siteType === 'imweb') {
        // 아임웹 OAuth 연동
        window.location.href = '/api/auth/imweb?from=quick-start'
        return
      }
    } catch {
      setSiteConnectError('네트워크 오류가 발생했습니다.')
    } finally {
      setSiteConnectLoading(false)
    }
  }

  // 광고 채널 연동
  const handleAdChannelConnect = async () => {
    if (!adChannel) return

    setAdConnectLoading(true)
    setAdConnectError('')

    try {
      if (adChannel === 'naver_search' || adChannel === 'naver_gfa') {
        // 네이버 검색광고/GFA API 연동
        if (!naverCustomerId || !naverApiKey || !naverSecretKey) {
          setAdConnectError('모든 필수 항목을 입력해주세요.')
          setAdConnectLoading(false)
          return
        }

        const endpoint = adChannel === 'naver_search'
          ? '/api/auth/naver-search-ads'
          : '/api/auth/naver-gfa'

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: naverCustomerId,
            apiKey: naverApiKey,
            secretKey: naverSecretKey,
            accountName: naverAccountName || undefined,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setAdConnectError(data.error || '연동에 실패했습니다.')
          setAdConnectLoading(false)
          return
        }

        // 성공
        await checkExistingData()
        setShowAdForm(false)
        resetAdForm()

      } else if (adChannel === 'meta') {
        window.location.href = '/api/auth/meta?from=quick-start'
        return
      } else if (adChannel === 'google') {
        window.location.href = '/api/auth/google?from=quick-start'
        return
      }
    } catch {
      setAdConnectError('네트워크 오류가 발생했습니다.')
    } finally {
      setAdConnectLoading(false)
    }
  }

  const resetSiteForm = () => {
    setSiteType(null)
    setSiteName('')
    setStoreId('')
    setClientId('')
    setClientSecret('')
    setCafe24MallId('')
    setSiteConnectError('')
  }

  const resetAdForm = () => {
    setAdChannel(null)
    setNaverCustomerId('')
    setNaverApiKey('')
    setNaverSecretKey('')
    setNaverAccountName('')
    setAdConnectError('')
  }

  // 쇼핑몰 연결 해제
  const handleDeleteSite = async () => {
    if (!deletingSite) return

    setDeleteLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('my_sites')
        .delete()
        .eq('id', deletingSite.id)

      if (error) {
        console.error('Failed to delete site:', error)
        return
      }

      await checkExistingData()
      setDeletingSite(null)
    } catch (error) {
      console.error('Delete site error:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  // 광고 채널 연결 해제
  const handleDeleteAdChannel = async () => {
    if (!deletingAdChannel) return

    setDeleteLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('ad_channels')
        .delete()
        .eq('id', deletingAdChannel.id)

      if (error) {
        console.error('Failed to delete ad channel:', error)
        return
      }

      await checkExistingData()
      setDeletingAdChannel(null)
    } catch (error) {
      console.error('Delete ad channel error:', error)
    } finally {
      setDeleteLoading(false)
    }
  }

  const getSiteTypeLabel = (type: string) => {
    switch (type) {
      case 'naver': return '스마트스토어'
      case 'cafe24': return '카페24'
      case 'imweb': return '아임웹'
      case 'custom': return '자체몰'
      default: return type
    }
  }

  // 사이트 타입별 로고 이미지 경로
  const getSiteLogo = (type: string) => {
    const logos: Record<string, string> = {
      'naver': '/site_logo/smartstore.png',
      'cafe24': '/site_logo/cafe24.png',
      'imweb': '/site_logo/imweb.png',
      'custom': '/site_logo/own_site.png',
      'makeshop': '/site_logo/makeshop.png',
      'godomall': '/site_logo/godomall.png',
    }
    return logos[type] || '/site_logo/own_site.png'
  }

  const getChannelLabel = (type: string) => {
    switch (type) {
      case 'naver_search': return '네이버 검색광고'
      case 'naver_gfa': return '네이버 GFA'
      case 'meta': return 'Meta 광고'
      case 'google': return 'Google Ads'
      case 'tiktok': return 'TikTok Ads'
      case 'kakao': return '카카오모먼트'
      default: return type
    }
  }

  // 다음 단계 가능 여부
  const canGoToStep2 = connectedSites.length > 0
  const canGoToStep3 = connectedAdChannels.length > 0

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">빠른 시작</h1>
        <p className="text-slate-400">쇼핑몰과 광고 채널을 연동하고 ROAS를 자동으로 측정하세요</p>
      </div>

      {/* 진행 단계 표시 */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <button
              onClick={() => {
                if (step === 1) setCurrentStep(1)
                else if (step === 2 && canGoToStep2) setCurrentStep(2)
                else if (step === 3 && canGoToStep3) setCurrentStep(3)
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                currentStep === step
                  ? 'bg-blue-600 text-white'
                  : currentStep > step || (step === 2 && canGoToStep2) || (step === 3 && canGoToStep3)
                    ? 'bg-green-600 text-white cursor-pointer hover:bg-green-500'
                    : 'bg-slate-700 text-slate-400'
              }`}
            >
              {(currentStep > step || (step === 2 && canGoToStep2 && currentStep !== 2) || (step === 3 && canGoToStep3 && currentStep !== 3)) ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : step}
            </button>
            {step < 3 && (
              <div className={`w-16 h-1 mx-1 rounded ${
                currentStep > step || (step === 1 && canGoToStep2) ? 'bg-green-600' : 'bg-slate-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-slate-400 mb-6">
        <span className={currentStep === 1 ? 'text-blue-400 font-medium' : ''}>쇼핑몰 연동</span>
        <span className="mx-2">→</span>
        <span className={currentStep === 2 ? 'text-blue-400 font-medium' : ''}>광고 채널 연동</span>
        <span className="mx-2">→</span>
        <span className={currentStep === 3 ? 'text-blue-400 font-medium' : ''}>완료</span>
      </div>

      {/* STEP 1: 쇼핑몰 연동 */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">STEP 1. 쇼핑몰 연동</h2>
            <p className="text-sm text-slate-400 mb-6">매출 데이터를 수집할 쇼핑몰을 연동하세요</p>

            {/* 이미 연결된 사이트 */}
            {connectedSites.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-slate-500 mb-2">연결된 쇼핑몰</p>
                <div className="space-y-2">
                  {connectedSites.map(site => (
                    <div key={site.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-green-500/30">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                          <Image
                            src={getSiteLogo(site.site_type)}
                            alt={getSiteTypeLabel(site.site_type)}
                            width={40}
                            height={40}
                            className="object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{site.site_name}</p>
                          <p className="text-xs text-slate-500">{getSiteTypeLabel(site.site_type)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">연동됨</span>
                        <button
                          onClick={() => setDeletingSite(site)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="연결 해제"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 새 쇼핑몰 추가 */}
            {!showSiteForm ? (
              <button
                onClick={() => setShowSiteForm(true)}
                className="w-full p-4 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                쇼핑몰 추가 연동
              </button>
            ) : (
              <div className="space-y-4">
                {/* 쇼핑몰 타입 선택 */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'naver' as SiteType, label: '스마트스토어', color: 'green' },
                    { type: 'cafe24' as SiteType, label: '카페24', color: 'blue' },
                    { type: 'imweb' as SiteType, label: '아임웹', color: 'purple' },
                  ].map(({ type, label, color }) => (
                    <button
                      key={type}
                      onClick={() => setSiteType(type)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        siteType === type
                          ? `border-${color}-500 bg-${color}-500/10`
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <p className={`font-medium ${siteType === type ? `text-${color}-400` : 'text-white'}`}>{label}</p>
                    </button>
                  ))}
                </div>

                {/* 네이버 스마트스토어 폼 */}
                {siteType === 'naver' && (
                  <div className="space-y-3 p-4 bg-slate-900/50 rounded-xl">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">스토어명 (선택)</label>
                      <input
                        type="text"
                        value={siteName}
                        onChange={(e) => setSiteName(e.target.value)}
                        placeholder="예: 내 스마트스토어"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">스토어 ID *</label>
                      <input
                        type="text"
                        value={storeId}
                        onChange={(e) => setStoreId(e.target.value)}
                        placeholder="스마트스토어 URL의 ID"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Application ID *</label>
                      <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="네이버 커머스 API Application ID"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Application Secret *</label>
                      <input
                        type="password"
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder="네이버 커머스 API Application Secret"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <Link
                      href="/guide?tab=sites&channel=naver"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      연동 방법 자세히 보기
                    </Link>
                  </div>
                )}

                {/* 카페24 폼 */}
                {siteType === 'cafe24' && (
                  <div className="space-y-3 p-4 bg-slate-900/50 rounded-xl">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">쇼핑몰 ID (Mall ID) *</label>
                      <input
                        type="text"
                        value={cafe24MallId}
                        onChange={(e) => setCafe24MallId(e.target.value)}
                        placeholder="예: myshop"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                      <p className="text-xs text-slate-500 mt-1">myshop.cafe24.com의 myshop 부분</p>
                    </div>
                  </div>
                )}

                {/* 아임웹 */}
                {siteType === 'imweb' && (
                  <div className="p-4 bg-slate-900/50 rounded-xl">
                    <p className="text-sm text-slate-300">아임웹 로그인으로 자동 연동됩니다.</p>
                  </div>
                )}

                {siteConnectError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{siteConnectError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSiteForm(false)
                      resetSiteForm()
                    }}
                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSiteConnect}
                    disabled={siteConnectLoading || !siteType}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {siteConnectLoading ? '연동 중...' : '연동하기'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 다음 단계 버튼 */}
          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!canGoToStep2}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              다음 단계
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: 광고 채널 연동 */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-2">STEP 2. 광고 채널 연동</h2>
            <p className="text-sm text-slate-400 mb-6">광고비 데이터를 수집할 광고 채널을 연동하세요</p>

            {/* 이미 연결된 광고 채널 */}
            {connectedAdChannels.length > 0 && (
              <div className="mb-6">
                <p className="text-xs text-slate-500 mb-2">연결된 광고 채널</p>
                <div className="space-y-2">
                  {connectedAdChannels.map(channel => (
                    <div key={channel.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-green-500/30">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          channel.channel_type === 'naver_search' || channel.channel_type === 'naver_gfa' ? 'bg-green-500/20' :
                          channel.channel_type === 'meta' ? 'bg-blue-500/20' :
                          channel.channel_type === 'google' ? 'bg-red-500/20' : 'bg-slate-500/20'
                        }`}>
                          {channel.channel_type === 'naver_search' ? (
                            <span className="text-green-400 font-bold text-xs">SA</span>
                          ) : channel.channel_type === 'naver_gfa' ? (
                            <span className="text-green-400 font-bold text-xs">GFA</span>
                          ) : channel.channel_type === 'meta' ? (
                            <span className="text-blue-400 font-bold text-xs">M</span>
                          ) : channel.channel_type === 'google' ? (
                            <span className="text-red-400 font-bold text-xs">G</span>
                          ) : (
                            <span className="text-slate-400 font-bold text-xs">AD</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{channel.channel_name || getChannelLabel(channel.channel_type)}</p>
                          <p className="text-xs text-slate-500">{channel.account_name || getChannelLabel(channel.channel_type)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">연동됨</span>
                        <button
                          onClick={() => setDeletingAdChannel(channel)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="연결 해제"
                        >
                          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 새 광고 채널 추가 */}
            {!showAdForm ? (
              <button
                onClick={() => setShowAdForm(true)}
                className="w-full p-4 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                광고 채널 추가 연동
              </button>
            ) : (
              <div className="space-y-4">
                {/* 광고 채널 선택 */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { type: 'naver_search' as AdChannel, label: '네이버 검색광고', color: 'green' },
                    { type: 'naver_gfa' as AdChannel, label: '네이버 GFA', color: 'green' },
                    { type: 'meta' as AdChannel, label: 'Meta 광고', color: 'blue' },
                    { type: 'google' as AdChannel, label: 'Google Ads', color: 'red' },
                  ].map(({ type, label, color }) => (
                    <button
                      key={type}
                      onClick={() => setAdChannel(type)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        adChannel === type
                          ? `border-${color}-500 bg-${color}-500/10`
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <p className={`font-medium ${adChannel === type ? `text-${color}-400` : 'text-white'}`}>{label}</p>
                    </button>
                  ))}
                </div>

                {/* 네이버 검색광고/GFA 폼 */}
                {(adChannel === 'naver_search' || adChannel === 'naver_gfa') && (
                  <div className="space-y-3 p-4 bg-slate-900/50 rounded-xl">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">계정 별칭 (선택)</label>
                      <input
                        type="text"
                        value={naverAccountName}
                        onChange={(e) => setNaverAccountName(e.target.value)}
                        placeholder="예: 내 검색광고 계정"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">고객 ID *</label>
                      <input
                        type="text"
                        value={naverCustomerId}
                        onChange={(e) => setNaverCustomerId(e.target.value)}
                        placeholder="예: 1234567"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">API Key *</label>
                      <input
                        type="text"
                        value={naverApiKey}
                        onChange={(e) => setNaverApiKey(e.target.value)}
                        placeholder="API 키 입력"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Secret Key *</label>
                      <input
                        type="password"
                        value={naverSecretKey}
                        onChange={(e) => setNaverSecretKey(e.target.value)}
                        placeholder="비밀키 입력"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <Link
                      href={`/guide?tab=adchannels&channel=${adChannel === 'naver_search' ? 'naver-search' : 'naver-gfa'}`}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      연동 방법 자세히 보기
                    </Link>
                  </div>
                )}

                {/* Meta/Google OAuth 안내 */}
                {(adChannel === 'meta' || adChannel === 'google') && (
                  <div className="p-4 bg-slate-900/50 rounded-xl">
                    <p className="text-sm text-slate-300">
                      {adChannel === 'meta' ? 'Facebook/Instagram' : 'Google'} 로그인으로 자동 연동됩니다.
                    </p>
                  </div>
                )}

                {adConnectError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm text-red-400">{adConnectError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowAdForm(false)
                      resetAdForm()
                    }}
                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleAdChannelConnect}
                    disabled={adConnectLoading || !adChannel}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {adConnectLoading ? '연동 중...' : '연동하기'}
                  </button>
                </div>
              </div>
            )}

            {/* 스마트스토어 + 네이버 광고 자동 매칭 안내 */}
            {connectedSites.some(s => s.site_type === 'naver') &&
             connectedAdChannels.some(c => c.channel_type === 'naver_search' || c.channel_type === 'naver_gfa') && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <div className="flex items-center gap-2 text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm font-medium">자동 매칭 활성화!</p>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  스마트스토어와 네이버 광고가 연동되어 ROAS가 자동으로 계산됩니다.
                </p>
              </div>
            )}
          </div>

          {/* 이전/다음 버튼 */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              이전 단계
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              disabled={!canGoToStep3}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              다음 단계
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: 완료 */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-white mb-2">설정 완료!</h2>
            <p className="text-slate-300 mb-6">
              이제 광고비와 매출이 자동으로 수집되어 ROAS를 확인할 수 있습니다.
            </p>

            {/* 연결된 항목 요약 */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-left">
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-2">연결된 쇼핑몰</p>
                {connectedSites.map(site => (
                  <p key={site.id} className="text-sm text-white">{site.site_name}</p>
                ))}
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4">
                <p className="text-xs text-slate-500 mb-2">연결된 광고 채널</p>
                {connectedAdChannels.map(channel => (
                  <p key={channel.id} className="text-sm text-white">{channel.channel_name || getChannelLabel(channel.channel_type)}</p>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href="/conversions"
                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition-colors"
              >
                전환 추적 관리로 이동
              </Link>
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
              >
                대시보드로 이동
              </Link>
            </div>
          </div>

          {/* 외부 광고 사용 시 안내 */}
          {!connectedSites.some(s => s.site_type === 'naver') ||
           connectedAdChannels.some(c => c.channel_type === 'meta' || c.channel_type === 'google') ? (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">외부 광고 연결이 필요한가요?</p>
                  <p className="text-sm text-slate-300">Meta, Google 등 외부 광고를 사용할 경우 추적 링크가 필요합니다.</p>
                </div>
                <Link
                  href="/conversions?openModal=true"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                >
                  추적 링크 만들기
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* 도움말 */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-white mb-1">도움이 필요하신가요?</h4>
            <p className="text-xs text-slate-400">
              설정 중 궁금한 점이 있으시면 <Link href="/guide" className="text-blue-400 hover:text-blue-300">사용 가이드</Link>를 참고하시거나 문의해주세요.
            </p>
          </div>
        </div>
      </div>

      {/* 쇼핑몰 삭제 확인 모달 */}
      {deletingSite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">쇼핑몰 연결 해제</h3>
              <p className="text-sm text-slate-400 mt-1">
                <span className="text-white font-medium">{deletingSite.site_name}</span>
              </p>
            </div>

            <div className="p-6">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm text-red-400 font-medium">주의</p>
                    <p className="text-xs text-slate-400 mt-1">
                      연결을 해제하면 해당 쇼핑몰의 주문 및 매출 데이터 수집이 중단됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-300 text-center">
                정말 이 쇼핑몰 연결을 해제하시겠습니까?
              </p>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3">
              <button
                onClick={() => setDeletingSite(null)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteSite}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    해제 중...
                  </>
                ) : (
                  '연결 해제'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 광고 채널 삭제 확인 모달 */}
      {deletingAdChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">광고 채널 연결 해제</h3>
              <p className="text-sm text-slate-400 mt-1">
                <span className="text-white font-medium">{deletingAdChannel.channel_name || getChannelLabel(deletingAdChannel.channel_type)}</span>
              </p>
            </div>

            <div className="p-6">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm text-red-400 font-medium">주의</p>
                    <p className="text-xs text-slate-400 mt-1">
                      연결을 해제하면 해당 광고 채널의 광고비 데이터 수집이 중단됩니다.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-300 text-center">
                정말 이 광고 채널 연결을 해제하시겠습니까?
              </p>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3">
              <button
                onClick={() => setDeletingAdChannel(null)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAdChannel}
                disabled={deleteLoading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    해제 중...
                  </>
                ) : (
                  '연결 해제'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
