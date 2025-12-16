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

      const { error: insertError } = await supabase
        .from('ad_channels')
        .insert({
          user_id: user.id,
          channel_type: 'naver_blog',
          channel_name: accountName.trim(),
          account_id: blogId.trim(),
          metadata: {
            blog_url: `https://blog.naver.com/${blogId.trim()}`,
            category: 'organic',
          },
          status: 'connected',
          is_manual: true,
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

            <div className="p-3 rounded-xl bg-slate-700/50 border border-white/10">
              <p className="text-xs text-slate-400">
                네이버 블로그 채널을 등록하여 관리할 수 있습니다. 별도의 API 연동 없이 채널 정보만 등록됩니다.
              </p>
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
          </div>
        </ModalContent>

        <ModalFooter
          onCancel={handleClose}
          onSubmit={handleConnect}
          loading={loading}
          disabled={!accountName.trim() || !blogId.trim()}
          guideId="naver-blog"
          submitText="채널 추가"
          loadingText="추가 중..."
        />
      </ModalContainer>
    </>
  )
}
