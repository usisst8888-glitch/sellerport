'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TikTokAdsConnectDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function TikTokAdsConnectDialog({
  children,
  onSuccess
}: TikTokAdsConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [accountName, setAccountName] = useState('')
  const [advertiserId, setAdvertiserId] = useState('')
  const [appId, setAppId] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [accessToken, setAccessToken] = useState('')

  const handleConnect = async () => {
    if (!accountName.trim() || !advertiserId.trim()) {
      setError('계정 이름과 광고주 ID를 입력해주세요')
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
          channel_type: 'tiktok',
          channel_name: accountName.trim(),
          account_id: advertiserId.trim(),
          access_token: accessToken.trim() || null,
          metadata: {
            app_id: appId.trim() || null,
            app_secret: appSecret.trim() || null,
          },
          status: 'pending_verification',
          is_manual: false,
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 TikTok Ads 계정입니다')
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
      console.error('TikTok Ads connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setAccountName('')
    setAdvertiserId('')
    setAppId('')
    setAppSecret('')
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
                  <svg viewBox="0 0 24 24" className="w-4 h-4">
                    <path fill="#25F4EE" d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 004.3 1.38V7.3s-1.88.09-3.24-1.48z"/>
                    <path fill="#FE2C55" d="M17.6 6.82s.51.5 0 0A4.278 4.278 0 0116.54 4h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48v-3.16c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7v-5.29a7.35 7.35 0 004.3 1.38V8.3s-1.88.09-3.24-1.48z"/>
                    <path fill="white" d="M17.1 6.32s.51.5 0 0A4.278 4.278 0 0116.04 3.5h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V10.16c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V10.51a7.35 7.35 0 004.3 1.38V8.8s-1.88.09-3.24-1.48z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">TikTok Ads 연동</h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">TikTok Marketing API 정보를 입력하세요</p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                <p className="text-sm font-medium text-white mb-2">API 설정 방법</p>
                <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                  <li>
                    <a
                      href="https://ads.tiktok.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      TikTok Ads Manager
                    </a> 접속 → 로그인
                  </li>
                  <li>광고 계정 → 설정에서 광고주 ID 확인</li>
                  <li>
                    <a
                      href="https://business-api.tiktok.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      TikTok Marketing API
                    </a>에서 앱 생성
                  </li>
                  <li>App ID, Secret, Access Token 발급</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">계정 별칭 *</label>
                <input
                  type="text"
                  placeholder="예: 내 TikTok Ads 계정"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">셀러포트에서 구분하기 위한 이름입니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">광고주 ID (Advertiser ID) *</label>
                <input
                  type="text"
                  placeholder="예: 7123456789012345678"
                  value={advertiserId}
                  onChange={(e) => setAdvertiserId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">TikTok Ads Manager 설정에서 확인 가능합니다</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">App ID (선택)</label>
                  <input
                    type="text"
                    placeholder="Marketing API App ID"
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">App Secret (선택)</label>
                  <input
                    type="password"
                    placeholder="App Secret"
                    value={appSecret}
                    onChange={(e) => setAppSecret(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Access Token (선택)</label>
                <input
                  type="password"
                  placeholder="Long-term Access Token"
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
                  <li>- 쇼트폼 광고 성과 데이터</li>
                  <li>- MZ 타겟 분석</li>
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
                disabled={loading || !accountName.trim() || !advertiserId.trim()}
                className="px-4 py-2 rounded-xl bg-black hover:bg-gray-800 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
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
