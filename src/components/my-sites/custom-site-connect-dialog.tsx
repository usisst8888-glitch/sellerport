'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CustomSiteConnectDialogProps {
  children: React.ReactNode
  siteType: 'cafe24' | 'imweb' | 'godo' | 'makeshop' | 'custom'
  siteName: string
  siteDescription: string
  onSuccess?: () => void
}

const siteConfigs = {
  cafe24: {
    name: '카페24',
    color: '#1A1A1A',
    urlPlaceholder: 'mystore.cafe24.com',
    urlHint: '카페24 쇼핑몰 도메인을 입력하세요',
    guideSteps: [
      '카페24 관리자 접속',
      '디자인 → 디자인 편집에서 head 영역 편집',
      '추적 스크립트 붙여넣기 → 저장',
    ],
  },
  imweb: {
    name: '아임웹',
    color: '#6366F1',
    urlPlaceholder: 'mystore.imweb.me',
    urlHint: '아임웹 쇼핑몰 도메인을 입력하세요',
    guideSteps: [
      '아임웹 관리자 접속',
      '환경설정 → 기본 설정 → 스크립트/메타태그',
      '헤드 스크립트에 추적 코드 붙여넣기',
    ],
  },
  godo: {
    name: '고도몰',
    color: '#FF6B35',
    urlPlaceholder: 'mystore.godomall.com',
    urlHint: '고도몰 쇼핑몰 도메인을 입력하세요',
    guideSteps: [
      '고도몰 관리자 접속',
      '디자인 → 디자인 설정 → 공통 레이아웃',
      '헤더 영역에 추적 스크립트 추가',
    ],
  },
  makeshop: {
    name: '메이크샵',
    color: '#E91E63',
    urlPlaceholder: 'mystore.makeshop.co.kr',
    urlHint: '메이크샵 쇼핑몰 도메인을 입력하세요',
    guideSteps: [
      '메이크샵 관리자 접속',
      '디자인 → 디자인 편집',
      '공통 레이아웃의 head 영역에 스크립트 추가',
    ],
  },
  custom: {
    name: '일반 웹사이트',
    color: '#10B981',
    urlPlaceholder: 'example.com',
    urlHint: '웹사이트 주소를 입력하세요 (예: mysite.com)',
    guideSteps: [
      '웹사이트 관리자 페이지 또는 HTML 파일 접속',
      '모든 페이지에 적용되는 <head> 태그 찾기',
      '추적 스크립트 붙여넣기 후 저장/배포',
    ],
  },
}

