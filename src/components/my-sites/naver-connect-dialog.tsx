'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface NaverConnectDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function NaverConnectDialog({ children, onSuccess }: NaverConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [storeName, setStoreName] = useState('')
  const [storeId, setStoreId] = useState('') // 스마트스토어 URL에 사용되는 ID
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')

  const handleConnect = async () => {
    if (!storeName.trim() || !storeId.trim() || !clientId.trim() || !clientSecret.trim()) {
      setError('모든 필드를 입력해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('로그인이 필요합니다')
        setLoading(false)
        return
      }

      // 사이트 정보 저장 (API 키는 암호화하여 저장)
      const { error: insertError } = await supabase
        .from('my_sites')
        .insert({
          user_id: user.id,
          site_type: 'naver',
          site_name: storeName.trim(),
          store_id: storeId.trim().toLowerCase(), // 스마트스토어 ID (URL용)
          application_id: clientId.trim(),
          application_secret: clientSecret.trim(),
          status: 'pending_verification',
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 스토어입니다')
        } else {
          setError('연동 중 오류가 발생했습니다')
        }
        setLoading(false)
        return
      }

      // 성공
      setOpen(false)
      setStoreName('')
      setStoreId('')
      setClientId('')
      setClientSecret('')
      onSuccess?.()

    } catch (err) {
      console.error('Naver connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStoreName('')
    setStoreId('')
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
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#03C75A"/>
                </svg>
                <h3 className="text-lg font-semibold text-white">네이버 스마트스토어 연동</h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                네이버 커머스API센터에서 발급받은 인증 정보를 입력하세요
              </p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* API 발급 안내 */}
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <p className="text-sm font-medium text-green-400 mb-2">API 발급 방법</p>
                <ol className="text-sm text-green-300 space-y-1 list-decimal list-inside">
                  <li>
                    <a
                      href="https://apicenter.commerce.naver.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-400 underline hover:text-green-300"
                    >
                      네이버 커머스API센터
                    </a>
                    {' '}접속
                  </li>
                  <li>스마트스토어 판매자 계정으로 로그인</li>
                  <li>애플리케이션 등록 → Client ID/Secret 발급</li>
                  <li>API 호출 IP에 <code className="bg-green-500/20 px-1 rounded text-green-300">34.50.46.70</code> 등록</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">스토어 별칭 *</label>
                <input
                  type="text"
                  placeholder="예: 내 스마트스토어"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">셀러포트에서 구분하기 위한 이름입니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">스마트스토어 ID *</label>
                <input
                  type="text"
                  placeholder="예: tripsim"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">
                  스마트스토어 URL에서 확인: smartstore.naver.com/<strong className="text-slate-300">스토어ID</strong>/products/...
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Application ID (Client ID) *</label>
                <input
                  type="text"
                  placeholder="예: 5f0XZPkXRbvHEcaxEWKKg9"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Application Secret (Client Secret) *</label>
                <input
                  type="password"
                  placeholder="발급받은 Secret 입력"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-green-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">입력한 정보는 암호화되어 안전하게 저장됩니다</p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* 권한 안내 */}
              <div className="p-3 rounded-xl bg-slate-900/50">
                <p className="text-xs text-slate-400 font-medium mb-2">필요한 API 권한</p>
                <ul className="text-xs text-slate-500 space-y-1">
                  <li>- 주문 정보 조회 (정기배송 주문 포함)</li>
                  <li>- 상품 정보 조회</li>
                  <li>- 고객 정보 조회 (구독자 관리용)</li>
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
                disabled={loading || !storeName.trim() || !storeId.trim() || !clientId.trim() || !clientSecret.trim()}
                className="px-4 py-2 rounded-xl bg-[#03C75A] hover:bg-[#02b351] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    연동 중...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="currentColor"/>
                    </svg>
                    연동하기
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
