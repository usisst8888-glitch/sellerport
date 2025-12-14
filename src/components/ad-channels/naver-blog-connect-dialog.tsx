'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NaverBlogConnectDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function NaverBlogConnectDialog({
  children,
  onSuccess
}: NaverBlogConnectDialogProps) {
  const [open, setOpen] = useState(false)
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

      // 블로그 URL 포맷팅
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
                <div className="w-6 h-6 rounded flex items-center justify-center bg-[#03C75A]">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white">
                    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">네이버 블로그 연동</h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">네이버 블로그 통계 API로 방문자를 추적합니다</p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* API 설정 안내 */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                <p className="text-sm font-medium text-white mb-2">연동 방법</p>
                <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                  <li>
                    <a
                      href="https://blog.naver.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      네이버 블로그
                    </a> → 관리 → 기본설정에서 블로그 ID 확인
                  </li>
                  <li>
                    <a
                      href="https://developers.naver.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      네이버 개발자센터
                    </a>에서 애플리케이션 등록 (선택)
                  </li>
                  <li>블로그 API 사용 신청 후 Client ID/Secret 발급</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">블로그 별칭 *</label>
                <input
                  type="text"
                  placeholder="예: 내 네이버 블로그"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">셀러포트에서 구분하기 위한 이름입니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">블로그 ID *</label>
                <input
                  type="text"
                  placeholder="예: myblog123"
                  value={blogId}
                  onChange={(e) => setBlogId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">blog.naver.com/[블로그ID] 형태로 확인 가능합니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">블로그 URL (선택)</label>
                <input
                  type="text"
                  placeholder="예: https://blog.naver.com/myblog123"
                  value={blogUrl}
                  onChange={(e) => setBlogUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client ID (선택)</label>
                  <input
                    type="text"
                    placeholder="네이버 API Client ID"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Client Secret (선택)</label>
                  <input
                    type="password"
                    placeholder="네이버 API Client Secret"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
                  />
                </div>
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
                  <li>- 일별 방문자 수 추적</li>
                  <li>- 게시글별 조회수 분석</li>
                  <li>- 검색 유입 키워드 데이터</li>
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
                disabled={loading || !accountName.trim() || !blogId.trim()}
                className="px-4 py-2 rounded-xl bg-[#03C75A] hover:bg-[#02B350] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
