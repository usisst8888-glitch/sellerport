'use client'

import { useState } from 'react'

type TabId = 'overview' | 'tracking' | 'dashboard' | 'profit' | 'alerts' | 'faq'

interface Tab {
  id: TabId
  title: string
  icon: React.ReactNode
}

const tabs: Tab[] = [
  {
    id: 'overview',
    title: '시작하기',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'tracking',
    title: '추적 링크 사용법',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    id: 'dashboard',
    title: '대시보드 이해하기',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'profit',
    title: '수익 계산',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'alerts',
    title: '알림 설정',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    id: 'faq',
    title: '자주 묻는 질문',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
]

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            📖 셀러포트 사용 가이드
          </h1>
          <p className="text-slate-400">
            광고 전환 추적부터 수익 계산까지, 셀러포트 사용법을 알아보세요.
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex flex-wrap gap-2 mb-8 p-1 bg-slate-800/50 rounded-xl">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.title}</span>
            </button>
          ))}
        </div>

        {/* 컨텐츠 */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 md:p-8">
          {activeTab === 'overview' && <OverviewContent />}
          {activeTab === 'tracking' && <TrackingContent />}
          {activeTab === 'dashboard' && <DashboardContent />}
          {activeTab === 'profit' && <ProfitContent />}
          {activeTab === 'alerts' && <AlertsContent />}
          {activeTab === 'faq' && <FAQContent />}
        </div>
      </div>
    </div>
  )
}

function OverviewContent() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-white mb-4">셀러포트란?</h2>
        <p className="text-slate-300 leading-relaxed">
          셀러포트는 <span className="text-blue-400 font-semibold">온라인 광고주</span>를 위한 올인원 광고 성과 관리 플랫폼입니다.
          인스타그램, 유튜브, 블로그 등 다양한 채널의 광고 효과를 실시간으로 추적하고,
          수익을 자동으로 계산해 드립니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">핵심 기능</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <FeatureCard
            icon="🔗"
            title="추적 링크 생성"
            description="광고 채널별로 고유한 추적 링크를 발급받아 클릭과 전환을 추적하세요."
          />
          <FeatureCard
            icon="🚦"
            title="신호등 시스템"
            description="ROAS 기준으로 광고 효율을 🟢🟡🔴 색상으로 한눈에 파악하세요."
          />
          <FeatureCard
            icon="💰"
            title="자동 수익 계산"
            description="원가, 플랫폼 수수료, 광고비를 반영한 실제 순이익을 자동으로 계산합니다."
          />
          <FeatureCard
            icon="📱"
            title="카카오 알림톡"
            description="ROAS 급변, 신호 변경 등 중요 이벤트를 카카오톡으로 바로 받아보세요."
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">시작하는 방법</h2>
        <div className="space-y-4">
          <StepCard
            step={1}
            title="상품 등록"
            description="상품 관리에서 광고할 상품을 등록하세요. 원가와 판매가를 입력하면 마진율이 자동 계산됩니다."
          />
          <StepCard
            step={2}
            title="추적 링크 생성"
            description="전환 추적 메뉴에서 새 추적 링크를 만들고 광고 채널과 상품을 연결하세요."
          />
          <StepCard
            step={3}
            title="추적 링크 배포"
            description="생성된 추적 링크를 인플루언서나 광고에 사용하세요. 클릭과 구매가 자동으로 추적됩니다."
          />
          <StepCard
            step={4}
            title="성과 모니터링"
            description="대시보드에서 실시간 ROAS, 전환율, 순이익을 확인하고 광고 전략을 조정하세요."
          />
        </div>
      </section>
    </div>
  )
}

