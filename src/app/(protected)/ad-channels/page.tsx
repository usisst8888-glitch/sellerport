'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { GoogleAdsConnectDialog } from '@/components/ad-channels/google-ads-connect-dialog'
import { KakaoMomentConnectDialog } from '@/components/ad-channels/kakao-moment-connect-dialog'
import { TikTokAdsConnectDialog } from '@/components/ad-channels/tiktok-ads-connect-dialog'
import { NaverGfaConnectDialog } from '@/components/ad-channels/naver-gfa-connect-dialog'
import { YouTubeConnectDialog } from '@/components/ad-channels/youtube-connect-dialog'
import { InstagramConnectDialog } from '@/components/ad-channels/instagram-connect-dialog'
import { TikTokConnectDialog } from '@/components/ad-channels/tiktok-connect-dialog'
import { ThreadsConnectDialog } from '@/components/ad-channels/threads-connect-dialog'

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      // 성공
      onSuccess()
      onClose()
      // 폼 초기화
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-slate-800 rounded-2xl border border-white/10 p-6 w-full max-w-md mx-4 shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#03C75A] flex items-center justify-center">
              <span className="text-white font-bold text-sm">SA</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">네이버 검색광고 연동</h2>
              <p className="text-sm text-slate-400">API 키를 입력해주세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              고객 ID (Customer ID) <span className="text-red-400">*</span>
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
              API Key (액세스 라이선스) <span className="text-red-400">*</span>
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
              Secret Key (비밀키) <span className="text-red-400">*</span>
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

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              계정 이름 (선택)
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="예: 내 검색광고 계정"
              className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
            />
          </div>

          {/* API 키 발급 안내 */}
          <div className="p-3 bg-slate-900/50 rounded-lg border border-white/5">
            <p className="text-xs text-slate-400">
              API 키는 <a
                href="https://searchad.naver.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                네이버 검색광고 관리 시스템
              </a>의 [도구 → API 사용관리]에서 발급받을 수 있습니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/10 text-slate-300 hover:bg-white/5"
              disabled={loading}
            >
              취소
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#03C75A] hover:bg-[#02b351] text-white"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  연동 중...
                </div>
              ) : '연동하기'}
            </Button>
          </div>
        </form>
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

// 수동 채널 타입
const manualChannelTypes = [
  { value: 'karrot', label: '당근 비즈니스', icon: '🥕', description: '당근 광고 (API 미지원)' },
  { value: 'toss', label: '토스 광고', icon: '💙', description: '토스애즈 (API 미지원)' },
  { value: 'naver_blog', label: '네이버 블로그', icon: '📗', description: '블로그 마케팅 (API 미지원)' },
  { value: 'influencer', label: '인플루언서', icon: '👤', description: '외부 인플루언서 협찬' },
  { value: 'experience', label: '체험단', icon: '📝', description: '블로그 체험단, 리뷰어' },
  { value: 'email', label: '이메일/SMS', icon: '📧', description: '뉴스레터, 문자 마케팅' },
  { value: 'other', label: '기타', icon: '📌', description: '기타 마케팅 채널' },
]

// 광고 채널 로고 컴포넌트
const MetaLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#0081FB"/>
    <path d="M25 50c0-8 3-14.5 7.5-18.5 3.5-3 8-5 13-5 6 0 11 3.5 14.5 8.5 3.5-5 8.5-8.5 14.5-8.5 5 0 9.5 2 13 5 4.5 4 7.5 10.5 7.5 18.5 0 8-3 14.5-7.5 18.5-3.5 3-8 5-13 5-6 0-11-3.5-14.5-8.5-3.5 5-8.5 8.5-14.5 8.5-5 0-9.5-2-13-5C28 64.5 25 58 25 50zm15 0c0 5.5 2.5 10 6.5 12.5 2 1.2 4 2 6.5 2 3.5 0 6.5-2 9-5.5-2.5-4-4-8.5-4-14s1.5-10 4-14c-2.5-3.5-5.5-5.5-9-5.5-2.5 0-4.5.8-6.5 2C42.5 30 40 34.5 40 40v10zm37 0c0-5.5-2.5-10-6.5-12.5-2-1.2-4-2-6.5-2-3.5 0-6.5 2-9 5.5 2.5 4 4 8.5 4 14s-1.5 10-4 14c2.5 3.5 5.5 5.5 9 5.5 2.5 0 4.5-.8 6.5-2 4-2.5 6.5-7 6.5-12.5V50z" fill="white"/>
  </svg>
)

const GoogleLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="white"/>
    <path d="M85 50c0-2.5-.2-5-.7-7.5H50v14h19.5c-.8 4.5-3.5 8.5-7.5 11v9h12c7-6.5 11-16 11-26.5z" fill="#4285F4"/>
    <path d="M50 85c10 0 18.5-3.5 24.5-9l-12-9c-3.5 2.5-8 4-12.5 4-9.5 0-17.5-6.5-20.5-15H17v9.5C23 76 35.5 85 50 85z" fill="#34A853"/>
    <path d="M29.5 56c-1-3-1.5-6-1.5-9s.5-6 1.5-9V28.5H17C14 34.5 12 42 12 50s2 15.5 5 21.5l12.5-9.5z" fill="#FBBC05"/>
    <path d="M50 26c5.5 0 10.5 2 14.5 5.5l11-11C68.5 14.5 60 11 50 11c-14.5 0-27 9-33 22.5l12.5 9.5c3-8.5 11-17 20.5-17z" fill="#EA4335"/>
  </svg>
)

const NaverSearchLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#03C75A"/>
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial">SA</text>
  </svg>
)

const NaverGfaLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#03C75A"/>
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">GFA</text>
  </svg>
)

const KakaoLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#FEE500"/>
    <path d="M50 25c-16.5 0-30 10.5-30 23.5 0 8.5 5.5 16 14 20.5l-3 11c-.2.8.6 1.5 1.4 1l13-8.5c1.5.2 3 .5 4.6.5 16.5 0 30-10.5 30-23.5S66.5 25 50 25z" fill="#3C1E1E"/>
  </svg>
)

const TikTokLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#000000"/>
    <path d="M67 42c-4 0-7.5-1.8-9.5-4.5V58c0 8.3-6.7 15-15 15s-15-6.7-15-15 6.7-15 15-15c.8 0 1.6.1 2.5.2v8.3c-.8-.2-1.6-.4-2.5-.4-4.1 0-7.5 3.4-7.5 7.5s3.4 7.5 7.5 7.5 7.5-3.4 7.5-7.5V27h7.5c0 4.1 3.4 7.5 7.5 7.5v7.5z" fill="#25F4EE"/>
    <path d="M69 44c-4 0-7.5-1.8-9.5-4.5V60c0 8.3-6.7 15-15 15s-15-6.7-15-15 6.7-15 15-15c.8 0 1.6.1 2.5.2v8.3c-.8-.2-1.6-.4-2.5-.4-4.1 0-7.5 3.4-7.5 7.5s3.4 7.5 7.5 7.5 7.5-3.4 7.5-7.5V29h7.5c0 4.1 3.4 7.5 7.5 7.5v7.5z" fill="#FE2C55"/>
    <path d="M68 43c-4 0-7.5-1.8-9.5-4.5V59c0 8.3-6.7 15-15 15s-15-6.7-15-15 6.7-15 15-15c.8 0 1.6.1 2.5.2v8.3c-.8-.2-1.6-.4-2.5-.4-4.1 0-7.5 3.4-7.5 7.5s3.4 7.5 7.5 7.5 7.5-3.4 7.5-7.5V28h7.5c0 4.1 3.4 7.5 7.5 7.5v7.5z" fill="white"/>
  </svg>
)

