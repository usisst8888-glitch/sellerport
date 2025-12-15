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

interface TikTokConnectDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" fill="#25F4EE"/>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" fill="#FE2C55" style={{transform: 'translate(2px, 2px)'}}/>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" fill="white" style={{transform: 'translate(1px, 1px)'}}/>
  </svg>
)

export function TikTokConnectDialog({
  children,
  onSuccess,
  open: controlledOpen,
  onOpenChange
}: TikTokConnectDialogProps) {
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
  const [username, setUsername] = useState('')
  const [openId, setOpenId] = useState('')
  const [accessToken, setAccessToken] = useState('')

  const handleConnect = async () => {
    if (!accountName.trim() || !username.trim()) {
      setError('계정 이름과 사용자명을 입력해주세요')
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
          channel_type: 'tiktok_channel',
          channel_name: accountName.trim(),
          account_id: username.trim().replace('@', ''),
          access_token: accessToken.trim() || null,
          metadata: {
            open_id: openId.trim() || null,
            category: 'organic',
          },
          status: 'pending_verification',
          is_manual: false,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 TikTok 계정입니다')
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
      console.error('TikTok connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAccountName('')
    setUsername('')
    setOpenId('')
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
          title="TikTok 채널 연동"
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
                TikTok 팔로워, 조회수 추적
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                영상별 인게이지먼트 분석
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                자연 유입 콘텐츠 성과 분석
              </div>
            </div>

            <ModalInput
              label="계정 별칭"
              value={accountName}
              onChange={setAccountName}
              placeholder="예: 내 틱톡 채널"
              required
            />

            <ModalInput
              label="TikTok 사용자명"
              value={username}
              onChange={setUsername}
              placeholder="예: @myaccount"
              required
            />

            <ModalInput
              label="Open ID"
              value={openId}
              onChange={setOpenId}
              placeholder="TikTok Open ID (선택)"
            />

            <ModalInput
              label="Access Token"
              value={accessToken}
              onChange={setAccessToken}
              placeholder="TikTok Creator API Access Token (선택)"
              type="password"
            />
          </div>
        </ModalContent>

        <ModalFooter
          onCancel={handleClose}
          onSubmit={handleConnect}
          loading={loading}
          disabled={!accountName.trim() || !username.trim()}
          guideId="tiktok"
        />
      </ModalContainer>
    </>
  )
}
