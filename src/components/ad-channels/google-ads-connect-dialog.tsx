'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface GoogleAdsConnectDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function GoogleAdsConnectDialog({
  children,
  onSuccess
}: GoogleAdsConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [accountName, setAccountName] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [developerToken, setDeveloperToken] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [refreshToken, setRefreshToken] = useState('')

  const handleConnect = async () => {
    if (!accountName.trim() || !customerId.trim()) {
      setError('계정 이름과 고객 ID를 입력해주세요')
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
          channel_type: 'google',
          channel_name: accountName.trim(),
          account_id: customerId.trim().replace(/-/g, ''),
          access_token: developerToken.trim() || null,
          refresh_token: refreshToken.trim() || null,
          metadata: {
            client_id: clientId.trim() || null,
            client_secret: clientSecret.trim() || null,
          },
          status: 'pending_verification',
          is_manual: false,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 Google Ads 계정입니다')
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
      console.error('Google Ads connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAccountName('')
    setCustomerId('')
    setDeveloperToken('')
    setClientId('')
    setClientSecret('')
    setRefreshToken('')
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
                <div className="w-6 h-6 rounded flex items-center justify-center bg-white">
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Google Ads 연동</h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">Google Ads API 자격 증명을 입력하세요</p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* API 발급 안내 */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                <p className="text-sm font-medium text-white mb-2">API 설정 방법</p>
                <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                  <li>
                    <a
                      href="https://console.cloud.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Google Cloud Console
                    </a> 접속
                  </li>
                  <li>프로젝트 생성 → Google Ads API 활성화</li>
                  <li>OAuth 2.0 클라이언트 ID 생성</li>
                  <li>
                    <a
                      href="https://ads.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      Google Ads
                    </a>에서 고객 ID 확인
                  </li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">계정 별칭 *</label>
                <input
                  type="text"
                  placeholder="예: 내 Google Ads 계정"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">셀러포트에서 구분하기 위한 이름입니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">고객 ID (Customer ID) *</label>
                <input
                  type="text"
                  placeholder="예: 123-456-7890"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">Google Ads 대시보드 상단에서 확인 가능합니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Developer Token (선택)</label>
                <input
                  type="text"
                  placeholder="Developer Token 입력"
                  value={developerToken}
                  onChange={(e) => setDeveloperToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client ID (선택)</label>
                  <input
                    type="text"
                    placeholder="OAuth Client ID"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client Secret (선택)</label>
                  <input
                    type="password"
                    placeholder="OAuth Client Secret"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Refresh Token (선택)</label>
                <input
                  type="password"
                  placeholder="OAuth Refresh Token"
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
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
                  <li>- 일별 광고비 자동 수집</li>
                  <li>- 캠페인별 클릭/노출/전환 데이터</li>
                  <li>- 광고 on/off 제어</li>
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
                disabled={loading || !accountName.trim() || !customerId.trim()}
                className="px-4 py-2 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
