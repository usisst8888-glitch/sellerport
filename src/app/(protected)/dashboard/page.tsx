import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

// 신호등 상태 타입
type TrafficLight = 'green' | 'yellow' | 'red' | 'gray'

// 신호등 판정 함수
function getTrafficLight(roas: number): TrafficLight {
  if (roas >= 300) return 'green'
  if (roas >= 150) return 'yellow'
  if (roas > 0) return 'red'
  return 'gray'
}

function getTrafficLightColor(status: TrafficLight) {
  switch (status) {
    case 'green':
      return 'bg-emerald-500 shadow-emerald-500/50'
    case 'yellow':
      return 'bg-amber-500 shadow-amber-500/50'
    case 'red':
      return 'bg-red-500 shadow-red-500/50 animate-pulse'
    default:
      return 'bg-slate-500'
  }
}

function getStatusText(status: TrafficLight) {
  switch (status) {
    case 'green':
      return '효율 좋음'
    case 'yellow':
      return '주의 필요'
    case 'red':
      return '개선 필요'
    default:
      return '데이터 없음'
  }
}

function formatCurrency(value: number) {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`
  }
  return value.toLocaleString()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 캠페인 목록 조회
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select(`
      *,
      products (
        id,
        name,
        image_url,
        price
      )
    `)
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  // 캠페인에 신호등 상태 추가
  const campaignsWithLight = (campaigns || []).map(campaign => ({
    ...campaign,
    trafficLight: getTrafficLight(campaign.roas || 0)
  }))

  // 신호등 통계 계산
  const greenCount = campaignsWithLight.filter(c => c.trafficLight === 'green').length
  const yellowCount = campaignsWithLight.filter(c => c.trafficLight === 'yellow').length
  const redCount = campaignsWithLight.filter(c => c.trafficLight === 'red').length

  // 전체 통계
  const totalAdSpend = campaignsWithLight.reduce((sum, c) => sum + (c.spent || 0), 0)
  const totalRevenue = campaignsWithLight.reduce((sum, c) => sum + (c.revenue || 0), 0)
  const totalProfit = totalRevenue - totalAdSpend // 간단한 순이익 계산 (실제로는 원가도 빼야 함)
  const averageRoas = totalAdSpend > 0 ? Math.round((totalRevenue / totalAdSpend) * 100) : 0

  // 빨간불 캠페인
  const redLightCampaigns = campaignsWithLight.filter(c => c.trafficLight === 'red')

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            대시보드
            <span className="text-2xl">🚦</span>
          </h1>
          <p className="text-slate-400 mt-1">광고 효율을 신호등으로 한눈에 확인하세요</p>
        </div>
        <Link
          href="/conversions"
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          전환 추적 설정
        </Link>
      </div>

      {/* 신호등 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 초록불 */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-emerald-500/20 p-5 hover:border-emerald-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="relative flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 flex items-center justify-center`}>
                <span className="text-xl">🟢</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-emerald-400 font-medium">ROAS 300%+</p>
              <p className="text-3xl font-bold text-white">{greenCount}<span className="text-lg font-normal text-slate-400 ml-1">개</span></p>
              <p className="text-sm text-slate-500">효율 좋음</p>
            </div>
          </div>
        </div>

        {/* 노란불 */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-amber-500/20 p-5 hover:border-amber-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
          <div className="relative flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50 flex items-center justify-center`}>
                <span className="text-xl">🟡</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-amber-400 font-medium">ROAS 150-300%</p>
              <p className="text-3xl font-bold text-white">{yellowCount}<span className="text-lg font-normal text-slate-400 ml-1">개</span></p>
              <p className="text-sm text-slate-500">주의 필요</p>
            </div>
          </div>
        </div>

        {/* 빨간불 */}
        <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-red-500/20 p-5 hover:border-red-500/40 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-colors" />
          <div className="relative flex items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse flex items-center justify-center`}>
                <span className="text-xl">🔴</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-red-400 font-medium">ROAS 150% 미만</p>
              <p className="text-3xl font-bold text-white">{redCount}<span className="text-lg font-normal text-slate-400 ml-1">개</span></p>
              <p className="text-sm text-slate-500">개선 필요</p>
            </div>
          </div>
        </div>
      </div>

      {/* 전체 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">총 광고비</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalAdSpend)}원</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">총 매출</p>
          <p className="text-xl font-bold text-white mt-1">{formatCurrency(totalRevenue)}원</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">평균 ROAS</p>
          <p className="text-xl font-bold text-white mt-1">{averageRoas}%</p>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-white/5 p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider">순이익</p>
          <p className={`text-xl font-bold mt-1 ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}원
          </p>
        </div>
      </div>

      {/* 캠페인별 신호등 현황 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">캠페인별 광고 효율</h2>
              <p className="text-sm text-slate-400 mt-0.5">빨간불 캠페인은 즉시 점검이 필요합니다</p>
            </div>
            <Link
              href="/products"
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              전체 보기
            </Link>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {campaignsWithLight.length > 0 ? (
            campaignsWithLight.slice(0, 10).map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
              >
                {/* 신호등 */}
                <div className={`w-4 h-4 rounded-full ${getTrafficLightColor(campaign.trafficLight)} shadow-lg`} />

                {/* 캠페인 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{campaign.name}</p>
                  <p className="text-xs text-slate-500">{campaign.platform} · {campaign.products?.name || '상품 미연결'}</p>
                </div>

                {/* ROAS */}
                <div className="text-right">
                  <p className={`text-sm font-bold ${
                    campaign.trafficLight === 'green' ? 'text-emerald-400' :
                    campaign.trafficLight === 'yellow' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    ROAS {campaign.roas || 0}%
                  </p>
                  <p className="text-xs text-slate-500">{getStatusText(campaign.trafficLight)}</p>
                </div>

                {/* 광고비/매출 */}
                <div className="hidden md:block text-right w-28">
                  <p className="text-sm text-slate-300">{formatCurrency(campaign.spent || 0)}원</p>
                  <p className="text-xs text-slate-500">광고비</p>
                </div>

                <div className="hidden md:block text-right w-28">
                  <p className="text-sm text-slate-300">{formatCurrency(campaign.revenue || 0)}원</p>
                  <p className="text-xs text-slate-500">매출</p>
                </div>

                {/* 상태 변경 버튼 */}
                {campaign.trafficLight === 'red' && (
                  <Link
                    href={`/products?campaign=${campaign.id}`}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    점검하기
                  </Link>
                )}
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-700/30 flex items-center justify-center mb-4">
                <span className="text-3xl">🚦</span>
              </div>
              <p className="text-slate-400 mb-2">아직 등록된 캠페인이 없습니다</p>
              <p className="text-sm text-slate-500 mb-4">플랫폼을 연동하고 캠페인을 등록하세요</p>
              <Link
                href="/platforms"
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium border border-white/10 hover:border-white/20 transition-all"
              >
                플랫폼 연동하기
              </Link>
            </div>
          )}
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
              <Link href="/platforms" className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 transition-all duration-200 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-blue-500/20">
                  1
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white">플랫폼 연동</p>
                  <p className="text-sm text-slate-500">스마트스토어, 쿠팡, 카페24 등 연동</p>
                </div>
                <svg className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link href="/conversions" className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-200 group">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 text-slate-400 flex items-center justify-center font-bold text-sm border border-slate-600">
                  2
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-300">전환 추적 설정</p>
                  <p className="text-sm text-slate-500">UTM 태그 및 슬롯 발급</p>
                </div>
                <svg className="w-5 h-5 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>

              <Link href="/profit" className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all duration-200 group">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 text-slate-400 flex items-center justify-center font-bold text-sm border border-slate-600">
                  3
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-300">수익 계산 설정</p>
                  <p className="text-sm text-slate-500">원가, 마진, 세금 설정</p>
                </div>
                <svg className="w-5 h-5 text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* 빨간불 알림 */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-6">
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-red-500/5 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
              빨간불 알림
              <span className="px-2 py-0.5 text-xs font-medium bg-red-500/20 text-red-400 rounded-full">
                {redCount}
              </span>
            </h2>
            <p className="text-sm text-slate-400 mb-5">즉시 점검이 필요한 캠페인</p>

            {redLightCampaigns.length > 0 ? (
              <div className="space-y-3">
                {redLightCampaigns.slice(0, 3).map((campaign) => (
                  <div key={campaign.id} className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{campaign.name}</p>
                      <p className="text-xs text-red-400">
                        ROAS {campaign.roas || 0}% · {campaign.platform}
                      </p>
                    </div>
                    <Link
                      href={`/products?campaign=${campaign.id}`}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-400 rounded-lg transition-colors"
                    >
                      점검
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
                  <span className="text-2xl">✅</span>
                </div>
                <p className="text-slate-400">모든 캠페인의 광고 효율이 양호합니다</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