function TrackingContent() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-white mb-4">추적 링크란?</h2>
        <p className="text-slate-300 leading-relaxed mb-4">
          추적 링크는 광고 채널별로 발급되는 <span className="text-blue-400 font-semibold">고유한 URL</span>입니다.
          이 링크를 통해 방문자가 들어오면 어떤 광고에서 왔는지 자동으로 기록됩니다.
        </p>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-xs text-slate-500 mb-2">예시 추적 링크</p>
          <code className="text-sm text-emerald-400 break-all">
            https://yourstore.com/product?slot=abc123xyz
          </code>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">추적 링크 생성하기</h2>
        <div className="space-y-4">
          <StepCard
            step={1}
            title="전환 추적 메뉴 접속"
            description="좌측 사이드바에서 '전환 추적'을 클릭하세요."
          />
          <StepCard
            step={2}
            title="새 추적 링크 만들기"
            description="'새 추적 링크' 버튼을 클릭하고 이름, 광고 채널(인스타그램/유튜브/블로그 등), 연결할 상품을 선택하세요."
          />
          <StepCard
            step={3}
            title="링크 복사"
            description="추적 링크가 생성되면 복사 버튼을 눌러 링크를 가져가세요."
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">추적 링크 사용 예시</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <ExampleCard
            channel="인스타그램"
            emoji="📸"
            examples={[
              '프로필 링크에 추적 링크 등록',
              '스토리 링크 스티커에 사용',
              '협찬 게시물 바이오 링크',
            ]}
          />
          <ExampleCard
            channel="유튜브"
            emoji="🎬"
            examples={[
              '영상 설명란에 추적 링크 삽입',
              '고정 댓글에 링크 추가',
              '카드/엔드스크린 링크 연결',
            ]}
          />
          <ExampleCard
            channel="블로그"
            emoji="📝"
            examples={[
              '상품 이미지에 링크 연결',
              '구매 버튼에 링크 삽입',
              '텍스트 링크로 자연스럽게 삽입',
            ]}
          />
          <ExampleCard
            channel="카페/커뮤니티"
            emoji="💬"
            examples={[
              '후기 게시글에 링크 삽입',
              '댓글에 링크 공유',
              '공동구매 안내글에 사용',
            ]}
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">추적되는 데이터</h2>
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm shrink-0">✓</span>
              <div>
                <span className="text-white font-medium">클릭 수</span>
                <span className="text-slate-400 ml-2">링크가 클릭된 횟수</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm shrink-0">✓</span>
              <div>
                <span className="text-white font-medium">전환 (구매)</span>
                <span className="text-slate-400 ml-2">실제 구매로 이어진 건수</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm shrink-0">✓</span>
              <div>
                <span className="text-white font-medium">전환율 (CVR)</span>
                <span className="text-slate-400 ml-2">클릭 대비 구매 비율</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm shrink-0">✓</span>
              <div>
                <span className="text-white font-medium">매출액</span>
                <span className="text-slate-400 ml-2">해당 추적 링크를 통한 총 매출</span>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-sm shrink-0">✓</span>
              <div>
                <span className="text-white font-medium">ROAS</span>
                <span className="text-slate-400 ml-2">광고비 대비 매출 비율 (광고 효율)</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">전환 추적 정확도 안내</h2>
        <p className="text-slate-300 leading-relaxed mb-4">
          셀러포트는 업계 최고 수준의 추적 정확도를 제공하지만, 다음과 같은 경우는
          <span className="text-amber-400 font-semibold"> 기술적 한계</span>로 추적이 어려울 수 있습니다.
        </p>

        <div className="space-y-4">
          {/* 추적이 안 되는 경우 */}
          <div className="bg-red-500/10 rounded-xl p-5 border border-red-500/30">
            <h3 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              추적이 안 되는 경우
            </h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                광고 클릭 후 즐겨찾기/북마크 저장 → 나중에 직접 방문하여 구매
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                모바일에서 광고 클릭 → PC에서 구매 (또는 반대)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                브라우저 쿠키 삭제 후 구매
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                광고 링크를 다른 사람에게 공유 후 그 사람이 구매
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">•</span>
                쿠키 유효기간(30일) 초과 후 구매
              </li>
            </ul>
          </div>

          {/* 정확하게 추적되는 경우 */}
          <div className="bg-emerald-500/10 rounded-xl p-5 border border-emerald-500/30">
            <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              정확하게 추적되는 경우
            </h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                광고 클릭 → 바로 구매 (가장 정확)
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                광고 클릭 → 장바구니 담기 → 같은 기기/브라우저에서 구매
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                자체몰에서 직접 추적 스크립트 설치한 경우
              </li>
            </ul>
          </div>

          {/* 셀러포트의 해결책 */}
          <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/30">
            <h3 className="text-blue-400 font-semibold mb-3 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              셀러포트의 해결책
            </h3>
            <ul className="space-y-2 text-slate-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <strong className="text-white">브릿지샵 제공</strong> - 스마트스토어/쿠팡 판매자도 추적 가능한 랜딩페이지 자동 생성
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <strong className="text-white">자체몰 추적 스크립트</strong> - 카페24, 고도몰 등 자체몰은 스크립트 설치로 100% 정확 추적
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">•</span>
                <strong className="text-white">30일 쿠키 유지</strong> - 광고 클릭 후 30일 내 구매까지 추적
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-4 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
          <p className="text-slate-400 text-sm">
            <span className="text-amber-400 font-medium">참고:</span> 이러한 한계는 셀러포트뿐 아니라
            Meta Pixel, Google Analytics 등 모든 추적 솔루션이 가지고 있는 업계 공통 한계입니다.
            쿠키 기반 추적의 특성상 100% 완벽한 추적은 기술적으로 불가능합니다.
          </p>
        </div>
      </section>
    </div>
  )
}

