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

interface TikTokAdsConnectDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path fill="#25F4EE" d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 004.3 1.38V7.3s-1.88.09-3.24-1.48z"/>
    <path fill="#FE2C55" d="M17.6 6.82s.51.5 0 0A4.278 4.278 0 0116.54 4h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48v-3.16c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7v-5.29a7.35 7.35 0 004.3 1.38V8.3s-1.88.09-3.24-1.48z"/>
    <path fill="white" d="M17.1 6.32s.51.5 0 0A4.278 4.278 0 0116.04 3.5h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V10.16c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V10.51a7.35 7.35 0 004.3 1.38V8.8s-1.88.09-3.24-1.48z"/>
  </svg>
)

export function TikTokAdsConnectDialog({
  children,
  onSuccess,
  open: controlledOpen,
  onOpenChange
}: TikTokAdsConnectDialogProps) {
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
  const [advertiserId, setAdvertiserId] = useState('')
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [accessToken, setAccessToken] = useState('')

  const handleConnect = async () => {
    if (!accountName.trim() || !advertiserId.trim()) {
      setError('계정 이름과 광고주 ID를 입력해주세요')
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
          channel_type: 'tiktok',
          channel_name: accountName.trim(),
          account_id: advertiserId.trim(),
          access_token: accessToken.trim() || null,
          metadata: {
            app_id: appId.trim() || null,
            app_secret: appSecret.trim() || null,
          },
          status: 'pending_verification',
          is_manual: false,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 TikTok Ads 계정입니다')
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
      console.error('TikTok Ads connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAccountName('')
    setAdvertiserId('')
    setAppId('')
    setAppSecret('')
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
          icon={<TikTokIcon />}
          iconBg="bg-black"
          title="TikTok Ads 연동"
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
                TikTok 광고비 자동 수집
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                전환 및 ROAS 데이터 추적
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                캠페인 성과 및 광고 on/off 제어
              </div>
            </div>

            <ModalInput
              label="계정 별칭"
              value={accountName}
              onChange={setAccountName}
              placeholder="예: 내 TikTok Ads 계정"
              required
            />

            <ModalInput
              label="광고주 ID (Advertiser ID)"
              value={advertiserId}
              onChange={setAdvertiserId}
              placeholder="예: 7123456789012345678"
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <ModalInput
                label="App ID"
                value={appId}
                onChange={setAppId}
                placeholder="Marketing API App ID (선택)"
              />
              <ModalInput
                label="App Secret"
                value={appSecret}
                onChange={setAppSecret}
                placeholder="App Secret (선택)"
                type="password"
              />
            </div>

            <ModalInput
              label="Access Token"
              value={accessToken}
              onChange={setAccessToken}
              placeholder="Long-term Access Token (선택)"
              type="password"
            />
          </div>
        </ModalContent>

        <ModalFooter
          onCancel={handleClose}
          onSubmit={handleConnect}
          loading={loading}
          disabled={!accountName.trim() || !advertiserId.trim()}
          guideId="tiktok-ads"
        />
      </ModalContainer>
    </>
  )
}
