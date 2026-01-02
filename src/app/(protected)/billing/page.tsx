'use client'

import { useState, useEffect } from 'react'

// 구독 티어 정의
const SUBSCRIPTION_TIERS = [
  {
    id: 'free',
    name: '무료',
    price: 0,
    priceLabel: '0원',
    description: '셀러포트를 처음 사용하는 분께 추천',
    features: [
      '무제한 추적 링크',
      '기본 전환 추적',
      '셀러트리',
      '인스타그램 자동 DM',
      '디자이너 연결',
    ],
    alerts: 0,
    alertLabel: '알림톡 미포함',
    popular: false,
    buttonText: '현재 플랜',
    buttonDisabled: true,
  },
  {
    id: 'basic',
    name: '베이직',
    price: 55000,
    priceLabel: '55,000원',
    description: '본격적으로 광고 효율을 관리하는 셀러',
    features: [
      '무제한 추적 링크',
      '기본 전환 추적',
      '셀러트리',
      '인스타그램 자동 DM',
      '디자이너 연결',
      '광고 성과 관리 (전환/매출/ROAS)',
      '🟢🟡🔴 신호등 시스템',
      '빨간불/노란불 카카오 알림',
    ],
    alerts: 300,
    alertLabel: '알림톡 300건 포함',
    popular: true,
    buttonText: '베이직 시작하기',
    buttonDisabled: false,
  },
  {
    id: 'pro',
    name: '프로',
    price: 110000,
    priceLabel: '110,000원',
    description: '대규모 광고 운영 및 인플루언서 협업',
    features: [
      '베이직의 모든 기능',
      '인플루언서 자동 매칭',
      '우선 고객 지원',
      '상세 리포트',
    ],
    alerts: 1000,
    alertLabel: '알림톡 1,000건 포함',
    popular: false,
    buttonText: '프로 시작하기',
    buttonDisabled: false,
  },
  {
    id: 'reseller',
    name: '리셀러 파트너',
    price: -1,
    priceLabel: '별도 협의',
    description: '화이트라벨 재판매 파트너십',
    features: [
      '동일 플랫폼 화이트라벨 제공',
      '도매가 구독료 (무료/베이직/프로)',
      '자체 브랜드로 운영 가능',
      '파트너 전용 대시보드',
      '수익 정산 시스템',
      '기술 지원',
    ],
    alerts: -1,
    alertLabel: '알림톡 협의',
    popular: false,
    buttonText: '파트너 문의',
    buttonDisabled: false,
  },
]

