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

interface ThreadsConnectDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.632 2.695 6.54 2.717 1.986-.013 3.758-.474 5.27-1.373 1.768-1.053 2.742-2.473 2.742-3.999 0-1.049-.48-1.945-1.389-2.594-.838-.599-1.976-.926-3.292-.947-1.372.017-2.468.315-3.177.863-.602.464-.862.998-.862 1.768 0 .619.238 1.126.729 1.55.503.435 1.218.687 2.07.729l-.125 2.118c-1.397-.082-2.6-.535-3.479-1.312-.918-.813-1.404-1.903-1.404-3.158 0-1.4.614-2.552 1.775-3.333 1.094-.735 2.583-1.126 4.305-1.132h.091c1.784.028 3.322.491 4.448 1.337 1.204.903 1.84 2.209 1.84 3.78 0 2.195-1.312 4.138-3.69 5.464-1.825 1.02-3.959 1.555-6.345 1.595l-.01-.002z"/>
  </svg>
)

export function ThreadsConnectDialog({
  children,
  onSuccess,
  open: controlledOpen,
  onOpenChange
}: ThreadsConnectDialogProps) {
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
  const [threadsUserId, setThreadsUserId] = useState('')
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
          channel_type: 'threads',
          channel_name: accountName.trim(),
          account_id: username.trim().replace('@', ''),
          access_token: accessToken.trim() || null,
          metadata: {
            threads_user_id: threadsUserId.trim() || null,
            category: 'organic',
          },
          status: 'pending_verification',
          is_manual: false,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 Threads 계정입니다')
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
      console.error('Threads connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAccountName('')
    setUsername('')
    setThreadsUserId('')
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
          icon={<ThreadsIcon />}
          iconBg="bg-black"
          title="Threads 계정 연동"
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
                Threads 팔로워, 좋아요 데이터 추적
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                게시물별 인게이지먼트 분석
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
              placeholder="예: 내 쓰레드 계정"
              required
            />

            <ModalInput
              label="Threads 사용자명"
              value={username}
              onChange={setUsername}
              placeholder="예: @myaccount"
              required
            />

            <ModalInput
              label="Threads User ID"
              value={threadsUserId}
              onChange={setThreadsUserId}
              placeholder="Threads User ID (선택)"
            />

            <ModalInput
              label="Access Token"
              value={accessToken}
              onChange={setAccessToken}
              placeholder="Threads API Access Token (선택)"
              type="password"
            />
          </div>
        </ModalContent>

        <ModalFooter
          onCancel={handleClose}
          onSubmit={handleConnect}
          loading={loading}
          disabled={!accountName.trim() || !username.trim()}
          guideId="threads"
        />
      </ModalContainer>
    </>
  )
}
