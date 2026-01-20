'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Balance {
  slotBalance: number
}

interface Profile {
  plan: string
  planExpiresAt: string | null
}

// 플랜 정보
const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '무료',
    features: ['슬롯 5개', '사이트 1개 연동'],
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9900,
    priceLabel: '9,900원/월',
    features: ['슬롯 50개', '사이트 3개 연동', '기본 통계'],
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49900,
    priceLabel: '49,900원/월',
    features: ['슬롯 200개', '사이트 10개 연동', '고급 분석', '우선 지원'],
    popular: true,
  },
  {
    id: 'reseller',
    name: '리셀러 파트너',
    price: -1,
    priceLabel: '별도 협의',
    features: ['화이트라벨 플랫폼 제공', '도매가 구독료', '자체 브랜드 운영', '파트너 대시보드', '수익 정산'],
    popular: false,
  },
]

// 슬롯 패키지
const SLOT_PACKAGES = [
  { slots: 10, price: 20000, label: '10개', pricePerSlot: 2000 },
  { slots: 50, price: 90000, label: '50개', pricePerSlot: 1800, discount: 10 },
  { slots: 100, price: 160000, label: '100개', pricePerSlot: 1600, discount: 20 },
  { slots: 200, price: 280000, label: '200개', pricePerSlot: 1400, discount: 30 },
]

export default function PaymentPage() {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'plan' | 'slot'>('plan')
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [selectedSlotPackage, setSelectedSlotPackage] = useState<number | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // 프로필 조회
      const profileRes = await fetch('/api/profile')
      const profileData = await profileRes.json()
      if (profileData.success) {
        setProfile(profileData.data)
      }

      // 잔액 조회 (balance API가 있다면)
      // 현재는 임시로 0으로 설정
      setBalance({ slotBalance: 0 })

    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePurchase = async (type: 'plan' | 'slot') => {
    setProcessing(true)

    try {
      let amount = 0
      let quantity = 0

      if (type === 'plan' && selectedPlan) {
        const plan = PLANS.find(p => p.id === selectedPlan)
        if (plan) {
          amount = plan.price
        }
      } else if (type === 'slot' && selectedSlotPackage !== null) {
        const pkg = SLOT_PACKAGES[selectedSlotPackage]
        amount = pkg.price
        quantity = pkg.slots
      }

      if (amount === 0) {
        alert('무료 플랜은 결제가 필요 없습니다')
        setProcessing(false)
        return
      }

      // 토스페이먼츠 결제창 호출 (실제 구현 시)
      alert(`결제 금액: ${amount.toLocaleString()}원\n\n토스페이먼츠 연동 후 실제 결제가 진행됩니다.`)

      // 실제 구현 예시:
      // const orderId = `order_${Date.now()}`
      // const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!)
      // await tossPayments.requestPayment('카드', {
      //   amount,
      //   orderId,
      //   orderName: type === 'plan' ? `${selectedPlan} 플랜` : `슬롯 ${quantity}개`,
      //   successUrl: `${window.location.origin}/payment/success`,
      //   failUrl: `${window.location.origin}/payment/fail`,
      // })

    } catch (error) {
      console.error('Payment error:', error)
      alert('결제 중 오류가 발생했습니다')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (value: number) => value.toLocaleString()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-white">결제</h1>
        <p className="text-slate-400 mt-1">플랜 업그레이드 및 슬롯을 충전하세요</p>
      </div>

      {/* 현재 잔액 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">현재 플랜</p>
          <p className="text-xl font-bold text-white mt-1 capitalize">{profile?.plan || 'Free'}</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">슬롯 잔액</p>
          <p className="text-xl font-bold text-blue-400 mt-1">{balance?.slotBalance || 0}<span className="text-sm font-normal text-slate-400 ml-1">개</span></p>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('plan')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'plan'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          플랜 업그레이드
        </button>
        <button
          onClick={() => setActiveTab('slot')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'slot'
              ? 'bg-blue-600 text-white'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          슬롯 충전
        </button>
      </div>

      {/* 플랜 업그레이드 */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative rounded-2xl border p-6 cursor-pointer transition-all ${
                  selectedPlan === plan.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : profile?.plan === plan.id
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-white/10 bg-slate-800/50 hover:border-white/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                    인기
                  </div>
                )}
                {profile?.plan === plan.id && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-600 text-white text-xs font-medium rounded-full">
                    현재 플랜
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <p className="text-2xl font-bold text-white mt-2">{plan.priceLabel}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="text-sm text-slate-400 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {selectedPlan && selectedPlan !== 'free' && selectedPlan !== profile?.plan && (
            <div className="flex justify-center">
              <Button
                onClick={() => handlePurchase('plan')}
                disabled={processing}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white"
              >
                {processing ? '처리 중...' : `${PLANS.find(p => p.id === selectedPlan)?.priceLabel} 결제하기`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 슬롯 충전 */}
      {activeTab === 'slot' && (
        <div className="space-y-6">
          <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
            <h3 className="text-sm font-medium text-white mb-2">슬롯이란?</h3>
            <p className="text-sm text-slate-400">
              슬롯은 광고 성과 추적 링크를 생성하는 데 사용됩니다. 1개의 슬롯으로 1개의 추적 링크를 만들 수 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {SLOT_PACKAGES.map((pkg, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedSlotPackage(idx)}
                className={`relative rounded-2xl border p-6 cursor-pointer transition-all ${
                  selectedSlotPackage === idx
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-slate-800/50 hover:border-white/20'
                }`}
              >
                {pkg.discount && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                    {pkg.discount}% 할인
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white">{pkg.label}</h3>
                <p className="text-2xl font-bold text-white mt-2">{formatCurrency(pkg.price)}원</p>
                <p className="text-sm text-slate-400 mt-1">개당 {formatCurrency(pkg.pricePerSlot)}원</p>
              </div>
            ))}
          </div>

          {selectedSlotPackage !== null && (
            <div className="flex justify-center">
              <Button
                onClick={() => handlePurchase('slot')}
                disabled={processing}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white"
              >
                {processing ? '처리 중...' : `${formatCurrency(SLOT_PACKAGES[selectedSlotPackage].price)}원 결제하기`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 결제 안내 */}
      <div className="rounded-xl bg-slate-800/50 border border-white/5 p-6">
        <h3 className="text-sm font-medium text-white mb-3">결제 안내</h3>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            플랜은 결제 후 즉시 적용됩니다.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            충전된 슬롯은 유효기간이 없습니다.
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            환불은 미사용 분에 한해 7일 이내 요청 가능합니다.
          </li>
        </ul>
      </div>
    </div>
  )
}
