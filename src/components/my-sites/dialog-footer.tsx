'use client'

import { useRouter } from 'next/navigation'

interface DialogFooterProps {
  onCancel: () => void
  onSubmit: () => void
  loading?: boolean
  disabled?: boolean
  guideUrl?: string
  cancelText?: string
  submitText?: string
  loadingText?: string
}

export function DialogFooter({
  onCancel,
  onSubmit,
  loading = false,
  disabled = false,
  guideUrl,
  cancelText = '취소',
  submitText = '연동하기',
  loadingText = '연동 중...',
}: DialogFooterProps) {
  const router = useRouter()

  return (
    <div className="p-6 border-t border-white/5 flex-shrink-0">
      {guideUrl && (
        <button
          type="button"
          onClick={() => router.push(guideUrl)}
          className="w-full mb-3 px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          연동 방법 자세히 보기
        </button>
      )}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {cancelText}
        </button>
        <button
          onClick={onSubmit}
          disabled={loading || disabled}
          className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>{loadingText}</span>
            </>
          ) : submitText}
        </button>
      </div>
    </div>
  )
}
