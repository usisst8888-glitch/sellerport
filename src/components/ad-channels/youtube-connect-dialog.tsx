'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface YouTubeConnectDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function YouTubeConnectDialog({
  children,
  onSuccess
}: YouTubeConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [accountName, setAccountName] = useState('')
  const [channelId, setChannelId] = useState('')
  const [channelUrl, setChannelUrl] = useState('')
  const [apiKey, setApiKey] = useState('')

  const handleConnect = async () => {
    if (!accountName.trim() || !channelId.trim()) {
      setError('계정 이름과 채널 ID를 입력해주세요')
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
          channel_type: 'youtube',
          channel_name: accountName.trim(),
          account_id: channelId.trim(),
          access_token: apiKey.trim() || null,
          metadata: {
            channel_url: channelUrl.trim() || null,
            category: 'organic',
          },
          status: 'pending_verification',
          is_manual: false,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 YouTube 채널입니다')
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
      console.error('YouTube connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAccountName('')
    setChannelId('')
    setChannelUrl('')
    setApiKey('')
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
                <div className="w-6 h-6 rounded flex items-center justify-center bg-red-600">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">YouTube 채널 연동</h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">YouTube Analytics API로 채널 성과를 추적합니다</p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* API 설정 안내 */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                <p className="text-sm font-medium text-white mb-2">연동 방법</p>
                <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                  <li>
                    <a
                      href="https://studio.youtube.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      YouTube Studio
                    </a> 접속 → 설정
                  </li>
                  <li>채널 → 고급 설정에서 채널 ID 확인</li>
                  <li>
                    <a
                      href="https://console.cloud.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Google Cloud Console
                    </a>에서 API 키 발급 (선택)
                  </li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">채널 별칭 *</label>
                <input
                  type="text"
                  placeholder="예: 내 유튜브 채널"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">셀러포트에서 구분하기 위한 이름입니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">채널 ID *</label>
                <input
                  type="text"
                  placeholder="예: UC1234567890abcdef"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">YouTube Studio → 설정 → 채널 → 고급 설정에서 확인</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">채널 URL (선택)</label>
                <input
                  type="text"
                  placeholder="예: https://youtube.com/@mychannel"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">API Key (선택)</label>
                <input
                  type="password"
                  placeholder="Google Cloud API Key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">API 키가 있으면 더 상세한 데이터를 수집할 수 있습니다</p>
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
                  <li>- 조회수, 구독자 수 추적</li>
                  <li>- 시청시간 및 참여율 분석</li>
                  <li>- 동영상별 성과 데이터</li>
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
                disabled={loading || !accountName.trim() || !channelId.trim()}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
