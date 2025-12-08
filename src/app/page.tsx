import Link from "next/link";
import { Button } from "@/components/ui/button";

// 플랫폼 로고 컴포넌트
const NaverLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#03C75A"/>
  </svg>
)

const Cafe24Logo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="16" fill="#2A2A2A"/>
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="Arial">C24</text>
  </svg>
)

const ImwebLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="16" fill="#6366F1"/>
    <text x="50" y="65" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold" fontFamily="Arial">IM</text>
  </svg>
)

const GodoLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="16" fill="#FF6B35"/>
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">GODO</text>
  </svg>
)

const MakeshopLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="16" fill="#E91E63"/>
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial">MAKE</text>
  </svg>
)

const CoupangLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="16" fill="#E31837"/>
    <path d="M25 50C25 36.2 36.2 25 50 25C58.5 25 66 29.5 70.5 36L62 42C59.5 38 55 35 50 35C41.7 35 35 41.7 35 50C35 58.3 41.7 65 50 65C55 65 59.5 62 62 58L70.5 64C66 70.5 58.5 75 50 75C36.2 75 25 63.8 25 50Z" fill="white"/>
  </svg>
)

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f0f13] text-white">
      {/* 헤더 */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0f0f13]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-white">
              셀러포트
            </h1>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/5">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-blue-600 text-white hover:bg-blue-500 transition-all duration-300">
                  무료로 시작하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <main className="pt-16">
        <section className="relative overflow-hidden">
          {/* 배경 그라데이션 효과 */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-600/20 via-purple-600/10 to-transparent rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-sm text-blue-400 mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              네이버 스마트스토어 연동 지원
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in-up">
              이커머스 정기구독
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                통합 관리 플랫폼
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              여러 플랫폼의 정기구독 고객을 한 곳에서 관리하고,
              <br className="hidden sm:block" />
              카카오 알림톡으로 고객 이탈을 방지하세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-500 text-lg px-8 h-14 w-full sm:w-auto transition-all duration-300 hover:scale-105">
                  무료로 시작하기
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-gray-700 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white hover:border-gray-600 text-lg px-8 h-14 w-full sm:w-auto transition-all duration-300">
                  자세히 알아보기
                </Button>
              </Link>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-white/10 max-w-2xl mx-auto animate-fade-in-up animation-delay-600">
              <div className="group">
                <p className="text-3xl sm:text-4xl font-bold text-white transition-transform duration-300 group-hover:scale-110">99.9%</p>
                <p className="text-sm text-gray-500 mt-1">서비스 안정성</p>
              </div>
              <div className="group">
                <p className="text-3xl sm:text-4xl font-bold text-white transition-transform duration-300 group-hover:scale-110">10+</p>
                <p className="text-sm text-gray-500 mt-1">연동 플랫폼</p>
              </div>
              <div className="group">
                <p className="text-3xl sm:text-4xl font-bold text-white transition-transform duration-300 group-hover:scale-110">24/7</p>
                <p className="text-sm text-gray-500 mt-1">실시간 모니터링</p>
              </div>
            </div>
          </div>
        </section>

        {/* 기능 소개 */}
        <section id="features" className="py-24 bg-[#0a0a0e]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-wide">Features</p>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                왜 셀러포트인가요?
              </h3>
              <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                복잡한 정기구독 관리를 간단하게. 셀러포트 하나로 모든 것을 해결하세요.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="group p-8 rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent border border-white/10 hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold mb-3">멀티 플랫폼 통합</h4>
                <p className="text-gray-500 leading-relaxed">
                  네이버 스마트스토어, 카페24, 아임웹 등 다양한 플랫폼의 구독자를 한 대시보드에서 통합 관리
                </p>
              </div>

              <div className="group p-8 rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent border border-white/10 hover:border-amber-500/30 transition-all duration-500 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold mb-3">카카오 알림톡 자동화</h4>
                <p className="text-gray-500 leading-relaxed">
                  결제 실패, 배송 알림, 재구독 유도까지 자동 알림톡 발송으로 고객 경험 향상
                </p>
              </div>

              <div className="group p-8 rounded-2xl bg-gradient-to-b from-white/[0.08] to-transparent border border-white/10 hover:border-violet-500/30 transition-all duration-500 hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold mb-3">이탈 예측 & 방지</h4>
                <p className="text-gray-500 leading-relaxed">
                  AI 기반 이탈 예측 시스템으로 결제 실패 고객을 자동 감지하고 선제적으로 대응
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 지원 플랫폼 */}
        <section className="py-20 bg-[#0f0f13]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 mb-10 font-medium">연동 지원 플랫폼</p>
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
              <div className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1f] border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-green-500/30 group-hover:bg-[#1a1a1f]">
                  <NaverLogo className="w-8 h-8" />
                </div>
                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-300 transition-colors">스마트스토어</span>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1f] border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-white/20 overflow-hidden">
                  <Cafe24Logo className="w-12 h-12" />
                </div>
                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-300 transition-colors">카페24</span>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1f] border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-indigo-500/30 overflow-hidden">
                  <ImwebLogo className="w-12 h-12" />
                </div>
                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-300 transition-colors">아임웹</span>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1f] border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-orange-500/30 overflow-hidden">
                  <GodoLogo className="w-12 h-12" />
                </div>
                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-300 transition-colors">고도몰</span>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1f] border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-pink-500/30 overflow-hidden">
                  <MakeshopLogo className="w-12 h-12" />
                </div>
                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-300 transition-colors">메이크샵</span>
              </div>
              <div className="flex flex-col items-center gap-3 group">
                <div className="w-16 h-16 rounded-2xl bg-[#1a1a1f] border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-red-500/30 overflow-hidden">
                  <CoupangLogo className="w-12 h-12" />
                </div>
                <span className="text-xs font-medium text-gray-500 group-hover:text-gray-300 transition-colors">쿠팡</span>
              </div>
            </div>
          </div>
        </section>

        {/* 플랜 소개 */}
        <section className="py-24 bg-[#0a0a0e]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-wide">Pricing</p>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                심플한 요금제
              </h3>
              <p className="text-gray-500 text-lg">
                비즈니스 규모에 맞는 플랜을 선택하세요
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-5 max-w-6xl mx-auto">
              {[
                { name: 'Free', price: '0', subscribers: '10명', platforms: '1개', features: ['기본 대시보드', '이메일 지원'] },
                { name: 'Basic', price: '50,000', subscribers: '100명', platforms: '2개', features: ['알림톡 1,000건/월', '우선 지원'] },
                { name: 'Pro', price: '100,000', subscribers: '500명', platforms: '4개', popular: true, features: ['알림톡 5,000건/월', '이탈 예측', 'API 액세스'] },
                { name: 'Enterprise', price: '별도 협의', subscribers: '무제한', platforms: '무제한', features: ['알림톡 무제한', '전담 매니저', 'SLA 보장'] },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl p-7 transition-all duration-500 hover:-translate-y-2 ${
                    plan.popular
                      ? 'bg-gradient-to-b from-blue-600 to-blue-700 scale-105'
                      : 'bg-[#16161b] border border-white/10 hover:border-white/20'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-amber-400 text-amber-900 px-4 py-1 rounded-full">
                      추천
                    </span>
                  )}
                  <h4 className={`text-lg font-semibold ${plan.popular ? 'text-blue-100' : 'text-gray-400'}`}>{plan.name}</h4>
                  <p className={`text-3xl font-bold mt-3 mb-2 ${plan.popular ? 'text-white' : 'text-white'}`}>
                    {plan.price === '별도 협의' ? (
                      <span className="text-xl">별도 협의</span>
                    ) : (
                      <>₩{plan.price}</>
                    )}
                    {plan.price !== '별도 협의' && (
                      <span className={`text-sm font-normal ${plan.popular ? 'text-blue-200' : 'text-gray-500'}`}>/월</span>
                    )}
                  </p>
                  <p className={`text-sm mb-5 ${plan.popular ? 'text-blue-200' : 'text-gray-500'}`}>
                    구독자 {plan.subscribers} · 플랫폼 {plan.platforms}
                  </p>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className={`flex items-center text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-400'}`}>
                        <svg className={`w-4 h-4 mr-2 ${plan.popular ? 'text-blue-300' : 'text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="block">
                    <Button
                      className={`w-full transition-all duration-300 hover:scale-105 ${
                        plan.popular
                          ? 'bg-white text-blue-600 hover:bg-blue-50'
                          : 'bg-white/10 hover:bg-white/15 text-white border-0'
                      }`}
                    >
                      시작하기
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="py-24 bg-[#0f0f13] relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-600/20 via-violet-600/20 to-purple-600/20 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-3xl sm:text-4xl font-bold mb-6">
              지금 바로 시작하세요
            </h3>
            <p className="text-xl text-gray-400 mb-10">
              무료로 시작하고, 비즈니스가 성장하면 업그레이드하세요.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-500 text-lg px-10 h-14 transition-all duration-300 hover:scale-105">
                무료 체험 시작하기
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-[#0a0a0e] border-t border-white/5 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-12">
              <div className="md:col-span-2">
                <h5 className="text-xl font-bold mb-4">셀러포트</h5>
                <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                  이커머스 정기구독 통합 관리 플랫폼.
                  여러 플랫폼의 구독자를 한 곳에서 관리하고 고객 이탈을 방지하세요.
                </p>
              </div>
              <div>
                <h6 className="font-semibold mb-4 text-gray-300">서비스</h6>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li><Link href="#features" className="hover:text-white transition-colors duration-300">기능 소개</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors duration-300">요금제</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors duration-300">고객 사례</Link></li>
                </ul>
              </div>
              <div>
                <h6 className="font-semibold mb-4 text-gray-300">회사</h6>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li><Link href="#" className="hover:text-white transition-colors duration-300">이용약관</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors duration-300">개인정보처리방침</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors duration-300">문의하기</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-gray-600">
                어시스트 솔루션 (602-27-04681)
              </p>
              <p className="text-sm text-gray-600">
                © 2024 SellerPort. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