function DashboardContent() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-white mb-4">대시보드 이해하기</h2>
        <p className="text-slate-300 leading-relaxed">
          대시보드는 모든 추적 링크의 성과를 한눈에 보여주는 <span className="text-blue-400 font-semibold">핵심 화면</span>입니다.
          실시간으로 업데이트되며, 광고 효율을 직관적으로 파악할 수 있습니다.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">🚦 신호등 시스템</h2>
        <p className="text-slate-300 mb-4">
          ROAS(광고비 대비 매출)를 기준으로 추적 링크 상태를 색상으로 표시합니다.
        </p>
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <span className="text-3xl">🟢</span>
            <div>
              <p className="text-emerald-400 font-semibold">초록불 (ROAS 300% 이상)</p>
              <p className="text-slate-400 text-sm">광고 효율 우수! 이 추적 링크는 잘 되고 있어요.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <span className="text-3xl">🟡</span>
            <div>
              <p className="text-amber-400 font-semibold">노란불 (ROAS 150~300%)</p>
              <p className="text-slate-400 text-sm">주의 필요. 개선 여지가 있어요.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <span className="text-3xl">🔴</span>
            <div>
              <p className="text-red-400 font-semibold">빨간불 (ROAS 150% 미만)</p>
              <p className="text-slate-400 text-sm">적자 상태! 광고 중단이나 개선이 필요해요.</p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">주요 지표 설명</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <MetricCard
            title="ROAS"
            formula="매출 ÷ 광고비 × 100"
            description="광고비 대비 얼마나 매출이 발생했는지를 나타내는 핵심 지표입니다. 300% 이상이면 광고비 1원당 3원의 매출이 발생한 것입니다."
          />
          <MetricCard
            title="전환율 (CVR)"
            formula="구매 수 ÷ 클릭 수 × 100"
            description="링크를 클릭한 사람 중 실제로 구매한 비율입니다. 일반적으로 1~3%가 평균이며, 높을수록 좋습니다."
          />
          <MetricCard
            title="클릭당 비용 (CPC)"
            formula="광고비 ÷ 클릭 수"
            description="한 번의 클릭을 얻기 위해 지출한 비용입니다. 낮을수록 효율적인 광고입니다."
          />
          <MetricCard
            title="전환당 비용 (CPA)"
            formula="광고비 ÷ 전환 수"
            description="한 건의 구매(전환)를 얻기 위해 지출한 비용입니다. 제품 마진보다 낮아야 수익이 납니다."
          />
        </div>
      </section>
    </div>
  )
}

