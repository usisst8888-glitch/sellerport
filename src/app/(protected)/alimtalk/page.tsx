import { Button } from '@/components/ui/button'

export default function AlimtalkPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">알림톡</h1>
          <p className="text-slate-400 mt-1">카카오 알림톡 발송 및 관리</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-500 text-white" disabled>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          새 템플릿
        </Button>
      </div>

      {/* 잔액 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-slate-400 mb-1">알림톡 잔액</p>
          <p className="text-3xl font-bold text-white">0원</p>
          <Button variant="outline" size="sm" className="mt-3 border-slate-600 text-slate-300 hover:bg-slate-700" disabled>충전하기</Button>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-slate-400 mb-1">이번 달 발송</p>
          <p className="text-3xl font-bold text-white">0건</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <p className="text-sm text-slate-400 mb-1">발송 단가</p>
          <p className="text-3xl font-bold text-white">22원</p>
          <p className="text-xs text-slate-500 mt-2">Free 플랜 기준</p>
        </div>
      </div>

      {/* 템플릿 목록 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-1">알림톡 템플릿</h2>
        <p className="text-sm text-slate-400 mb-5">발송에 사용할 템플릿을 관리합니다</p>

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="w-12 h-12 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-slate-400 mb-4">등록된 템플릿이 없습니다</p>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white" disabled>템플릿 만들기</Button>
        </div>
      </div>

      {/* 발송 내역 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-1">최근 발송 내역</h2>
        <p className="text-sm text-slate-400 mb-5">최근 7일간 발송 내역</p>

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <svg className="w-12 h-12 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-slate-400">발송 내역이 없습니다</p>
        </div>
      </div>

      {/* 카카오톡 채널 안내 */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-300">카카오톡 채널 등록 필요</p>
            <p className="text-xs text-blue-400/80 mt-1">
              알림톡 발송을 위해서는 카카오톡 채널 등록이 필요합니다.
              설정에서 채널을 등록해주세요. 별도의 알리고 계약은 필요 없습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
