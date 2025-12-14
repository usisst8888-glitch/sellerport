'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ThreadsConnectDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function ThreadsConnectDialog({
  children,
  onSuccess
}: ThreadsConnectDialogProps) {
  const [open, setOpen] = useState(false)
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
                <div className="w-6 h-6 rounded flex items-center justify-center bg-black">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.632 2.695 6.54 2.717 1.986-.013 3.758-.474 5.27-1.373 1.768-1.053 2.742-2.473 2.742-3.999 0-1.049-.48-1.945-1.389-2.594-.838-.599-1.976-.926-3.292-.947-1.372.017-2.468.315-3.177.863-.602.464-.862.998-.862 1.768 0 .619.238 1.126.729 1.55.503.435 1.218.687 2.07.729l-.125 2.118c-1.397-.082-2.6-.535-3.479-1.312-.918-.813-1.404-1.903-1.404-3.158 0-1.4.614-2.552 1.775-3.333 1.094-.735 2.583-1.126 4.305-1.132h.091c1.784.028 3.322.491 4.448 1.337 1.204.903 1.84 2.209 1.84 3.78 0 2.195-1.312 4.138-3.69 5.464-1.825 1.02-3.959 1.555-6.345 1.595l-.01-.002z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Threads 계정 연동</h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">Threads API로 계정 성과를 추적합니다</p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* API 설정 안내 */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                <p className="text-sm font-medium text-white mb-2">연동 방법</p>
                <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                  <li>Instagram 비즈니스/크리에이터 계정과 연결된 Threads 필요</li>
                  <li>
                    <a
                      href="https://developers.facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Meta for Developers
                    </a>에서 앱 생성
                  </li>
                  <li>Threads API 권한 추가 후 Access Token 발급</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">계정 별칭 *</label>
                <input
                  type="text"
                  placeholder="예: 내 쓰레드 계정"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-gray-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">셀러포트에서 구분하기 위한 이름입니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Threads 사용자명 *</label>
                <input
                  type="text"
                  placeholder="예: @myaccount"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-gray-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">@ 포함하여 입력해주세요</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Threads User ID (선택)</label>
                <input
                  type="text"
                  placeholder="Threads User ID"
                  value={threadsUserId}
                  onChange={(e) => setThreadsUserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-gray-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">Meta for Developers에서 확인 가능합니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Access Token (선택)</label>
                <input
                  type="password"
                  placeholder="Threads API Access Token"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-gray-500 focus:outline-none transition-colors"
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
                  <li>- 팔로워 수, 조회수 추적</li>
                  <li>- 참여율 (좋아요, 답글, 리포스트) 분석</li>
                  <li>- 게시물별 성과 데이터</li>
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
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
