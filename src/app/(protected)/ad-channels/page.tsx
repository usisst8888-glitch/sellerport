'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

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
  status: string
  last_sync_at: string | null
  created_at: string
}

// 광고 채널 로고 컴포넌트
const MetaLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#0081FB"/>
    <path d="M70 35c-5.5 0-9.5 3-12.5 7.5-3-4.5-7-7.5-12.5-7.5-8 0-15 6.5-15 17.5 0 13 12 22.5 27.5 32.5 15.5-10 27.5-19.5 27.5-32.5 0-11-7-17.5-15-17.5z" fill="white"/>
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

const KarrotLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#FF6F0F"/>
    <ellipse cx="50" cy="55" rx="20" ry="25" fill="#FFA500"/>
    <path d="M45 30c0-5 2-15 5-15s5 10 5 15c0 3-2 5-5 5s-5-2-5-5z" fill="#228B22"/>
    <path d="M35 35c-3-4 0-12 3-10s5 8 3 12c-1 2-4 1-6-2z" fill="#228B22"/>
    <path d="M65 35c3-4 0-12-3-10s-5 8-3 12c1 2 4 1 6-2z" fill="#228B22"/>
  </svg>
)

const TossLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#0064FF"/>
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">toss</text>
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

const DableLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#FF6B35"/>
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial">dable</text>
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
}

const adChannels: AdChannelConfig[] = [
  {
    id: 'meta',
    name: 'Meta (Facebook/Instagram)',
    description: 'Marketing API 연동',
    logo: MetaLogo,
    status: 'available',
    features: ['광고비 자동 수집', '캠페인 성과', '광고 on/off 제어'],
  },
  {
    id: 'google',
    name: 'Google Ads',
    description: 'Google Ads API 연동',
    logo: GoogleLogo,
    status: 'coming_soon',
    features: ['광고비 자동 수집', '전환 데이터', '광고 on/off 제어'],
  },
  {
    id: 'naver_search',
    name: '네이버 검색광고',
    description: '네이버 광고 API 연동',
    logo: NaverSearchLogo,
    status: 'available',
    features: ['광고비 자동 수집', '키워드별 클릭/노출', '전체 ROAS 계산'],
    warning: '스마트스토어 랜딩 시 키워드별 전환 추적 불가 (네이버 정책)',
  },
  {
    id: 'naver_gfa',
    name: '네이버 GFA',
    description: '성과형 디스플레이 광고',
    logo: NaverGfaLogo,
    status: 'coming_soon',
    features: ['광고비 자동 수집', '타겟팅 성과', '노출/클릭 데이터'],
  },
  {
    id: 'kakao',
    name: '카카오모먼트',
    description: '카카오 광고 API 연동',
    logo: KakaoLogo,
    status: 'coming_soon',
    features: ['광고비 자동 수집', '캠페인 성과', '타겟팅 분석'],
  },
  {
    id: 'karrot',
    name: '당근 비즈니스',
    description: '당근 광고 API 연동',
    logo: KarrotLogo,
    status: 'coming_soon',
    features: ['광고비 자동 수집', '지역 타겟팅 성과', '노출/클릭 데이터'],
  },
  {
    id: 'toss',
    name: '토스',
    description: '토스 광고 API 연동',
    logo: TossLogo,
    status: 'coming_soon',
    features: ['광고비 자동 수집', '성과 데이터', '전환 추적'],
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    description: 'TikTok Marketing API 연동',
    logo: TikTokLogo,
    status: 'coming_soon',
    features: ['광고비 자동 수집', '쇼트폼 광고 성과', 'MZ 타겟팅'],
  },
  {
    id: 'dable',
    name: '데이블',
    description: '데이블 네이티브 광고 API 연동',
    logo: DableLogo,
    status: 'coming_soon',
    features: ['광고비 자동 수집', '네이티브 광고 성과', '콘텐츠 추천'],
  },
]

