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

interface KakaoMomentConnectDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const KakaoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path fill="#3C1E1E" d="M12 3c-5.5 0-10 3.5-10 7.8 0 2.8 1.8 5.3 4.6 6.8l-1 3.7c-.1.3.2.5.5.3l4.3-2.8c.5.1 1 .1 1.6.1 5.5 0 10-3.5 10-7.8S17.5 3 12 3z"/>
  </svg>
)

export function KakaoMomentConnectDialog({
  children,
  onSuccess,
  open: controlledOpen,
  onOpenChange
}: KakaoMomentConnectDialogProps) {
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
  const [adAccountId, setAdAccountId] = useState('')
  const [appKey, setAppKey] = useState('')
  const [accessToken, setAccessToken] = useState('')

  const handleConnect = async () => {
    if (!accountName.trim() || !adAccountId.trim()) {
      setError('계정 이름과 광고계정 ID를 입력해주세요')
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
          channel_type: 'kakao',
          channel_name: accountName.trim(),
          account_id: adAccountId.trim(),
          access_token: accessToken.trim() || null,
          metadata: {
            app_key: appKey.trim() || null,
          },
          status: 'pending_verification',
          is_manual: false,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 카카오모먼트 계정입니다')
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
      console.error('Kakao Moment connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAccountName('')
    setAdAccountId('')
    setAppKey('')
    setAccessToken('')
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
          icon={<KakaoIcon />}
          iconBg="bg-[#FEE500]"
          title="카카오모먼트 연동"
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
                카카오모먼트 광고비 자동 수집
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                카카오톡, 다음 포털 광고 데이터 통합
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                전환 및 ROAS 데이터 추적
              </div>
            </div>

            <ModalInput
              label="계정 별칭"
              value={accountName}
              onChange={setAccountName}
              placeholder="예: 내 카카오모먼트 계정"
              required
            />

            <ModalInput
              label="광고계정 ID"
              value={adAccountId}
              onChange={setAdAccountId}
              placeholder="예: 12345678"
              required
            />

            <ModalInput
              label="앱 키 (REST API Key)"
              value={appKey}
              onChange={setAppKey}
              placeholder="REST API 키 입력 (선택)"
            />

            <ModalInput
              label="Access Token"
              value={accessToken}
              onChange={setAccessToken}
              placeholder="Access Token 입력 (선택)"
              type="password"
            />
          </div>
        </ModalContent>

        <ModalFooter
          onCancel={handleClose}
          onSubmit={handleConnect}
          loading={loading}
          disabled={!accountName.trim() || !adAccountId.trim()}
          guideId="kakao-moment"
        />
      </ModalContainer>
    </>
  )
}