const mockUsageHistory = [
  { date: '2024-12-01', type: 'subscription', description: '베이직 구독', quantity: 1, amount: 55000 },
  { date: '2024-12-01', type: 'alert', description: '알림 충전', quantity: 100, amount: 1500 },
  { date: '2024-11-15', type: 'subscription', description: '베이직 구독', quantity: 1, amount: 55000 },
  { date: '2024-11-01', type: 'alert', description: '알림 충전', quantity: 200, amount: 3000 },
]

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState('free')
  const [currentAlerts, setCurrentAlerts] = useState(0)
  const [loading, setLoading] = useState(true)

  // 프로필 및 잔액 정보 로드
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, balanceRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/balance')
        ])

        const profileData = await profileRes.json()
        const balanceData = await balanceRes.json()

        if (profileData.success && profileData.data?.plan) {
          setCurrentPlan(profileData.data.plan)
        }

        if (balanceData.success) {
          setCurrentAlerts(balanceData.data?.alertBalance || 0)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // 알림 충전 모달
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertQuantity, setAlertQuantity] = useState(100)
  const ALERT_PRICE = 15 // 알림 1건당 가격

  // 구독 변경 모달
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState<typeof SUBSCRIPTION_TIERS[0] | null>(null)

  // 플랜 순서 (낮은 순 → 높은 순)
  const PLAN_ORDER = ['free', 'basic', 'pro', 'reseller']

  // 현재 플랜 대비 버튼 텍스트와 스타일 결정
  const getButtonConfig = (tierId: string) => {
    if (tierId === currentPlan) {
      return { text: '현재 플랜', style: 'bg-emerald-600 text-white cursor-not-allowed', disabled: true }
    }

    const currentIndex = PLAN_ORDER.indexOf(currentPlan)
    const tierIndex = PLAN_ORDER.indexOf(tierId)

    if (tierId === 'reseller') {
      return { text: '파트너 문의', style: 'bg-slate-700 hover:bg-slate-600 text-white', disabled: false }
    }

    if (tierIndex < currentIndex) {
      // 다운그레이드
      return { text: '다운그레이드', style: 'bg-slate-600 hover:bg-slate-500 text-slate-300', disabled: false }
    } else {
      // 업그레이드
      return { text: '업그레이드', style: 'bg-blue-600 hover:bg-blue-500 text-white', disabled: false }
    }
  }

  const handleSubscribe = (tier: typeof SUBSCRIPTION_TIERS[0]) => {
    if (tier.id === 'reseller') {
      // 리셀러 파트너는 문의 페이지로 이동
      window.open('mailto:contact@sellerport.app?subject=리셀러 파트너 문의', '_blank')
      return
    }
    if (tier.id === currentPlan) return
    setSelectedTier(tier)
    setShowSubscriptionModal(true)
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-white">결제 관리</h1>
        <p className="text-slate-400 mt-1">구독 플랜과 알림을 관리하세요</p>
      </div>

      {/* 현재 구독 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 현재 플랜 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/40 to-slate-800/40 border border-blue-500/20 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-blue-400 font-medium">현재 플랜</p>
                  <p className="text-xs text-slate-500">구독 상태</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {SUBSCRIPTION_TIERS.find(t => t.id === currentPlan)?.name}
                </p>
                <p className="text-sm text-slate-400">
                  {SUBSCRIPTION_TIERS.find(t => t.id === currentPlan)?.priceLabel}/월
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <p className="text-sm text-slate-400">다음 결제일: <span className="text-white">2025-01-11</span></p>
              <a href="#pricing" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                플랜 변경
              </a>
            </div>
          </div>
        </div>

        {/* 알림 현황 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-900/40 to-slate-800/40 border border-amber-500/20 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-amber-400 font-medium">알림 잔여</p>
                  <p className="text-xs text-slate-500">빨간불/노란불 알림용</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{currentAlerts}건</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <p className="text-sm text-slate-400">추가 충전: <span className="text-white">{ALERT_PRICE}원</span>/건</p>
              <button
                onClick={() => setShowAlertModal(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
              >
                알림 충전
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 구독 플랜 선택 */}
      <div id="pricing" className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">구독 플랜</h2>
          <p className="text-sm text-slate-400 mt-0.5">비즈니스에 맞는 플랜을 선택하세요</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SUBSCRIPTION_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative rounded-2xl p-6 transition-all duration-300 flex flex-col ${
                  tier.popular
                    ? 'bg-gradient-to-b from-blue-600/20 to-slate-800/50 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-800/50 border border-white/10 hover:border-white/20'
                } ${currentPlan === tier.id ? 'ring-2 ring-emerald-500/50' : ''}`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold">
                    인기
                  </div>
                )}
                {currentPlan === tier.id && (
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold">
                    현재 플랜
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">{tier.description}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">{tier.priceLabel}</span>
                    {tier.price > 0 && <span className="text-slate-400 text-sm">/월</span>}
                  </div>
                  <p className={`text-xs mt-1 ${tier.alerts > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {tier.alertLabel}
                  </p>
                </div>

                <ul className="space-y-2 flex-1">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {(() => {
                  const config = getButtonConfig(tier.id)
                  return (
                    <button
                      onClick={() => handleSubscribe(tier)}
                      disabled={config.disabled}
                      className={`w-full py-3 rounded-xl font-medium transition-colors mt-6 ${config.style}`}
                    >
                      {config.text}
                    </button>
                  )
                })()}
              </div>
            ))}
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            * 알림톡 초과 시 15원/건으로 추가 충전 가능
          </p>
        </div>
      </div>

      {/* 이용 안내 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <span className="text-blue-400">📦</span> 구독이란?
          </h3>
          <p className="text-sm text-slate-400">
            월 단위 구독으로 셀러포트의 모든 기능을 이용하세요.
            언제든지 플랜 변경 및 해지가 가능합니다.
          </p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <span className="text-amber-400">🔔</span> 알림톡이란?
          </h3>
          <p className="text-sm text-slate-400">
            빨간불/노란불 추적 링크 발생 시 카카오톡으로 알림을 보냅니다.
            플랜별 기본 제공량 초과 시 15원/건으로 충전 가능합니다.
          </p>
        </div>
      </div>

      {/* 결제 내역 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">결제 내역</h2>
          <p className="text-sm text-slate-400 mt-0.5">최근 결제 및 충전 내역</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">날짜</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">구분</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">내용</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">금액</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mockUsageHistory.map((record, index) => (
                <tr key={index} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-300">{record.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-lg ${
                      record.type === 'subscription'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {record.type === 'subscription' ? '구독' : '알림'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{record.description}</td>
                  <td className="px-6 py-4 text-sm text-white text-right">{record.amount.toLocaleString()}원</td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg">완료</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {mockUsageHistory.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="text-slate-400 mb-2">결제 내역이 없습니다</p>
          </div>
        )}
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

      {/* 알림 충전 모달 */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">🔔</span>
                알림 충전
              </h3>
              <p className="text-sm text-slate-400 mt-1">충전할 알림 건수를 선택하세요</p>
            </div>

            <div className="p-6">
              {/* 수량 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">충전 수량</label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setAlertQuantity(Math.max(10, alertQuantity - 10))}
                    className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xl font-bold transition-colors"
                  >
                    -
                  </button>
                  <div className="w-32 text-center">
                    <div className="flex items-baseline justify-center">
                      <input
                        type="number"
                        value={alertQuantity}
                        onChange={(e) => setAlertQuantity(Math.max(10, parseInt(e.target.value) || 10))}
                        className="w-20 text-center text-3xl font-bold text-white bg-transparent border-none focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                      />
                      <span className="text-xl text-slate-400">건</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setAlertQuantity(alertQuantity + 10)}
                    className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xl font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 빠른 선택 */}
              <div className="flex gap-2 mb-6">
                {[50, 100, 200, 500].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => setAlertQuantity(qty)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      alertQuantity === qty
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {qty}건
                  </button>
                ))}
              </div>

              {/* 결제 금액 */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">알림 {alertQuantity}건</span>
                  <span className="text-white">× {ALERT_PRICE.toLocaleString()}원</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">총 결제 금액</span>
                    <span className="text-2xl font-bold text-amber-400">
                      {(alertQuantity * ALERT_PRICE).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 space-y-3">
              <button
                onClick={() => setShowAlertModal(false)}
                className="w-full py-3 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">💬</span>
                카카오페이로 결제
              </button>
              <button
                onClick={() => setShowAlertModal(false)}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
              >
                카드로 결제
              </button>
              <button
                onClick={() => setShowAlertModal(false)}
                className="w-full py-2 text-slate-400 hover:text-white transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 구독 변경 모달 */}
      {showSubscriptionModal && selectedTier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">📦</span>
                플랜 변경
              </h3>
              <p className="text-sm text-slate-400 mt-1">{selectedTier.name} 플랜으로 변경합니다</p>
            </div>

            <div className="p-6">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 mb-4">
                <h4 className="font-bold text-white mb-2">{selectedTier.name}</h4>
                <p className="text-sm text-slate-400 mb-3">{selectedTier.description}</p>
                <ul className="space-y-1">
                  {selectedTier.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-blue-600/10 border border-blue-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">월 구독료</span>
                  <span className="text-2xl font-bold text-blue-400">{selectedTier.priceLabel}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedTier.alertLabel}</p>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 space-y-3">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="w-full py-3 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">💬</span>
                카카오페이로 결제
              </button>
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                카드로 결제
              </button>
              <button
                onClick={() => setShowSubscriptionModal(false)}
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