export default function AdChannelsPage() {
  const [connectedChannels, setConnectedChannels] = useState<AdChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [naverSearchModalOpen, setNaverSearchModalOpen] = useState(false)

  useEffect(() => {
    fetchConnectedChannels()

    // URL 파라미터에서 메시지 확인
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')

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
    if (success || error) {
      window.history.replaceState({}, '', '/ad-channels')
    }
  }, [])

  // 메시지 3초 후 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 5000) // 연동 메시지는 5초
      return () => clearTimeout(timer)
    }
  }, [message])

  const fetchConnectedChannels = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('ad_channels')
        .select('*')
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

  const handleConnect = (channelId: string) => {
    if (channelId === 'meta') {
      // Meta OAuth 연동 시작
      window.location.href = '/api/auth/meta'
    } else if (channelId === 'naver_search') {
      // 네이버 검색광고 모달 열기
      setNaverSearchModalOpen(true)
    } else {
      // 다른 채널은 아직 준비 중
      alert(`${channelId} 연동 기능은 준비 중입니다.`)
    }
  }

  const handleNaverSearchSuccess = () => {
    setMessage({ type: 'success', text: '네이버 검색광고가 성공적으로 연동되었습니다!' })
    fetchConnectedChannels()
  }

  const getChannelStatus = (channelId: string) => {
    return connectedChannels.find(c => c.channel_type === channelId)
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
          내 광고 계정을 연동하면 광고비가 자동으로 수집되어 ROAS가 실시간으로 계산됩니다
        </p>
      </div>

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

      {/* 연동 현황 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
          <p className="text-sm text-slate-400">연동된 채널</p>
          <p className="text-2xl font-bold text-white mt-1">{connectedChannels.filter(c => c.status === 'connected').length}개</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
          <p className="text-sm text-slate-400">오늘 광고비</p>
          <p className="text-2xl font-bold text-white mt-1">-</p>
          <p className="text-xs text-slate-500 mt-1">채널 연동 후 표시됩니다</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
          <p className="text-sm text-slate-400">이번 달 총 광고비</p>
          <p className="text-2xl font-bold text-white mt-1">-</p>
          <p className="text-xs text-slate-500 mt-1">채널 연동 후 표시됩니다</p>
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
                {/* Coming Soon 뱃지 */}
                {isComingSoon && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">
                      준비중
                    </span>
                  </div>
                )}

                {/* Connected 뱃지 */}
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
                    <h3 className="text-white font-medium">{channel.name}</h3>
                    <p className="text-sm text-slate-400 mt-0.5">{channel.description}</p>
                  </div>
                </div>

                {/* 기능 목록 */}
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

                {/* 경고 메시지 (있는 경우) */}
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

                {/* 연동 버튼 */}
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
                    <Button
                      onClick={() => !isComingSoon && handleConnect(channel.id)}
                      disabled={isComingSoon}
                      className={`w-full ${
                        isComingSoon
                          ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {isComingSoon ? '준비중' : '연동하기'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 광고 자동 제어 설정 */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              광고 자동 제어
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              ROAS가 설정한 기준 미만일 때 광고를 자동으로 일시중지합니다
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">비활성화됨</span>
            <button className="relative w-11 h-6 bg-slate-700 rounded-full transition-colors">
              <span className="absolute left-1 top-1 w-4 h-4 bg-slate-400 rounded-full transition-transform" />
            </button>
          </div>
        </div>

        <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-white/5">
          <p className="text-sm text-slate-400">
            광고 채널을 연동하면 아래 설정을 활성화할 수 있습니다:
          </p>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ROAS 150% 미만 시 광고 자동 일시중지
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              일일 광고비 한도 초과 시 자동 중지
            </li>
            <li className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              성과 좋은 광고 예산 자동 증액 추천
            </li>
          </ul>
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
              <p className="text-slate-400 text-xs mt-0.5">연동할 광고 플랫폼을 선택하세요</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-400 font-semibold text-sm">2</span>
            </div>
            <div>
              <p className="text-white font-medium text-sm">내 계정으로 로그인</p>
              <p className="text-slate-400 text-xs mt-0.5">해당 플랫폼에서 사용 중인 광고 계정으로 로그인</p>
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
    </div>
  )
}
