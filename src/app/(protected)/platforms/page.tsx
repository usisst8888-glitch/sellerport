'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

const platformConfigs = [
  {
    id: 'naver',
    name: '네이버 스마트스토어',
    description: '커머스 API 인증',
    icon: '🛒',
    status: 'available',
  },
  {
    id: 'cafe24',
    name: '카페24',
    description: 'OAuth 2.0 인증',
    icon: '🏪',
    status: 'coming_soon',
  },
  {
    id: 'imweb',
    name: '아임웹',
    description: 'API Key 인증',
    icon: '🌐',
    status: 'coming_soon',
  },
  {
    id: 'godo',
    name: '고도몰',
    description: 'API Key 인증',
    icon: '🛍️',
    status: 'coming_soon',
  },
  {
    id: 'makeshop',
    name: '메이크샵',
    description: 'API Key 인증',
    icon: '🏬',
    status: 'coming_soon',
  },
  {
    id: 'coupang',
    name: '쿠팡',
    description: 'HMAC 인증',
    icon: '📦',
    status: 'coming_soon',
  },
]

export default function PlatformsPage() {
  const [connectedPlatforms, setConnectedPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)

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
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">연동됨</span>
      case 'error':
        return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">오류</span>
      case 'expired':
        return <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">만료됨</span>
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">대기중</span>
    }
  }

  const getPlatformIcon = (type: string) => {
    const config = platformConfigs.find(p => p.id === type)
    return config?.icon || '🔗'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">플랫폼 연동</h1>
          <p className="text-gray-500 mt-1">이커머스 플랫폼을 연동하여 구독자를 관리하세요</p>
        </div>
      </div>

      {/* 연동된 플랫폼 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>연동된 플랫폼</CardTitle>
          <CardDescription>
            {connectedPlatforms.length > 0
              ? `${connectedPlatforms.length}개의 플랫폼이 연동되어 있습니다`
              : '현재 연동된 플랫폼이 없습니다'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : connectedPlatforms.length > 0 ? (
            <div className="space-y-3">
              {connectedPlatforms.map((platform) => (
                <div
                  key={platform.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getPlatformIcon(platform.platform_type)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{platform.platform_name}</h3>
                        {getStatusBadge(platform.status)}
                      </div>
                      <p className="text-sm text-gray-500">
                        {platform.last_sync_at
                          ? `마지막 동기화: ${new Date(platform.last_sync_at).toLocaleString('ko-KR')}`
                          : '아직 동기화되지 않음'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>
                      동기화
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
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
              <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <p className="text-gray-500">아래에서 플랫폼을 선택하여 연동하세요</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 연동 가능한 플랫폼 */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">연동 가능한 플랫폼</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platformConfigs.map((platform) => (
          <Card key={platform.id} className={platform.status === 'coming_soon' ? 'opacity-60' : ''}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{platform.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                    <p className="text-sm text-gray-500">{platform.description}</p>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                {platform.status === 'available' ? (
                  platform.id === 'naver' ? (
                    <NaverConnectDialog onSuccess={fetchPlatforms}>
                      <Button className="w-full">연동하기</Button>
                    </NaverConnectDialog>
                  ) : (
                    <Button className="w-full">연동하기</Button>
                  )
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    준비 중
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 플랜 안내 */}
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-blue-800">
                <strong>Free 플랜:</strong> 최대 1개 플랫폼 연동 가능
              </p>
              <p className="text-xs text-blue-600 mt-1">
                더 많은 플랫폼 연동이 필요하시면 플랜을 업그레이드하세요
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
