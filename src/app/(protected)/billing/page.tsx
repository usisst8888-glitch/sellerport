'use client'

import { useState } from 'react'

const mockUsageHistory = [
  { date: '2024-12-01', type: 'slot', description: '슬롯 충전', quantity: 5, amount: 10000 },
  { date: '2024-12-01', type: 'alert', description: '알림 충전', quantity: 100, amount: 5000 },
  { date: '2024-11-15', type: 'slot', description: '슬롯 충전', quantity: 3, amount: 6000 },
  { date: '2024-11-01', type: 'alert', description: '알림 충전', quantity: 200, amount: 8000 },
]

export default function BillingPage() {
  const [currentSlots, setCurrentSlots] = useState(3)
  const [currentAlerts, setCurrentAlerts] = useState(47)

  // 슬롯 충전 모달
  const [showSlotModal, setShowSlotModal] = useState(false)
  const [slotQuantity, setSlotQuantity] = useState(5)
  const SLOT_PRICE = 2000 // 슬롯당 가격

  // 알림 충전 모달
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [alertQuantity, setAlertQuantity] = useState(100)
  const ALERT_PRICE = 15 // 알림 1건당 가격

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-white">결제 관리</h1>
        <p className="text-slate-400 mt-1">슬롯 및 알림 충전과 결제 내역을 관리하세요</p>
      </div>

      {/* 현재 보유 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 슬롯 현황 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900/40 to-slate-800/40 border border-blue-500/20 p-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-blue-400 font-medium">활성 슬롯</p>
                  <p className="text-xs text-slate-500">상품 전환 추적용</p>
                </div>
              </div>
              <p className="text-4xl font-bold text-white">{currentSlots}개</p>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <p className="text-sm text-slate-400">슬롯당 <span className="text-white">{SLOT_PRICE.toLocaleString()}원</span>/월</p>
              <button
                onClick={() => setShowSlotModal(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
              >
                슬롯 충전
              </button>
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
              <p className="text-sm text-slate-400">알림 1건당 <span className="text-white">{ALERT_PRICE.toLocaleString()}원</span></p>
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

      {/* 이용 안내 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <span className="text-blue-400">📦</span> 슬롯이란?
          </h3>
          <p className="text-sm text-slate-400">
            하나의 슬롯으로 하나의 상품 광고 효율을 추적합니다.
            슬롯은 월 단위로 과금되며, 사용하지 않은 슬롯은 다음 달로 이월됩니다.
          </p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
            <span className="text-amber-400">🔔</span> 알림이란?
          </h3>
          <p className="text-sm text-slate-400">
            빨간불/노란불 상품 발생 시 카카오톡, 이메일 등으로 알림을 보냅니다.
            알림 1건당 과금되며, 잔여 건수가 0이 되면 알림이 발송되지 않습니다.
          </p>
        </div>
      </div>

      {/* 결제 내역 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">결제 내역</h2>
          <p className="text-sm text-slate-400 mt-0.5">최근 충전 및 결제 내역</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">날짜</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">구분</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">내용</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">수량</th>
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
                      record.type === 'slot'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {record.type === 'slot' ? '슬롯' : '알림'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-white">{record.description}</td>
                  <td className="px-6 py-4 text-sm text-slate-300 text-right">
                    {record.quantity}{record.type === 'slot' ? '개' : '건'}
                  </td>
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

      {/* 슬롯 충전 모달 */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">📦</span>
                슬롯 충전
              </h3>
              <p className="text-sm text-slate-400 mt-1">충전할 슬롯 개수를 선택하세요</p>
            </div>

            <div className="p-6">
              {/* 수량 선택 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">충전 수량</label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setSlotQuantity(Math.max(1, slotQuantity - 1))}
                    className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xl font-bold transition-colors"
                  >
                    -
                  </button>
                  <div className="w-32 text-center">
                    <div className="flex items-baseline justify-center">
                      <input
                        type="number"
                        value={slotQuantity}
                        onChange={(e) => setSlotQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 text-center text-3xl font-bold text-white bg-transparent border-none focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                      />
                      <span className="text-xl text-slate-400">개</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSlotQuantity(slotQuantity + 1)}
                    className="w-12 h-12 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xl font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 빠른 선택 */}
              <div className="flex gap-2 mb-6">
                {[5, 10, 20, 50].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => setSlotQuantity(qty)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      slotQuantity === qty
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {qty}개
                  </button>
                ))}
              </div>

              {/* 결제 금액 */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">슬롯 {slotQuantity}개</span>
                  <span className="text-white">× {SLOT_PRICE.toLocaleString()}원</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-white">총 결제 금액</span>
                    <span className="text-2xl font-bold text-blue-400">
                      {(slotQuantity * SLOT_PRICE).toLocaleString()}원
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 space-y-3">
              <button
                onClick={() => setShowSlotModal(false)}
                className="w-full py-3 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] text-[#3C1E1E] font-medium transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">💬</span>
                카카오페이로 결제
              </button>
              <button
                onClick={() => setShowSlotModal(false)}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                카드로 결제
              </button>
              <button
                onClick={() => setShowSlotModal(false)}
                className="w-full py-2 text-slate-400 hover:text-white transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}