function ProfitContent() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-white mb-4">수익 계산 기능</h2>
        <p className="text-slate-300 leading-relaxed">
          셀러포트는 단순 매출이 아닌 <span className="text-blue-400 font-semibold">실제 순이익</span>을 자동으로 계산합니다.
          원가, 플랫폼 수수료, 광고비, 세금까지 모두 반영한 정확한 수익을 확인하세요.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">계산 항목</h2>
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
              <span className="text-slate-300">판매가</span>
              <span className="text-white font-mono">+ 50,000원</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
              <span className="text-slate-300">원가</span>
              <span className="text-red-400 font-mono">- 20,000원</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
              <span className="text-slate-300">플랫폼 수수료 (스마트스토어 등)</span>
              <span className="text-red-400 font-mono">- 3,000원</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
              <span className="text-slate-300">광고비</span>
              <span className="text-red-400 font-mono">- 10,000원</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/50">
              <span className="text-slate-300">예상 세금</span>
              <span className="text-red-400 font-mono">- 2,000원</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-white font-semibold">순이익</span>
              <span className="text-emerald-400 font-mono font-bold text-lg">= 15,000원</span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">사이트별 수수료</h2>
        <p className="text-slate-300 mb-4">
          연동된 사이트의 실제 수수료율이 자동으로 적용됩니다.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/50 rounded-xl p-4 text-center border border-slate-700/50">
            <p className="text-2xl mb-2">🟢</p>
            <p className="text-white font-medium">네이버</p>
            <p className="text-slate-400 text-sm">2~6%</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 text-center border border-slate-700/50">
            <p className="text-2xl mb-2">🟠</p>
            <p className="text-white font-medium">쿠팡</p>
            <p className="text-slate-400 text-sm">10.8%</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 text-center border border-slate-700/50">
            <p className="text-2xl mb-2">🔴</p>
            <p className="text-white font-medium">11번가</p>
            <p className="text-slate-400 text-sm">13%</p>
          </div>
          <div className="bg-slate-900/50 rounded-xl p-4 text-center border border-slate-700/50">
            <p className="text-2xl mb-2">🟡</p>
            <p className="text-white font-medium">카카오</p>
            <p className="text-slate-400 text-sm">12%</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">세금 계산</h2>
        <p className="text-slate-300 leading-relaxed">
          사업자 유형(간이/일반)에 따라 부가세와 소득세가 자동 계산됩니다.
          설정에서 사업자 유형을 선택하면 더 정확한 세금 예측이 가능합니다.
        </p>
      </section>
    </div>
  )
}

function AlertsContent() {
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-white mb-4">알림 설정</h2>
        <p className="text-slate-300 leading-relaxed">
          중요한 이벤트가 발생하면 <span className="text-blue-400 font-semibold">카카오 알림톡</span>으로 바로 알려드립니다.
          광고 효율이 급격히 변하거나, 신호등 색상이 바뀌면 즉시 대응할 수 있어요.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">알림 종류</h2>
        <div className="space-y-3">
          <AlertTypeCard
            emoji="🔴"
            title="빨간불 전환 알림"
            description="추적 링크가 초록불/노란불에서 빨간불로 바뀌면 알림"
          />
          <AlertTypeCard
            emoji="🟢"
            title="초록불 전환 알림"
            description="추적 링크가 빨간불/노란불에서 초록불로 개선되면 알림"
          />
          <AlertTypeCard
            emoji="📉"
            title="ROAS 급락 알림"
            description="ROAS가 급격히 하락하면 즉시 알림"
          />
          <AlertTypeCard
            emoji="🤖"
            title="AI 최적화 추천"
            description="AI가 분석한 광고 개선 팁을 매일 아침 발송"
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">알림톡 설정 방법</h2>
        <div className="space-y-4">
          <StepCard
            step={1}
            title="설정 메뉴 접속"
            description="좌측 사이드바에서 '설정'을 클릭하세요."
          />
          <StepCard
            step={2}
            title="알림톡 활성화"
            description="'카카오 알림톡' 옵션을 켜고, 알림 받을 전화번호를 입력하세요."
          />
          <StepCard
            step={3}
            title="알림 조건 선택"
            description="받고 싶은 알림 종류를 선택하세요. 모든 알림을 받거나, 빨간불 알림만 받을 수 있습니다."
          />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">알림톡 요금</h2>
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
          <ul className="space-y-2 text-slate-300">
            <li>• 베이직 요금제: 월 <span className="text-white font-semibold">300건</span> 기본 포함</li>
            <li>• 프로 요금제: 월 <span className="text-white font-semibold">1,000건</span> 기본 포함</li>
            <li>• 추가 알림톡: 건당 <span className="text-white font-semibold">15원</span></li>
          </ul>
        </div>
      </section>
    </div>
  )
}

