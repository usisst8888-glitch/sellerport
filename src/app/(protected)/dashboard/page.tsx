import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LogoutButton } from './logout-button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // 프로필 정보 가져오기
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const planLabels: Record<string, string> = {
    free: 'Free',
    basic: 'Basic',
    pro: 'Pro',
    enterprise: 'Enterprise'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">셀러포트</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">대시보드</h2>

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

        {/* 빠른 시작 가이드 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>시작하기</CardTitle>
            <CardDescription>셀러포트를 시작하려면 아래 단계를 따라주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">1</div>
                <div>
                  <p className="font-medium">사업자 정보 등록</p>
                  <p className="text-sm text-gray-500">설정에서 사업자 정보를 입력하세요</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-semibold">2</div>
                <div>
                  <p className="font-medium text-gray-400">플랫폼 연동</p>
                  <p className="text-sm text-gray-400">스마트스토어, 카페24 등을 연동하세요</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center font-semibold">3</div>
                <div>
                  <p className="font-medium text-gray-400">구독자 동기화</p>
                  <p className="text-sm text-gray-400">플랫폼에서 구독자를 불러옵니다</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