// 자체 채널 로고 컴포넌트
const YouTubeLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#FF0000"/>
    <path d="M78 37.5c-.8-3-3.2-5.4-6.2-6.2C67.2 30 50 30 50 30s-17.2 0-21.8 1.3c-3 .8-5.4 3.2-6.2 6.2C20.7 42.1 20.7 50 20.7 50s0 7.9 1.3 12.5c.8 3 3.2 5.4 6.2 6.2C32.8 70 50 70 50 70s17.2 0 21.8-1.3c3-.8 5.4-3.2 6.2-6.2 1.3-4.6 1.3-12.5 1.3-12.5s0-7.9-1.3-12.5zM43.3 58.3V41.7L60 50l-16.7 8.3z" fill="white"/>
  </svg>
)

const InstagramLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <defs>
      <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#F77737"/>
        <stop offset="50%" stopColor="#E1306C"/>
        <stop offset="75%" stopColor="#C13584"/>
        <stop offset="100%" stopColor="#833AB4"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" rx="20" fill="url(#ig-gradient)"/>
    <rect x="25" y="25" width="50" height="50" rx="12" stroke="white" strokeWidth="5" fill="none"/>
    <circle cx="50" cy="50" r="12" stroke="white" strokeWidth="5" fill="none"/>
    <circle cx="66" cy="34" r="4" fill="white"/>
  </svg>
)

const ThreadsLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#000000"/>
    <path d="M50.4 75h-.02c-8.95-.06-15.84-3.01-20.46-8.77-4.34-5.41-6.47-12.54-6.54-21.48v-.04c.07-8.95 2.2-16.08 6.31-21.21C34.1 18.01 41 15.06 50 15h.04c6.87.05 12.61 1.81 17.07 5.25 4.19 3.22 7.14 7.82 8.77 13.67l-5.1 1.42c-2.76-9.9-9.75-14.96-20.76-15.04-7.28.06-12.78 2.34-16.35 6.79-3.38 4.21-5.11 10.24-5.18 17.94.06 7.72 1.8 13.74 5.14 17.91 3.58 4.45 9.08 6.74 16.35 6.79 4.97-.03 9.4-1.19 13.18-3.43 4.42-2.63 6.85-6.18 6.85-10 0-2.62-1.2-4.86-3.47-6.48-2.1-1.5-4.94-2.32-8.23-2.37-3.43.04-6.17.79-7.94 2.16-1.5 1.16-2.16 2.5-2.16 4.42 0 1.55.6 2.82 1.82 3.88 1.26 1.09 3.05 1.72 5.18 1.82l-.31 5.3c-3.49-.21-6.5-1.34-8.7-3.28-2.3-2.03-3.51-4.76-3.51-7.9 0-3.5 1.54-6.38 4.44-8.33 2.74-1.84 6.46-2.82 10.76-2.83h.23c4.46.07 8.3 1.23 11.12 3.34 3.01 2.26 4.6 5.52 4.6 9.45 0 5.49-3.28 10.35-9.23 13.66-4.56 2.55-9.9 3.89-15.86 3.99l-.03-.01z" fill="white"/>
  </svg>
)

// 광고 채널 설정
interface AdChannelConfig {
  id: string
  name: string
  description: string
  logo: React.ComponentType<{ className?: string }>
  status: 'available' | 'coming_soon'
  features: string[]
  warning?: string
  category: 'paid_ad' | 'organic' // 유료광고 vs 자체채널
}

