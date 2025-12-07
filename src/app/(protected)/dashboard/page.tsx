import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 프로필 정보 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  const planLabels: Record<string, string> = {
    free: 'Free',
    basic: 'Basic',
    pro: 'Pro',
    enterprise: 'Enterprise'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 현재 플랜 */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>현재 플랜</CardDescription>
            <CardTitle className="text-2xl">
              {planLabels[profile?.plan || 'free']}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              {profile?.plan === 'free' ? '무료 플랜 사용 중' : '구독 중'}
            </p>
          </CardContent>
        </Card>

        {/* 구독자 수 */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>총 구독자</CardDescription>
            <CardTitle className="text-2xl">
              {profile?.subscriber_count || 0}명
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              {profile?.plan === 'free' ? '최대 10명' :
               profile?.plan === 'basic' ? '최대 100명' :
               profile?.plan === 'pro' ? '최대 500명' : '무제한'}
            </p>
          </CardContent>
        </Card>

        {/* 연동 플랫폼 */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>연동 플랫폼</CardDescription>
            <CardTitle className="text-2xl">
              {profile?.platform_count || 0}개
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">
              {profile?.plan === 'free' ? '최대 1개' :
               profile?.plan === 'basic' ? '최대 2개' :
               profile?.plan === 'pro' ? '최대 4개' : '무제한'}
            </p>
          </CardContent>
        </Card>

        {/* 오늘 발송 */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>오늘 발송 예정</CardDescription>
            <CardTitle className="text-2xl">0건</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">알림톡 발송 대기</p>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 작업 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* 빠른 시작 가이드 */}
        <Card>
          <CardHeader>
            <CardTitle>시작하기</CardTitle>
            <CardDescription>셀러포트를 시작하려면 아래 단계를 따라주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Link href="/settings" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-sm">1</div>
                <div className="flex-1">
                  <p className="font-medium">사업자 정보 등록</p>
                  <p className="text-sm text-gray-500">설정에서 사업자 정보를 입력하세요</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="/platforms" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-semibold text-sm">2</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-600">플랫폼 연동</p>
                  <p className="text-sm text-gray-400">스마트스토어, 카페24 등을 연동하세요</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link href="/subscribers" className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-semibold text-sm">3</div>
                <div className="flex-1">
                  <p className="font-medium text-gray-600">구독자 동기화</p>
                  <p className="text-sm text-gray-400">플랫폼에서 구독자를 불러옵니다</p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 최근 활동 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 활동</CardTitle>
            <CardDescription>최근 발송 및 구독자 변동 내역</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 mb-4">아직 활동 내역이 없습니다</p>
              <Link href="/platforms">
                <Button variant="outline" size="sm">
                  플랫폼 연동하기
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
