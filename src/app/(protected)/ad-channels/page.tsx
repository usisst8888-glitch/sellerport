'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { GoogleAdsConnectDialog } from '@/components/ad-channels/google-ads-connect-dialog'
import { TikTokAdsConnectDialog } from '@/components/ad-channels/tiktok-ads-connect-dialog'
import { NaverGfaConnectDialog } from '@/components/ad-channels/naver-gfa-connect-dialog'
import { YouTubeConnectDialog } from '@/components/ad-channels/youtube-connect-dialog'
import { InstagramConnectDialog } from '@/components/ad-channels/instagram-connect-dialog'
import { NaverBlogConnectDialog } from '@/components/ad-channels/naver-blog-connect-dialog'
import { MetaConnectDialog } from '@/components/ad-channels/meta-connect-dialog'

// 네이버 검색광고 연동 모달 컴포넌트
interface NaverSearchAdsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function NaverSearchAdsModal({ isOpen, onClose, onSuccess }: NaverSearchAdsModalProps) {
  const [customerId, setCustomerId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [accountName, setAccountName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!customerId || !apiKey || !secretKey) {
      setError('필수 항목을 모두 입력해주세요.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/naver-search-ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          apiKey,
          secretKey,
          accountName: accountName || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '연동에 실패했습니다.')
        return
      }

      onSuccess()
      onClose()
      setCustomerId('')
      setApiKey('')
      setSecretKey('')
      setAccountName('')
    } catch {
      setError('네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setError('')
    setCustomerId('')
    setApiKey('')
    setSecretKey('')
    setAccountName('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
        <div className="p-6 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#03C75A] flex items-center justify-center">
                <span className="text-white font-bold">SA</span>
              </div>
              <h2 className="text-lg font-semibold text-white">네이버 검색광고 연동</h2>
            </div>
            <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                네이버 검색광고 광고비 자동 수집
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                키워드별 전환 데이터 추적
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                캠페인 성과 및 ROAS 분석
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                계정 별칭
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="예: 내 검색광고 계정"
                className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                고객 ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                placeholder="예: 1234567"
                className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                API Key <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="API 키 입력"
                className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Secret Key <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="비밀키 입력"
                className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                required
              />
            </div>
          </div>
        </div>

        <NaverSearchAdsFooter loading={loading} onClose={handleClose} onSubmit={handleSubmit} disabled={!customerId || !apiKey || !secretKey} />
      </div>
    </div>
  )
}

function NaverSearchAdsFooter({ loading, onClose, onSubmit, disabled }: { loading: boolean; onClose: () => void; onSubmit: () => void; disabled: boolean }) {
  const router = useRouter()

  return (
    <div className="p-6 border-t border-white/5 flex-shrink-0">
      <button
        type="button"
        onClick={() => router.push('/guide?tab=adchannels&channel=naver-search')}
        className="w-full mb-3 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        연동 방법 자세히 보기
      </button>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || disabled}
          className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>연동 중...</span>
            </>
          ) : '연동하기'}
        </button>
      </div>
    </div>
  )
}

interface AdChannel {
  id: string
  channel_type: string
  channel_name: string
  account_id: string | null
  account_name: string | null
  status: string
  last_sync_at: string | null
  created_at: string
  is_manual?: boolean
  metadata?: Record<string, unknown>
}

// 수동 채널 타입 (레거시 - 기존 데이터 호환용)
const manualChannelTypes: { value: string; label: string; icon: string; description: string }[] = []

// 광고 채널 로고 매핑
const channelLogos: Record<string, string> = {
  meta: '/channel_logo/meta.png',
  google: '/channel_logo/google_ads.png',
  naver_search: '/channel_logo/naver_search.png',
  naver_gfa: '/channel_logo/naver_gfa.png',
  tiktok_ads: '/channel_logo/tiktok.png',
  youtube: '/channel_logo/youtube.png',
  instagram: '/channel_logo/insta.png',
  naver_blog: '/channel_logo/naver_blog.png',
  influencer: '/channel_logo/influencer.png',
  experience: '/channel_logo/experience.png',
}

