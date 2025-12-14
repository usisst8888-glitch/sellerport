'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface KakaoMomentConnectDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function KakaoMomentConnectDialog({
  children,
  onSuccess
}: KakaoMomentConnectDialogProps) {
  const [open, setOpen] = useState(false)
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
                <div className="w-6 h-6 rounded flex items-center justify-center bg-[#FEE500]">
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path fill="#3C1E1E" d="M12 3c-5.5 0-10 3.5-10 7.8 0 2.8 1.8 5.3 4.6 6.8l-1 3.7c-.1.3.2.5.5.3l4.3-2.8c.5.1 1 .1 1.6.1 5.5 0 10-3.5 10-7.8S17.5 3 12 3z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">카카오모먼트 연동</h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">카카오모먼트 광고 API 정보를 입력하세요</p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                <p className="text-sm font-medium text-white mb-2">API 설정 방법</p>
                <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                  <li>
                    <a
                      href="https://moment.kakao.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      카카오모먼트
                    </a> 접속 → 로그인
                  </li>
                  <li>광고계정 선택 → 설정</li>
                  <li>광고계정 ID 확인</li>
                  <li>
                    <a
                      href="https://developers.kakao.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Kakao Developers
                    </a>에서 앱 키 발급
                  </li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">계정 별칭 *</label>
                <input
                  type="text"
                  placeholder="예: 내 카카오모먼트 계정"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">셀러포트에서 구분하기 위한 이름입니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">광고계정 ID *</label>
                <input
                  type="text"
                  placeholder="예: 12345678"
                  value={adAccountId}
                  onChange={(e) => setAdAccountId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">카카오모먼트 광고계정 설정에서 확인 가능합니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">앱 키 (REST API Key) (선택)</label>
                <input
                  type="text"
                  placeholder="REST API 키 입력"
                  value={appKey}
                  onChange={(e) => setAppKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Access Token (선택)</label>
                <input
                  type="password"
                  placeholder="Access Token 입력"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-900/50">
                <p className="text-xs text-slate-400 font-medium mb-2">연동 후 사용 가능한 기능</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>- 일별 광고비 자동 수집</li>
                  <li>- 캠페인/그룹별 성과 데이터</li>
                  <li>- 타겟팅 분석</li>
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
                disabled={loading || !accountName.trim() || !adAccountId.trim()}
                className="px-4 py-2 rounded-xl bg-[#FEE500] hover:bg-[#F5DC00] text-[#3C1E1E] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
