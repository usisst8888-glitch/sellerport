'use client'

import { useState, useEffect } from 'react'

// 플랫폼별 수수료 구조
// 네이버: 채널별, 카테고리별로 다름 (결제수수료 별도)
// 쿠팡: 카테고리별 6~10.8% (로켓배송 여부에 따라 추가)
// G마켓/옥션/11번가: 카테고리별 9~15%

interface PlatformFeeConfig {
  name: string
  channels?: {
    id: string
    name: string
    baseFee: number // 판매수수료
    paymentFee: number // 결제수수료
    categories?: {
      id: string
      name: string
      fee: number
    }[]
  }[]
  baseFee?: number
  paymentFee?: number
}

// 로드맵 기반 플랫폼: 네이버, 쿠팡, 카페24, 아임웹, 고도몰, 메이크샵
const PLATFORM_FEE_CONFIG: Record<string, PlatformFeeConfig> = {
  naver: {
    name: '네이버 스마트스토어',
    channels: [
      {
        id: 'smartstore',
        name: '스마트스토어',
        baseFee: 0, // 판매수수료 없음
        paymentFee: 3.63, // 네이버페이 결제수수료 (VAT 포함)
        categories: [
          { id: 'fashion', name: '패션의류', fee: 5.63 },
          { id: 'fashion_acc', name: '패션잡화', fee: 5.63 },
          { id: 'beauty', name: '화장품/미용', fee: 5.63 },
          { id: 'digital', name: '디지털/가전', fee: 4.63 },
          { id: 'furniture', name: '가구/인테리어', fee: 5.63 },
          { id: 'food', name: '식품', fee: 5.63 },
          { id: 'baby', name: '출산/유아동', fee: 5.63 },
          { id: 'sports', name: '스포츠/레저', fee: 5.63 },
          { id: 'life', name: '생활/건강', fee: 4.63 },
          { id: 'default', name: '기타', fee: 4.63 },
        ]
      },
      {
        id: 'brandstore',
        name: '브랜드스토어',
        baseFee: 2, // 판매수수료 2%
        paymentFee: 3.63,
      },
      {
        id: 'window',
        name: '쇼핑윈도',
        baseFee: 6, // 판매수수료 6%
        paymentFee: 3.63,
      }
    ]
  },
  coupang: {
    name: '쿠팡',
    channels: [
      {
        id: 'marketplace',
        name: '마켓플레이스',
        baseFee: 10.8,
        paymentFee: 0,
        categories: [
          { id: 'fashion', name: '패션의류/잡화', fee: 10.8 },
          { id: 'beauty', name: '뷰티', fee: 10.8 },
          { id: 'food', name: '식품', fee: 10.8 },
          { id: 'baby', name: '출산/유아동', fee: 10.8 },
          { id: 'home', name: '홈/리빙', fee: 10.8 },
          { id: 'digital', name: '가전디지털', fee: 7.8 },
          { id: 'sports', name: '스포츠/레저', fee: 10.8 },
          { id: 'book', name: '도서/음반', fee: 6.0 },
          { id: 'default', name: '기타', fee: 10.8 },
        ]
      },
      {
        id: 'rocket',
        name: '로켓그로스',
        baseFee: 10.8, // 기본 수수료
        paymentFee: 3, // 물류비 추가 (대략)
      }
    ]
  },
  cafe24: {
    name: '카페24 (자사몰)',
    baseFee: 0, // 자사몰은 판매수수료 없음
    paymentFee: 3.3, // PG 수수료만
  },
  imweb: {
    name: '아임웹 (자사몰)',
    baseFee: 0, // 자사몰은 판매수수료 없음
    paymentFee: 3.3, // PG 수수료만
  },
  godomall: {
    name: '고도몰 (자사몰)',
    baseFee: 0, // 자사몰은 판매수수료 없음
    paymentFee: 3.3, // PG 수수료만
  },
  makeshop: {
    name: '메이크샵 (자사몰)',
    baseFee: 0, // 자사몰은 판매수수료 없음
    paymentFee: 3.3, // PG 수수료만
  },
  etc: {
    name: '기타',
    baseFee: 0,
    paymentFee: 3.3, // 기본 PG 수수료
  }
}

