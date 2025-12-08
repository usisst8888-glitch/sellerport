import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ShipmentsPage() {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">발송 관리</h1>
          <p className="text-slate-400 mt-1">{today}</p>
        </div>
      </div>

      {/* 오늘 발송 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-slate-400 mb-1">발송 예정</p>
          <p className="text-3xl font-bold text-white">0건</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-slate-400 mb-1">발송 완료</p>
          <p className="text-3xl font-bold text-green-400">0건</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-slate-400 mb-1">발송 실패</p>
          <p className="text-3xl font-bold text-red-400">0건</p>
        </div>
      </div>

      {/* 발송 목록 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-1">오늘 발송 목록</h2>
        <p className="text-sm text-slate-400 mb-5">오늘 발송해야 할 정기구독 상품 목록입니다</p>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">발송 예정 건이 없습니다</h3>
          <p className="text-slate-400 mb-6 max-w-sm">
            플랫폼을 연동하고 구독자를 동기화하면<br />발송 목록이 자동으로 생성됩니다
          </p>
          <Link href="/platforms">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white">
              플랫폼 연동하기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