// 채널 타입 한글 라벨 매핑
const channelTypeLabels: Record<string, string> = {
  instagram: '인스타그램',
  youtube: '유튜브',
  naver_blog: '네이버 블로그',
  meta: 'Meta 광고',
  google_ads: 'Google Ads',
  naver_search: '네이버 검색광고',
  naver_gfa: '네이버 GFA',
  tiktok_ads: '틱톡 광고',
  influencer: '인플루언서',
  experience: '체험단',
}

// 광고 채널 설정
interface AdChannelConfig {
  id: string
  name: string
  description: string
  status: 'available' | 'coming_soon'
  features: string[]
  warning?: string
  category: 'organic' | 'paid_ad' | 'other' // 자체채널 vs 유료광고 vs 기타
  connectionType: 'api' | 'manual' | 'both' // 연동 방식
}

const adChannels: AdChannelConfig[] = [
  // 자체 채널
  {
    id: 'instagram',
    name: '인스타그램 피드/스토리/릴스',
    description: 'Instagram Graph API 연동',
    status: 'available',
    features: ['팔로워/도달 추적', '참여율 분석', '스토리 성과'],
    category: 'organic',
    connectionType: 'api',
  },
  {
    id: 'youtube',
    name: '유튜브 본편/쇼츠',
    description: 'YouTube Analytics API 연동',
    status: 'available',
    features: ['조회수/구독자 추적', '시청시간 분석', '참여율 데이터'],
    category: 'organic',
    connectionType: 'api',
  },
  {
    id: 'naver_blog',
    name: '네이버 블로그',
    description: '블로그 마케팅',
    status: 'available',
    features: ['채널 등록 및 관리', '블로그 URL 연결'],
    category: 'organic',
    connectionType: 'manual',
  },
  // 유료 광고 채널
  {
    id: 'meta',
    name: 'Meta Ads',
    description: 'Facebook/Instagram/Threads 광고',
    status: 'available',
    features: ['광고비 자동 수집', '캠페인 성과', '광고 on/off 제어'],
    category: 'paid_ad',
    connectionType: 'api',
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Google Ads API 연동',
    status: 'available',
    features: ['광고비 자동 수집', '전환 데이터', '광고 on/off 제어'],
    category: 'paid_ad',
    connectionType: 'api',
  },
  {
    id: 'naver_search',
    name: '네이버 검색광고',
    description: '네이버 광고 API 연동',
    status: 'available',
    features: ['광고비 자동 수집', '키워드별 클릭/노출', '전체 ROAS 계산'],
    warning: '스마트스토어 랜딩 시 키워드별 전환 추적 불가 (네이버 정책)',
    category: 'paid_ad',
    connectionType: 'api',
  },
  {
    id: 'naver_gfa',
    name: '네이버 GFA',
    description: '성과형 디스플레이 광고',
    status: 'available',
    features: ['광고비 자동 수집', '타겟팅 성과', '노출/클릭 데이터'],
    category: 'paid_ad',
    connectionType: 'api',
  },
  {
    id: 'tiktok_ads',
    name: 'TikTok Ads',
    description: 'TikTok Marketing API 연동',
    status: 'available',
    features: ['광고비 자동 수집', '쇼트폼 광고 성과', 'MZ 타겟팅'],
    category: 'paid_ad',
    connectionType: 'api',
  },
  // 기타
  {
    id: 'influencer',
    name: '인플루언서',
    description: '외부 인플루언서 협찬',
    status: 'available',
    features: ['협찬 비용 관리', '전환 추적', '성과 분석'],
    category: 'other',
    connectionType: 'manual',
  },
  {
    id: 'experience',
    name: '체험단',
    description: '블로그 체험단, 리뷰어',
    status: 'available',
    features: ['체험단 비용 관리', '전환 추적', '성과 분석'],
    category: 'other',
    connectionType: 'manual',
  },
]

