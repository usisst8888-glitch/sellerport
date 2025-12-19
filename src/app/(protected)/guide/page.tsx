'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

type TabId = 'overview' | 'mysites' | 'tracking' | 'adchannels' | 'dashboard' | 'profit' | 'alerts' | 'faq'

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
    id: 'mysites',
    title: '내 사이트 연동',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
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
    id: 'adchannels',
    title: '광고 채널 연동',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
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
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [initialChannel, setInitialChannel] = useState<string | null>(null)

  useEffect(() => {
    const tab = searchParams.get('tab')
    const channel = searchParams.get('channel')

    if (tab && ['overview', 'mysites', 'tracking', 'adchannels', 'dashboard', 'profit', 'alerts', 'faq'].includes(tab)) {
      setActiveTab(tab as TabId)
    }

    if (channel) {
      setInitialChannel(channel)
    }
  }, [searchParams])

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
          {activeTab === 'mysites' && <MySitesContent />}
          {activeTab === 'tracking' && <TrackingContent />}
          {activeTab === 'adchannels' && <AdChannelsContent initialChannel={initialChannel} />}
          {activeTab === 'dashboard' && <DashboardContent />}
          {activeTab === 'profit' && <ProfitContent />}
          {activeTab === 'alerts' && <AlertsContent />}
          {activeTab === 'faq' && <FAQContent />}
        </div>
      </div>
    </div>
  )
}

function MySitesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const expandParam = searchParams.get('expand')
  const [expandedSite, setExpandedSite] = useState<string | null>(null)

  // URL 파라미터로 드롭다운 자동 펼치기
  useEffect(() => {
    if (expandParam) {
      setExpandedSite(expandParam)
    }
  }, [expandParam])

  const toggleSite = (siteId: string) => {
    setExpandedSite(expandedSite === siteId ? null : siteId)
  }

  const handleConnect = (siteId: string) => {
    router.push(`/my-sites?connect=${siteId}`)
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-white mb-4">내 사이트 연동이란?</h2>
        <p className="text-slate-300 leading-relaxed">
          셀러포트에서 전환(구매, 회원가입, DB수집)을 추적하려면 먼저 <span className="text-blue-400 font-semibold">내 사이트</span>를 연동해야 합니다.
          쇼핑몰, 웹사이트, 블로그 등 고객이 전환하는 사이트를 등록하면, 해당 사이트에서 발생하는 모든 전환을 추적할 수 있습니다.
        </p>
      </section>

      {/* 쇼핑 추적 */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">🛒</span> 쇼핑 추적
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          쇼핑몰에서 발생하는 주문/결제 전환을 추적합니다.
        </p>
        <div className="space-y-3">
          {/* 네이버 스마트스토어 */}
          <SiteGuideCard
            id="naver"
            icon={<img src="/site_logo/smartstore.png" alt="네이버 스마트스토어" className="w-6 h-6 rounded" />}
            title="네이버 스마트스토어"
            description="커머스 API 연동"
            isExpanded={expandedSite === 'naver'}
            onToggle={() => toggleSite('naver')}
            onConnect={() => handleConnect('naver')}
          >
            <div className="space-y-4">
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                <p className="text-green-400 font-medium mb-2">API 연동 방식</p>
                <p className="text-slate-300 text-sm">네이버 커머스API센터에서 발급받은 Client ID/Secret을 입력하면 연동됩니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="네이버 커머스API센터 접속" description="apicenter.commerce.naver.com에 접속하여 스마트스토어 판매자 계정으로 로그인하세요." />
                <StepCard step={2} title="애플리케이션 등록" description="새 애플리케이션을 등록하고 Client ID와 Client Secret을 발급받으세요." />
                <StepCard step={3} title="API 호출 IP 등록" description="API 호출 IP에 34.64.115.226을 등록하세요." />
                <StepCard step={4} title="셀러포트에서 연동" description="내 사이트 → 네이버 스마트스토어 연동하기를 클릭하고 발급받은 정보를 입력하세요." />
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-white/10">
                <p className="text-slate-300 font-medium mb-2">필요한 API 권한</p>
                <ul className="text-slate-400 text-sm space-y-1">
                  <li>• 주문 정보 조회</li>
                  <li>• 상품 정보 조회</li>
                  <li>• 정산 정보 조회</li>
                </ul>
              </div>
            </div>
          </SiteGuideCard>

          {/* 카페24 */}
          <SiteGuideCard
            id="cafe24"
            icon={<img src="/site_logo/cafe24.png" alt="카페24" className="w-6 h-6 rounded" />}
            title="카페24"
            description="앱스토어 설치"
            isExpanded={expandedSite === 'cafe24'}
            onToggle={() => toggleSite('cafe24')}
            onConnect={() => handleConnect('cafe24')}
          >
            <div className="space-y-4">
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                <p className="text-blue-400 font-medium mb-2">앱스토어 설치 방식</p>
                <p className="text-slate-300 text-sm">카페24 앱스토어에서 셀러포트 앱을 설치하면 자동으로 연동됩니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="카페24 앱스토어 접속" description="카페24 앱스토어(store.cafe24.com)에 접속하세요." />
                <StepCard step={2} title="셀러포트 검색" description="검색창에 '셀러포트'를 검색하세요." />
                <StepCard step={3} title="앱 설치" description="앱 설치 버튼을 클릭하고 권한을 승인하세요." />
                <StepCard step={4} title="셀러포트 연결" description="설치 완료 후 셀러포트에 회원가입/로그인하여 쇼핑몰을 연결하세요." />
              </div>
              <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                <p className="text-amber-400 font-medium mb-2">참고사항</p>
                <p className="text-slate-300 text-sm">카페24는 앱스토어를 통해서만 연동할 수 있습니다. 직접 API 키를 입력하는 방식은 지원하지 않습니다.</p>
              </div>
            </div>
          </SiteGuideCard>

          {/* 아임웹 */}
          <SiteGuideCard
            id="imweb"
            icon={<img src="/site_logo/imweb.png" alt="아임웹" className="w-6 h-6 rounded" />}
            title="아임웹"
            description="OAuth 2.0 연동"
            isExpanded={expandedSite === 'imweb'}
            onToggle={() => toggleSite('imweb')}
            onConnect={() => handleConnect('imweb')}
          >
            <div className="space-y-4">
              <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/30">
                <p className="text-indigo-400 font-medium mb-2">OAuth 연동 방식</p>
                <p className="text-slate-300 text-sm">아임웹 계정으로 로그인하면 자동으로 연동됩니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="셀러포트에서 연동 시작" description="내 사이트 → 아임웹 연동하기를 클릭하세요." />
                <StepCard step={2} title="아임웹 로그인" description="팝업 창에서 아임웹 계정으로 로그인하세요." />
                <StepCard step={3} title="권한 승인" description="셀러포트가 쇼핑몰 데이터를 읽을 수 있도록 권한을 승인하세요." />
                <StepCard step={4} title="연동 완료" description="주문, 상품 데이터가 자동으로 수집됩니다." />
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-white/10">
                <p className="text-slate-300 font-medium mb-2">지원 기능</p>
                <p className="text-slate-400 text-sm">아임웹은 쇼핑 추적, 회원가입 추적, DB 추적 모두 지원합니다.</p>
              </div>
            </div>
          </SiteGuideCard>

          {/* 자체 제작 쇼핑몰 - 쇼핑 */}
          <SiteGuideCard
            id="custom-shopping"
            icon={<img src="/site_logo/own_site.png" alt="자체 제작 쇼핑몰" className="w-6 h-6 rounded" />}
            title="자체 제작 쇼핑몰"
            description="추적 스크립트 설치"
            isExpanded={expandedSite === 'custom-shopping'}
            onToggle={() => toggleSite('custom-shopping')}
            onConnect={() => handleConnect('custom')}
          >
            <div className="space-y-4">
              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                <p className="text-emerald-400 font-medium mb-2">스크립트 설치 방식</p>
                <p className="text-slate-300 text-sm">사이트에 추적 스크립트를 설치하고, 전환 발생 시 이벤트 코드를 호출합니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="사이트 등록" description="내 사이트 → 자체 제작 쇼핑몰 연동하기를 클릭하고 사이트 정보를 입력하세요." />
                <StepCard step={2} title="추적 스크립트 설치" description="발급된 추적 스크립트를 사이트의 <head> 태그에 삽입하세요." />
                <StepCard step={3} title="전환 이벤트 코드 설치" description="구매 완료 페이지에 전환 이벤트 코드를 삽입하세요." />
                <StepCard step={4} title="연동 확인" description="테스트 주문으로 전환이 정상 수집되는지 확인하세요." />
              </div>
              <div className="bg-slate-900/70 rounded-lg p-4 border border-white/10">
                <p className="text-slate-400 text-sm mb-2">전환 이벤트 코드 예시:</p>
                <pre className="text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap">
{`sellerport('track', 'Purchase', {
  value: 50000,  // 주문 금액
  order_id: 'ORDER_123'  // 주문 번호
});`}
                </pre>
              </div>
            </div>
          </SiteGuideCard>
        </div>
      </section>

      {/* 회원가입 추적 */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">👤</span> 회원가입 추적
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          회원가입 전환을 추적합니다. 광고를 통해 유입된 신규 회원을 측정할 수 있습니다.
        </p>
        <div className="space-y-3">
          {/* 아임웹 - 회원가입 */}
          <SiteGuideCard
            id="imweb-signup"
            icon={<img src="/site_logo/imweb.png" alt="아임웹" className="w-6 h-6 rounded" />}
            title="아임웹"
            description="회원가입 폼 추적"
            isExpanded={expandedSite === 'imweb-signup'}
            onToggle={() => toggleSite('imweb-signup')}
            onConnect={() => handleConnect('imweb')}
          >
            <div className="space-y-4">
              <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/30">
                <p className="text-indigo-400 font-medium mb-2">OAuth 연동 방식</p>
                <p className="text-slate-300 text-sm">아임웹 연동 시 회원가입 전환도 자동으로 추적됩니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="아임웹 쇼핑 추적 연동" description="위의 쇼핑 추적에서 아임웹을 먼저 연동하세요." />
                <StepCard step={2} title="회원가입 추적 활성화" description="연동 완료 후 회원가입 전환이 자동으로 추적됩니다." />
              </div>
            </div>
          </SiteGuideCard>

          {/* 일반 웹사이트/블로그 - 회원가입 */}
          <SiteGuideCard
            id="custom-signup"
            icon={<img src="/site_logo/own_site.png" alt="일반 웹사이트" className="w-6 h-6 rounded" />}
            title="일반 웹사이트/블로그"
            description="회원가입 폼 추적"
            isExpanded={expandedSite === 'custom-signup'}
            onToggle={() => toggleSite('custom-signup')}
            onConnect={() => handleConnect('custom')}
          >
            <div className="space-y-4">
              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                <p className="text-emerald-400 font-medium mb-2">스크립트 설치 방식</p>
                <p className="text-slate-300 text-sm">회원가입 완료 시 전환 이벤트 코드를 호출합니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="사이트 등록" description="내 사이트 → 일반 웹사이트/블로그 연동하기를 클릭하고 사이트 정보를 입력하세요." />
                <StepCard step={2} title="추적 스크립트 설치" description="발급된 추적 스크립트를 사이트의 <head> 태그에 삽입하세요." />
                <StepCard step={3} title="회원가입 전환 이벤트 코드 설치" description="회원가입 완료 페이지 또는 성공 시점에 전환 이벤트 코드를 호출하세요." />
              </div>
              <div className="bg-slate-900/70 rounded-lg p-4 border border-white/10">
                <p className="text-slate-400 text-sm mb-2">회원가입 전환 이벤트 코드 예시:</p>
                <pre className="text-xs text-emerald-300 overflow-x-auto whitespace-pre-wrap">
{`window.sellerport?.track('signup', {
  userId: '신규회원ID',      // 선택: 회원 고유 ID
  email: 'user@email.com'   // 선택: 회원 이메일
});`}
                </pre>
              </div>
            </div>
          </SiteGuideCard>
        </div>
      </section>

      {/* DB 추적 */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span> DB 추적
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          상담신청, 문의, 전화상담 등 DB 수집 전환을 추적합니다. 리드 획득 효율을 측정할 수 있습니다.
        </p>
        <div className="space-y-3">
          {/* 아임웹 - DB */}
          <SiteGuideCard
            id="imweb-db"
            icon={<img src="/site_logo/imweb.png" alt="아임웹" className="w-6 h-6 rounded" />}
            title="아임웹"
            description="DB 수집 폼 추적"
            isExpanded={expandedSite === 'imweb-db'}
            onToggle={() => toggleSite('imweb-db')}
            onConnect={() => handleConnect('imweb')}
          >
            <div className="space-y-4">
              <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/30">
                <p className="text-indigo-400 font-medium mb-2">OAuth 연동 방식</p>
                <p className="text-slate-300 text-sm">아임웹 연동 시 폼 제출 전환도 자동으로 추적됩니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="아임웹 쇼핑 추적 연동" description="위의 쇼핑 추적에서 아임웹을 먼저 연동하세요." />
                <StepCard step={2} title="DB 추적 활성화" description="연동 완료 후 폼 제출 전환이 자동으로 추적됩니다." />
              </div>
            </div>
          </SiteGuideCard>

          {/* 일반 웹사이트/블로그 - DB */}
          <SiteGuideCard
            id="custom-db"
            icon={<img src="/site_logo/own_site.png" alt="일반 웹사이트" className="w-6 h-6 rounded" />}
            title="일반 웹사이트/블로그"
            description="상담신청, 문의, 전화상담 추적"
            isExpanded={expandedSite === 'custom-db'}
            onToggle={() => toggleSite('custom-db')}
            onConnect={() => handleConnect('custom')}
          >
            <div className="space-y-4">
              <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                <p className="text-amber-400 font-medium mb-2">스크립트 설치 방식</p>
                <p className="text-slate-300 text-sm">상담신청/문의 폼 제출 시 전환 이벤트 코드를 호출합니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="사이트 등록" description="내 사이트 → 일반 웹사이트/블로그 연동하기를 클릭하고 사이트 정보를 입력하세요." />
                <StepCard step={2} title="추적 스크립트 설치" description="발급된 추적 스크립트를 사이트의 <head> 태그에 삽입하세요." />
                <StepCard step={3} title="DB 전환 이벤트 코드 설치" description="상담신청/문의 폼 제출 완료 시점에 전환 이벤트 코드를 호출하세요." />
              </div>
              <div className="bg-slate-900/70 rounded-lg p-4 border border-white/10">
                <p className="text-slate-400 text-sm mb-2">DB 전환 이벤트 코드 예시:</p>
                <pre className="text-xs text-amber-300 overflow-x-auto whitespace-pre-wrap">
{`window.sellerport?.track('lead', {
  formId: '폼ID',           // 선택: 폼 구분용 ID
  formName: '상담신청'       // 선택: 폼 이름
});`}
                </pre>
              </div>
            </div>
          </SiteGuideCard>
        </div>
      </section>

      {/* 전화 추적 */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          전화 추적
          <span className="px-2 py-0.5 text-[10px] bg-green-500/20 text-green-400 rounded-full font-medium">추적 링크</span>
        </h2>
        <p className="text-sm text-slate-400 mb-4">추적 링크를 통해 광고별 전화 전환을 추적합니다.</p>
        <div className="space-y-4">
          {/* 일반 웹사이트/블로그 - 전화 */}
          <SiteGuideCard
            id="custom-call"
            icon={<img src="/site_logo/own_site.png" alt="일반 웹사이트" className="w-6 h-6 rounded" />}
            title="일반 웹사이트/블로그"
            description="추적 링크 생성"
            isExpanded={expandedSite === 'custom-call'}
            onToggle={() => toggleSite('custom-call')}
            onConnect={() => handleConnect('custom')}
          >
            <div className="space-y-4">
              <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/30">
                <p className="text-green-400 font-medium mb-2">추적 링크 방식</p>
                <p className="text-slate-300 text-sm">광고에 추적 링크를 사용하면 고객이 어떤 광고를 통해 전화했는지 정확히 추적합니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="추적 링크 생성" description="내 사이트 → 전화 추적에서 추적 링크 생성을 클릭하세요." />
                <StepCard step={2} title="광고에 추적 링크 사용" description="네이버 광고, 카카오 광고 등에 생성된 추적 링크를 사용하세요." />
                <StepCard step={3} title="자동 리다이렉트" description="고객이 링크 클릭 시 광고 정보가 저장되고 도착 페이지로 이동합니다." />
                <StepCard step={4} title="전화 전환 추적" description="고객이 전화번호를 클릭하면 해당 광고의 전환으로 기록됩니다." />
              </div>
              <div className="bg-slate-900/70 rounded-lg p-4 border border-white/10">
                <p className="text-slate-400 text-sm mb-2">추적 링크 장점:</p>
                <ul className="text-xs text-green-300 space-y-1 list-disc list-inside">
                  <li>추가 비용 없음 (050 번호 비용 X)</li>
                  <li>광고별 전화 전환 정확히 추적</li>
                  <li>UTM 파라미터로 상세 분석 가능</li>
                  <li>네이버 블로그 등 스크립트 설치 불가 사이트에서도 사용 가능</li>
                </ul>
              </div>
            </div>
          </SiteGuideCard>
        </div>
      </section>

      {/* 자주 묻는 질문 */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">자주 묻는 질문</h2>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <h4 className="font-medium text-white mb-2">Q. 사이트를 여러 개 연동할 수 있나요?</h4>
            <p className="text-sm text-slate-400">네, 플랜에 따라 여러 사이트를 연동할 수 있습니다. 무료 플랜은 1개, 유료 플랜은 무제한 사이트를 연동할 수 있습니다.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <h4 className="font-medium text-white mb-2">Q. 스크립트 설치 없이도 전환 추적이 가능한가요?</h4>
            <p className="text-sm text-slate-400">네이버 스마트스토어, 카페24, 아임웹은 API 연동으로 스크립트 설치 없이 주문을 자동 수집합니다. 일반 웹사이트는 스크립트 설치가 필요합니다.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <h4 className="font-medium text-white mb-2">Q. 연동 후 데이터가 바로 수집되나요?</h4>
            <p className="text-sm text-slate-400">연동 완료 후 발생하는 주문/전환부터 수집됩니다. 과거 데이터는 플랫폼에 따라 일부 수집될 수 있습니다.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

// 사이트 가이드 카드 컴포넌트
function SiteGuideCard({
  id,
  icon,
  title,
  description,
  isExpanded,
  onToggle,
  onConnect,
  children
}: {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  isExpanded: boolean
  onToggle: () => void
  onConnect?: () => void
  children: React.ReactNode
}) {
  return (
    <div id={`site-${id}`} className={`bg-slate-900/50 rounded-xl border overflow-hidden transition-colors ${isExpanded ? 'border-blue-500/50' : 'border-slate-700/50'}`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-white font-medium">{title}</h3>
            <p className="text-slate-400 text-sm">{description}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-slate-700/50">
          <div className="pt-4">{children}</div>
          {onConnect && (
            <button
              onClick={onConnect}
              className="mt-4 w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              이 사이트 연동하러 가기
            </button>
          )}
        </div>
      )}
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

function AdChannelsContent({ initialChannel }: { initialChannel?: string | null }) {
  const router = useRouter()
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null)

  useEffect(() => {
    if (initialChannel) {
      setExpandedChannel(initialChannel)
      // 해당 채널로 스크롤
      setTimeout(() => {
        const element = document.getElementById(`channel-${initialChannel}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [initialChannel])

  const toggleChannel = (channelId: string) => {
    setExpandedChannel(expandedChannel === channelId ? null : channelId)
  }

  const handleConnect = (channelId: string) => {
    // 빠른시작 STEP 4로 이동하면서 해당 채널 선택
    router.push(`/quick-start?step=4&channel=${channelId}`)
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-bold text-white mb-4">광고 채널 연동 가이드</h2>
        <p className="text-slate-300 leading-relaxed">
          셀러포트는 다양한 광고 플랫폼과 소셜 채널을 연동하여 <span className="text-blue-400 font-semibold">광고비 대비 성과</span>를 한눈에 확인할 수 있습니다.
          각 채널별 연동 방법을 확인하세요.
        </p>
      </section>

      {/* 자체 채널 */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📱</span> 자체 채널
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          인스타그램, 유튜브, 블로그 등 내가 운영하는 채널을 등록하여 유입을 추적합니다.
        </p>
        <div className="space-y-3">
          {/* Instagram */}
          <ChannelGuideCard
            id="instagram"
            icon={
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <defs>
                  <linearGradient id="instagram-gradient-self" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#FFDC80" />
                    <stop offset="25%" stopColor="#FCAF45" />
                    <stop offset="50%" stopColor="#F77737" />
                    <stop offset="75%" stopColor="#F56040" />
                    <stop offset="100%" stopColor="#C13584" />
                  </linearGradient>
                </defs>
                <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#instagram-gradient-self)"/>
                <circle cx="12" cy="12" r="4" fill="none" stroke="white" strokeWidth="2"/>
                <circle cx="17.5" cy="6.5" r="1.5" fill="white"/>
              </svg>
            }
            title="인스타그램"
            description="Instagram 비즈니스/크리에이터 계정 자동 연동"
            isExpanded={expandedChannel === 'instagram'}
            onToggle={() => toggleChannel('instagram')}
            onConnect={() => handleConnect('instagram')}
          >
            <div className="space-y-4">
              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                <p className="text-emerald-400 font-medium mb-2">OAuth 연동 방식</p>
                <p className="text-slate-300 text-sm">Instagram 계정으로 로그인하면 자동으로 연동됩니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="비즈니스/크리에이터 계정 전환" description="Instagram 앱에서 '프로필 > 설정 > 계정 > 프로페셔널 계정으로 전환'을 선택하세요." />
                <StepCard step={2} title="셀러포트에서 연동 시작" description="광고 채널 메뉴에서 인스타그램 '연동하기' 버튼을 클릭하세요." />
                <StepCard step={3} title="Instagram 로그인" description="Instagram 계정으로 로그인하고 권한을 승인하세요." />
                <StepCard step={4} title="연동 완료" description="팔로워 수, 게시물/릴스/스토리 인사이트 등이 자동으로 수집됩니다." />
              </div>
              <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                <p className="text-amber-400 font-medium mb-2">필수 조건</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• <strong className="text-amber-300">Instagram 비즈니스/크리에이터 계정</strong>이 필요합니다</li>
                  <li>• 개인 계정은 인사이트 데이터를 제공하지 않습니다</li>
                </ul>
              </div>
            </div>
          </ChannelGuideCard>

          {/* YouTube */}
          <ChannelGuideCard
            id="youtube"
            icon={
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            }
            title="유튜브"
            description="Google 계정 OAuth 연동으로 간편하게 연결"
            isExpanded={expandedChannel === 'youtube'}
            onToggle={() => toggleChannel('youtube')}
            onConnect={() => handleConnect('youtube')}
          >
            <div className="space-y-4">
              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                <p className="text-emerald-400 font-medium mb-2">OAuth 연동 방식</p>
                <p className="text-slate-300 text-sm">Google 계정으로 로그인하면 자동으로 연동됩니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="광고 채널 메뉴 접속" description="좌측 사이드바에서 '광고 채널'을 클릭하세요." />
                <StepCard step={2} title="유튜브 선택" description="'유튜브' 카드의 연동하기 버튼을 클릭하세요." />
                <StepCard step={3} title="Google 계정 로그인" description="팝업 창에서 YouTube 채널에 연결된 Google 계정으로 로그인하세요." />
                <StepCard step={4} title="권한 승인" description="셀러포트가 YouTube 채널 데이터를 읽을 수 있도록 권한을 승인하세요." />
                <StepCard step={5} title="연동 완료" description="조회수, 구독자, 시청시간 등 채널 데이터가 자동으로 수집됩니다." />
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                <p className="text-blue-400 font-medium mb-2">수집되는 데이터</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• 조회수, 구독자 수</li>
                  <li>• 시청시간 분석</li>
                  <li>• 참여율 데이터</li>
                </ul>
              </div>
            </div>
          </ChannelGuideCard>

          {/* 네이버 블로그 */}
          <ChannelGuideCard
            id="naver-blog"
            icon={
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#03C75A">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
              </svg>
            }
            title="네이버 블로그"
            description="블로그 정보 등록 (수동 입력)"
            isExpanded={expandedChannel === 'naver-blog'}
            onToggle={() => toggleChannel('naver-blog')}
            onConnect={() => handleConnect('naver-blog')}
          >
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-white/10">
                <p className="text-slate-300 text-sm">네이버 블로그는 별도의 API가 없어 채널 정보만 등록됩니다. 추적 링크를 통한 유입 분석에 활용됩니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="네이버 블로그 접속" description="blog.naver.com에서 내 블로그로 이동하세요." />
                <StepCard step={2} title="블로그 ID 확인" description="블로그 URL에서 블로그 ID를 확인하세요. (예: blog.naver.com/myblog)" />
                <StepCard step={3} title="셀러포트에서 등록" description="광고 채널 메뉴에서 네이버 블로그를 선택하고, 블로그 별칭과 블로그 ID를 입력하세요." />
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-slate-400 font-medium mb-2">입력 정보</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• <strong className="text-white">블로그 별칭:</strong> 관리용 이름 (자유 입력)</li>
                  <li>• <strong className="text-white">블로그 ID:</strong> 네이버 블로그 ID</li>
                </ul>
              </div>
            </div>
          </ChannelGuideCard>
        </div>
      </section>

      {/* 유료 광고 */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">💰</span> 유료 광고
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          유료 광고 플랫폼과 연동하여 광고비 대비 성과(ROAS)를 분석합니다.
        </p>
        <div className="space-y-3">
          {/* Google Ads */}
          <ChannelGuideCard
            id="google-ads"
            icon={
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            }
            title="Google Ads"
            description="Google 계정 OAuth 연동으로 간편하게 연결"
            isExpanded={expandedChannel === 'google-ads'}
            onToggle={() => toggleChannel('google-ads')}
            onConnect={() => handleConnect('google-ads')}
          >
            <div className="space-y-4">
              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                <p className="text-emerald-400 font-medium mb-2">OAuth 연동 방식</p>
                <p className="text-slate-300 text-sm">Google 계정으로 로그인하면 자동으로 연동됩니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="광고 채널 메뉴 접속" description="좌측 사이드바에서 '광고 채널'을 클릭하세요." />
                <StepCard step={2} title="Google Ads 선택" description="'Google Ads' 카드의 연동하기 버튼을 클릭하세요." />
                <StepCard step={3} title="Google 계정 로그인" description="팝업 창에서 Google Ads에 사용하는 Google 계정으로 로그인하세요." />
                <StepCard step={4} title="권한 승인" description="셀러포트가 광고 데이터를 읽을 수 있도록 권한을 승인하세요." />
                <StepCard step={5} title="연동 완료" description="연동이 완료되면 광고비, 클릭, 노출 데이터가 자동으로 수집됩니다." />
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                <p className="text-blue-400 font-medium mb-2">수집되는 데이터</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• 광고비 (비용)</li>
                  <li>• 노출수, 클릭수</li>
                  <li>• 전환수, 전환가치</li>
                  <li>• 캠페인/광고그룹별 성과</li>
                </ul>
              </div>
            </div>
          </ChannelGuideCard>

          {/* Meta (Facebook/Instagram Ads) */}
          <ChannelGuideCard
            id="meta-ads"
            icon={
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <defs>
                  <linearGradient id="meta-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0088FE" />
                    <stop offset="50%" stopColor="#A033FF" />
                    <stop offset="100%" stopColor="#FF5C87" />
                  </linearGradient>
                </defs>
                <path fill="url(#meta-gradient)" d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            }
            title="Meta (Facebook/Instagram Ads)"
            description="Facebook 계정 OAuth 연동으로 간편하게 연결"
            isExpanded={expandedChannel === 'meta-ads'}
            onToggle={() => toggleChannel('meta-ads')}
            onConnect={() => handleConnect('meta')}
          >
            <div className="space-y-4">
              <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/30">
                <p className="text-emerald-400 font-medium mb-2">OAuth 연동 방식</p>
                <p className="text-slate-300 text-sm">Facebook 계정으로 로그인하면 자동으로 연동됩니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="광고 채널 메뉴 접속" description="좌측 사이드바에서 '광고 채널'을 클릭하세요." />
                <StepCard step={2} title="Meta 선택" description="'Meta' 카드의 연동하기 버튼을 클릭하세요." />
                <StepCard step={3} title="Facebook 계정 로그인" description="팝업 창에서 Meta 광고 관리자에 사용하는 Facebook 계정으로 로그인하세요." />
                <StepCard step={4} title="광고 계정 선택" description="연동할 광고 계정을 선택하고 권한을 승인하세요." />
                <StepCard step={5} title="연동 완료" description="연동이 완료되면 Facebook과 Instagram 광고 데이터가 자동으로 수집됩니다." />
              </div>
              <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30">
                <p className="text-blue-400 font-medium mb-2">수집되는 데이터</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• 광고비 (비용)</li>
                  <li>• 도달, 노출수, 클릭수</li>
                  <li>• 구매, 장바구니 추가 등 전환 이벤트</li>
                  <li>• 캠페인/광고세트/광고별 성과</li>
                </ul>
              </div>
            </div>
          </ChannelGuideCard>

          {/* 네이버 검색광고 */}
          <ChannelGuideCard
            id="naver-search"
            icon={
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="#03C75A">
                <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"/>
              </svg>
            }
            title="네이버 검색광고"
            description="API Key 연동으로 광고 성과 수집"
            isExpanded={expandedChannel === 'naver-search'}
            onToggle={() => toggleChannel('naver-search')}
            onConnect={() => handleConnect('naver-search')}
          >
            <div className="space-y-4">
              <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                <p className="text-amber-400 font-medium mb-2">API 연동 방식</p>
                <p className="text-slate-300 text-sm">네이버 검색광고 API 키가 필요합니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="네이버 검색광고 센터 접속" description="searchad.naver.com에 로그인하세요." />
                <StepCard step={2} title="도구 > API 사용 관리 메뉴" description="상단 메뉴에서 '도구' → 'API 사용 관리'를 클릭하세요." />
                <StepCard step={3} title="API 라이선스 발급" description="'API 라이선스 발급' 버튼을 클릭하여 API Key와 Secret Key를 발급받으세요." />
                <StepCard step={4} title="고객 ID 확인" description="화면 오른쪽 상단에서 고객 ID(숫자)를 확인하세요." />
                <StepCard step={5} title="셀러포트에서 연동" description="광고 채널 메뉴에서 네이버 검색광고를 선택하고, 고객 ID, API Key, Secret Key를 입력하세요." />
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-slate-400 font-medium mb-2">입력 정보</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• <strong className="text-white">고객 ID:</strong> 7자리 숫자 (예: 1234567)</li>
                  <li>• <strong className="text-white">API Key:</strong> API 사용 관리에서 발급</li>
                  <li>• <strong className="text-white">Secret Key:</strong> API 사용 관리에서 발급</li>
                </ul>
              </div>
            </div>
          </ChannelGuideCard>

          {/* 카카오 모먼트 */}
          <ChannelGuideCard
            id="kakao-moment"
            icon={
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="#FEE500" d="M12 3C6.477 3 2 6.463 2 10.691c0 2.654 1.725 4.99 4.332 6.347-.137.457-.883 2.954-.912 3.15 0 0-.019.154.082.213.1.058.217.013.217.013.286-.039 3.314-2.163 3.833-2.53.474.068.963.103 1.448.103 5.523 0 10-3.463 10-7.296S17.523 3 12 3z"/>
              </svg>
            }
            title="카카오 모먼트"
            description="REST API Key 연동으로 광고 성과 수집"
            isExpanded={expandedChannel === 'kakao-moment'}
            onToggle={() => toggleChannel('kakao-moment')}
            onConnect={() => handleConnect('kakao-moment')}
          >
            <div className="space-y-4">
              <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                <p className="text-amber-400 font-medium mb-2">API 연동 방식</p>
                <p className="text-slate-300 text-sm">카카오 비즈니스 API 키가 필요합니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="카카오 비즈니스 접속" description="business.kakao.com에 로그인하세요." />
                <StepCard step={2} title="광고 계정 ID 확인" description="카카오 모먼트 광고 관리자에서 광고 계정 ID를 확인하세요." />
                <StepCard step={3} title="Kakao Developers 접속" description="developers.kakao.com에서 앱을 생성하세요." />
                <StepCard step={4} title="REST API Key 발급" description="앱 설정에서 REST API Key를 확인하세요." />
                <StepCard step={5} title="셀러포트에서 연동" description="광고 채널 메뉴에서 카카오 모먼트를 선택하고, 광고 계정 ID와 REST API Key를 입력하세요." />
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-slate-400 font-medium mb-2">입력 정보</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• <strong className="text-white">계정 별칭:</strong> 관리용 이름 (자유 입력)</li>
                  <li>• <strong className="text-white">광고 계정 ID:</strong> 카카오 모먼트 광고 계정 ID</li>
                  <li>• <strong className="text-white">REST API Key:</strong> Kakao Developers에서 발급</li>
                </ul>
              </div>
            </div>
          </ChannelGuideCard>

          {/* TikTok Ads */}
          <ChannelGuideCard
            id="tiktok-ads"
            icon={
              <svg viewBox="0 0 24 24" className="w-6 h-6">
                <path fill="#25F4EE" d="M16.6 5.82s.51.5 0 0A4.278 4.278 0 0115.54 3h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V9.66c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V9.01a7.35 7.35 0 004.3 1.38V7.3s-1.88.09-3.24-1.48z"/>
                <path fill="#FE2C55" d="M17.6 6.82s.51.5 0 0A4.278 4.278 0 0116.54 4h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48v-3.16c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7v-5.29a7.35 7.35 0 004.3 1.38V8.3s-1.88.09-3.24-1.48z"/>
                <path fill="white" d="M17.1 6.32s.51.5 0 0A4.278 4.278 0 0116.04 3.5h-3.09v12.4a2.592 2.592 0 01-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6 0-1.72 1.66-3.01 3.37-2.48V10.16c-3.45-.46-6.47 2.22-6.47 5.64 0 3.33 2.76 5.7 5.69 5.7 3.14 0 5.69-2.55 5.69-5.7V10.51a7.35 7.35 0 004.3 1.38V8.8s-1.88.09-3.24-1.48z"/>
              </svg>
            }
            title="TikTok Ads"
            description="Marketing API 연동으로 광고 성과 수집"
            isExpanded={expandedChannel === 'tiktok-ads'}
            onToggle={() => toggleChannel('tiktok-ads')}
            onConnect={() => handleConnect('tiktok-ads')}
          >
            <div className="space-y-4">
              <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                <p className="text-amber-400 font-medium mb-2">API 연동 방식</p>
                <p className="text-slate-300 text-sm">TikTok Marketing API 인증 정보가 필요합니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="TikTok Ads Manager 접속" description="ads.tiktok.com에 로그인하세요." />
                <StepCard step={2} title="광고주 ID 확인" description="대시보드 상단에서 Advertiser ID를 확인하세요." />
                <StepCard step={3} title="TikTok for Developers 접속" description="developers.tiktok.com에서 Marketing API 앱을 생성하세요." />
                <StepCard step={4} title="API 정보 발급" description="App ID, App Secret, Access Token을 발급받으세요." />
                <StepCard step={5} title="셀러포트에서 연동" description="광고 채널 메뉴에서 TikTok Ads를 선택하고, 광고주 ID와 API 정보를 입력하세요." />
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-slate-400 font-medium mb-2">입력 정보</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• <strong className="text-white">계정 별칭:</strong> 관리용 이름 (자유 입력)</li>
                  <li>• <strong className="text-white">광고주 ID:</strong> 숫자 형태의 Advertiser ID</li>
                  <li>• <strong className="text-white">App ID / App Secret:</strong> TikTok for Developers에서 발급</li>
                  <li>• <strong className="text-white">Access Token:</strong> Long-term Access Token</li>
                </ul>
              </div>
            </div>
          </ChannelGuideCard>

          {/* 네이버 GFA */}
          <ChannelGuideCard
            id="naver-gfa"
            icon={
              <div className="w-6 h-6 bg-[#03C75A] rounded-md flex items-center justify-center">
                <span className="text-white text-[8px] font-bold">GFA</span>
              </div>
            }
            title="네이버 GFA (성과형 디스플레이)"
            description="API Key 연동으로 광고 성과 수집"
            isExpanded={expandedChannel === 'naver-gfa'}
            onToggle={() => toggleChannel('naver-gfa')}
            onConnect={() => handleConnect('naver-gfa')}
          >
            <div className="space-y-4">
              <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                <p className="text-amber-400 font-medium mb-2">API 연동 방식</p>
                <p className="text-slate-300 text-sm">네이버 GFA API 키가 필요합니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="네이버 GFA 광고 관리자 접속" description="gfa.naver.com에 로그인하세요." />
                <StepCard step={2} title="고객 ID 확인" description="광고 관리자 화면에서 고객 ID를 확인하세요." />
                <StepCard step={3} title="API 사용 신청" description="네이버 GFA API 사용을 신청하고 API Key와 Secret Key를 발급받으세요." />
                <StepCard step={4} title="셀러포트에서 연동" description="광고 채널 메뉴에서 네이버 GFA를 선택하고, 고객 ID와 API 정보를 입력하세요." />
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-slate-400 font-medium mb-2">입력 정보</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• <strong className="text-white">계정 별칭:</strong> 관리용 이름 (자유 입력)</li>
                  <li>• <strong className="text-white">고객 ID:</strong> 네이버 GFA 고객 ID</li>
                  <li>• <strong className="text-white">API Key / Secret Key:</strong> API 사용 관리에서 발급</li>
                </ul>
              </div>
            </div>
          </ChannelGuideCard>
        </div>
      </section>

      {/* 기타 */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl">📋</span> 기타
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          인플루언서, 체험단 등 기타 마케팅 채널을 수동으로 등록하여 관리합니다.
        </p>
        <div className="space-y-3">
          {/* 인플루언서 */}
          <ChannelGuideCard
            id="influencer"
            icon={
              <div className="w-6 h-6 bg-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            }
            title="인플루언서"
            description="인플루언서 채널 수동 등록"
            isExpanded={expandedChannel === 'influencer'}
            onToggle={() => toggleChannel('influencer')}
            onConnect={() => handleConnect('influencer')}
          >
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-white/10">
                <p className="text-slate-300 text-sm">인플루언서 마케팅 채널을 등록하여 추적 링크별 성과를 분석합니다. 채널 이름과 설명을 입력하여 관리하세요.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="광고 채널 메뉴 접속" description="좌측 사이드바에서 '광고 채널'을 클릭하세요." />
                <StepCard step={2} title="기타 > 인플루언서 선택" description="기타 섹션에서 '인플루언서' 채널 추가 버튼을 클릭하세요." />
                <StepCard step={3} title="채널 정보 입력" description="인플루언서 이름, 플랫폼, 팔로워 수 등 필요한 정보를 입력하세요." />
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-slate-400 font-medium mb-2">입력 정보</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• <strong className="text-white">채널 이름:</strong> 인플루언서 이름 또는 계정명</li>
                  <li>• <strong className="text-white">설명:</strong> 플랫폼, 팔로워 수 등 추가 정보 (선택)</li>
                </ul>
              </div>
            </div>
          </ChannelGuideCard>

          {/* 체험단 */}
          <ChannelGuideCard
            id="experience"
            icon={
              <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            }
            title="체험단"
            description="체험단 캠페인 수동 등록"
            isExpanded={expandedChannel === 'experience'}
            onToggle={() => toggleChannel('experience')}
            onConnect={() => handleConnect('experience')}
          >
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-white/10">
                <p className="text-slate-300 text-sm">체험단/서포터즈 마케팅 채널을 등록하여 캠페인별 성과를 분석합니다.</p>
              </div>
              <div className="space-y-3">
                <StepCard step={1} title="광고 채널 메뉴 접속" description="좌측 사이드바에서 '광고 채널'을 클릭하세요." />
                <StepCard step={2} title="기타 > 체험단 선택" description="기타 섹션에서 '체험단' 채널 추가 버튼을 클릭하세요." />
                <StepCard step={3} title="캠페인 정보 입력" description="캠페인 이름, 플랫폼, 참여자 수 등 필요한 정보를 입력하세요." />
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
                <p className="text-slate-400 font-medium mb-2">입력 정보</p>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• <strong className="text-white">채널 이름:</strong> 체험단 캠페인 이름</li>
                  <li>• <strong className="text-white">설명:</strong> 플랫폼, 참여자 수 등 추가 정보 (선택)</li>
                </ul>
              </div>
            </div>
          </ChannelGuideCard>
        </div>
      </section>

      {/* 연동 팁 */}
      <section>
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span> 연동 팁
          </h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li>• <strong className="text-white">자체 채널:</strong> 인스타그램, 유튜브는 OAuth 연동으로 자동 데이터 수집이 가능합니다.</li>
            <li>• <strong className="text-white">유료 광고:</strong> 각 플랫폼에서 API 키를 발급받아 연동하면 광고비와 성과가 자동으로 수집됩니다.</li>
            <li>• <strong className="text-white">기타 채널:</strong> 인플루언서, 체험단 등은 수동 등록 후 추적 링크로 성과를 분석합니다.</li>
            <li>• <strong className="text-white">데이터 동기화:</strong> 연동 후 데이터는 매일 자동으로 수집됩니다. 첫 동기화는 최대 24시간이 소요될 수 있습니다.</li>
          </ul>
        </div>
      </section>
    </div>
  )
}

// 채널 가이드 카드 컴포넌트
function ChannelGuideCard({
  id,
  icon,
  title,
  description,
  isExpanded,
  onToggle,
  onConnect,
  children
}: {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  isExpanded: boolean
  onToggle: () => void
  onConnect?: () => void
  children: React.ReactNode
}) {
  return (
    <div id={`channel-${id}`} className={`bg-slate-900/50 rounded-xl border overflow-hidden transition-colors ${isExpanded ? 'border-blue-500/50' : 'border-slate-700/50'}`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-white font-medium">{title}</h3>
            <p className="text-slate-400 text-sm">{description}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-slate-700/50">
          <div className="pt-4">{children}</div>
          {onConnect && (
            <button
              onClick={onConnect}
              className="mt-4 w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              이 채널 연동하러 가기
            </button>
          )}
        </div>
      )}
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
      answer: '전환 추적은 네이버 스마트스토어 연동이 필요합니다. 빠른 시작에서 스토어를 연결하면 주문 데이터가 자동으로 연동됩니다.',
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
