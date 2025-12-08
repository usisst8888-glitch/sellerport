import { createClient } from '@/lib/supabase/server'
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
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-white">대시보드</h1>
        <p className="text-slate-400 mt-1">정기구독 관리 현황을 한눈에 확인하세요</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 현재 플랜 */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-colors" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-sm text-slate-400">현재 플랜</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {planLabels[profile?.plan || 'free']}
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {profile?.plan === 'free' ? '무료 플랜 사용 중' : '구독 중'}
            </p>
          </div>
        </div>

        {/* 구독자 수 */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm text-slate-400">총 구독자</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {profile?.subscriber_count || 0}<span className="text-lg font-normal text-slate-400 ml-1">명</span>
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {profile?.plan === 'free' ? '최대 10명' :
               profile?.plan === 'basic' ? '최대 100명' :
               profile?.plan === 'pro' ? '최대 500명' : '무제한'}
            </p>
          </div>
        </div>

        {/* 연동 플랫폼 */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <p className="text-sm text-slate-400">연동 플랫폼</p>
            </div>
            <p className="text-2xl font-bold text-white">
              {profile?.platform_count || 0}<span className="text-lg font-normal text-slate-400 ml-1">개</span>
            </p>
            <p className="text-sm text-slate-500 mt-1">
              {profile?.plan === 'free' ? '최대 1개' :
               profile?.plan === 'basic' ? '최대 2개' :
               profile?.plan === 'pro' ? '최대 4개' : '무제한'}
            </p>
          </div>
        </div>

        {/* 오늘 발송 */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-5 hover:border-white/10 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-slate-400">오늘 발송 예정</p>
            </div>
            <p className="text-2xl font-bold text-white">
              0<span className="text-lg font-normal text-slate-400 ml-1">건</span>
            </p>
            <p className="text-sm text-slate-500 mt-1">알림톡 발송 대기</p>
          </div>
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 빠른 시작 가이드 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-6">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-lg font-semibold text-white mb-1">시작하기</h2>
            <p className="text-sm text-slate-400 mb-5">셀러포트를 시작하려면 아래 단계를 따라주세요</p>

            <div className="space-y-2">
              <Link href="/settings" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 transition-all duration-200 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/20">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">사업자 정보 등록</p>
                  <p className="text-sm text-slate-500">설정에서 사업자 정보를 입력하세요</p>
                </div>
                <svg className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link href="/platforms" className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-200 group">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 text-slate-400 flex items-center justify-center font-bold text-sm border border-slate-600">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-300">플랫폼 연동</p>
                  <p className="text-sm text-slate-500">스마트스토어, 카페24 등을 연동하세요</p>
                </div>
                <svg className="w-5 h-5 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link href="/subscribers" className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-200 group">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 text-slate-400 flex items-center justify-center font-bold text-sm border border-slate-600">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-300">구독자 동기화</p>
                  <p className="text-sm text-slate-500">플랫폼에서 구독자를 불러옵니다</p>
                </div>
                <svg className="w-5 h-5 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* 최근 활동 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-6">
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-lg font-semibold text-white mb-1">최근 활동</h2>
            <p className="text-sm text-slate-400 mb-5">최근 발송 및 구독자 변동 내역</p>

            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-400 mb-4">아직 활동 내역이 없습니다</p>
              <Link href="/platforms">
                <Button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all">
                  플랫폼 연동하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
