'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface StepStatus {
  siteConnected: boolean
  trackingLinkCreated: boolean
  adChannelConnected: boolean
  conversionTracked: boolean
}

export default function QuickStartPage() {
  const [stepStatus, setStepStatus] = useState<StepStatus>({
    siteConnected: false,
    trackingLinkCreated: false,
    adChannelConnected: false,
    conversionTracked: false,
  })
  const [loading, setLoading] = useState(true)
  const [showCelebration, setShowCelebration] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    checkStepStatus()
  }, [])

  // URL 파라미터로 완료 메시지 표시
  useEffect(() => {
    const completed = searchParams.get('completed')
    if (completed) {
      // 완료 후 상태 다시 체크
      checkStepStatus()
    }
  }, [searchParams])

  const checkStepStatus = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // 1. 사이트 연동 확인
    const { data: sites } = await supabase
      .from('my_sites')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    // 2. 추적 링크 생성 확인
    const { data: trackingLinks } = await supabase
      .from('tracking_links')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    // 3. 광고 채널 연결 확인
    const { data: adChannels } = await supabase
      .from('ad_channels')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    // 4. 전환 발생 확인
    const { data: conversions } = await supabase
      .from('conversions')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    const newStatus = {
      siteConnected: (sites?.length || 0) > 0,
      trackingLinkCreated: (trackingLinks?.length || 0) > 0,
      adChannelConnected: (adChannels?.length || 0) > 0,
      conversionTracked: (conversions?.length || 0) > 0,
    }

    setStepStatus(newStatus)
    setLoading(false)

    // 모든 단계 완료 시 축하 메시지
    if (newStatus.siteConnected && newStatus.trackingLinkCreated &&
        newStatus.adChannelConnected && newStatus.conversionTracked) {
      setShowCelebration(true)
    }
  }

  const completedCount = Object.values(stepStatus).filter(Boolean).length
  const progressPercent = (completedCount / 4) * 100

  const steps = [
    {
      number: 1,
      title: '내 사이트 연동하기',
      description: '판매 사이트를 연동하여 주문 데이터를 자동으로 수집하세요',
      completed: stepStatus.siteConnected,
      href: '/my-sites?from=quick-start',
      buttonText: '사이트 연동하기',
      completedButtonText: '사이트 관리하기',
      isModal: false,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      number: 2,
      title: '추적 링크 만들기',
      description: '광고에 사용할 추적 링크를 생성하여 유입 경로를 파악하세요',
      completed: stepStatus.trackingLinkCreated,
      href: '/conversions?from=quick-start&openModal=true',
      buttonText: '추적 링크 만들기',
      completedButtonText: '새 추적 링크 만들기',
      isModal: false,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
    },
    {
      number: 3,
      title: '광고 채널 연결하기',
      description: '메타, 구글 등 광고 계정을 연결하여 광고비를 자동으로 집계하세요',
      completed: stepStatus.adChannelConnected,
      href: '/ad-channels?from=quick-start',
      buttonText: '광고 채널 연결하기',
      completedButtonText: '광고 채널 관리하기',
      isModal: false,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
    },
    {
      number: 4,
      title: '첫 전환 확인하기',
      description: '추적 링크를 통해 발생한 첫 번째 전환을 확인하세요',
      completed: stepStatus.conversionTracked,
      href: '/conversions?from=quick-start',
      buttonText: '전환 현황 보기',
      completedButtonText: '전환 현황 보기',
      isModal: false,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]

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
        <h1 className="text-2xl font-bold text-white mb-2">빠른 시작</h1>
        <p className="text-slate-400">
          4단계만 완료하면 광고 성과 추적을 시작할 수 있어요
        </p>
      </div>

      {/* 진행률 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-300">설정 진행률</span>
          <span className="text-sm font-bold text-blue-400">{completedCount}/4 완료</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {completedCount === 4 && (
          <p className="mt-3 text-sm text-green-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            모든 설정이 완료되었습니다!
          </p>
        )}
      </div>

      {/* 축하 메시지 */}
      {showCelebration && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">축하합니다! 설정이 완료되었어요</h3>
              <p className="text-sm text-slate-300 mb-3">
                이제 대시보드에서 광고 성과를 실시간으로 확인할 수 있습니다.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                대시보드로 이동
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 단계별 카드 */}
      <div className="space-y-4">
        {steps.map((step, index) => {
          const isCurrentStep = !step.completed && steps.slice(0, index).every(s => s.completed)

          return (
            <div
              key={step.number}
              className={`bg-slate-800 border rounded-xl p-6 transition-all ${
                step.completed
                  ? 'border-green-500/30 bg-green-500/5'
                  : isCurrentStep
                    ? 'border-blue-500/50 ring-2 ring-blue-500/20'
                    : 'border-slate-700'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* 번호/체크 아이콘 */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  step.completed
                    ? 'bg-green-500 text-white'
                    : isCurrentStep
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700 text-slate-400'
                }`}>
                  {step.completed ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="font-bold">{step.number}</span>
                  )}
                </div>

                {/* 내용 */}
                <div className="flex-grow">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${step.completed ? 'text-green-400' : 'text-white'}`}>
                      {step.title}
                    </h3>
                    {step.completed && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                        완료
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mb-3">{step.description}</p>

                  {/* 버튼: 완료 여부와 관계없이 항상 표시 */}
                  <Link
                    href={step.href}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      step.completed
                        ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-500/30'
                        : isCurrentStep
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                    }`}
                  >
                    {step.completed ? step.completedButtonText : step.buttonText}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>

                {/* 아이콘 */}
                <div className={`hidden sm:flex w-12 h-12 rounded-lg items-center justify-center ${
                  step.completed
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-slate-700/50 text-slate-500'
                }`}>
                  {step.icon}
                </div>
              </div>
            </div>
          )
        })}
      </div>

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
