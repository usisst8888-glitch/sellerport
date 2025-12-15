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

interface NaverBlogConnectDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const NaverIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
  </svg>
)

export function NaverBlogConnectDialog({
  children,
  onSuccess,
  open: controlledOpen,
  onOpenChange
}: NaverBlogConnectDialogProps) {
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
  const [blogId, setBlogId] = useState('')
  const [blogUrl, setBlogUrl] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')

  const handleConnect = async () => {
    if (!accountName.trim() || !blogId.trim()) {
      setError('계정 이름과 블로그 ID를 입력해주세요')
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

      let formattedUrl = blogUrl.trim()
      if (formattedUrl && !formattedUrl.startsWith('http')) {
        formattedUrl = `https://blog.naver.com/${formattedUrl}`
      }

      const { error: insertError } = await supabase
        .from('ad_channels')
        .insert({
          user_id: user.id,
          channel_type: 'naver_blog',
          channel_name: accountName.trim(),
          account_id: blogId.trim(),
          access_token: clientId.trim() || null,
          refresh_token: clientSecret.trim() || null,
          metadata: {
            blog_url: formattedUrl || `https://blog.naver.com/${blogId.trim()}`,
            category: 'organic',
          },
          status: 'pending_verification',
          is_manual: false,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 네이버 블로그입니다')
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
      console.error('Naver Blog connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAccountName('')
    setBlogId('')
    setBlogUrl('')
    setClientId('')
    setClientSecret('')
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
          icon={<NaverIcon />}
          iconBg="bg-[#03C75A]"
          title="네이버 블로그 연동"
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
                네이버 블로그 방문자 수 추적
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                포스트별 조회수, 댓글 분석
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                자연 유입 콘텐츠 성과 분석
              </div>
            </div>

            <ModalInput
              label="블로그 별칭"
              value={accountName}
              onChange={setAccountName}
              placeholder="예: 내 네이버 블로그"
              required
            />

            <ModalInput
              label="블로그 ID"
              value={blogId}
              onChange={setBlogId}
              placeholder="예: myblog123"
              required
            />

            <ModalInput
              label="블로그 URL"
              value={blogUrl}
              onChange={setBlogUrl}
              placeholder="예: https://blog.naver.com/myblog123 (선택)"
            />

            <div className="grid grid-cols-2 gap-3">
              <ModalInput
                label="Client ID"
                value={clientId}
                onChange={setClientId}
                placeholder="네이버 API Client ID (선택)"
              />
              <ModalInput
                label="Client Secret"
                value={clientSecret}
                onChange={setClientSecret}
                placeholder="네이버 API Client Secret (선택)"
                type="password"
              />
            </div>
          </div>
        </ModalContent>

        <ModalFooter
          onCancel={handleClose}
          onSubmit={handleConnect}
          loading={loading}
          disabled={!accountName.trim() || !blogId.trim()}
          guideId="naver-blog"
        />
      </ModalContainer>
    </>
  )
}
