'use client'

import { useState } from 'react'
import Image from 'next/image'
import { DialogFooter } from './dialog-footer'

interface Cafe24ConnectDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function Cafe24ConnectDialog({ isOpen, onClose, onSuccess }: Cafe24ConnectDialogProps) {
  const [mallId, setMallId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleConnect = () => {
    if (!mallId.trim()) {
      setError('쇼핑몰 ID를 입력해주세요')
      return
    }

    // 쇼핑몰 ID 형식 검증 (영문, 숫자, 하이픈만 허용)
    if (!/^[a-zA-Z0-9-]+$/.test(mallId)) {
      setError('쇼핑몰 ID는 영문, 숫자, 하이픈만 사용 가능합니다')
      return
    }

    setLoading(true)
    setError(null)

    // 카페24 OAuth 인증 페이지로 리다이렉트
    window.location.href = `/api/auth/cafe24?mall_id=${encodeURIComponent(mallId.trim())}`
  }

  const handleClose = () => {
    setMallId('')
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
        {/* 헤더 */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-2 flex items-center justify-center">
              <Image
                src="/site_logo/cafe24.png"
                alt="카페24"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">카페24 연동</h3>
              <p className="text-sm text-slate-400">쇼핑몰을 셀러포트와 연결하세요</p>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6 space-y-4">
          {/* 안내 */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <p className="text-sm text-blue-400 mb-2">연동 방법</p>
            <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
              <li>카페24 쇼핑몰 ID를 입력하세요</li>
              <li>카페24 로그인 후 앱 설치를 승인하세요</li>
              <li>자동으로 상품과 주문이 동기화됩니다</li>
            </ol>
          </div>

          {/* 쇼핑몰 ID 입력 */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              카페24 쇼핑몰 ID *
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="myshop"
                value={mallId}
                onChange={(e) => {
                  setMallId(e.target.value)
                  setError(null)
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
              />
              <span className="text-slate-500 text-sm">.cafe24.com</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              카페24 관리자 URL에서 확인할 수 있습니다 (예: myshop.cafe24.com)
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* 권한 안내 */}
          <div className="p-4 rounded-xl bg-slate-900/50">
            <p className="text-xs text-slate-500 mb-2">요청되는 권한</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">상품 조회</span>
              <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">주문 조회</span>
              <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">스토어 정보</span>
              <span className="px-2 py-1 text-xs rounded bg-slate-700 text-slate-300">매출 통계</span>
            </div>
          </div>
        </div>

        {/* 푸터 */}
        <DialogFooter
          onCancel={handleClose}
          onSubmit={handleConnect}
          loading={loading}
          disabled={!mallId.trim()}
        />
      </div>
    </div>
  )
}
