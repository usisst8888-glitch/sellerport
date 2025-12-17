'use client'

interface DialogFooterProps {
  onCancel: () => void
  onSubmit: () => void
  loading?: boolean
  disabled?: boolean
}

export function DialogFooter({
  onCancel,
  onSubmit,
  loading = false,
  disabled = false,
}: DialogFooterProps) {
  return (
    <div className="p-6 border-t border-white/5 flex gap-3 flex-shrink-0">
      <button
        onClick={onCancel}
        disabled={loading}
        className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        취소
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
            <span>연동 중...</span>
          </>
        ) : '연동하기'}
      </button>
    </div>
  )
}