function FAQContent() {
  const faqs = [
    {
      question: '추적 링크가 작동하지 않아요',
      answer: '추적 링크를 그대로 복사했는지 확인해 주세요. URL 단축 서비스(bit.ly 등)를 사용하면 추적이 되지 않을 수 있습니다. 원본 링크를 그대로 사용해 주세요.',
    },
    {
      question: '클릭은 되는데 전환이 안 잡혀요',
      answer: '전환 추적은 네이버 스마트스토어 연동이 필요합니다. 내 사이트 연동 메뉴에서 스토어를 연결하면 주문 데이터가 자동으로 연동됩니다.',
    },
    {
      question: 'ROAS가 정확한가요?',
      answer: 'ROAS는 (추적 링크를 통한 매출 ÷ 입력한 광고비) × 100으로 계산됩니다. 광고비를 정확히 입력하면 정확한 ROAS를 확인할 수 있습니다.',
    },
    {
      question: '여러 상품을 하나의 추적 링크로 추적할 수 있나요?',
      answer: '현재는 1추적 링크 = 1상품 구조입니다. 여러 상품을 묶어서 추적하려면 각각 추적 링크를 생성해 주세요.',
    },
    {
      question: '알림톡이 오지 않아요',
      answer: '설정에서 알림톡 수신 전화번호가 정확한지 확인해 주세요. 또한 알림톡 잔여 건수가 있는지 결제 관리에서 확인해 주세요.',
    },
    {
      question: '구독을 해지하면 데이터는 어떻게 되나요?',
      answer: '구독 해지 후에도 기존 데이터는 30일간 보관됩니다. 재구독하시면 이전 데이터를 그대로 사용할 수 있습니다.',
    },
    {
      question: '환불이 가능한가요?',
      answer: '결제 후 7일 이내, 서비스 미사용 시 전액 환불이 가능합니다. 고객센터로 문의해 주세요.',
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white mb-6">자주 묻는 질문</h2>
      {faqs.map((faq, index) => (
        <div key={index} className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-4">
            <h3 className="text-white font-medium flex items-start gap-3">
              <span className="text-blue-400 shrink-0">Q.</span>
              {faq.question}
            </h3>
            <p className="mt-3 text-slate-400 text-sm pl-6">
              <span className="text-emerald-400 font-medium">A.</span> {faq.answer}
            </p>
          </div>
        </div>
      ))}

      <div className="mt-8 p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
        <h3 className="text-white font-semibold mb-2">더 궁금한 점이 있으신가요?</h3>
        <p className="text-slate-400 text-sm mb-4">
          카카오톡 채널에서 1:1 상담을 받아보세요.
        </p>
        <a
          href="https://pf.kakao.com/_xnxnxn"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors"
        >
          <span>💬</span>
          카카오톡 상담하기
        </a>
      </div>
    </div>
  )
}

// 컴포넌트들
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="text-white font-medium">{title}</h3>
          <p className="text-slate-400 text-sm mt-1">{description}</p>
        </div>
      </div>
    </div>
  )
}

function StepCard({ step, title, description }: { step: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
        {step}
      </div>
      <div>
        <h3 className="text-white font-medium">{title}</h3>
        <p className="text-slate-400 text-sm mt-1">{description}</p>
      </div>
    </div>
  )
}

function ExampleCard({ channel, emoji, examples }: { channel: string; emoji: string; examples: string[] }) {
  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{emoji}</span>
        <h3 className="text-white font-medium">{channel}</h3>
      </div>
      <ul className="space-y-1.5">
        {examples.map((example, i) => (
          <li key={i} className="text-slate-400 text-sm flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            {example}
          </li>
        ))}
      </ul>
    </div>
  )
}

function MetricCard({ title, formula, description }: { title: string; formula: string; description: string }) {
  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
      <h3 className="text-white font-medium mb-1">{title}</h3>
      <p className="text-blue-400 text-sm font-mono mb-2">{formula}</p>
      <p className="text-slate-400 text-sm">{description}</p>
    </div>
  )
}

function AlertTypeCard({ emoji, title, description }: { emoji: string; title: string; description: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
      <span className="text-2xl">{emoji}</span>
      <div>
        <p className="text-white font-medium">{title}</p>
        <p className="text-slate-400 text-sm">{description}</p>
      </div>
    </div>
  )
}
