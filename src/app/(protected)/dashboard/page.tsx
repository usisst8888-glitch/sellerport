'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

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
  platformConnected: boolean
  trackingLinkCreated: boolean
  costConfigured: boolean
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
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toLocaleString()
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const { signalCounts, totals, today, trackingLinks, redLightLinks, setupProgress } = stats || {
    signalCounts: { green: 0, yellow: 0, red: 0 },
    totals: { trackingLinks: 0, clicks: 0, conversions: 0, adSpend: 0, revenue: 0, roas: 0, conversionRate: 0, profit: 0 },
    today: { conversions: 0, revenue: 0 },
    trackingLinks: [],
    redLightLinks: [],
    setupProgress: { platformConnected: false, trackingLinkCreated: false, costConfigured: false, allCompleted: false }
  }

  // 현재 진행해야 할 단계 찾기
  const currentStep = !setupProgress.platformConnected ? 1
    : !setupProgress.trackingLinkCreated ? 2
    : !setupProgress.costConfigured ? 3
    : 0

  return (
    <div className="space-y-6">
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
          href="/conversions"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          전환 추적 설정
        </Link>
      </div>

      {/* 오늘 실시간 현황 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 p-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-300 font-medium">오늘 실시간</p>
            <div className="flex items-baseline gap-4 mt-1">
              <div>
                <span className="text-3xl font-bold text-white">{today.conversions}</span>
                <span className="text-slate-400 ml-1">건</span>
              </div>
              <div>
                <span className="text-2xl font-bold text-emerald-400">{formatCurrency(today.revenue)}</span>
                <span className="text-slate-400 ml-1">원</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">마지막 업데이트</p>
            <p className="text-sm text-slate-400">{new Date().toLocaleTimeString('ko-KR')}</p>
          </div>
        </div>
      </div>

      {/* 신호등 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-emerald-500/20 p-5 hover:border-emerald-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 flex items-center justify-center">
              <span className="text-xl">🟢</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-emerald-400 font-medium">ROAS 300%+</p>
              <p className="text-3xl font-bold text-white">{signalCounts.green}<span className="text-lg font-normal text-slate-400 ml-1">개</span></p>
              <p className="text-sm text-slate-500">효율 좋음</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-amber-500/20 p-5 hover:border-amber-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50 flex items-center justify-center">
              <span className="text-xl">🟡</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-amber-400 font-medium">ROAS 150-300%</p>
              <p className="text-3xl font-bold text-white">{signalCounts.yellow}<span className="text-lg font-normal text-slate-400 ml-1">개</span></p>
              <p className="text-sm text-slate-500">주의 필요</p>
            </div>
          </div>
        </div>

        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-red-500/20 p-5 hover:border-red-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse flex items-center justify-center">
              <span className="text-xl">🔴</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-red-400 font-medium">ROAS 150% 미만</p>
              <p className="text-3xl font-bold text-white">{signalCounts.red}<span className="text-lg font-normal text-slate-400 ml-1">개</span></p>
              <p className="text-sm text-slate-500">개선 필요</p>
            </div>
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

      {/* 캠페인별 신호등 현황 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">캠페인별 광고 효율</h2>
              <p className="text-sm text-slate-400 mt-0.5">빨간불 캠페인은 즉시 점검이 필요합니다</p>
            </div>
            <Link href="/conversions" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              전체 보기
            </Link>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {trackingLinks.length > 0 ? (
            trackingLinks.slice(0, 10).map((link) => (
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
                  <Link href="/conversions" className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors">
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
              <p className="text-slate-400 mb-2">아직 등록된 캠페인이 없습니다</p>
              <p className="text-sm text-slate-500 mb-4">추적 링크를 생성하여 광고 효율을 측정하세요</p>
              <Link href="/conversions" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                캠페인 만들기
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 시작하기 섹션 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-6">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-lg font-semibold text-white mb-1">시작하기</h2>
            <p className="text-sm text-slate-400 mb-5">셀러포트를 시작하려면 아래 단계를 따라주세요</p>
            <div className="space-y-2">
              {/* Step 1: 플랫폼 연동 */}
              <Link
                href="/platforms"
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group ${
                  currentStep === 1 ? 'bg-white/5 hover:bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  setupProgress.platformConnected
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : currentStep === 1
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                }`}>
                  {setupProgress.platformConnected ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : '1'}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${setupProgress.platformConnected ? 'text-emerald-400' : currentStep === 1 ? 'text-white' : 'text-slate-300'}`}>
                    플랫폼 연동
                  </p>
                  <p className="text-sm text-slate-500">
                    {setupProgress.platformConnected ? '연동 완료!' : '판매 플랫폼 연결'}
                  </p>
                </div>
                {!setupProgress.platformConnected && (
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>

              {/* Step 2: 추적 링크 생성 */}
              <Link
                href="/conversions"
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group ${
                  currentStep === 2 ? 'bg-white/5 hover:bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  setupProgress.trackingLinkCreated
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : currentStep === 2
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                }`}>
                  {setupProgress.trackingLinkCreated ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : '2'}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${setupProgress.trackingLinkCreated ? 'text-emerald-400' : currentStep === 2 ? 'text-white' : 'text-slate-300'}`}>
                    추적 링크 생성
                  </p>
                  <p className="text-sm text-slate-500">
                    {setupProgress.trackingLinkCreated ? '추적 링크 생성됨!' : '추적 링크 발급'}
                  </p>
                </div>
                {!setupProgress.trackingLinkCreated && (
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>

              {/* Step 3: 상품 원가 설정 */}
              <Link
                href="/products"
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group ${
                  currentStep === 3 ? 'bg-white/5 hover:bg-white/10' : 'hover:bg-white/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  setupProgress.costConfigured
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : currentStep === 3
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                }`}>
                  {setupProgress.costConfigured ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : '3'}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${setupProgress.costConfigured ? 'text-emerald-400' : currentStep === 3 ? 'text-white' : 'text-slate-300'}`}>
                    상품 원가 설정
                  </p>
                  <p className="text-sm text-slate-500">
                    {setupProgress.costConfigured ? '원가 설정됨!' : '상품별 원가 입력'}
                  </p>
                </div>
                {!setupProgress.costConfigured && (
                  <svg className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>

              {/* Step 4: 설정 완료 */}
              <div
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                  setupProgress.allCompleted ? 'bg-emerald-500/10 border border-emerald-500/20' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  setupProgress.allCompleted
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                }`}>
                  {setupProgress.allCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : '4'}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${setupProgress.allCompleted ? 'text-emerald-400' : 'text-slate-300'}`}>
                    설정 완료
                  </p>
                  <p className="text-sm text-slate-500">
                    {setupProgress.allCompleted ? '모든 설정이 완료되었습니다!' : '위 단계를 모두 완료하세요'}
                  </p>
                </div>
                {setupProgress.allCompleted && (
                  <span className="px-3 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded-full">
                    완료
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-6">
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              빨간불 알림
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">{signalCounts.red}</span>
            </h2>
            <p className="text-sm text-slate-400 mb-5">즉시 점검이 필요한 추적 링크</p>
            {redLightLinks.length > 0 ? (
              <div className="space-y-3">
                {redLightLinks.slice(0, 3).map((link) => (
                  <div key={link.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{link.name}</p>
                      <p className="text-xs text-red-400">ROAS {link.roas}% · {link.utm_source}</p>
                    </div>
                    <Link href="/conversions" className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-400 rounded-lg transition-colors">점검</Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-slate-400">모든 추적 링크의 광고 효율이 양호합니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
