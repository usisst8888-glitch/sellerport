'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// 정식 오픈일 (2026년 1월 1일)
const LAUNCH_DATE = new Date('2026-01-01T00:00:00')

// 사전 오픈 예외 계정 (Meta 심사용 등)
const ALLOWED_TEST_EMAILS = ['test@naver.com']

interface TrackingLink {
  id: string
  name: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  clicks: number
  conversions: number
  revenue: number
  ad_spend: number
  roas: number
  trafficLight: 'green' | 'yellow' | 'red' | 'gray'
  products?: {
    id: string
    name: string
    image_url: string | null
    price: number
  } | null
}

interface SetupProgress {
  siteConnected: boolean
  adChannelConnected: boolean
  trackingLinkCreated: boolean
  allCompleted: boolean
}

interface DashboardStats {
  signalCounts: {
    green: number
    yellow: number
    red: number
  }
  totals: {
    trackingLinks: number
    clicks: number
    conversions: number
    adSpend: number
    revenue: number
    roas: number
    conversionRate: number
    profit: number
  }
  today: {
    conversions: number
    revenue: number
  }
  trackingLinks: TrackingLink[]
  redLightLinks: TrackingLink[]
  setupProgress: SetupProgress
}

function getTrafficLightColor(status: string) {
  switch (status) {
    case 'green':
      return 'bg-emerald-500 shadow-emerald-500/50'
    case 'yellow':
      return 'bg-amber-500 shadow-amber-500/50'
    case 'red':
      return 'bg-red-500 shadow-red-500/50 animate-pulse'
    default:
      return 'bg-slate-500'
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'green':
      return '효율 좋음'
    case 'yellow':
      return '주의 필요'
    case 'red':
      return '개선 필요'
    default:
      return '데이터 없음'
  }
}

