'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BillingPage() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [trialEndDate, setTrialEndDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const MONTHLY_PRICE = 12900

  // 구독 정보 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 구독 정보 확인
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (sub) {
          setIsSubscribed(true)
        } else {
          // 무료 체험 기간 계산 (가입일로부터 7일)
          const { data: profile } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', user.id)
            .maybeSingle()

          if (profile?.created_at) {
            const trialEnd = new Date(profile.created_at)
            trialEnd.setDate(trialEnd.getDate() + 7)
            const now = new Date()
            const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

            if (daysLeft > 0) {
              setTrialDaysLeft(daysLeft)
              setTrialEndDate(trialEnd.toLocaleDateString('ko-KR'))
            } else {
              setTrialDaysLeft(0)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const features = [
    { icon: '📊', title: '광고 성과 관리', desc: '전환, 매출, ROAS 실시간 추적' },
    { icon: '📱', title: '인스타그램 자동 DM', desc: '댓글 트리거 자동 DM 발송' },
    { icon: '🎯', title: 'Meta 광고 연동', desc: '광고비/성과 자동 동기화' },
    { icon: '📤', title: '콘텐츠 발행', desc: '인스타그램 피드/릴스/스토리 발행' },
    { icon: '🔗', title: '무제한 추적 링크', desc: '광고별 유입/전환 추적' },
    { icon: '🔔', title: '신호등 시스템', desc: '광고 효율 빨간불/노란불 알림' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-white">결제 관리</h1>
        <p className="text-slate-400 mt-1">셀러포트 구독을 관리하세요</p>
      </div>

      {/* 현재 구독 상태 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/40 to-slate-800/40 border border-blue-500/20 p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                {isSubscribed ? (
                  <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ) : (
                  <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-lg font-bold text-white">
                  {isSubscribed ? '프리미엄 구독 중' : trialDaysLeft && trialDaysLeft > 0 ? '무료 체험 중' : '체험 기간 종료'}
                </p>
                <p className="text-sm text-slate-400">
                  {isSubscribed
                    ? '모든 기능을 무제한으로 이용 중입니다'
                    : trialDaysLeft && trialDaysLeft > 0
                      ? `${trialEndDate}까지 무료로 이용 가능`
                      : '구독하여 모든 기능을 이용하세요'
                  }
                </p>
              </div>
            </div>
            {!isSubscribed && trialDaysLeft !== null && trialDaysLeft > 0 && (
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-400">{trialDaysLeft}일</p>
                <p className="text-sm text-slate-400">남음</p>
              </div>
            )}
          </div>

          {isSubscribed && (
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <p className="text-sm text-slate-400">다음 결제일: <span className="text-white">2025-02-13</span></p>
              <button className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-colors">
                구독 해지
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 요금제 카드 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/10">
        {/* 무료 체험 배너 */}
        {!isSubscribed && (
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-3 text-center">
            <p className="text-white font-medium">
              첫 가입 시 <span className="font-bold">1개월 무료 체험</span> 제공
            </p>
          </div>
        )}

        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">셀러포트 프리미엄</h2>
            <p className="text-slate-400">인스타그램 & Meta 광고 관리의 모든 것</p>
          </div>

          {/* 가격 */}
          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-5xl font-bold text-white">{MONTHLY_PRICE.toLocaleString()}</span>
              <span className="text-xl text-slate-400">원/월</span>
            </div>
            <p className="text-sm text-slate-500 mt-2">부가세 포함</p>
          </div>

          {/* 기능 목록 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-xl bg-slate-900/50 border border-white/5"
              >
                <span className="text-2xl">{feature.icon}</span>
                <div>
                  <p className="font-medium text-white">{feature.title}</p>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 구독 버튼 */}
          {!isSubscribed && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-lg font-bold transition-all shadow-lg shadow-blue-500/25"
            >
              {trialDaysLeft && trialDaysLeft > 0 ? '지금 구독하기' : '무료 체험 시작하기'}
            </button>
          )}

          {isSubscribed && (
            <div className="text-center p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-emerald-400 font-medium flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                현재 구독 중입니다
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 이용 안내 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <span className="text-blue-400">💳</span> 결제 방법
          </h3>
          <p className="text-sm text-slate-400">
            카카오페이, 신용카드, 계좌이체 등 다양한 결제 수단을 지원합니다.
          </p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <span className="text-emerald-400">🔄</span> 자동 갱신
          </h3>
          <p className="text-sm text-slate-400">
            매월 자동으로 결제되며, 언제든지 해지할 수 있습니다.
          </p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <span className="text-amber-400">📞</span> 고객 지원
          </h3>
          <p className="text-sm text-slate-400">
            문의사항은 카카오톡 채널로 연락해주세요.
          </p>
        </div>
      </div>

      {/* 결제 수단 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">결제 수단</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">등록된 카드 없음</p>
                <p className="text-xs text-slate-500">카드를 등록하면 자동 결제가 가능합니다</p>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
              카드 등록
            </button>
          </div>
        </div>
      </div>

      {/* 결제 내역 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">결제 내역</h2>
          <p className="text-sm text-slate-400 mt-0.5">최근 결제 내역</p>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-slate-400 mb-2">결제 내역이 없습니다</p>
        </div>
      </div>

      {/* 결제 모달 */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                셀러포트 프리미엄 구독
              </h3>
              <p className="text-sm text-slate-400 mt-1">결제 수단을 선택하세요</p>
            </div>

            <div className="p-6">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">월 구독료</span>
                  <span className="text-xl font-bold text-white">{MONTHLY_PRICE.toLocaleString()}원</span>
                </div>
                {trialDaysLeft && trialDaysLeft > 0 && (
                  <p className="text-xs text-emerald-400">
                    * 첫 달은 무료이며, 다음 달부터 결제됩니다
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-white/5 space-y-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-3 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">💬</span>
                카카오페이로 결제
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                카드로 결제
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-2 text-slate-400 hover:text-white transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
