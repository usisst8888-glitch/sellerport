'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { NaverConnectDialog } from '@/components/platforms/naver-connect-dialog'
import { createClient } from '@/lib/supabase/client'

interface Platform {
  id: string
  platform_type: string
  platform_name: string
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

// 플랫폼 로고 컴포넌트
const NaverLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#03C75A"/>
  </svg>
)

const Cafe24Logo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#1A1A1A"/>
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="Arial">C24</text>
  </svg>
)

const ImwebLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#6366F1"/>
    <text x="50" y="65" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial">IM</text>
  </svg>
)

const GodoLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#FF6B35"/>
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">GODO</text>
  </svg>
)

const MakeshopLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#E91E63"/>
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial">MAKE</text>
  </svg>
)

const CoupangLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="20" fill="#E31837"/>
    <path d="M25 50C25 36.2 36.2 25 50 25C58.5 25 66 29.5 70.5 36L62 42C59.5 38 55 35 50 35C41.7 35 35 41.7 35 50C35 58.3 41.7 65 50 65C55 65 59.5 62 62 58L70.5 64C66 70.5 58.5 75 50 75C36.2 75 25 63.8 25 50Z" fill="white"/>
  </svg>
)

const platformConfigs = [
  {
    id: 'naver',
    name: '네이버 스마트스토어',
    description: '커머스 API 인증',
    logo: NaverLogo,
    status: 'available',
  },
  {
    id: 'cafe24',
    name: '카페24',
    description: 'OAuth 2.0 인증',
    logo: Cafe24Logo,
    status: 'coming_soon',
  },
  {
    id: 'imweb',
    name: '아임웹',
    description: 'API Key 인증',
    logo: ImwebLogo,
    status: 'coming_soon',
  },
  {
    id: 'godo',
    name: '고도몰',
    description: 'API Key 인증',
    logo: GodoLogo,
    status: 'coming_soon',
  },
  {
    id: 'makeshop',
    name: '메이크샵',
    description: 'API Key 인증',
    logo: MakeshopLogo,
    status: 'coming_soon',
  },
  {
    id: 'coupang',
    name: '쿠팡',
    description: 'HMAC 인증',
    logo: CoupangLogo,
    status: 'coming_soon',
  },
]

export default function PlatformsPage() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStates, setLoadingStates] = useState<LoadingState>({})
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const fetchPlatforms = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('platforms')
      .select('*')
      .order('created_at', { ascending: false })

    setConnectedPlatforms(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPlatforms()
  }, [])

  // 연동 검증
  const handleVerify = async (platformId: string) => {
    setLoadingStates(prev => ({ ...prev, [platformId]: { ...prev[platformId], verifying: true } }))
    setMessage(null)

    try {
      const response = await fetch('/api/naver/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        fetchPlatforms()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: '검증 중 오류가 발생했습니다' })
    } finally {
      setLoadingStates(prev => ({ ...prev, [platformId]: { ...prev[platformId], verifying: false } }))
    }
  }

  // 데이터 동기화
  const handleSync = async (platformId: string) => {
    setLoadingStates(prev => ({ ...prev, [platformId]: { ...prev[platformId], syncing: true } }))
    setMessage(null)

    try {
      const response = await fetch('/api/naver/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platformId, syncType: 'all' })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({
          type: 'success',
          text: `동기화 완료: 상품 ${result.results.products.synced}개, 주문 ${result.results.orders.synced}개`
        })
        fetchPlatforms()
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: '동기화 중 오류가 발생했습니다' })
    } finally {
      setLoadingStates(prev => ({ ...prev, [platformId]: { ...prev[platformId], syncing: false } }))
    }
  }

  const handleDisconnect = async (platformId: string) => {
    if (!confirm('정말 연동을 해제하시겠습니까?')) return

    const supabase = createClient()
    await supabase
      .from('platforms')
      .delete()
      .eq('id', platformId)

    fetchPlatforms()
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
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-slate-600 text-slate-300 rounded-full">대기중</span>
    }
  }

  const getPlatformLogo = (type: string) => {
    const config = platformConfigs.find(p => p.id === type)
    if (config?.logo) {
      const Logo = config.logo
      return <Logo className="w-8 h-8" />
    }
    return <span className="text-2xl">🔗</span>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">플랫폼 연동</h1>
          <p className="text-slate-400 mt-1">이커머스 플랫폼을 연동하여 상품과 주문을 관리하세요</p>
        </div>
      </div>

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

      {/* 연동된 플랫폼 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-1">연동된 플랫폼</h2>
        <p className="text-sm text-slate-400 mb-5">
          {connectedPlatforms.length > 0
            ? `${connectedPlatforms.length}개의 플랫폼이 연동되어 있습니다`
            : '현재 연동된 플랫폼이 없습니다'}
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : connectedPlatforms.length > 0 ? (
          <div className="space-y-3">
            {connectedPlatforms.map((platform) => (
              <div
                key={platform.id}
                className="flex items-center justify-between p-4 bg-slate-700/50 border border-slate-600 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getPlatformLogo(platform.platform_type)}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-white">{platform.platform_name}</h3>
                      {getStatusBadge(platform.status)}
                    </div>
                    <p className="text-sm text-slate-400">
                      {platform.last_sync_at
                        ? `마지막 동기화: ${new Date(platform.last_sync_at).toLocaleString('ko-KR')}`
                        : '아직 동기화되지 않음'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {platform.status === 'pending_verification' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
                      onClick={() => handleVerify(platform.id)}
                      disabled={loadingStates[platform.id]?.verifying}
                    >
                      {loadingStates[platform.id]?.verifying ? (
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
                      variant="outline"
                      size="sm"
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      onClick={() => handleSync(platform.id)}
                      disabled={loadingStates[platform.id]?.syncing || platform.status !== 'connected'}
                    >
                      {loadingStates[platform.id]?.syncing ? (
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
                    onClick={() => handleDisconnect(platform.id)}
                  >
                    해제
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg className="w-12 h-12 text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-slate-400">아래에서 플랫폼을 선택하여 연동하세요</p>
          </div>
        )}
      </div>

      {/* 연동 가능한 플랫폼 */}
      <h2 className="text-lg font-semibold text-white mb-4">연동 가능한 플랫폼</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platformConfigs.map((platform) => (
          <div
            key={platform.id}
            className={`bg-slate-800 border border-slate-700 rounded-xl p-6 ${platform.status === 'coming_soon' ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {<platform.logo className="w-10 h-10" />}
                <div>
                  <h3 className="font-semibold text-white">{platform.name}</h3>
                  <p className="text-sm text-slate-400">{platform.description}</p>
                </div>
              </div>
            </div>
            <div className="mt-4">
              {platform.status === 'available' ? (
                platform.id === 'naver' ? (
                  <NaverConnectDialog onSuccess={fetchPlatforms}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">연동하기</Button>
                  </NaverConnectDialog>
                ) : (
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">연동하기</Button>
                )
              ) : (
                <Button className="w-full border-slate-600 text-slate-400" variant="outline" disabled>
                  준비 중
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 플랜 안내 */}
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-blue-300">
              <strong>Free 플랜:</strong> 최대 1개 플랫폼 연동 가능
            </p>
            <p className="text-xs text-blue-400/80 mt-1">
              더 많은 플랫폼 연동이 필요하시면 플랜을 업그레이드하세요
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