const adChannels: AdChannelConfig[] = [
  // 유료 광고 채널
  {
    id: 'meta',
    name: 'Meta (Facebook/Instagram/Threads)',
    description: 'Marketing API 연동',
    logo: MetaLogo,
    status: 'available',
    features: ['광고비 자동 수집', '캠페인 성과', '광고 on/off 제어'],
    category: 'paid_ad',
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Google Ads API 연동',
    logo: GoogleLogo,
    status: 'available',
    features: ['광고비 자동 수집', '전환 데이터', '광고 on/off 제어'],
    category: 'paid_ad',
  },
  {
    id: 'naver_search',
    name: '네이버 검색광고',
    description: '네이버 광고 API 연동',
    logo: NaverSearchLogo,
    status: 'available',
    features: ['광고비 자동 수집', '키워드별 클릭/노출', '전체 ROAS 계산'],
    warning: '스마트스토어 랜딩 시 키워드별 전환 추적 불가 (네이버 정책)',
    category: 'paid_ad',
  },
  {
    id: 'naver_gfa',
    name: '네이버 GFA',
    description: '성과형 디스플레이 광고',
    logo: NaverGfaLogo,
    status: 'available',
    features: ['광고비 자동 수집', '타겟팅 성과', '노출/클릭 데이터'],
    category: 'paid_ad',
  },
  {
    id: 'kakao',
    name: '카카오모먼트',
    description: '카카오 광고 API 연동',
    logo: KakaoLogo,
    status: 'available',
    features: ['광고비 자동 수집', '캠페인 성과', '타겟팅 분석'],
    category: 'paid_ad',
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'TikTok Marketing API 연동',
    logo: TikTokLogo,
    status: 'available',
    features: ['광고비 자동 수집', '쇼트폼 광고 성과', 'MZ 타겟팅'],
    category: 'paid_ad',
  },
  // 자체 채널
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'YouTube Analytics API 연동',
    logo: YouTubeLogo,
    status: 'available',
    features: ['조회수/구독자 추적', '시청시간 분석', '참여율 데이터'],
    category: 'organic',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Instagram Graph API 연동',
    logo: InstagramLogo,
    status: 'available',
    features: ['팔로워/도달 추적', '참여율 분석', '스토리 성과'],
    category: 'organic',
  },
  {
    id: 'tiktok_channel',
    name: 'TikTok',
    description: 'TikTok Creator API 연동',
    logo: TikTokLogo,
    status: 'available',
    features: ['조회수/팔로워 추적', '참여율 분석', '쇼츠 성과'],
    category: 'organic',
  },
  {
    id: 'threads',
    name: 'Threads',
    description: 'Threads API 연동',
    logo: ThreadsLogo,
    status: 'available',
    features: ['팔로워/조회수 추적', '참여율 분석', '게시물 성과'],
    category: 'organic',
  },
]