// 수수료 계산 함수
function calculatePlatformFee(
  platform: string,
  channel: string,
  category: string,
  price: number,
  customFeeRate?: number // 사용자 지정 수수료율
): { totalFee: number; feeRate: number; breakdown: string } {
  // 사용자가 직접 수수료를 입력한 경우
  if (customFeeRate !== undefined && customFeeRate >= 0) {
    const totalFee = Math.round(price * (customFeeRate / 100))
    return { totalFee, feeRate: customFeeRate, breakdown: `직접 입력 ${customFeeRate}%` }
  }

  const config = PLATFORM_FEE_CONFIG[platform]
  if (!config) {
    return { totalFee: price * 0.033, feeRate: 3.3, breakdown: '기타 3.3%' }
  }

  let feeRate = 0
  let breakdown = ''

  if (config.channels) {
    const channelConfig = config.channels.find(c => c.id === channel)
    if (channelConfig) {
      if (channelConfig.categories) {
        const categoryConfig = channelConfig.categories.find(c => c.id === category)
        if (categoryConfig) {
          feeRate = categoryConfig.fee
          breakdown = `${channelConfig.name} ${categoryConfig.name} ${feeRate}%`
        } else {
          const defaultCategory = channelConfig.categories.find(c => c.id === 'default')
          feeRate = defaultCategory?.fee || (channelConfig.baseFee + channelConfig.paymentFee)
          breakdown = `${channelConfig.name} ${feeRate}%`
        }
      } else {
        // 채널에 카테고리가 없는 경우 (브랜드스토어, 쇼핑윈도 등)
        feeRate = Math.round((channelConfig.baseFee + channelConfig.paymentFee) * 100) / 100
        breakdown = channelConfig.paymentFee > 0
          ? `${channelConfig.name} (판매 ${channelConfig.baseFee}% + 결제 ${channelConfig.paymentFee}%) = ${feeRate}%`
          : `${channelConfig.name} ${feeRate}%`
      }
    }
  } else {
    // 채널이 없는 플랫폼 (자사몰: 카페24, 아임웹 등)
    feeRate = Math.round(((config.baseFee || 0) + (config.paymentFee || 0)) * 100) / 100
    breakdown = config.paymentFee && config.paymentFee > 0
      ? `PG수수료 ${config.paymentFee}%`
      : `${feeRate}%`
  }

  const totalFee = Math.round(price * (feeRate / 100))
  return { totalFee, feeRate: Math.round(feeRate * 100) / 100, breakdown }
}

// 기존 단순 수수료 (호환성용) - 로드맵 기반 플랫폼만
const PLATFORM_FEES: Record<string, number> = {
  naver: 4.63, // 스마트스토어 평균 (결제수수료 포함)
  coupang: 10.8, // 마켓플레이스 평균
  cafe24: 3.3, // 자사몰 PG 수수료만
  imweb: 3.3, // 자사몰 PG 수수료만
  godomall: 3.3, // 자사몰 PG 수수료만
  makeshop: 3.3, // 자사몰 PG 수수료만
  etc: 3.3 // 기본 PG 수수료
}

interface Product {
  id: string
  name: string
  platform_type: string
  price: number
  cost: number
  platforms?: {
    platform_name: string
  }
}

interface Order {
  id: string
  product_id: string
  order_amount: number
  shipping_cost: number
  platform_fee: number
  ad_spend: number
  status: string
}

interface ProductProfit {
  id: string
  name: string
  platform: string
  platformType: string
  sellingPrice: number
  cost: number
  platformFee: number
  shippingCost: number
  adSpend: number
  margin: number
  marginRate: number
  salesCount: number
}

interface Slot {
  id: string
  name: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  clicks: number
  conversions: number
  revenue: number
  ad_spend: number
  status: string
  products?: {
    id: string
    name: string
    price: number
    cost: number
  } | null
}

interface CalcResult {
  platformFee: number
  shippingCost: number
  adSpend: number
  totalCost: number
  revenue: number
  profit: number
  marginRate: number
  roas: number
  bepQuantity: number
}

function formatCurrency(value: number) {
  return value.toLocaleString()
}

// ROAS 기준 신호등 색상 반환
function getSignalLight(roas: number): { bg: string; text: string; label: string } {
  if (roas >= 300) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '🟢' }
  if (roas >= 150) return { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '🟡' }
  return { bg: 'bg-red-500/20', text: 'text-red-400', label: '🔴' }
}