export default function AdChannelsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [connectedChannels, setConnectedChannels] = useState<AdChannel[]>([])
  const [manualChannels, setManualChannels] = useState<AdChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [naverSearchModalOpen, setNaverSearchModalOpen] = useState(false)

  // 모달 열기용 상태 (가이드에서 연결)
  const [connectModalOpen, setConnectModalOpen] = useState<string | null>(null)

  // 수동 채널 추가 모달
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualForm, setManualForm] = useState({
    channelType: '',
    channelName: '',
    contactName: '',
    contactInfo: '',
    channelUrl: '',
    memo: '',
  })
  const [creatingManual, setCreatingManual] = useState(false)

  // 수동 채널 삭제
  const [deletingManual, setDeletingManual] = useState<AdChannel | null>(null)

  // 모달 닫기 함수
  const closeConnectModal = useCallback(() => {
    setConnectModalOpen(null)
    // URL에서 connect 파라미터 제거
    router.replace('/ad-channels')
  }, [router])

  useEffect(() => {
    fetchConnectedChannels()
    fetchManualChannels()

    // URL 파라미터에서 메시지 확인
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    const tab = searchParams.get('tab')
    const connect = searchParams.get('connect')

    // 연동 모달 자동 열기 (가이드에서 연결)
    if (connect) {
      if (connect === 'naver-search') {
        setNaverSearchModalOpen(true)
      } else {
        setConnectModalOpen(connect)
      }
    }

    if (success === 'meta_connected') {
      setMessage({ type: 'success', text: 'Meta 광고 계정이 성공적으로 연동되었습니다!' })
    } else if (success === 'google_ads_connected') {
      setMessage({ type: 'success', text: 'Google Ads 계정이 성공적으로 연동되었습니다!' })
    } else if (success === 'google_ads_pending') {
      setMessage({ type: 'success', text: 'Google 계정이 연결되었습니다. 광고 계정 데이터는 곧 동기화됩니다.' })
    } else if (success === 'instagram_connected') {
      setMessage({ type: 'success', text: 'Instagram 계정이 성공적으로 연동되었습니다!' })
    } else if (success === 'youtube_connected') {
      setMessage({ type: 'success', text: 'YouTube 채널이 성공적으로 연동되었습니다!' })
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'no_ad_accounts': 'Meta에 연결된 광고 계정이 없습니다. 광고 계정을 먼저 생성해주세요.',
        'no_facebook_pages': 'Facebook 페이지가 없습니다. Instagram 비즈니스 계정을 연결하려면 Facebook 페이지가 필요합니다.',
        'no_instagram_business_account': 'Instagram 비즈니스 계정이 연결된 Facebook 페이지가 없습니다. Instagram 앱에서 비즈니스 계정으로 전환 후 Facebook 페이지와 연결해주세요.',
        'instagram_account_error': 'Instagram 계정 정보를 가져오는데 실패했습니다.',
        'no_youtube_channel': 'YouTube 채널을 찾을 수 없습니다. Google 계정에 YouTube 채널이 있는지 확인해주세요.',
        'token_exchange_failed': '토큰 교환에 실패했습니다. 다시 시도해주세요.',
        'save_failed': '연동 정보 저장에 실패했습니다.',
        'internal_error': '내부 오류가 발생했습니다. 다시 시도해주세요.',
        'invalid_state': '잘못된 요청입니다. 다시 시도해주세요.',
        'state_expired': '요청이 만료되었습니다. 다시 시도해주세요.',
        'configuration_error': '서버 설정 오류입니다. 관리자에게 문의해주세요.',
      }
      setMessage({ type: 'error', text: errorMessages[error] || `연동 중 오류가 발생했습니다: ${error}` })
    }

    // URL에서 파라미터 제거 (connect 제외)
    if (success || error || tab) {
      router.replace('/ad-channels')
    }
  }, [searchParams, router])

  // 메시지 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const fetchConnectedChannels = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('ad_channels')
        .select('*')
        .eq('is_manual', false)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setConnectedChannels(data)
      }
    } catch (error) {
      console.error('Failed to fetch ad channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchManualChannels = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('ad_channels')
        .select('*')
        .eq('is_manual', true)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setManualChannels(data)
      }
    } catch (error) {
      console.error('Failed to fetch manual channels:', error)
    }
  }

  const handleConnect = (channelId: string) => {
    if (channelId === 'meta') {
      window.open('/api/auth/meta', '_blank', 'width=600,height=700')
    } else if (channelId === 'naver_search') {
      setNaverSearchModalOpen(true)
    } else {
      alert(`${channelId} 연동 기능은 준비 중입니다.`)
    }
  }

  const handleNaverSearchSuccess = () => {
    setMessage({ type: 'success', text: '네이버 검색광고가 성공적으로 연동되었습니다!' })
    fetchConnectedChannels()
  }

  const handleCreateManualChannel = async () => {
    if (!manualForm.channelName.trim()) {
      setMessage({ type: 'error', text: '채널 이름을 입력해주세요' })
      return
    }

    setCreatingManual(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다' })
        setCreatingManual(false)
        return
      }

      const { error } = await supabase
        .from('ad_channels')
        .insert({
          user_id: user.id,
          channel_type: manualForm.channelType,
          channel_name: manualForm.channelName.trim(),
          account_name: manualForm.contactName.trim() || null,
          account_id: manualForm.contactInfo.trim() || null,
          metadata: {
            memo: manualForm.memo.trim(),
            channelUrl: manualForm.channelUrl.trim() || null,
          },
          status: 'connected',
          is_manual: true,
        })

      if (error) {
        console.error('Failed to create manual channel:', error)
        setMessage({ type: 'error', text: '채널 추가에 실패했습니다' })
        return
      }

      setMessage({ type: 'success', text: '수동 채널이 추가되었습니다' })
      setShowManualModal(false)
      setManualForm({
        channelType: '',
        channelName: '',
        contactName: '',
        contactInfo: '',
        channelUrl: '',
        memo: '',
      })
      fetchManualChannels()
    } catch (error) {
      console.error('Failed to create manual channel:', error)
      setMessage({ type: 'error', text: '채널 추가 중 오류가 발생했습니다' })
    } finally {
      setCreatingManual(false)
    }
  }

  const handleDeleteManualChannel = async () => {
    if (!deletingManual) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('ad_channels')
        .delete()
        .eq('id', deletingManual.id)

      if (error) {
        console.error('Failed to delete manual channel:', error)
        setMessage({ type: 'error', text: '삭제에 실패했습니다' })
        return
      }

      setMessage({ type: 'success', text: '채널이 삭제되었습니다' })
      setDeletingManual(null)
      fetchManualChannels()
    } catch (error) {
      console.error('Failed to delete manual channel:', error)
      setMessage({ type: 'error', text: '삭제 중 오류가 발생했습니다' })
    }
  }

  const getChannelStatus = (channelId: string) => {
    // channelId와 channel_type 매핑 (UI id → DB channel_type)
    const channelTypeMap: Record<string, string> = {
      'google': 'google_ads',
    }
    const dbChannelType = channelTypeMap[channelId] || channelId
    return connectedChannels.find(c => c.channel_type === dbChannelType)
  }

  const getChannelLabel = (type: string) => {
    return channelTypeLabels[type] || type
  }

  return (
    <div className="space-y-8">
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

      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-white">광고 채널 연동</h1>
        <p className="mt-1 text-sm text-slate-400">
          광고 채널을 연동하면 광고비가 자동으로 수집되어 ROAS가 실시간으로 계산됩니다
        </p>
      </div>

      {/* 연동 현황 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
          <p className="text-sm text-slate-400">전체 채널</p>
          <p className="text-2xl font-bold text-white mt-1">{connectedChannels.filter(c => c.status === 'connected').length + manualChannels.length}개</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
          <p className="text-sm text-slate-400">API 연동</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{connectedChannels.filter(c => c.status === 'connected').length}개</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
          <p className="text-sm text-slate-400">수동 채널</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{manualChannels.length}개</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
          <p className="text-sm text-slate-400">오늘 광고비</p>
          <p className="text-2xl font-bold text-white mt-1">-</p>
          <p className="text-xs text-slate-500 mt-1">채널 연동 후 표시됩니다</p>
        </div>
      </div>

      {/* 등록된 채널 목록 (상단 배치) */}
      {manualChannels.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <h3 className="text-white font-semibold">등록된 채널</h3>
            <p className="text-xs text-slate-500 mt-0.5">수동으로 등록한 마케팅 채널</p>
          </div>
          <div className="divide-y divide-white/5">
            {manualChannels.map((channel) => (
              <div key={channel.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {channelLogos[channel.channel_type] ? (
                        <img
                          src={channelLogos[channel.channel_type]}
                          alt={channel.channel_type}
                          width={40}
                          height={40}
                          className="rounded-lg"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                          <span className="text-slate-400 text-sm">{channel.channel_type.charAt(0).toUpperCase()}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">{channel.channel_name}</h4>
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/20 text-amber-300">
                          {getChannelLabel(channel.channel_type)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {channel.account_name && (
                          <span className="text-xs text-slate-400">{channel.account_name}</span>
                        )}
                        {channel.account_id && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-xs text-slate-500">{channel.account_id}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/conversions?channel=${channel.id}`}
                      className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 hover:text-amber-200 text-xs transition-colors"
                    >
                      추적 링크 발급
                    </a>
                    <button
                      onClick={() => setDeletingManual(channel)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 자체 채널 */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">자체 채널</h2>
            <p className="text-xs text-slate-400">인스타그램, 유튜브, 블로그 등 내 채널</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adChannels.filter(c => c.category === 'organic').map((channel) => {
            const connectedChannel = getChannelStatus(channel.id)
            const isConnected = connectedChannel?.status === 'connected'
            const logoPath = channelLogos[channel.id]

            return (
              <div
                key={channel.id}
                className={`relative overflow-hidden rounded-xl border p-5 transition-all ${
                  isConnected
                    ? 'bg-gradient-to-br from-emerald-500/10 to-slate-800/50 border-emerald-500/30'
                    : 'bg-slate-800/50 border-white/5 hover:border-white/10'
                }`}
              >
                {/* 뱃지들 */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                    channel.connectionType === 'api' ? 'bg-blue-500/20 text-blue-300' :
                    channel.connectionType === 'both' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-slate-600/50 text-slate-400'
                  }`}>
                    {channel.connectionType === 'api' ? 'API' : channel.connectionType === 'both' ? '수동/API' : '수동'}
                  </span>
                  {isConnected && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded flex items-center gap-0.5">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      연동됨
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {logoPath ? (
                      <Image src={logoPath} alt={channel.name} width={48} height={48} className="rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-2xl">📱</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium">{channel.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{channel.description}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  {channel.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                      <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  {isConnected ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-slate-300 border-white/10 hover:bg-white/5">
                        설정
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-red-400 border-red-500/30 hover:bg-red-500/10">
                        연동 해제
                      </Button>
                    </div>
                  ) : channel.connectionType === 'manual' ? (
                    channel.id === 'naver_blog' ? (
                      <NaverBlogConnectDialog onSuccess={() => {
                        fetchConnectedChannels()
                        fetchManualChannels()
                        setMessage({ type: 'success', text: '네이버 블로그가 추가되었습니다!' })
                      }}>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                          채널 추가
                        </Button>
                      </NaverBlogConnectDialog>
                    ) : (
                      <Button
                        onClick={() => {
                          setManualForm({ ...manualForm, channelType: channel.id })
                          setShowManualModal(true)
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        연동하기
                      </Button>
                    )
                  ) : channel.id === 'instagram' ? (
                    <InstagramConnectDialog onSuccess={() => {
                      fetchConnectedChannels()
                      setMessage({ type: 'success', text: 'Instagram 계정이 연동되었습니다!' })
                    }}>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                        연동하기
                      </Button>
                    </InstagramConnectDialog>
                  ) : channel.id === 'youtube' ? (
                    <YouTubeConnectDialog onSuccess={() => {
                      fetchConnectedChannels()
                      setMessage({ type: 'success', text: 'YouTube 채널이 연동되었습니다!' })
                    }}>
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                        연동하기
                      </Button>
                    </YouTubeConnectDialog>
                  ) : (
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white">
                      연동하기
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 유료 광고 */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">유료 광고</h2>
            <p className="text-xs text-slate-400">Meta, Google, 네이버 등 광고 플랫폼</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adChannels.filter(c => c.category === 'paid_ad').map((channel) => {
            const connectedChannel = getChannelStatus(channel.id)
            const isConnected = connectedChannel?.status === 'connected'
            const logoPath = channelLogos[channel.id]

            return (
              <div
                key={channel.id}
                className={`relative overflow-hidden rounded-xl border p-5 transition-all ${
                  isConnected
                    ? 'bg-gradient-to-br from-blue-500/10 to-slate-800/50 border-blue-500/30'
                    : 'bg-slate-800/50 border-white/5 hover:border-white/10'
                }`}
              >
                {/* 뱃지들 */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-500/20 text-blue-300">
                    API
                  </span>
                  {isConnected && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded flex items-center gap-0.5">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      연동됨
                    </span>
                  )}
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {logoPath ? (
                      <Image src={logoPath} alt={channel.name} width={48} height={48} className="rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <span className="text-2xl">📢</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium">{channel.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{channel.description}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  {channel.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>

                {channel.warning && (
                  <div className="mt-3 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-[11px] text-amber-300/90 leading-relaxed">
                        {channel.warning}
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  {isConnected ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-slate-300 border-white/10 hover:bg-white/5">
                        설정
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-red-400 border-red-500/30 hover:bg-red-500/10">
                        연동 해제
                      </Button>
                    </div>
                  ) : channel.id === 'meta' ? (
                    <MetaConnectDialog onSuccess={() => {
                      fetchConnectedChannels()
                      setMessage({ type: 'success', text: 'Meta 광고 계정이 연동되었습니다!' })
                    }}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                        연동하기
                      </Button>
                    </MetaConnectDialog>
                  ) : channel.id === 'google' ? (
                    <GoogleAdsConnectDialog onSuccess={() => {
                      fetchConnectedChannels()
                      setMessage({ type: 'success', text: 'Google Ads 계정이 연동되었습니다!' })
                    }}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                        연동하기
                      </Button>
                    </GoogleAdsConnectDialog>
                  ) : channel.id === 'tiktok_ads' ? (
                    <TikTokAdsConnectDialog onSuccess={() => {
                      fetchConnectedChannels()
                      setMessage({ type: 'success', text: 'TikTok Ads 계정이 연동되었습니다!' })
                    }}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                        연동하기
                      </Button>
                    </TikTokAdsConnectDialog>
                  ) : channel.id === 'naver_gfa' ? (
                    <NaverGfaConnectDialog onSuccess={() => {
                      fetchConnectedChannels()
                      setMessage({ type: 'success', text: '네이버 GFA 계정이 연동되었습니다!' })
                    }}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                        연동하기
                      </Button>
                    </NaverGfaConnectDialog>
                  ) : (
                    <Button
                      onClick={() => handleConnect(channel.id)}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                    >
                      연동하기
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 기타 */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">기타</h2>
            <p className="text-xs text-slate-400">인플루언서, 체험단 등</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adChannels.filter(c => c.category === 'other').map((channel) => {
            const logoPath = channelLogos[channel.id]

            return (
              <div
                key={channel.id}
                className="relative overflow-hidden rounded-xl border p-5 transition-all bg-slate-800/50 border-white/5 hover:border-white/10"
              >
                {/* 뱃지 */}
                <div className="absolute top-3 right-3">
                  <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-slate-600/50 text-slate-400">
                    수동
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {logoPath ? (
                      <Image src={logoPath} alt={channel.name} width={48} height={48} className="rounded-lg" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <span className="text-2xl">{channel.id === 'influencer' ? '👤' : '📝'}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium">{channel.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{channel.description}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  {channel.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                      <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Button
                    onClick={() => {
                      setManualForm({ ...manualForm, channelType: channel.id })
                      setShowManualModal(true)
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                  >
                    채널 추가
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 연동 플로우 안내 */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-6">
        <h3 className="text-white font-semibold mb-4">연동 방법</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-semibold text-sm">1</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">광고 채널 선택</p>
              <p className="text-slate-400 text-xs mt-0.5">연동할 광고 채널을 선택하세요</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-semibold text-sm">2</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">내 계정으로 로그인</p>
              <p className="text-slate-400 text-xs mt-0.5">해당 채널에서 사용 중인 광고 계정으로 로그인</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-semibold text-sm">3</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">자동 연동 완료</p>
              <p className="text-slate-400 text-xs mt-0.5">광고비가 자동으로 수집되기 시작합니다</p>
            </div>
          </div>
        </div>
      </div>

      {/* 안내 메시지 */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div>
            <p className="text-sm text-blue-300 font-medium">연동 권한 안내</p>
            <p className="text-sm text-blue-200/70 mt-1">
              셀러포트는 <strong className="text-blue-300">광고 성과 조회 및 광고 on/off 제어</strong> 권한만 요청합니다.
              결제 정보나 비즈니스 설정에는 접근하지 않으며, 언제든 연동을 해제할 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 네이버 검색광고 연동 모달 */}
      <NaverSearchAdsModal
        isOpen={naverSearchModalOpen}
        onClose={() => setNaverSearchModalOpen(false)}
        onSuccess={handleNaverSearchSuccess}
      />

      {/* 수동 채널 추가 모달 */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {channelLogos[manualForm.channelType] && (
                  <img
                    src={channelLogos[manualForm.channelType]}
                    alt={manualForm.channelType}
                    width={48}
                    height={48}
                    className="rounded-lg"
                  />
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {channelTypeLabels[manualForm.channelType] || '채널'} 추가
                  </h3>
                  <p className="text-sm text-slate-400 mt-0.5">채널 정보를 입력해주세요</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowManualModal(false)
                  setManualForm({
                    channelType: '',
                    channelName: '',
                    contactName: '',
                    contactInfo: '',
                    channelUrl: '',
                    memo: '',
                  })
                }}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 채널 이름 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">채널 이름 *</label>
                <input
                  type="text"
                  placeholder="예: 김OO 인플루언서, 네이버 체험단 12월"
                  value={manualForm.channelName}
                  onChange={(e) => setManualForm({ ...manualForm, channelName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 담당자/연락처 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">담당자명 (선택)</label>
                  <input
                    type="text"
                    placeholder="예: 홍길동"
                    value={manualForm.contactName}
                    onChange={(e) => setManualForm({ ...manualForm, contactName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">연락처/ID (선택)</label>
                  <input
                    type="text"
                    placeholder="예: @instagram_id"
                    value={manualForm.contactInfo}
                    onChange={(e) => setManualForm({ ...manualForm, contactInfo: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 채널 주소 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">채널 주소 (선택)</label>
                <input
                  type="url"
                  placeholder="예: https://instagram.com/username"
                  value={manualForm.channelUrl}
                  onChange={(e) => setManualForm({ ...manualForm, channelUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">메모 (선택)</label>
                <textarea
                  placeholder="예: 팔로워 10만, 뷰티 카테고리, 12월 협찬 예정"
                  value={manualForm.memo}
                  onChange={(e) => setManualForm({ ...manualForm, memo: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* 안내 */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs text-purple-300">
                  수동 채널을 추가하면 <strong className="text-purple-200">전환 추적</strong> 페이지에서 이 채널용 추적 링크를 발급할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowManualModal(false)
                    setManualForm({
                      channelType: '',
                      channelName: '',
                      contactName: '',
                      contactInfo: '',
                      channelUrl: '',
                      memo: '',
                    })
                  }}
                  disabled={creatingManual}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleCreateManualChannel}
                  disabled={creatingManual || !manualForm.channelName.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingManual ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>추가 중...</span>
                    </>
                  ) : (
                    '채널 추가'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deletingManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">{deletingManual.channel_name}</p>
                  <p className="text-sm text-slate-400">이 채널을 삭제하시겠습니까?</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                채널은 삭제되지만, 이미 발급된 추적 링크는 유지됩니다.
              </p>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => setDeletingManual(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteManualChannel}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 가이드에서 연동 시 모달들 (controlled) */}
      <MetaConnectDialog
        open={connectModalOpen === 'meta'}
        onOpenChange={(open) => !open && closeConnectModal()}
        onSuccess={() => {
          fetchConnectedChannels()
          setMessage({ type: 'success', text: 'Meta 광고 계정이 연동되었습니다!' })
          closeConnectModal()
        }}
      />
      <GoogleAdsConnectDialog
        open={connectModalOpen === 'google-ads'}
        onOpenChange={(open) => !open && closeConnectModal()}
        onSuccess={() => {
          fetchConnectedChannels()
          setMessage({ type: 'success', text: 'Google Ads 계정이 연동되었습니다!' })
          closeConnectModal()
        }}
      />
      <TikTokAdsConnectDialog
        open={connectModalOpen === 'tiktok-ads'}
        onOpenChange={(open) => !open && closeConnectModal()}
        onSuccess={() => {
          fetchConnectedChannels()
          setMessage({ type: 'success', text: 'TikTok Ads 계정이 연동되었습니다!' })
          closeConnectModal()
        }}
      />
      <NaverGfaConnectDialog
        open={connectModalOpen === 'naver-gfa'}
        onOpenChange={(open) => !open && closeConnectModal()}
        onSuccess={() => {
          fetchConnectedChannels()
          setMessage({ type: 'success', text: '네이버 GFA 계정이 연동되었습니다!' })
          closeConnectModal()
        }}
      />
      <YouTubeConnectDialog
        open={connectModalOpen === 'youtube'}
        onOpenChange={(open) => !open && closeConnectModal()}
        onSuccess={() => {
          fetchConnectedChannels()
          setMessage({ type: 'success', text: 'YouTube 채널이 연동되었습니다!' })
          closeConnectModal()
        }}
      />
      <InstagramConnectDialog
        open={connectModalOpen === 'instagram'}
        onOpenChange={(open) => !open && closeConnectModal()}
        onSuccess={() => {
          fetchConnectedChannels()
          setMessage({ type: 'success', text: 'Instagram 계정이 연동되었습니다!' })
          closeConnectModal()
        }}
      />
      <NaverBlogConnectDialog
        open={connectModalOpen === 'naver-blog'}
        onOpenChange={(open) => !open && closeConnectModal()}
        onSuccess={() => {
          fetchConnectedChannels()
          setMessage({ type: 'success', text: '네이버 블로그가 연동되었습니다!' })
          closeConnectModal()
        }}
      />
    </div>
  )
}
