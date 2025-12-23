/**
 * /v 기본 페이지
 * 스토어 슬러그 없이 접근한 경우 안내 페이지 표시
 */

export default function VideoCodeBasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700 flex items-center justify-center">
        <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-white mb-2">잘못된 접근입니다</h1>
      <p className="text-slate-400 text-sm text-center">
        올바른 스토어 주소로 접근해주세요
      </p>
      <p className="text-slate-500 text-xs mt-4">
        예: /v/storename
      </p>

      {/* 푸터 */}
      <div className="absolute bottom-4 text-center">
        <p className="text-slate-600 text-xs">
          Powered by SellerPort
        </p>
      </div>
    </div>
  )
}
