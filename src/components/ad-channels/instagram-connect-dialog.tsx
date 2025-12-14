'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface InstagramConnectDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function InstagramConnectDialog({
  children,
  onSuccess
}: InstagramConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [accountName, setAccountName] = useState('')
  const [username, setUsername] = useState('')
  const [businessAccountId, setBusinessAccountId] = useState('')
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
          channel_type: 'instagram',
          channel_name: accountName.trim(),
          account_id: username.trim().replace('@', ''),
          access_token: accessToken.trim() || null,
          metadata: {
            business_account_id: businessAccountId.trim() || null,
            category: 'organic',
          },
          status: 'pending_verification',
          is_manual: false,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 Instagram 계정입니다')
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
      console.error('Instagram connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAccountName('')
    setUsername('')
    setBusinessAccountId('')
    setAccessToken('')
    setError('')
  }

  return (
    <>
      <div onClick={() => setOpen(true)}>
        {children}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'linear-gradient(45deg, #FFDC80, #F77737, #E1306C, #C13584, #833AB4)' }}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Instagram 계정 연동</h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">Instagram Graph API로 계정 성과를 추적합니다</p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* API 설정 안내 */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                <p className="text-sm font-medium text-white mb-2">연동 방법</p>
                <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Instagram 비즈니스/크리에이터 계정 필요</li>
                  <li>
                    <a
                      href="https://business.facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Meta Business Suite
                    </a>에서 Facebook 페이지와 연결
                  </li>
                  <li>
                    <a
                      href="https://developers.facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Meta for Developers
                    </a>에서 앱 생성 (선택)
                  </li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">계정 별칭 *</label>
                <input
                  type="text"
                  placeholder="예: 내 인스타그램 계정"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">셀러포트에서 구분하기 위한 이름입니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Instagram 사용자명 *</label>
                <input
                  type="text"
                  placeholder="예: @myaccount"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">@ 포함하여 입력해주세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">비즈니스 계정 ID (선택)</label>
                <input
                  type="text"
                  placeholder="예: 17841400000000000"
                  value={businessAccountId}
                  onChange={(e) => setBusinessAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">Meta Business Suite에서 확인 가능합니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Access Token (선택)</label>
                <input
                  type="password"
                  placeholder="Instagram Graph API Access Token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">Access Token이 있으면 더 상세한 데이터를 수집할 수 있습니다</p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* 기능 안내 */}
              <div className="p-3 rounded-xl bg-slate-900/50">
                <p className="text-xs text-slate-400 font-medium mb-2">연동 후 사용 가능한 기능</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>- 팔로워 수, 도달 범위 추적</li>
                  <li>- 참여율 (좋아요, 댓글) 분석</li>
                  <li>- 스토리, 릴스 성과 데이터</li>
                </ul>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end flex-shrink-0">
              <button
                onClick={() => {
                  setOpen(false)
                  resetForm()
                }}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConnect}
                disabled={loading || !accountName.trim() || !username.trim()}
                className="px-4 py-2 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(45deg, #F77737, #E1306C, #C13584)' }}
              >
                {loading ? '연동 중...' : '연동하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
