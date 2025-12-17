'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { NaverConnectDialog } from '@/components/my-sites/naver-connect-dialog'
import { Cafe24ConnectDialog } from '@/components/my-sites/cafe24-connect-dialog'
import { ImwebConnectDialog } from '@/components/my-sites/imweb-connect-dialog'
import { CustomSiteConnectDialog } from '@/components/my-sites/custom-site-connect-dialog'
import { createClient } from '@/lib/supabase/client'

interface MySite {
  id: string
  site_type: string
  site_name: string
  status: string
  last_sync_at: string | null
  created_at: string
}

// 로딩 상태 타입
interface LoadingState {
  [key: string]: {
    verifying?: boolean
    syncing?: boolean
  }
}

// 사이트 로고 경로 매핑
const siteLogos: Record<string, string> = {
  naver: '/site_logo/smartstore.png',
  cafe24: '/site_logo/cafe24.png',
  imweb: '/site_logo/imweb.png',
  custom: '/site_logo/own_site.png',
}

// 쇼핑 추적 사이트
const shoppingSites = [
  {
    id: 'naver',
    name: '네이버 스마트스토어',
    description: '커머스 API 인증',
    status: 'available',
    needsBridgeShop: true,
  },
  {
    id: 'cafe24',
    name: '카페24',
    description: '쇼핑몰 솔루션',
    status: 'available',
    needsBridgeShop: false,
  },
  {
    id: 'imweb',
    name: '아임웹',
    description: '쇼핑몰 솔루션',
    status: 'available',
    needsBridgeShop: false,
  },
  {
    id: 'custom',
    name: '자체 제작 쇼핑몰',
    description: '직접 개발한 쇼핑몰',
    status: 'available',
    needsBridgeShop: false,
  },
]

// 회원가입 추적 사이트
const signupSites = [
  {
    id: 'imweb',
    name: '아임웹',
    description: '회원가입 폼 추적',
    status: 'available',
  },
  {
    id: 'custom',
    name: '일반 웹사이트',
    description: '자체 제작 사이트',
    status: 'available',
  },
]

// DB 추적 사이트
const dbSites = [
  {
    id: 'imweb',
    name: '아임웹',
    description: 'DB 수집 폼 추적',
    status: 'available',
  },
  {
    id: 'custom',
    name: '일반 웹사이트',
    description: '자체 제작 사이트',
    status: 'available',
  },
]

