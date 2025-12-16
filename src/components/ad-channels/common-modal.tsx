'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface ModalButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  variant: 'cancel' | 'submit'
  color?: string // 브랜드 컬러 (submit 버튼용)
  children: ReactNode
}

// 공통 모달 버튼 컴포넌트
export function ModalButton({
  onClick,
  disabled = false,
  loading = false,
  variant,
  color,
  children
}: ModalButtonProps) {
  if (variant === 'cancel') {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      >
        {children}
      </button>
    )
  }

  // submit 버튼
  const bgColor = color || '#3B82F6'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      style={{ backgroundColor: disabled || loading ? undefined : bgColor }}
      className={`flex-1 px-4 py-2.5 rounded-xl text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
        disabled || loading ? 'bg-slate-600' : 'hover:brightness-110'
      }`}
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>연동 중...</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}

interface ModalFooterProps {
  onCancel: () => void
  onSubmit: () => void
  loading?: boolean
  disabled?: boolean
  guideId?: string // 가이드 페이지로 연결할 채널 ID
  submitText?: string // 제출 버튼 텍스트 (기본: '연동하기')
  loadingText?: string // 로딩 중 텍스트 (기본: '연동 중...')
}

export function ModalFooter({
  onCancel,
  onSubmit,
  loading = false,
  disabled = false,
  guideId,
  submitText = '연동하기',
  loadingText = '연동 중...',
}: ModalFooterProps) {
  const router = useRouter()

  const handleGuideClick = () => {
    if (guideId) {
      router.push(`/guide?tab=adchannels&channel=${guideId}`)
    }
  }

  return (
    <div className="p-6 border-t border-white/5 flex-shrink-0">
      {guideId && (
        <button
          type="button"
          onClick={handleGuideClick}
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
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || loading}
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
          ) : (
            submitText
          )}
        </button>
      </div>
    </div>
  )
}

interface ModalContainerProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg'
}

// 공통 모달 컨테이너
export function ModalContainer({
  isOpen,
  onClose,
  children,
  maxWidth = 'lg'
}: ModalContainerProps) {
  if (!isOpen) return null

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  }[maxWidth]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* 모달 */}
      <div className={`relative w-full ${maxWidthClass} max-h-[90vh] flex flex-col rounded-2xl bg-slate-800 border border-white/10 shadow-2xl`}>
        {children}
      </div>
    </div>
  )
}

interface ModalHeaderProps {
  icon: ReactNode
  iconBg?: string
  title: string
  subtitle?: string
  onClose: () => void
}

// 공통 모달 헤더
export function ModalHeader({
  icon,
  iconBg = 'bg-blue-500',
  title,
  subtitle,
  onClose
}: ModalHeaderProps) {
  return (
    <div className="p-6 border-b border-white/5 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

interface ModalContentProps {
  children: ReactNode
}

// 공통 모달 컨텐츠 영역
export function ModalContent({ children }: ModalContentProps) {
  return (
    <div className="p-6 overflow-y-auto flex-1">
      {children}
    </div>
  )
}

interface ModalInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'password'
  required?: boolean
  hint?: string
}

// 공통 입력 필드
export function ModalInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  hint
}: ModalInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-colors"
        required={required}
      />
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

interface ModalErrorProps {
  message: string
}

// 공통 에러 메시지
export function ModalError({ message }: ModalErrorProps) {
  if (!message) return null

  return (
    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
      <p className="text-sm text-red-400">{message}</p>
    </div>
  )
}

interface ModalInfoBoxProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'info'
}

// 공통 정보 박스
export function ModalInfoBox({ children, variant = 'default' }: ModalInfoBoxProps) {
  const styles = {
    default: 'bg-slate-900/50 border-white/10',
    success: 'bg-emerald-500/10 border-emerald-500/20',
    warning: 'bg-amber-500/10 border-amber-500/20',
    info: 'bg-blue-500/10 border-blue-500/20'
  }

  return (
    <div className={`p-4 rounded-xl border ${styles[variant]}`}>
      {children}
    </div>
  )
}

interface ModalStepProps {
  number: number
  title: string
  description?: ReactNode
  color?: string
}

// 공통 단계 표시
export function ModalStep({ number, title, description, color = '#3B82F6' }: ModalStepProps) {
  return (
    <div className="flex gap-3">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ backgroundColor: color }}
      >
        <span className="text-white text-xs font-bold">{number}</span>
      </div>
      <div>
        <p className="text-sm text-white font-medium">{title}</p>
        {description && (
          <div className="text-xs text-slate-400 mt-0.5">{description}</div>
        )}
      </div>
    </div>
  )
}

interface FeatureListProps {
  features: string[]
}

// 공통 기능 목록
export function FeatureList({ features }: FeatureListProps) {
  return (
    <ul className="space-y-1.5">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-2 text-sm text-emerald-200/80">
          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {feature}
        </li>
      ))}
    </ul>
  )
}