export function CustomSiteConnectDialog({
  children,
  siteType,
  siteName: propSiteName,
  siteDescription,
  onSuccess
}: CustomSiteConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'script'>('form')

  const [siteName, setSiteName] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [createdSiteId, setCreatedSiteId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [copiedScript, setCopiedScript] = useState(false)

  const config = siteConfigs[siteType]

  const handleConnect = async () => {
    if (!siteName.trim() || !siteUrl.trim()) {
      setError('모든 필드를 입력해주세요')
      return
    }

    // URL 형식 검증
    let formattedUrl = siteUrl.trim()
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl
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

      setUserId(user.id)

      // 사이트 정보 저장
      const { data, error: insertError } = await supabase
        .from('my_sites')
        .insert({
          user_id: user.id,
          site_type: siteType,
          site_name: siteName.trim(),
          store_id: formattedUrl,
          status: 'pending_script', // 스크립트 설치 대기
        })
        .select()
        .single()

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 사이트입니다')
        } else {
          setError('연동 중 오류가 발생했습니다')
        }
        setLoading(false)
        return
      }

      // 스크립트 안내 단계로 이동
      setCreatedSiteId(data.id)
      setStep('script')

    } catch (err) {
      console.error('Site connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const getTrackingScript = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sellerport.app'
    return `<!-- SellerPort 전환 추적 코드 -->
<script>
(function() {
  var sp = document.createElement('script');
  sp.type = 'text/javascript';
  sp.async = true;
  sp.src = '${baseUrl}/tracking.js';
  sp.setAttribute('data-user-id', '${userId || 'YOUR_USER_ID'}');
  sp.setAttribute('data-site-id', '${createdSiteId || 'SITE_ID'}');
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(sp, s);
})();
</script>
<!-- End SellerPort 추적 코드 -->`
  }

  const handleCopyScript = () => {
    navigator.clipboard.writeText(getTrackingScript())
    setCopiedScript(true)
    setTimeout(() => setCopiedScript(false), 2000)
  }

  const handleComplete = async () => {
    // 상태를 connected로 업데이트
    if (createdSiteId) {
      const supabase = createClient()
      await supabase
        .from('my_sites')
        .update({ status: 'connected' })
        .eq('id', createdSiteId)
    }

    setOpen(false)
    resetForm()
    onSuccess?.()
  }

  const resetForm = () => {
    setSiteName('')
    setSiteUrl('')
    setError('')
    setStep('form')
    setCreatedSiteId(null)
    setCopiedScript(false)
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
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: config.color }}
                >
                  {config.name.charAt(0)}
                </div>
                <h3 className="text-lg font-semibold text-white">{propSiteName} 연동</h3>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                {step === 'form' ? siteDescription : '추적 스크립트를 사이트에 설치하세요'}
              </p>
            </div>

            {step === 'form' ? (
              <>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  {/* 연동 안내 */}
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                    <p className="text-sm font-medium text-white mb-2">연동 방법</p>
                    <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
                      <li>사이트 정보 입력</li>
                      <li>추적 스크립트 복사</li>
                      <li>쇼핑몰 관리자에서 스크립트 설치</li>
                    </ol>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">사이트 별칭 *</label>
                    <input
                      type="text"
                      placeholder={siteType === 'custom' ? '예: 내 회사 홈페이지' : `예: 내 ${config.name} 쇼핑몰`}
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-slate-500 mt-1">셀러포트에서 구분하기 위한 이름입니다</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">사이트 주소 *</label>
                    <input
                      type="text"
                      placeholder={config.urlPlaceholder}
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-slate-500 mt-1">{config.urlHint}</p>
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
                      <li>- 광고 클릭 → {siteType === 'custom' ? '전환(회원가입, 구매 등)' : '구매 전환'} 추적</li>
                      <li>- ROAS (광고비 대비 매출) 계산</li>
                      <li>- 광고 채널별 성과 분석</li>
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
                    disabled={loading || !siteName.trim() || !siteUrl.trim()}
                    className="px-4 py-2 rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: config.color }}
                  >
                    {loading ? '처리 중...' : '다음'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  {/* 스크립트 설치 가이드 */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm font-medium text-amber-400 mb-2">{config.name} 스크립트 설치 방법</p>
                    <ol className="text-sm text-amber-300 space-y-1 list-decimal list-inside">
                      {config.guideSteps.map((guideStep, i) => (
                        <li key={i}>{guideStep}</li>
                      ))}
                    </ol>
                  </div>

                  {/* 스크립트 코드 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-300">추적 스크립트</label>
                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className="px-3 py-1 text-xs rounded-lg border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
                      >
                        {copiedScript ? '복사됨 ✓' : '복사하기'}
                      </button>
                    </div>
                    <div className="p-3 bg-slate-950 rounded-xl overflow-x-auto border border-white/5">
                      <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono">
                        {getTrackingScript()}
                      </pre>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      위 코드를 쇼핑몰의 모든 페이지에 적용되는 head 영역에 붙여넣으세요
                    </p>
                  </div>

                  {/* 전환 추적 안내 */}
                  <div className="p-3 rounded-xl bg-slate-900/50">
                    <p className="text-xs text-slate-400 font-medium mb-2">구매 전환 추적 (선택)</p>
                    <p className="text-xs text-slate-500 mb-2">
                      주문 완료 페이지에 아래 코드를 추가하면 구매 전환을 추적할 수 있습니다:
                    </p>
                    <code className="text-xs bg-slate-800 px-2 py-1 rounded block text-blue-400">
                      {`window.sellerport?.track('conversion', { orderId: '주문번호', amount: 50000 });`}
                    </code>
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 flex gap-3 justify-end flex-shrink-0">
                  <button
                    onClick={() => setStep('form')}
                    className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    이전
                  </button>
                  <button
                    onClick={handleComplete}
                    className="px-4 py-2 rounded-xl text-white font-medium transition-colors"
                    style={{ backgroundColor: config.color }}
                  >
                    완료
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