export default function MySitesPage() {
  const searchParams = useSearchParams()
  const fromQuickStart = searchParams.get('from') === 'quick-start'

  const [connectedSites, setConnectedSites] = useState<MySite[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStates, setLoadingStates] = useState<LoadingState>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showTrackingCode, setShowTrackingCode] = useState(false)
  const [showSignupCode, setShowSignupCode] = useState(false)
  const [showDbCode, setShowDbCode] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedSignupCode, setCopiedSignupCode] = useState(false)
  const [copiedDbCode, setCopiedDbCode] = useState(false)
  const [copiedSignupEventCode, setCopiedSignupEventCode] = useState(false)
  const [copiedDbEventCode, setCopiedDbEventCode] = useState(false)
  const [showCafe24Dialog, setShowCafe24Dialog] = useState(false)

  const fetchMySites = async () => {
    const supabase = createClient()

    // 사용자 ID 가져오기
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
    }

    const { data } = await supabase
      .from('my_sites')
      .select('*')
      .order('created_at', { ascending: false })

    setConnectedSites(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMySites()
  }, [])

  // 메시지 3초 후 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // 추적 코드 생성
  const getTrackingCode = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://sellerport.app'
    return `<!-- SellerPort 전환 추적 코드 -->
<script>
(function() {
  var sp = document.createElement('script');
  sp.type = 'text/javascript';
  sp.async = true;
  sp.src = '${baseUrl}/tracking.js';
  sp.setAttribute('data-user-id', '${userId || 'YOUR_USER_ID'}');
  var s = document.getElementsByTagName('script')[0];
  s.parentNode.insertBefore(sp, s);
})();
</script>
<!-- End SellerPort 추적 코드 -->`
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getTrackingCode())
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  // 회원가입 이벤트 코드
  const getSignupEventCode = () => {
    return `// 회원가입 완료 시 호출
window.sellerport?.track('signup', {
  userId: '신규회원ID',      // 선택: 회원 고유 ID
  email: 'user@email.com'   // 선택: 회원 이메일
});`
  }

  // DB 수집 이벤트 코드
  const getDbEventCode = () => {
    return `// DB 수집(상담신청/문의) 완료 시 호출
window.sellerport?.track('lead', {
  formId: '폼ID',           // 선택: 폼 구분용 ID
  formName: '상담신청'       // 선택: 폼 이름
});`
  }

  const handleCopySignupCode = () => {
    navigator.clipboard.writeText(getTrackingCode())
    setCopiedSignupCode(true)
    setTimeout(() => setCopiedSignupCode(false), 2000)
  }

  const handleCopyDbCode = () => {
    navigator.clipboard.writeText(getTrackingCode())
    setCopiedDbCode(true)
    setTimeout(() => setCopiedDbCode(false), 2000)
  }

  const handleCopySignupEventCode = () => {
    navigator.clipboard.writeText(getSignupEventCode())
    setCopiedSignupEventCode(true)
    setTimeout(() => setCopiedSignupEventCode(false), 2000)
  }

  const handleCopyDbEventCode = () => {
    navigator.clipboard.writeText(getDbEventCode())
    setCopiedDbEventCode(true)
    setTimeout(() => setCopiedDbEventCode(false), 2000)
  }

  // 연동 검증
  const handleVerify = async (siteId: string) => {
    setLoadingStates(prev => ({ ...prev, [siteId]: { ...prev[siteId], verifying: true } }))
    setMessage(null)

    try {
      const response = await fetch('/api/naver/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        fetchMySites()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: '검증 중 오류가 발생했습니다' })
    } finally {
      setLoadingStates(prev => ({ ...prev, [siteId]: { ...prev[siteId], verifying: false } }))
    }
  }

  // 데이터 동기화
  const handleSync = async (siteId: string) => {
    setLoadingStates(prev => ({ ...prev, [siteId]: { ...prev[siteId], syncing: true } }))
    setMessage(null)

    // 해당 사이트 정보 가져오기
    const site = connectedSites.find(s => s.id === siteId)
    const shoppingSiteTypes = ['naver', 'cafe24', 'imweb', 'godo', 'makeshop']
    const isShoppingSite = site?.site_type && shoppingSiteTypes.includes(site.site_type)

    try {
      // 사이트 타입별 동기화 API 선택
      let apiUrl = '/api/sites/verify'
      if (site?.site_type === 'naver') {
        apiUrl = '/api/naver/sync'
      } else if (site?.site_type === 'cafe24') {
        apiUrl = '/api/cafe24/sync'
      } else if (isShoppingSite) {
        apiUrl = '/api/naver/sync' // 기타 쇼핑몰은 네이버 API 사용 (임시)
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId, syncType: 'all' })
      })

      const result = await response.json()

      if (result.success) {
        // 사이트 타입에 따라 메시지 다르게 표시
        if (isShoppingSite && result.results?.products && result.results?.orders) {
          // 쇼핑 추적: 상품/주문 개수 표시
          setMessage({
            type: 'success',
            text: `동기화 완료: 상품 ${result.results.products.synced}개, 주문 ${result.results.orders.synced}개`
          })
        } else if (!isShoppingSite) {
          // 회원가입/DB 추적: 추적 코드 검증 결과 표시
          if (result.verified) {
            setMessage({
              type: 'success',
              text: '추적 코드가 정상적으로 설치되어 있습니다'
            })
          } else {
            setMessage({
              type: 'error',
              text: result.message || '추적 코드가 감지되지 않았습니다. 설치를 확인해주세요.'
            })
          }
        } else {
          setMessage({ type: 'success', text: '동기화 완료' })
        }
        fetchMySites()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: '동기화 중 오류가 발생했습니다' })
    } finally {
      setLoadingStates(prev => ({ ...prev, [siteId]: { ...prev[siteId], syncing: false } }))
    }
  }

  const handleDisconnect = async (siteId: string) => {
    if (!confirm('정말 연동을 해제하시겠습니까?')) return

    const supabase = createClient()
    await supabase
      .from('my_sites')
      .delete()
      .eq('id', siteId)

    fetchMySites()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">연동됨</span>
      case 'error':
        return <span className="px-2 py-1 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">오류</span>
      case 'expired':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">만료됨</span>
      case 'pending_verification':
        return <span className="px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full">검증 필요</span>
      case 'pending_script':
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-400 rounded-full">연동중</span>
    }
  }

  const getSiteLogo = (type: string) => {
    const logoPath = siteLogos[type]
    if (logoPath) {
      return <Image src={logoPath} alt={type} width={32} height={32} className="rounded-lg" />
    }
    return <span className="text-2xl">🔗</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">내 사이트 연동</h1>
          <p className="text-slate-400 mt-1">판매 사이트를 연동하여 상품과 주문을 관리하세요</p>
        </div>
      </div>

      {/* 빠른 시작 안내 배너 */}
      {fromQuickStart && connectedSites.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">사이트 연동 완료!</p>
                <p className="text-sm text-slate-300">다음 단계로 넘어가세요</p>
              </div>
            </div>
            <Link
              href="/quick-start"
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              빠른 시작으로 돌아가기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* 메시지 표시 */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        </div>
      )}

      {/* 연동된 사이트 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-1">연동된 사이트</h2>
        <p className="text-sm text-slate-400 mb-5">
          {connectedSites.length > 0
            ? `${connectedSites.length}개의 사이트가 연동되어 있습니다`
            : '현재 연동된 사이트가 없습니다'}
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : connectedSites.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {connectedSites.map((site) => (
                <div
                  key={site.id}
                  className="p-4 bg-slate-700/50 border border-slate-600 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSiteLogo(site.site_type)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-white">{site.site_name}</h3>
                          {getStatusBadge(site.status)}
                        </div>
                        <p className="text-sm text-slate-400">
                          {site.last_sync_at
                            ? `마지막 동기화: ${new Date(site.last_sync_at).toLocaleString('ko-KR')}`
                            : '아직 동기화되지 않음'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {site.status === 'pending_verification' ? (
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-400 text-black font-medium"
                          onClick={() => handleVerify(site.id)}
                          disabled={loadingStates[site.id]?.verifying}
                        >
                          {loadingStates[site.id]?.verifying ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              검증 중...
                            </>
                          ) : '검증하기'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-500 text-white font-medium"
                          onClick={() => handleSync(site.id)}
                          disabled={loadingStates[site.id]?.syncing || !['connected', 'pending_script'].includes(site.status)}
                        >
                          {loadingStates[site.id]?.syncing ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-3 w-3" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              동기화 중...
                            </>
                          ) : '동기화'}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                        onClick={() => handleDisconnect(site.id)}
                      >
                        해제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* 안내 문구 */}
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              상품명, 가격 등 정보가 변경되었을 때 동기화 버튼을 눌러주세요.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg className="w-12 h-12 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-slate-400">아래에서 사이트를 선택하여 연동하세요</p>
          </div>
        )}
      </div>

      {/* 쇼핑 추적 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h2 className="text-lg font-semibold text-white">쇼핑 추적</h2>
          <button
            onClick={() => setShowTrackingCode(!showTrackingCode)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
          >
            {showTrackingCode ? '추적 코드 숨기기' : '추적 코드 설치'}
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          상품 구매 전환을 추적합니다. 광고를 통해 들어온 고객의 구매를 측정할 수 있습니다.
        </p>

        {/* 추적 코드 섹션 */}
        {showTrackingCode && (
          <div className="mb-6 bg-gradient-to-br from-blue-900/30 to-slate-800/40 border border-blue-500/30 rounded-xl p-5 space-y-4">
            {/* 추적 코드 박스 */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-blue-400 font-medium">HTML 추적 코드</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {copiedCode ? (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      복사됨!
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      복사
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono">
                {getTrackingCode()}
              </pre>
            </div>

            {/* 설치 가이드 */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <h4 className="text-sm font-semibold text-white mb-3">설치 방법</h4>
              <ol className="space-y-2 text-sm text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                  <span>위 코드를 복사합니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                  <span>웹사이트의 <code className="px-1 py-0.5 bg-slate-700 rounded text-blue-300">&lt;head&gt;</code> 태그 안에 붙여넣습니다.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                  <span>모든 페이지에 코드가 포함되도록 공통 헤더에 추가하세요.</span>
                </li>
              </ol>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {shoppingSites.map((site) => (
            <div
              key={site.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col"
            >
              <div className="flex flex-col items-center text-center flex-grow">
                <Image src={siteLogos[site.id]} alt={site.name} width={48} height={48} className="rounded-lg mb-3" />
                <h3 className="font-semibold text-white">{site.name}</h3>
                <p className="text-xs text-slate-400 mb-2">{site.description}</p>
                {site.needsBridgeShop && (
                  <span className="px-2 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded-full">브릿지샵 사용, 추적코드 설치 X</span>
                )}
              </div>
              <div className="mt-3">
                {site.status === 'available' ? (
                  site.id === 'naver' ? (
                    <NaverConnectDialog onSuccess={fetchMySites}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" size="sm">연동하기</Button>
                    </NaverConnectDialog>
                  ) : site.id === 'cafe24' ? (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                      size="sm"
                      onClick={() => setShowCafe24Dialog(true)}
                    >
                      연동하기
                    </Button>
                  ) : site.id === 'imweb' ? (
                    <ImwebConnectDialog onSuccess={fetchMySites}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" size="sm">연동하기</Button>
                    </ImwebConnectDialog>
                  ) : (
                    <CustomSiteConnectDialog
                      siteType={site.id as 'custom'}
                      siteName={site.name}
                      siteDescription={`${site.name} 쇼핑몰을 연동하고 광고 전환을 추적하세요`}
                      onSuccess={fetchMySites}
                    >
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" size="sm">연동하기</Button>
                    </CustomSiteConnectDialog>
                  )
                ) : (
                  <Button className="w-full border-slate-600 text-slate-400" variant="outline" size="sm" disabled>
                    준비 중
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 회원가입 추적 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <h2 className="text-lg font-semibold text-white">회원가입 추적</h2>
          <button
            onClick={() => setShowSignupCode(!showSignupCode)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
          >
            {showSignupCode ? '추적 코드 숨기기' : '추적 코드 설치'}
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          회원가입 전환을 추적합니다. 광고를 통해 유입된 신규 회원을 측정할 수 있습니다.
        </p>

        {/* 회원가입 추적 코드 섹션 */}
        {showSignupCode && (
          <div className="mb-6 bg-gradient-to-br from-emerald-900/30 to-slate-800/40 border border-emerald-500/30 rounded-xl p-5 space-y-4">
            {/* 기본 추적 코드 */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-emerald-400 font-medium">1. 기본 추적 코드 (head 태그에 삽입)</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopySignupCode}
                  className="h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {copiedSignupCode ? (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      복사됨!
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      복사
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono">
                {getTrackingCode()}
              </pre>
            </div>

            {/* 회원가입 이벤트 코드 */}
            <div className="bg-slate-900 rounded-lg p-4 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-medium">2. 회원가입 전환 코드 (필수)</span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-emerald-500/20 text-emerald-400 rounded">필수</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopySignupEventCode}
                  className="h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {copiedSignupEventCode ? (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      복사됨!
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      복사
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono">
                {getSignupEventCode()}
              </pre>
              <p className="text-xs text-slate-500 mt-2">
                회원가입 완료 페이지 또는 회원가입 성공 시점에 위 코드를 호출하세요.
              </p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {signupSites.map((site) => (
            <div
              key={`signup-${site.id}`}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col"
            >
              <div className="flex flex-col items-center text-center flex-grow">
                <Image src={siteLogos[site.id]} alt={site.name} width={48} height={48} className="rounded-lg mb-3" />
                <h3 className="font-semibold text-white">{site.name}</h3>
                <p className="text-xs text-slate-400 mb-2">{site.description}</p>
              </div>
              <div className="mt-3">
                {site.status === 'available' ? (
                  site.id === 'imweb' ? (
                    <ImwebConnectDialog onSuccess={fetchMySites}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" size="sm">연동하기</Button>
                    </ImwebConnectDialog>
                  ) : (
                    <CustomSiteConnectDialog
                      siteType={site.id as 'custom'}
                      siteName={site.name}
                      siteDescription={`${site.name}에서 회원가입 전환을 추적하세요`}
                      conversionType="signup"
                      onSuccess={fetchMySites}
                    >
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" size="sm">연동하기</Button>
                    </CustomSiteConnectDialog>
                  )
                ) : (
                  <Button className="w-full border-slate-600 text-slate-400" variant="outline" size="sm" disabled>
                    준비 중
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DB 추적 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <h2 className="text-lg font-semibold text-white">DB 추적</h2>
          <button
            onClick={() => setShowDbCode(!showDbCode)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
          >
            {showDbCode ? '추적 코드 숨기기' : '추적 코드 설치'}
          </button>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          상담신청, 문의 등 DB 수집 전환을 추적합니다. 리드 획득 효율을 측정할 수 있습니다.
        </p>

        {/* DB 추적 코드 섹션 */}
        {showDbCode && (
          <div className="mb-6 bg-gradient-to-br from-amber-900/30 to-slate-800/40 border border-amber-500/30 rounded-xl p-5 space-y-4">
            {/* 기본 추적 코드 */}
            <div className="bg-slate-900 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-amber-400 font-medium">1. 기본 추적 코드 (head 태그에 삽입)</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyDbCode}
                  className="h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {copiedDbCode ? (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      복사됨!
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      복사
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono">
                {getTrackingCode()}
              </pre>
            </div>

            {/* DB 수집 이벤트 코드 */}
            <div className="bg-slate-900 rounded-lg p-4 border border-amber-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-amber-400 font-medium">2. DB 수집 전환 코드 (필수)</span>
                  <span className="px-1.5 py-0.5 text-[10px] bg-amber-500/20 text-amber-400 rounded">필수</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyDbEventCode}
                  className="h-7 text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  {copiedDbEventCode ? (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      복사됨!
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      복사
                    </>
                  )}
                </Button>
              </div>
              <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono">
                {getDbEventCode()}
              </pre>
              <p className="text-xs text-slate-500 mt-2">
                상담신청/문의 폼 제출 완료 시점에 위 코드를 호출하세요.
              </p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {dbSites.map((site) => (
            <div
              key={`db-${site.id}`}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col"
            >
              <div className="flex flex-col items-center text-center flex-grow">
                <Image src={siteLogos[site.id]} alt={site.name} width={48} height={48} className="rounded-lg mb-3" />
                <h3 className="font-semibold text-white">{site.name}</h3>
                <p className="text-xs text-slate-400 mb-2">{site.description}</p>
              </div>
              <div className="mt-3">
                {site.status === 'available' ? (
                  site.id === 'imweb' ? (
                    <ImwebConnectDialog onSuccess={fetchMySites}>
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" size="sm">연동하기</Button>
                    </ImwebConnectDialog>
                  ) : (
                    <CustomSiteConnectDialog
                      siteType={site.id as 'custom'}
                      siteName={site.name}
                      siteDescription={`${site.name}에서 DB 수집 전환을 추적하세요`}
                      conversionType="db"
                      onSuccess={fetchMySites}
                    >
                      <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white" size="sm">연동하기</Button>
                    </CustomSiteConnectDialog>
                  )
                ) : (
                  <Button className="w-full border-slate-600 text-slate-400" variant="outline" size="sm" disabled>
                    준비 중
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 플랜 안내 */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-300">
              <strong>무료 플랜:</strong> 추적 링크 3개까지 무료
            </p>
            <p className="text-xs text-blue-400/80 mt-1">
              더 많은 추적 링크가 필요하시면 플랜을 업그레이드하세요
            </p>
          </div>
        </div>
      </div>

      {/* 카페24 연동 다이얼로그 */}
      <Cafe24ConnectDialog
        isOpen={showCafe24Dialog}
        onClose={() => setShowCafe24Dialog(false)}
        onSuccess={() => {
          setShowCafe24Dialog(false)
          fetchMySites()
        }}
      />
    </div>
  )
}
