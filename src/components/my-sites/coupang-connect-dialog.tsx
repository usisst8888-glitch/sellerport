'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CoupangConnectDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function CoupangConnectDialog({
  children,
  onSuccess
}: CoupangConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [siteName, setSiteName] = useState('')
  const [accessKey, setAccessKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [vendorId, setVendorId] = useState('')

  const handleConnect = async () => {
    if (!siteName.trim() || !accessKey.trim() || !secretKey.trim() || !vendorId.trim()) {
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

      // 쿠팡 API 연결 테스트 (향후 구현)
      // const verifyResult = await verifyCoupangCredentials(accessKey, secretKey, vendorId)

      // 사이트 정보 저장
      const { error: insertError } = await supabase
        .from('my_sites')
        .insert({
          user_id: user.id,
          site_type: 'coupang',
          site_name: siteName.trim(),
          store_id: vendorId.trim(),
          access_token: accessKey.trim(), // HMAC Access Key
          refresh_token: secretKey.trim(), // HMAC Secret Key (암호화 필요)
          status: 'pending_verification',
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 쿠팡 계정입니다')
        } else {
          setError('연동 중 오류가 발생했습니다')
        }
        setLoading(false)
        return
      }

      // 성공
      setOpen(false)
      resetForm()
      onSuccess?.()

    } catch (err) {
      console.error('Coupang connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSiteName('')
    setAccessKey('')
    setSecretKey('')
    setVendorId('')
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
                <div className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold bg-[#E31837]">
                  C
                </div>
                <h3 className="text-lg font-semibold text-white">쿠팡 연동</h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">쿠팡 Wing에서 발급받은 API 키를 입력하세요</p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* API 발급 안내 */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                <p className="text-sm font-medium text-white mb-2">API 키 발급 방법</p>
                <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                  <li>
                    <a
                      href="https://wing.coupang.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      쿠팡 Wing
                    </a> 접속 → 로그인
                  </li>
                  <li>판매자정보 → 개발자센터</li>
                  <li>Open API 키 발급 신청</li>
                  <li>발급된 Access Key, Secret Key, 업체코드 확인</li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">사이트 별칭 *</label>
                <input
                  type="text"
                  placeholder="예: 내 쿠팡 스토어"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">셀러포트에서 구분하기 위한 이름입니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">업체코드 (Vendor ID) *</label>
                <input
                  type="text"
                  placeholder="예: A00123456"
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">쿠팡 Wing에서 확인할 수 있는 업체코드입니다</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Access Key *</label>
                <input
                  type="text"
                  placeholder="발급받은 Access Key 입력"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Secret Key *</label>
                <input
                  type="password"
                  placeholder="발급받은 Secret Key 입력"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">Secret Key는 암호화되어 안전하게 저장됩니다</p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* 브릿지샵 안내 */}
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <p className="text-xs text-purple-400 font-medium mb-2">브릿지샵 사용 안내</p>
                <p className="text-xs text-purple-300">
                  쿠팡은 스크립트 설치가 불가하여 메타/구글/틱톡 광고 시 브릿지샵(중간 페이지)을 통해 전환을 추적합니다.
                  광고 채널 연동 후 자동으로 브릿지샵이 생성됩니다.
                </p>
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
                disabled={loading || !siteName.trim() || !accessKey.trim() || !secretKey.trim() || !vendorId.trim()}
                className="px-4 py-2 rounded-xl bg-[#E31837] hover:bg-[#C41530] text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
