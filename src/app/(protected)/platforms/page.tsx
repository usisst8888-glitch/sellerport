import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const platforms = [
  {
    id: 'naver',
    name: '네이버 스마트스토어',
    description: 'OAuth 2.0 인증',
    icon: '🛒',
    status: 'available',
  },
  {
    id: 'cafe24',
    name: '카페24',
    description: 'OAuth 2.0 인증',
    icon: '🏪',
    status: 'available',
  },
  {
    id: 'imweb',
    name: '아임웹',
    description: 'API Key 인증',
    icon: '🌐',
    status: 'available',
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
          <CardDescription>현재 연동된 플랫폼이 없습니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-gray-500">아래에서 플랫폼을 선택하여 연동하세요</p>
          </div>
        </CardContent>
      </Card>

      {/* 연동 가능한 플랫폼 */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">연동 가능한 플랫폼</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {platforms.map((platform) => (
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
                  <Button className="w-full">연동하기</Button>
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
