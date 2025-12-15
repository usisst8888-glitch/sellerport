'use client'

import { useState } from 'react'
import {
  ModalContainer,
  ModalHeader,
  ModalContent,
  ModalFooter,
  ModalInfoBox,
} from './common-modal'

interface MetaConnectDialogProps {
  children?: React.ReactNode
  onSuccess?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const MetaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <path fill="white" d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
  </svg>
)

export function MetaConnectDialog({
  children,
  onSuccess,
  open: controlledOpen,
  onOpenChange
}: MetaConnectDialogProps) {
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

  const handleConnect = () => {
    setLoading(true)
    const width = 600
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      '/api/auth/meta',
      'meta_oauth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    )

    const checkPopup = setInterval(() => {
      if (popup && popup.closed) {
        clearInterval(checkPopup)
        setLoading(false)
        setOpen(false)
        onSuccess?.()
      }
    }, 500)
  }

  const handleClose = () => {
    if (!loading) setOpen(false)
  }

  return (
    <>
      {children && (
        <div onClick={() => setOpen(true)}>
          {children}
        </div>
      )}

      <ModalContainer isOpen={open} onClose={handleClose} maxWidth="md">
        <ModalHeader
          icon={<MetaIcon />}
          iconBg="bg-[#0081FB]"
          title="Meta 광고 연동"
          onClose={handleClose}
        />

        <ModalContent>
          <ModalInfoBox variant="info">
            <div className="flex gap-2">
              <svg className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-xs text-blue-300">
                Meta 계정으로 로그인하면 Facebook, Instagram, Threads 광고 계정이 자동으로 연동됩니다.
              </p>
            </div>
          </ModalInfoBox>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Facebook 광고 데이터 자동 수집
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Instagram 광고 데이터 자동 수집
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Threads 광고 데이터 자동 수집
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              캠페인 성과 및 광고 on/off 제어
            </div>
          </div>
        </ModalContent>

        <ModalFooter
          onCancel={handleClose}
          onSubmit={handleConnect}
          loading={loading}
          guideId="meta"
        />
      </ModalContainer>
    </>
  )
}