function formatCurrency(value: number) {
  return value.toLocaleString()
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPreLaunchModal, setShowPreLaunchModal] = useState(false)
  const [userType, setUserType] = useState<string | null>(null)
  const [notifyLoading, setNotifyLoading] = useState(false)
  const [signalFilter, setSignalFilter] = useState<'all' | 'green' | 'yellow' | 'red'>('all')
  const router = useRouter()

  // 사용자 타입 확인 및 사전예약 팝업 표시
  useEffect(() => {
    const checkUserType = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single()

        const type = profile?.user_type || 'seller'
        setUserType(type)

        // admin이 아니고, 예외 계정이 아니고, 정식 오픈 전이면 팝업 표시
        const isAllowedTestAccount = ALLOWED_TEST_EMAILS.includes(user.email || '')
        if (type !== 'admin' && !isAllowedTestAccount && new Date() < LAUNCH_DATE) {
          setShowPreLaunchModal(true)
        }
      }
    }

    checkUserType()
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        const result = await response.json()
        if (result.success) {
          setStats(result.data)
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  // 알림 받기 클릭 시 저장 후 홈으로 이동
  const handleNotifyYes = async () => {
    setNotifyLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('profiles')
          .update({ pre_launch_notify: true })
          .eq('id', user.id)
      }
    } catch (error) {
      console.error('Failed to save notify preference:', error)
    }
    setNotifyLoading(false)
    router.push('/')
  }

  // 알림 안받기 클릭 시 그냥 홈으로 이동
  const handleNotifyNo = () => {
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const { signalCounts, totals, today, trackingLinks } = stats || {
    signalCounts: { green: 0, yellow: 0, red: 0 },
    totals: { trackingLinks: 0, clicks: 0, conversions: 0, adSpend: 0, revenue: 0, roas: 0, conversionRate: 0, profit: 0 },
    today: { conversions: 0, revenue: 0 },
    trackingLinks: []
  }

  return (
    <div className="space-y-6">
      {/* 사전예약 안내 모달 */}
      {showPreLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md mx-4 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-2xl">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />

            <div className="relative p-8 text-center">
              {/* 아이콘 */}
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                <span className="text-4xl">🚀</span>
              </div>

              {/* 제목 */}
              <h2 className="text-2xl font-bold text-white mb-3">
                사전예약 중입니다
              </h2>

              {/* 내용 */}
              <div className="space-y-4 mb-8">
                <p className="text-slate-300">
                  셀러포트는 현재 <span className="text-blue-400 font-semibold">사전예약</span> 기간입니다.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30">
                  <span className="text-blue-400 font-medium">정식 오픈</span>
                  <span className="text-white font-bold">2026년 1월 1일</span>
                </div>
                <p className="text-slate-400 text-sm">
                  정식 오픈 시 알림을 받으시겠습니까?
                </p>
              </div>

              {/* 버튼 */}
              <div className="space-y-3">
                <button
                  onClick={handleNotifyYes}
                  disabled={notifyLoading}
                  className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 disabled:opacity-50"
                >
                  {notifyLoading ? '저장 중...' : '네, 알림 받을게요'}
                </button>
                <button
                  onClick={handleNotifyNo}
                  disabled={notifyLoading}
                  className="w-full px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium transition-all duration-200"
                >
                  괜찮아요
                </button>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                사전예약해 주셔서 감사합니다
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            대시보드
            <span className="text-2xl">🚦</span>
          </h1>
          <p className="text-slate-400 mt-1">광고 효율을 신호등으로 한눈에 확인하세요</p>
        </div>
        <Link
          href="/ad-performance"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          광고 성과 관리
        </Link>
      </div>

      {/* 오늘 실시간 현황 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/20 to-blue-600/20 border border-blue-500/30 p-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-300 font-medium">오늘 실시간</p>
            <div className="flex items-baseline gap-4 mt-1">
              <div>
                <span className="text-3xl font-bold text-white">{today.conversions}</span>
                <span className="text-slate-400 ml-1">건</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">마지막 업데이트</p>
            <p className="text-sm text-slate-400">{new Date().toLocaleTimeString('ko-KR')}</p>
          </div>
        </div>
      </div>

      {/* 전체 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">총 클릭</p>
          <p className="text-xl font-bold text-white mt-1">{totals.clicks.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">총 전환</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{totals.conversions.toLocaleString()}</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">총 광고비</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(totals.adSpend)}원</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">총 매출</p>
          <p className="text-xl font-bold text-blue-400 mt-1">{formatCurrency(totals.revenue)}원</p>
        </div>
        <div className={`rounded-xl border p-4 ${totals.roas >= 300 ? 'bg-emerald-500/10 border-emerald-500/30' : totals.roas >= 150 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <p className="text-xs text-slate-500 uppercase tracking-wider">평균 ROAS</p>
          <p className={`text-xl font-bold mt-1 ${totals.roas >= 300 ? 'text-emerald-400' : totals.roas >= 150 ? 'text-amber-400' : 'text-red-400'}`}>
            {totals.roas}%
            <span className="text-sm ml-1">{totals.roas >= 300 ? '🟢' : totals.roas >= 150 ? '🟡' : '🔴'}</span>
          </p>
        </div>
      </div>

      {/* 신호등 필터 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 전체 */}
        <button
          onClick={() => setSignalFilter('all')}
          className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${
            signalFilter === 'all'
              ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10'
              : 'bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 hover:border-white/20'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
          <div className="relative flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 flex items-center justify-center ${signalFilter === 'all' ? 'scale-110' : ''} transition-transform`}>
              <span className="text-xl">🚦</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-blue-400 font-medium">전체</p>
              <p className="text-3xl font-bold text-white">{signalCounts.green + signalCounts.yellow + signalCounts.red}<span className="text-lg font-normal text-slate-400 ml-1">개</span></p>
            </div>
          </div>
        </button>

        {/* 초록불 */}
        <button
          onClick={() => setSignalFilter('green')}
          className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${
            signalFilter === 'green'
              ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
              : 'bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-emerald-500/20 hover:border-emerald-500/40'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="relative flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 flex items-center justify-center ${signalFilter === 'green' ? 'scale-110' : ''} transition-transform`}>
              <span className="text-xl">🟢</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-emerald-400 font-medium">효율 좋음</p>
              <p className="text-3xl font-bold text-white">{signalCounts.green}<span className="text-lg font-normal text-slate-400 ml-1">개</span></p>
            </div>
          </div>
        </button>

        {/* 노란불 */}
        <button
          onClick={() => setSignalFilter('yellow')}
          className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${
            signalFilter === 'yellow'
              ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-amber-500/50 shadow-lg shadow-amber-500/10'
              : 'bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-amber-500/20 hover:border-amber-500/40'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
          <div className="relative flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50 flex items-center justify-center ${signalFilter === 'yellow' ? 'scale-110' : ''} transition-transform`}>
              <span className="text-xl">🟡</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-amber-400 font-medium">주의 필요</p>
              <p className="text-3xl font-bold text-white">{signalCounts.yellow}<span className="text-lg font-normal text-slate-400 ml-1">개</span></p>
            </div>
          </div>
        </button>

        {/* 빨간불 */}
        <button
          onClick={() => setSignalFilter('red')}
          className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 ${
            signalFilter === 'red'
              ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-red-500/50 shadow-lg shadow-red-500/10'
              : 'bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-red-500/20 hover:border-red-500/40'
          }`}
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors" />
          <div className="relative flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse flex items-center justify-center ${signalFilter === 'red' ? 'scale-110' : ''} transition-transform`}>
              <span className="text-xl">🔴</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-red-400 font-medium">개선 필요</p>
              <p className="text-3xl font-bold text-white">{signalCounts.red}<span className="text-lg font-normal text-slate-400 ml-1">개</span></p>
            </div>
          </div>
        </button>
      </div>

      {/* 추적 링크별 신호등 현황 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {signalFilter === 'all' && '전체 추적 링크'}
                {signalFilter === 'green' && '🟢 효율 좋은 추적 링크'}
                {signalFilter === 'yellow' && '🟡 주의 필요한 추적 링크'}
                {signalFilter === 'red' && '🔴 개선 필요한 추적 링크'}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                {signalFilter === 'all' && '신호등으로 광고 효율을 한눈에 확인하세요'}
                {signalFilter === 'green' && 'ROAS 300% 이상의 우수한 광고들'}
                {signalFilter === 'yellow' && 'ROAS 150~300%, 개선하면 더 좋아질 수 있어요'}
                {signalFilter === 'red' && 'ROAS 150% 미만, 즉시 점검이 필요합니다'}
              </p>
            </div>
            <Link href="/ad-performance" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              전체 보기
            </Link>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {trackingLinks.length > 0 ? (
            trackingLinks
              .filter(link => signalFilter === 'all' || link.trafficLight === signalFilter)
              .slice(0, 10)
              .map((link) => (
              <div key={link.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors">
                <div className={`w-4 h-4 rounded-full ${getTrafficLightColor(link.trafficLight)} shadow-lg`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{link.name}</p>
                  <p className="text-xs text-slate-500">{link.utm_source} · {link.products?.name || '상품 미연결'}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    link.trafficLight === 'green' ? 'text-emerald-400' :
                    link.trafficLight === 'yellow' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    ROAS {link.roas}%
                  </p>
                  <p className="text-xs text-slate-500">{getStatusText(link.trafficLight)}</p>
                </div>
                <div className="hidden md:block text-right w-20">
                  <p className="text-sm text-slate-300">{link.clicks.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">클릭</p>
                </div>
                <div className="hidden md:block text-right w-20">
                  <p className="text-sm text-emerald-400">{link.conversions}</p>
                  <p className="text-xs text-slate-500">전환</p>
                </div>
                <div className="hidden md:block text-right w-28">
                  <p className="text-sm text-slate-300">{formatCurrency(link.revenue)}원</p>
                  <p className="text-xs text-slate-500">매출</p>
                </div>
                {link.trafficLight === 'red' && (
                  <Link href="/ad-performance" className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors">
                    점검하기
                  </Link>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mb-4">
                <span className="text-3xl">🚦</span>
              </div>
              <p className="text-slate-400 mb-2">아직 등록된 추적 링크가 없습니다</p>
              <p className="text-sm text-slate-500">추적 링크를 생성하여 광고 효율을 측정하세요</p>
            </div>
          )}
          {trackingLinks.length > 0 &&
            trackingLinks.filter(link => signalFilter === 'all' || link.trafficLight === signalFilter).length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-slate-400">해당 조건의 추적 링크가 없습니다</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