export default function ProfitPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [productProfits, setProductProfits] = useState<ProductProfit[]>([])
  const [loading, setLoading] = useState(true)
  const [showCalculator, setShowCalculator] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null)

  // 계산기 상태
  const [calcValues, setCalcValues] = useState({
    platform: 'naver',
    channel: 'smartstore',
    category: 'default',
    sellingPrice: 0,
    cost: 0,
    quantity: 1,
    shippingCost: 3000,
    adSpend: 0,
    customFeeRate: undefined as number | undefined, // 사용자 직접 입력 수수료
    useCustomFee: false, // 직접 입력 모드 사용 여부
  })

  // 플랫폼 변경 시 채널/카테고리 초기화
  const handlePlatformChange = (platform: string) => {
    const config = PLATFORM_FEE_CONFIG[platform]
    const defaultChannel = config?.channels?.[0]?.id || 'standard'
    setCalcValues({
      ...calcValues,
      platform,
      channel: defaultChannel,
      category: 'default'
    })
  }

  // 현재 선택된 플랫폼의 채널 목록
  const currentChannels = PLATFORM_FEE_CONFIG[calcValues.platform]?.channels || []
  const currentChannel = currentChannels.find(c => c.id === calcValues.channel)
  const currentCategories = currentChannel?.categories || []

  // 현재 수수료 계산
  const currentFeeInfo = calculatePlatformFee(
    calcValues.platform,
    calcValues.channel,
    calcValues.category,
    calcValues.sellingPrice,
    calcValues.useCustomFee ? calcValues.customFeeRate : undefined
  )

  // 데이터 로드
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // 상품 목록과 슬롯 목록 동시에 가져오기
      const [productsRes, slotsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/slots')
      ])

      const productsData = await productsRes.json()
      const slotsData = await slotsRes.json()

      if (productsData.success) {
        setProducts(productsData.data || [])
      }

      if (slotsData.success) {
        setSlots(slotsData.data || [])
      }

      // 상품별 수익 계산
      calculateProductProfits(productsData.data || [])

    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  // 상품별 수익 계산
  const calculateProductProfits = (productList: Product[]) => {
    const profits: ProductProfit[] = productList.map(product => {
      const platformFeeRate = PLATFORM_FEES[product.platform_type] || PLATFORM_FEES.etc
      const platformFee = Math.round(product.price * (platformFeeRate / 100))
      const shippingCost = 3000 // 기본 배송비 가정
      const adSpend = 0 // 광고비는 캠페인에서 계산

      const totalCost = product.cost + platformFee + shippingCost + adSpend
      const margin = product.price - totalCost
      const marginRate = product.price > 0 ? (margin / product.price) * 100 : 0

      return {
        id: product.id,
        name: product.name,
        platform: product.platforms?.platform_name || product.platform_type,
        platformType: product.platform_type,
        sellingPrice: product.price,
        cost: product.cost,
        platformFee,
        shippingCost,
        adSpend,
        margin,
        marginRate,
        salesCount: 0 // 주문 API 연동 시 실제 판매 수량으로 대체
      }
    })

    setProductProfits(profits)
  }

  // 클라이언트 측에서 직접 마진 계산 (실시간)
  const handleCalculate = () => {
    if (calcValues.sellingPrice <= 0) {
      setCalcResult(null)
      return
    }

    const feeInfo = calculatePlatformFee(
      calcValues.platform,
      calcValues.channel,
      calcValues.category,
      calcValues.sellingPrice,
      calcValues.useCustomFee ? calcValues.customFeeRate : undefined
    )

    const revenue = calcValues.sellingPrice * calcValues.quantity
    const totalCost = calcValues.cost * calcValues.quantity
    const platformFee = Math.round(revenue * (feeInfo.feeRate / 100))
    const shippingTotal = calcValues.shippingCost * calcValues.quantity
    const adSpend = calcValues.adSpend

    const totalExpense = totalCost + platformFee + shippingTotal + adSpend
    const profit = revenue - totalExpense
    const marginRate = revenue > 0 ? (profit / revenue) * 100 : 0
    const roas = adSpend > 0 ? (revenue / adSpend) * 100 : 0

    // 손익분기점 계산
    const profitPerUnit = calcValues.sellingPrice - calcValues.cost - (calcValues.sellingPrice * feeInfo.feeRate / 100) - calcValues.shippingCost
    const bepQuantity = profitPerUnit > 0 && adSpend > 0 ? Math.ceil(adSpend / profitPerUnit) : 0

    setCalcResult({
      platformFee,
      shippingCost: shippingTotal,
      adSpend,
      totalCost: totalExpense,
      revenue,
      profit,
      marginRate,
      roas,
      bepQuantity
    })
  }

  // 입력값 변경 시 자동 계산
  useEffect(() => {
    handleCalculate()
  }, [calcValues])

  // 전체 통계 계산
  const totalRevenue = productProfits.reduce((sum, p) => sum + (p.sellingPrice * Math.max(1, p.salesCount)), 0)
  const totalCost = productProfits.reduce((sum, p) => sum + ((p.cost + p.platformFee + p.shippingCost + p.adSpend) * Math.max(1, p.salesCount)), 0)
  const totalProfit = productProfits.reduce((sum, p) => sum + (p.margin * Math.max(1, p.salesCount)), 0)
  const avgMarginRate = productProfits.length > 0
    ? productProfits.reduce((sum, p) => sum + p.marginRate, 0) / productProfits.length
    : 0

  // 슬롯별 통계 계산
  const totalSlotAdSpend = slots.reduce((sum, s) => sum + (s.ad_spend || 0), 0)
  const totalSlotRevenue = slots.reduce((sum, s) => sum + (s.revenue || 0), 0)
  const totalSlotConversions = slots.reduce((sum, s) => sum + (s.conversions || 0), 0)
  const totalSlotRoas = totalSlotAdSpend > 0 ? Math.round((totalSlotRevenue / totalSlotAdSpend) * 100) : 0
  const activeSlots = slots.filter(s => s.status === 'active').length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">수익 계산</h1>
          <p className="text-slate-400 mt-1">원가, 수수료, 세금을 고려한 실제 마진을 계산하세요</p>
        </div>
        <button
          onClick={() => setShowCalculator(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          마진 계산기
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">등록 상품</p>
          <p className="text-2xl font-bold text-white mt-1">{productProfits.length}<span className="text-sm font-normal text-slate-400 ml-1">개</span></p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">예상 매출 (1개씩)</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(totalRevenue)}<span className="text-sm font-normal text-slate-400 ml-1">원</span></p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">예상 순이익</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{formatCurrency(totalProfit)}<span className="text-sm font-normal text-slate-400 ml-1">원</span></p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">평균 마진율</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{avgMarginRate.toFixed(1)}<span className="text-sm font-normal text-slate-400 ml-1">%</span></p>
        </div>
      </div>

      {/* 비용 구성 가이드 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900/30 to-slate-800/40 border border-emerald-500/20 p-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            마진 계산 방법
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            실제 순수익 = 판매가 - 원가 - 플랫폼 수수료 - 배송비 - 광고비
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">💰</p>
              <p className="text-xs text-slate-500">원가</p>
              <p className="text-sm text-slate-300">제품 원가</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">🏪</p>
              <p className="text-xs text-slate-500">수수료</p>
              <p className="text-sm text-slate-300">플랫폼별 상이</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">🚚</p>
              <p className="text-xs text-slate-500">배송비</p>
              <p className="text-sm text-slate-300">실제 배송 원가</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">📢</p>
              <p className="text-xs text-slate-500">광고비</p>
              <p className="text-sm text-slate-300">캠페인 광고비</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">📊</p>
              <p className="text-xs text-slate-500">ROAS</p>
              <p className="text-sm text-slate-300">광고 수익률</p>
            </div>
          </div>
        </div>
      </div>

      {/* 슬롯별 ROAS 현황 - 전환추적과 연동 */}
      {slots.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/30 to-slate-800/40 border border-blue-500/20">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  슬롯별 광고 성과
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">전환 추적에서 연동된 슬롯별 ROAS</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-slate-500">총 광고비</p>
                  <p className="text-lg font-bold text-white">{formatCurrency(totalSlotAdSpend)}원</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">총 매출</p>
                  <p className="text-lg font-bold text-blue-400">{formatCurrency(totalSlotRevenue)}원</p>
                </div>
                <div className={`px-3 py-2 rounded-xl ${getSignalLight(totalSlotRoas).bg}`}>
                  <p className="text-xs text-slate-500">전체 ROAS</p>
                  <p className={`text-lg font-bold ${getSignalLight(totalSlotRoas).text}`}>
                    {totalSlotRoas}% {getSignalLight(totalSlotRoas).label}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {slots.filter(s => s.ad_spend > 0).map((slot) => {
              const slotRoas = slot.ad_spend > 0 ? Math.round((slot.revenue / slot.ad_spend) * 100) : 0
              const signal = getSignalLight(slotRoas)
              // 상품 원가 기반 순이익 계산
              const productCost = slot.products?.cost || 0
              const estimatedProfit = slot.revenue - (productCost * slot.conversions) - slot.ad_spend

              return (
                <div key={slot.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded ${signal.bg} ${signal.text}`}>
                          {signal.label} {slotRoas}%
                        </span>
                        <span className="text-sm font-medium text-white">{slot.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{slot.utm_source}</span>
                        <span>·</span>
                        <span>{slot.utm_medium}</span>
                        {slot.products?.name && (
                          <>
                            <span>·</span>
                            <span className="text-slate-400">🛒 {slot.products.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="text-sm font-medium text-white">{slot.conversions}</p>
                        <p className="text-xs text-slate-500">전환</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-400">-{formatCurrency(slot.ad_spend)}원</p>
                        <p className="text-xs text-slate-500">광고비</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-400">{formatCurrency(slot.revenue)}원</p>
                        <p className="text-xs text-slate-500">매출</p>
                      </div>
                      {productCost > 0 && (
                        <div>
                          <p className={`text-sm font-medium ${estimatedProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {estimatedProfit >= 0 ? '+' : ''}{formatCurrency(estimatedProfit)}원
                          </p>
                          <p className="text-xs text-slate-500">예상 순이익</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {slots.filter(s => s.ad_spend > 0).length === 0 && (
              <div className="p-8 text-center">
                <p className="text-slate-400">광고비가 입력된 슬롯이 없습니다</p>
                <p className="text-xs text-slate-500 mt-1">전환 추적에서 슬롯의 광고비를 입력하세요</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 상품별 수익 현황 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">상품별 수익 분석</h2>
          <p className="text-sm text-slate-400 mt-0.5">각 상품의 예상 마진을 확인하세요</p>
        </div>

        {productProfits.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-slate-400 mb-2">등록된 상품이 없습니다</p>
            <p className="text-sm text-slate-500">상품을 등록하면 수익 분석을 확인할 수 있습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">상품</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">판매가</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">원가</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">수수료</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">배송비</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">순마진</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">마진율</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {productProfits.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-white">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.platform}</p>
                    </td>
                    <td className="text-right px-4 py-4 text-sm text-white">{formatCurrency(product.sellingPrice)}원</td>
                    <td className="text-right px-4 py-4 text-sm text-red-400">
                      {product.cost > 0 ? `-${formatCurrency(product.cost)}원` : <span className="text-slate-500">미입력</span>}
                    </td>
                    <td className="text-right px-4 py-4 text-sm text-red-400">-{formatCurrency(product.platformFee)}원</td>
                    <td className="text-right px-4 py-4 text-sm text-red-400">-{formatCurrency(product.shippingCost)}원</td>
                    <td className="text-right px-4 py-4">
                      <span className={`text-sm font-medium ${product.margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {product.margin >= 0 ? '+' : ''}{formatCurrency(product.margin)}원
                      </span>
                    </td>
                    <td className="text-right px-4 py-4">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                        product.marginRate >= 30 ? 'bg-emerald-500/20 text-emerald-400' :
                        product.marginRate >= 20 ? 'bg-amber-500/20 text-amber-400' :
                        product.marginRate >= 0 ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {product.marginRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 마진 계산기 모달 */}
      {showCalculator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">마진 계산기</h3>
              <p className="text-sm text-slate-400 mt-1">판매가와 비용을 입력하면 실제 마진을 계산합니다</p>
            </div>

            <div className="p-6 space-y-4">
              {/* 플랫폼 선택 - 한 줄로 */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">판매 플랫폼</label>
                <div className="flex gap-2">
                  <select
                    value={calcValues.platform}
                    onChange={(e) => handlePlatformChange(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    {Object.entries(PLATFORM_FEE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>{config.name}</option>
                    ))}
                  </select>

                  {currentChannels.length > 0 && (
                    <select
                      value={calcValues.channel}
                      onChange={(e) => setCalcValues({...calcValues, channel: e.target.value, category: 'default'})}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      {currentChannels.map(channel => (
                        <option key={channel.id} value={channel.id}>{channel.name}</option>
                      ))}
                    </select>
                  )}

                  {currentCategories.length > 0 && (
                    <select
                      value={calcValues.category}
                      onChange={(e) => setCalcValues({...calcValues, category: e.target.value})}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      {currentCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name} ({cat.fee}%)</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* 현재 수수료율 표시 및 직접 입력 */}
              <div className="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-300">적용 수수료</span>
                  <div className="flex items-center gap-2">
                    {!calcValues.useCustomFee && (
                      <span className="text-sm font-medium text-white">{currentFeeInfo.breakdown || `${currentFeeInfo.feeRate}%`}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setCalcValues({
                        ...calcValues,
                        useCustomFee: !calcValues.useCustomFee,
                        customFeeRate: calcValues.useCustomFee ? undefined : currentFeeInfo.feeRate
                      })}
                      className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                        calcValues.useCustomFee
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {calcValues.useCustomFee ? '자동으로' : '직접 입력'}
                    </button>
                  </div>
                </div>

                {calcValues.useCustomFee && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={calcValues.customFeeRate ?? ''}
                      onChange={(e) => setCalcValues({
                        ...calcValues,
                        customFeeRate: e.target.value ? Number(e.target.value) : undefined
                      })}
                      placeholder="수수료율 입력"
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-900/50 border border-white/10 text-white text-sm placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                    <span className="text-sm text-slate-400">%</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">판매가</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={calcValues.sellingPrice || ''}
                      onChange={(e) => setCalcValues({...calcValues, sellingPrice: Number(e.target.value)})}
                      placeholder="0"
                      className="w-full px-4 py-2.5 pr-8 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">원가</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={calcValues.cost || ''}
                      onChange={(e) => setCalcValues({...calcValues, cost: Number(e.target.value)})}
                      placeholder="0"
                      className="w-full px-4 py-2.5 pr-8 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">수량</label>
                  <input
                    type="number"
                    value={calcValues.quantity}
                    onChange={(e) => setCalcValues({...calcValues, quantity: Math.max(1, Number(e.target.value))})}
                    min="1"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">배송비</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={calcValues.shippingCost}
                      onChange={(e) => setCalcValues({...calcValues, shippingCost: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 pr-8 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">광고비</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={calcValues.adSpend || ''}
                      onChange={(e) => setCalcValues({...calcValues, adSpend: Number(e.target.value)})}
                      placeholder="0"
                      className="w-full px-4 py-2.5 pr-8 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                  </div>
                </div>
              </div>

              {/* 계산 결과 */}
              <div className="mt-6 p-4 rounded-xl bg-slate-900/50 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-slate-400">계산 결과</p>
                  {calculating && (
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {calcResult ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">총 매출</span>
                      <span className="text-white">{formatCurrency(calcResult.revenue)}원</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">원가 ({calcValues.quantity}개)</span>
                      <span className="text-red-400">-{formatCurrency(calcValues.cost * calcValues.quantity)}원</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">플랫폼 수수료 ({currentFeeInfo.feeRate}%)</span>
                      <span className="text-red-400">-{formatCurrency(calcResult.platformFee)}원</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">배송비</span>
                      <span className="text-red-400">-{formatCurrency(calcResult.shippingCost)}원</span>
                    </div>
                    {calcResult.adSpend > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">광고비</span>
                        <span className="text-red-400">-{formatCurrency(calcResult.adSpend)}원</span>
                      </div>
                    )}
                    <div className="border-t border-white/10 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-medium text-white">순이익</span>
                        <span className={`font-bold text-lg ${calcResult.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {calcResult.profit >= 0 ? '+' : ''}{formatCurrency(calcResult.profit)}원
                        </span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-slate-400">마진율</span>
                        <span className={`text-sm font-medium ${calcResult.marginRate >= 20 ? 'text-emerald-400' : calcResult.marginRate >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                          {calcResult.marginRate.toFixed(1)}%
                        </span>
                      </div>
                      {calcResult.adSpend > 0 && (
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-slate-400">ROAS</span>
                          <span className={`text-sm font-medium ${
                            calcResult.roas >= 300 ? 'text-emerald-400' :
                            calcResult.roas >= 150 ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {calcResult.roas.toFixed(0)}%
                          </span>
                        </div>
                      )}
                      {calcResult.bepQuantity > 0 && (
                        <div className="flex justify-between mt-1">
                          <span className="text-sm text-slate-400">손익분기점</span>
                          <span className="text-sm text-slate-300">{calcResult.bepQuantity}개</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-slate-500 py-4">판매가를 입력하면 자동으로 계산됩니다</p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => setShowCalculator(false)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  setCalcValues({
                    platform: 'naver',
                    channel: 'smartstore',
                    category: 'default',
                    sellingPrice: 0,
                    cost: 0,
                    quantity: 1,
                    shippingCost: 3000,
                    adSpend: 0,
                    customFeeRate: undefined,
                    useCustomFee: false,
                  })
                  setCalcResult(null)
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