export default function AdChannelsPage() {
  const [connectedChannels, setConnectedChannels] = useState<AdChannel[]>([])
  const [manualChannels, setManualChannels] = useState<AdChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [naverSearchModalOpen, setNaverSearchModalOpen] = useState(false)

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

  // 현재 보기 탭 (API / 수동)
  const [activeTab, setActiveTab] = useState<'api' | 'manual'>('api')

  useEffect(() => {
    fetchConnectedChannels()
    fetchManualChannels()

    // URL 파라미터에서 메시지 확인
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    const tab = urlParams.get('tab')

    // 탭 파라미터가 있으면 해당 탭으로 이동
    if (tab === 'manual') {
      setActiveTab('manual')
    }

    if (success === 'meta_connected') {
      setMessage({ type: 'success', text: 'Meta 광고 계정이 성공적으로 연동되었습니다!' })
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'no_ad_accounts': 'Meta에 연결된 광고 계정이 없습니다. 광고 계정을 먼저 생성해주세요.',
        'token_exchange_failed': '토큰 교환에 실패했습니다. 다시 시도해주세요.',
        'save_failed': '연동 정보 저장에 실패했습니다.',
        'internal_error': '내부 오류가 발생했습니다. 다시 시도해주세요.',
        'invalid_state': '잘못된 요청입니다. 다시 시도해주세요.',
        'state_expired': '요청이 만료되었습니다. 다시 시도해주세요.',
        'configuration_error': '서버 설정 오류입니다. 관리자에게 문의해주세요.',
      }
      setMessage({ type: 'error', text: errorMessages[error] || `연동 중 오류가 발생했습니다: ${error}` })
    }

    // URL에서 파라미터 제거
    if (success || error || tab) {
      window.history.replaceState({}, '', '/ad-channels')
    }
  }, [])

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
      window.location.href = '/api/auth/meta'
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
    if (!manualForm.channelType || !manualForm.channelName.trim()) {
      setMessage({ type: 'error', text: '채널 유형과 이름을 입력해주세요' })
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
    return connectedChannels.find(c => c.channel_type === channelId)
  }

  const getManualChannelIcon = (type: string) => {
    const channel = manualChannelTypes.find(c => c.value === type)
    return channel?.icon || '📌'
  }

  const getManualChannelLabel = (type: string) => {
    const channel = manualChannelTypes.find(c => c.value === type)
    return channel?.label || type
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

      {/* 탭 전환 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('api')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'api'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-800/50 text-slate-400 hover:text-white'
          }`}
        >
          API 연동 채널
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`px-4 py-2 rounded-xl font-medium transition-all ${
            activeTab === 'manual'
              ? 'bg-purple-600 text-white'
              : 'bg-slate-800/50 text-slate-400 hover:text-white'
          }`}
        >
          수동 채널
        </button>
      </div>

      {/* API 연동 채널 탭 */}
      {activeTab === 'api' && (
        <>
          {/* 연동 안내 배너 */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">내 광고 계정 연동하기</h3>
                <p className="text-slate-300 text-sm mt-1">
                  Meta, Google, 네이버 등에서 운영 중인 <strong className="text-white">내 광고 계정</strong>을 셀러포트에 연동하세요.
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    일별 광고비 자동 수집
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ROAS 실시간 계산
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    비효율 광고 자동 중지
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 광고 채널 목록 */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">연동 가능한 광고 채널</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {adChannels.map((channel) => {
                const Logo = channel.logo
                const connectedChannel = getChannelStatus(channel.id)
                const isConnected = connectedChannel?.status === 'connected'
                const isComingSoon = channel.status === 'coming_soon'

                return (
                  <div
                    key={channel.id}
                    className={`relative overflow-hidden rounded-xl border p-5 transition-all ${
                      isConnected
                        ? 'bg-gradient-to-br from-blue-500/10 to-slate-800/50 border-blue-500/30'
                        : isComingSoon
                        ? 'bg-slate-800/30 border-white/5 opacity-60'
                        : 'bg-slate-800/50 border-white/5 hover:border-white/10'
                    }`}
                  >
                    {isComingSoon && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                          준비중
                        </span>
                      </div>
                    )}

                    {isConnected && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          연동됨
                        </span>
                      </div>
                    )}

                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <Logo className="w-12 h-12 rounded-lg" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium">{channel.name}</h3>
                          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                            channel.category === 'paid_ad'
                              ? 'bg-blue-500/20 text-blue-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {channel.category === 'paid_ad' ? '유료광고' : '자체채널'}
                          </span>
                        </div>
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-slate-300 border-white/10 hover:bg-white/5"
                          >
                            설정
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-red-400 border-red-500/30 hover:bg-red-500/10"
                          >
                            연동 해제
                          </Button>
                        </div>
                      ) : (
                        channel.id === 'google' ? (
                          <GoogleAdsConnectDialog onSuccess={() => {
                            fetchConnectedChannels()
                            setMessage({ type: 'success', text: 'Google Ads 계정이 연동되었습니다!' })
                          }}>
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                              연동하기
                            </Button>
                          </GoogleAdsConnectDialog>
                        ) : channel.id === 'kakao' ? (
                          <KakaoMomentConnectDialog onSuccess={() => {
                            fetchConnectedChannels()
                            setMessage({ type: 'success', text: '카카오모먼트 계정이 연동되었습니다!' })
                          }}>
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                              연동하기
                            </Button>
                          </KakaoMomentConnectDialog>
                        ) : channel.id === 'tiktok' ? (
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
                        ) : channel.id === 'youtube' ? (
                          <YouTubeConnectDialog onSuccess={() => {
                            fetchConnectedChannels()
                            setMessage({ type: 'success', text: 'YouTube 채널이 연동되었습니다!' })
                          }}>
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                              연동하기
                            </Button>
                          </YouTubeConnectDialog>
                        ) : channel.id === 'instagram' ? (
                          <InstagramConnectDialog onSuccess={() => {
                            fetchConnectedChannels()
                            setMessage({ type: 'success', text: 'Instagram 계정이 연동되었습니다!' })
                          }}>
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                              연동하기
                            </Button>
                          </InstagramConnectDialog>
                        ) : channel.id === 'tiktok_channel' ? (
                          <TikTokConnectDialog onSuccess={() => {
                            fetchConnectedChannels()
                            setMessage({ type: 'success', text: 'TikTok 채널이 연동되었습니다!' })
                          }}>
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                              연동하기
                            </Button>
                          </TikTokConnectDialog>
                        ) : channel.id === 'threads' ? (
                          <ThreadsConnectDialog onSuccess={() => {
                            fetchConnectedChannels()
                            setMessage({ type: 'success', text: 'Threads 계정이 연동되었습니다!' })
                          }}>
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                              연동하기
                            </Button>
                          </ThreadsConnectDialog>
                        ) : (
                          <Button
                            onClick={() => handleConnect(channel.id)}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                          >
                            연동하기
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* 수동 채널 탭 */}
      {activeTab === 'manual' && (
        <>
          {/* 수동 채널 안내 배너 */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">수동 마케팅 채널</h3>
                <p className="text-slate-300 text-sm mt-1">
                  인플루언서, 체험단, 블로그 마케팅 등 <strong className="text-white">API 연동이 불가능한 채널</strong>을 등록하고 추적 링크를 발급하세요.
                </p>
              </div>
              <button
                onClick={() => setShowManualModal(true)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                채널 추가
              </button>
            </div>
          </div>

          {/* 수동 채널 목록 */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-white font-semibold">등록된 수동 채널</h3>
              <p className="text-xs text-slate-500 mt-0.5">인플루언서, 체험단, 블로그 등 수동으로 등록한 마케팅 채널</p>
            </div>

            {manualChannels.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">👤</span>
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">등록된 수동 채널이 없습니다</h4>
                <p className="text-slate-400 text-sm mb-6">
                  인플루언서, 체험단, 블로그 마케팅 등을 등록하고<br />
                  각 채널별 전환을 추적하세요
                </p>
                <button
                  onClick={() => setShowManualModal(true)}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
                >
                  수동 채널 추가
                </button>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {manualChannels.map((channel) => (
                  <div key={channel.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                          <span className="text-lg">{getManualChannelIcon(channel.channel_type)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-white font-medium">{channel.channel_name}</h4>
                            <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-300">
                              {getManualChannelLabel(channel.channel_type)}
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
                          className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 text-xs transition-colors"
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
                    {channel.metadata && (channel.metadata as { memo?: string }).memo && (
                      <div className="mt-2 ml-13 pl-13">
                        <p className="text-xs text-slate-500 ml-13">
                          메모: {(channel.metadata as { memo?: string }).memo}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 수동 채널 유형 안내 */}
          <div>
            <h3 className="text-white font-semibold mb-3">추가 가능한 채널 유형</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {manualChannelTypes.map((type) => (
                <div
                  key={type.value}
                  className="p-2.5 rounded-xl bg-slate-800/50 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer flex items-center gap-2.5"
                  onClick={() => {
                    setManualForm({ ...manualForm, channelType: type.value })
                    setShowManualModal(true)
                  }}
                >
                  <span className="text-xl flex-shrink-0">{type.icon}</span>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-xs">{type.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">수동 마케팅 채널 추가</h3>
              <p className="text-sm text-slate-400 mt-1">인플루언서, 체험단 등 API 연동이 불가능한 채널을 추가하세요</p>
            </div>

            <div className="p-6 space-y-4">
              {/* 채널 유형 선택 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">채널 유형 *</label>
                <div className="grid grid-cols-2 gap-2">
                  {manualChannelTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, channelType: type.value })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        manualForm.channelType === type.value
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-white/10 bg-slate-900/50 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{type.icon}</span>
                        <div>
                          <p className={`text-sm font-medium ${manualForm.channelType === type.value ? 'text-white' : 'text-slate-300'}`}>
                            {type.label}
                          </p>
                          <p className="text-xs text-slate-500">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

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

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
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
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateManualChannel}
                disabled={creatingManual || !manualForm.channelType || !manualForm.channelName.trim()}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingManual ? '추가 중...' : '채널 추가'}
              </button>
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
    </div>
  )
}
