'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ModalContainer,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ModalInput,
  ModalError,
} from './common-modal'

interface NaverGfaConnectDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const NaverGfaIcon = () => (
  <span className="text-white text-[10px] font-bold">GFA</span>
)

export function NaverGfaConnectDialog({
  children,
  onSuccess,
  open: controlledOpen,
  onOpenChange
}: NaverGfaConnectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value)
    } else {
      setInternalOpen(value)
    }
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [accountName, setAccountName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [secretKey, setSecretKey] = useState('')

  const handleConnect = async () => {
    if (!accountName.trim() || !customerId.trim()) {
      setError('계정 이름과 고객 ID를 입력해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('로그인이 필요합니다')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase
        .from('ad_channels')
        .insert({
          user_id: user.id,
          channel_type: 'naver_gfa',
          channel_name: accountName.trim(),
          account_id: customerId.trim(),
          access_token: apiKey.trim() || null,
          refresh_token: secretKey.trim() || null,
          status: 'pending_verification',
          is_manual: false,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 네이버 GFA 계정입니다')
        } else {
          setError('연동 중 오류가 발생했습니다')
        }
        setLoading(false)
        return
      }

      setOpen(false)
      resetForm()
      onSuccess?.()

    } catch (err) {
      console.error('Naver GFA connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAccountName('')
    setCustomerId('')
    setApiKey('')
    setSecretKey('')
    setError('')
  }

  const handleClose = () => {
    if (!loading) {
      setOpen(false)
      resetForm()
    }
  }

  return (
    <>
      {children && (
        <div onClick={() => setOpen(true)}>
          {children}
        </div>
      )}

      <ModalContainer isOpen={open} onClose={handleClose}>
        <ModalHeader
          icon={<NaverGfaIcon />}
          iconBg="bg-[#03C75A]"
          title="네이버 GFA 연동"
          onClose={handleClose}
        />

        <ModalContent>
          <div className="space-y-4">
            <ModalError message={error} />

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                네이버 성과형 디스플레이 광고 데이터 수집
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                광고비 및 전환 데이터 자동 수집
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                캠페인 성과 분석 및 ROAS 추적
              </div>
            </div>

            <ModalInput
              label="계정 별칭"
              value={accountName}
              onChange={setAccountName}
              placeholder="예: 내 GFA 계정"
              required
            />

            <ModalInput
              label="고객 ID"
              value={customerId}
              onChange={setCustomerId}
              placeholder="예: 1234567"
              required
            />

            <ModalInput
              label="API Key"
              value={apiKey}
              onChange={setApiKey}
              placeholder="API 키 입력 (선택)"
            />

            <ModalInput
              label="Secret Key"
              value={secretKey}
              onChange={setSecretKey}
              placeholder="비밀키 입력 (선택)"
              type="password"
            />
          </div>
        </ModalContent>

        <ModalFooter
          onCancel={handleClose}
          onSubmit={handleConnect}
          loading={loading}
          disabled={!accountName.trim() || !customerId.trim()}
          guideId="naver-gfa"
        />
      </ModalContainer>
    </>
  )
}
