'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { DialogFooter } from './dialog-footer'

interface CustomSiteConnectDialogProps {
  children?: React.ReactNode
  siteType: 'cafe24' | 'imweb' | 'godo' | 'makeshop' | 'custom'
  siteName: string
  siteDescription: string
  conversionType?: 'shopping' | 'signup' | 'db' | 'call' // 전환 목적
  onSuccess?: () => void
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const siteConfigs = {
  cafe24: {
    name: '카페24',
    logo: '/site_logo/cafe24.png',
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
    logo: '/site_logo/imweb.png',
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
    logo: '/site_logo/godo.png',
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
    logo: '/site_logo/makeshop.png',
    urlPlaceholder: 'mystore.makeshop.co.kr',
    urlHint: '메이크샵 쇼핑몰 도메인을 입력하세요',
    guideSteps: [
      '메이크샵 관리자 접속',
      '디자인 → 디자인 편집',
      '공통 레이아웃의 head 영역에 스크립트 추가',
    ],
  },
  custom: {
    name: '일반 웹사이트/블로그',
    logo: '/site_logo/own_site.png',
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
  conversionType = 'shopping',
  onSuccess,
  isOpen: externalIsOpen,
  onOpenChange
}: CustomSiteConnectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // 외부에서 제어하는 경우 externalIsOpen 사용, 아니면 내부 상태 사용
  const open = externalIsOpen !== undefined ? externalIsOpen : internalOpen
  const setOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value)
    } else {
      setInternalOpen(value)
    }
  }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'script'>('form')

  const [siteName, setSiteName] = useState('')
  const [siteUrl, setSiteUrl] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [createdSiteId, setCreatedSiteId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [copiedScript, setCopiedScript] = useState(false)
  const [copiedEventCode, setCopiedEventCode] = useState(false)

  const config = siteConfigs[siteType]

  // 전화번호 포맷팅 (숫자만 추출 후 하이픈 추가)
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  const handleConnect = async () => {
    const isCallTracking = conversionType === 'call'

    if (isCallTracking) {
      if (!siteName.trim() || !phoneNumber.trim()) {
        setError('모든 필드를 입력해주세요')
        return
      }
      // 전화번호 형식 검증 (최소 9자리 숫자)
      const phoneDigits = phoneNumber.replace(/[^\d]/g, '')
      if (phoneDigits.length < 9) {
        setError('올바른 전화번호를 입력해주세요')
        return
      }
    } else {
      if (!siteName.trim() || !siteUrl.trim()) {
        setError('모든 필드를 입력해주세요')
        return
      }
    }

    // URL 형식 검증 (전화 추적이 아닌 경우에만)
    let formattedUrl = ''
    if (!isCallTracking) {
      formattedUrl = siteUrl.trim()
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl
      }
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
      const isCallTracking = conversionType === 'call'
      const { data, error: insertError } = await supabase
        .from('my_sites')
        .insert({
          user_id: user.id,
          site_type: isCallTracking ? 'call' : siteType, // 전화 추적은 'call' 타입으로 저장
          site_name: siteName.trim(),
          store_id: isCallTracking ? phoneNumber.replace(/[^\d]/g, '') : formattedUrl, // 전화 추적 시 전화번호 저장
          status: isCallTracking ? 'connected' : 'pending_script', // 전화 추적은 스크립트 불필요
          metadata: isCallTracking ? { phone_number: phoneNumber, conversion_type: 'call' } : { conversion_type: conversionType },
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

      // 전화 추적의 경우 바로 완료, 그 외에는 스크립트 안내 단계로 이동
      setCreatedSiteId(data.id)
      if (conversionType === 'call') {
        // 전화 추적은 스크립트 설치가 필요없으므로 바로 완료
        setOpen(false)
        resetForm()
        onSuccess?.()
      } else {
        setStep('script')
      }

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

  // 전환 목적별 이벤트 코드 생성
  const getEventCode = () => {
    switch (conversionType) {
      case 'signup':
        return `// 회원가입 완료 시 호출
window.sellerport?.track('signup', {
  userId: '신규회원ID',      // 선택: 회원 고유 ID
  email: 'user@email.com'   // 선택: 회원 이메일
});`
      case 'db':
        return `// DB 수집(상담신청/문의) 완료 시 호출
window.sellerport?.track('lead', {
  formId: '폼ID',           // 선택: 폼 구분용 ID
  formName: '상담신청'       // 선택: 폼 이름
});`
      default: // shopping
        return `// 구매 완료 시 호출
window.sellerport?.track('conversion', {
  orderId: '주문번호',       // 필수: 주문 고유번호
  amount: 50000             // 필수: 결제금액
});`
    }
  }

  const getEventCodeLabel = () => {
    switch (conversionType) {
      case 'signup':
        return '회원가입 전환 추적 코드'
      case 'db':
        return 'DB 수집 전환 추적 코드'
      default:
        return '구매 전환 추적 코드'
    }
  }

  const getEventCodeDescription = () => {
    switch (conversionType) {
      case 'signup':
        return '회원가입 완료 페이지 또는 회원가입 성공 시점에 아래 코드를 호출하세요'
      case 'db':
        return '상담신청/문의 폼 제출 완료 시점에 아래 코드를 호출하세요'
      default:
        return '주문 완료 페이지에 아래 코드를 추가하면 구매 전환을 추적할 수 있습니다'
    }
  }

  const handleCopyEventCode = () => {
    navigator.clipboard.writeText(getEventCode())
    setCopiedEventCode(true)
    setTimeout(() => setCopiedEventCode(false), 2000)
  }

  const handleComplete = async () => {
    // pending_script 상태 유지 - 동기화 버튼으로 추적 코드 확인 후 connected로 변경됨
    setOpen(false)
    resetForm()
    onSuccess?.()
  }

  const resetForm = () => {
    setSiteName('')
    setSiteUrl('')
    setPhoneNumber('')
    setError('')
    setStep('form')
    setCreatedSiteId(null)
    setCopiedScript(false)
  }

  return (
    <>
      {children && (
        <div onClick={() => setOpen(true)}>
          {children}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Image
                  src={config.logo}
                  alt={config.name}
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">{propSiteName} 연동</h3>
                  <p className="text-sm text-slate-400">
                    {step === 'form' ? siteDescription : '추적 스크립트를 사이트에 설치하세요'}
                  </p>
                </div>
              </div>
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

                  {conversionType === 'call' ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">전화번호 *</label>
                      <input
                        type="tel"
                        placeholder="010-1234-5678"
                        value={phoneNumber}
                        onChange={handlePhoneChange}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                      />
                      <p className="text-xs text-slate-500 mt-1">전환 추적에 사용할 전화번호를 입력하세요</p>
                    </div>
                  ) : (
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
                  )}

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

                <DialogFooter
                  onCancel={() => {
                    setOpen(false)
                    resetForm()
                  }}
                  onSubmit={handleConnect}
                  loading={loading}
                  disabled={!siteName.trim() || (conversionType === 'call' ? !phoneNumber.trim() : !siteUrl.trim())}
                  guideUrl={`/guide?tab=mysites&expand=${
                    siteType === 'custom'
                      ? conversionType === 'db'
                        ? 'custom-db'
                        : conversionType === 'signup'
                        ? 'custom-signup'
                        : conversionType === 'call'
                        ? 'custom-call'
                        : 'custom-shopping'
                      : siteType
                  }`}
                />
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

                  {/* 이벤트 전환 추적 코드 */}
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-amber-400">{getEventCodeLabel()} (필수)</p>
                      <button
                        type="button"
                        onClick={handleCopyEventCode}
                        className="px-3 py-1 text-xs rounded-lg border border-amber-500/30 text-amber-300 hover:bg-amber-500/10 transition-colors"
                      >
                        {copiedEventCode ? '복사됨 ✓' : '복사하기'}
                      </button>
                    </div>
                    <p className="text-xs text-amber-300/80 mb-3">
                      {getEventCodeDescription()}
                    </p>
                    <div className="p-3 bg-slate-950 rounded-lg overflow-x-auto border border-white/5">
                      <pre className="text-xs text-blue-400 whitespace-pre-wrap font-mono">
                        {getEventCode()}
                      </pre>
                    </div>
                  </div>
                </div>

                <DialogFooter
                  onCancel={() => setStep('form')}
                  onSubmit={handleComplete}
                  cancelText="뒤로"
                  submitText="완료"
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
