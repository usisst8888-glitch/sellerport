'use client'

import { useState, useEffect } from 'react'

// 플랫폼 수수료율
const PLATFORM_FEES: Record<string, number> = {
  naver: 2.73,
  coupang: 10.8,
  gmarket: 12,
  auction: 12,
  '11st': 12,
  etc: 10
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

export default function ProfitPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [productProfits, setProductProfits] = useState<ProductProfit[]>([])
  const [loading, setLoading] = useState(true)
  const [showCalculator, setShowCalculator] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [calcResult, setCalcResult] = useState<CalcResult | null>(null)

  // 계산기 상태
  const [calcValues, setCalcValues] = useState({
    platform: 'naver',
    sellingPrice: 0,
    cost: 0,
    quantity: 1,
    shippingCost: 3000,
    adSpend: 0,
  })

  // 데이터 로드
  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // 상품 목록 가져오기
      const productsRes = await fetch('/api/products')
      const productsData = await productsRes.json()

      if (productsData.success) {
        setProducts(productsData.data || [])
      }

      // 주문 목록 가져오기 (나중에 orders API 구현 시 연동)
      // const ordersRes = await fetch('/api/orders')
      // const ordersData = await ordersRes.json()

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

  // API를 통한 마진 계산
  const handleCalculate = async () => {
    if (calcValues.sellingPrice <= 0) return

    setCalculating(true)
    try {
      const response = await fetch('/api/profit/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: calcValues.platform,
          sellingPrice: calcValues.sellingPrice,
          cost: calcValues.cost,
          quantity: calcValues.quantity,
          shippingCost: calcValues.shippingCost,
          adSpend: calcValues.adSpend
        })
      })

      const data = await response.json()

      if (data.success) {
        setCalcResult(data.data)
      }
    } catch (error) {
      console.error('Calculate error:', error)
    } finally {
      setCalculating(false)
    }
  }

  // 입력값 변경 시 자동 계산
  useEffect(() => {
    if (calcValues.sellingPrice > 0) {
      handleCalculate()
    } else {
      setCalcResult(null)
    }
  }, [calcValues])

  // 전체 통계 계산
  const totalRevenue = productProfits.reduce((sum, p) => sum + (p.sellingPrice * Math.max(1, p.salesCount)), 0)
  const totalCost = productProfits.reduce((sum, p) => sum + ((p.cost + p.platformFee + p.shippingCost + p.adSpend) * Math.max(1, p.salesCount)), 0)
  const totalProfit = productProfits.reduce((sum, p) => sum + (p.margin * Math.max(1, p.salesCount)), 0)
  const avgMarginRate = productProfits.length > 0
    ? productProfits.reduce((sum, p) => sum + p.marginRate, 0) / productProfits.length
    : 0

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

      {/* 플랫폼별 수수료 안내 */}
      <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
        <h3 className="text-sm font-medium text-white mb-3">플랫폼별 판매 수수료</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(PLATFORM_FEES).map(([platform, fee]) => (
            <div key={platform} className="px-3 py-1.5 rounded-lg bg-slate-900/50 border border-white/5">
              <span className="text-slate-400 text-sm capitalize">{platform === 'etc' ? '기타' : platform}</span>
              <span className="text-white text-sm font-medium ml-2">{fee}%</span>
            </div>
          ))}
        </div>
      </div>

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
              {/* 플랫폼 선택 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">판매 플랫폼</label>
                <select
                  value={calcValues.platform}
                  onChange={(e) => setCalcValues({...calcValues, platform: e.target.value})}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="naver">네이버 스마트스토어 (2.73%)</option>
                  <option value="coupang">쿠팡 (10.8%)</option>
                  <option value="gmarket">G마켓 (12%)</option>
                  <option value="auction">옥션 (12%)</option>
                  <option value="11st">11번가 (12%)</option>
                  <option value="etc">기타 (10%)</option>
                </select>
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
                      <span className="text-slate-400">플랫폼 수수료 ({PLATFORM_FEES[calcValues.platform]}%)</span>
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
                    sellingPrice: 0,
                    cost: 0,
                    quantity: 1,
                    shippingCost: 3000,
                    adSpend: 0,
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
