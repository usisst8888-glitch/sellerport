import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SubscribersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">구독자 관리</h1>
          <p className="text-slate-400 mt-1">구독자를 추가하고 관리합니다</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" disabled>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            동기화
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white" disabled>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            구독자 추가
          </Button>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="이름, 이메일, 전화번호로 검색..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              disabled
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" disabled>전체</Button>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" disabled>활성</Button>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" disabled>이탈 위험</Button>
          </div>
        </div>
      </div>

      {/* 구독자 목록 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-1">구독자 목록</h2>
        <p className="text-sm text-slate-400 mb-5">총 0명의 구독자</p>

        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="w-16 h-16 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-2">구독자가 없습니다</h3>
          <p className="text-slate-400 mb-6 max-w-sm">
            구독자를 직접 추가하거나 플랫폼을 연동하여 자동으로 동기화하세요
          </p>
          <div className="flex gap-3">
            <Button className="bg-blue-600 hover:bg-blue-500 text-white" disabled>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              구독자 추가
            </Button>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" disabled>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              엑셀 업로드
            </Button>
          </div>
        </div>
      </div>

      {/* 안내 */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-blue-300">구독자 추가 방법</p>
            <p className="text-xs text-blue-400/80 mt-1">
              플랫폼 연동 없이도 구독자를 직접 추가하거나 엑셀 파일로 일괄 업로드할 수 있습니다.
              인스타그램, 블로그 등 다양한 채널의 구독자를 한 곳에서 관리하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
