import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* 헤더 */}
      <header className="fixed top-0 w-full z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              셀러포트
            </h1>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-white text-black hover:bg-gray-200">
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
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/30 rounded-full blur-[120px]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 sm:py-40 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/20 bg-white/5 text-sm text-gray-300 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              네이버 스마트스토어 연동 지원
            </div>

            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8">
              이커머스 정기구독
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                통합 관리 플랫폼
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              여러 플랫폼의 정기구독 고객을 한 곳에서 관리하고,
              <br className="hidden sm:block" />
              카카오 알림톡으로 고객 이탈을 방지하세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-8 h-14 w-full sm:w-auto">
                  무료로 시작하기
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 h-14 w-full sm:w-auto">
                  자세히 알아보기
                </Button>
              </Link>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-3 gap-8 mt-20 pt-12 border-t border-white/10 max-w-2xl mx-auto">
              <div>
                <p className="text-3xl sm:text-4xl font-bold">99.9%</p>
                <p className="text-sm text-gray-500 mt-1">서비스 안정성</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold">10+</p>
                <p className="text-sm text-gray-500 mt-1">연동 플랫폼</p>
              </div>
              <div>
                <p className="text-3xl sm:text-4xl font-bold">24/7</p>
                <p className="text-sm text-gray-500 mt-1">실시간 모니터링</p>
              </div>
            </div>
          </div>
        </section>

        {/* 기능 소개 */}
        <section id="features" className="py-32 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <p className="text-blue-400 font-medium mb-4">FEATURES</p>
              <h3 className="text-4xl sm:text-5xl font-bold mb-6">
                왜 셀러포트인가요?
              </h3>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                복잡한 정기구독 관리를 간단하게. 셀러포트 하나로 모든 것을 해결하세요.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="group p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-3">멀티 플랫폼 통합</h4>
                <p className="text-gray-400 leading-relaxed">
                  네이버 스마트스토어, 카페24, 아임웹 등 다양한 플랫폼의 구독자를 한 대시보드에서 통합 관리
                </p>
              </div>

              <div className="group p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-3">카카오 알림톡 자동화</h4>
                <p className="text-gray-400 leading-relaxed">
                  결제 실패, 배송 알림, 재구독 유도까지 자동 알림톡 발송으로 고객 경험 향상
                </p>
              </div>

              <div className="group p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-3">이탈 예측 & 방지</h4>
                <p className="text-gray-400 leading-relaxed">
                  AI 기반 이탈 예측 시스템으로 결제 실패 고객을 자동 감지하고 선제적으로 대응
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 지원 플랫폼 */}
        <section className="py-24 border-t border-white/10 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-500 mb-12">연동 지원 플랫폼</p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
              <span className="text-2xl font-bold text-gray-400">네이버 스마트스토어</span>
              <span className="text-2xl font-bold text-gray-400">카페24</span>
              <span className="text-2xl font-bold text-gray-400">아임웹</span>
              <span className="text-2xl font-bold text-gray-400">고도몰</span>
              <span className="text-2xl font-bold text-gray-400">메이크샵</span>
            </div>
          </div>
        </section>

        {/* 플랜 소개 */}
        <section className="py-32 border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <p className="text-blue-400 font-medium mb-4">PRICING</p>
              <h3 className="text-4xl sm:text-5xl font-bold mb-6">
                심플한 요금제
              </h3>
              <p className="text-gray-400 text-lg">
                비즈니스 규모에 맞는 플랜을 선택하세요
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {[
                { name: 'Free', price: '0', subscribers: '10명', platforms: '1개', features: ['기본 대시보드', '이메일 지원'] },
                { name: 'Basic', price: '50,000', subscribers: '100명', platforms: '2개', features: ['알림톡 1,000건/월', '우선 지원'] },
                { name: 'Pro', price: '100,000', subscribers: '500명', platforms: '4개', popular: true, features: ['알림톡 5,000건/월', '이탈 예측', 'API 액세스'] },
                { name: 'Enterprise', price: '별도 협의', subscribers: '무제한', platforms: '무제한', features: ['알림톡 무제한', '전담 매니저', 'SLA 보장'] },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl p-8 transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-b from-blue-600 to-blue-700 scale-105 shadow-2xl shadow-blue-500/20'
                      : 'bg-white/5 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-white text-blue-600 px-3 py-1 rounded-full">
                      추천
                    </span>
                  )}
                  <h4 className="text-lg font-semibold text-gray-300">{plan.name}</h4>
                  <p className="text-4xl font-bold mt-4 mb-2">
                    {plan.price === '별도 협의' ? (
                      <span className="text-2xl">별도 협의</span>
                    ) : (
                      <>₩{plan.price}</>
                    )}
                    {plan.price !== '별도 협의' && (
                      <span className="text-base font-normal text-gray-500">/월</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    구독자 {plan.subscribers} · 플랫폼 {plan.platforms}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center text-sm text-gray-400">
                        <svg className={`w-4 h-4 mr-2 ${plan.popular ? 'text-blue-200' : 'text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href="/signup" className="block">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-white text-blue-600 hover:bg-gray-100'
                          : 'bg-white/10 hover:bg-white/20 text-white'
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
        <section className="py-32 border-t border-white/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-4xl sm:text-5xl font-bold mb-6">
              지금 바로 시작하세요
            </h3>
            <p className="text-xl text-gray-400 mb-10">
              무료로 시작하고, 비즈니스가 성장하면 업그레이드하세요.
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-white text-black hover:bg-gray-200 text-lg px-10 h-14">
                무료 체험 시작하기
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Button>
            </Link>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="border-t border-white/10 py-16">
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
                  <li><Link href="#features" className="hover:text-white transition-colors">기능 소개</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">요금제</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">고객 사례</Link></li>
                </ul>
              </div>
              <div>
                <h6 className="font-semibold mb-4 text-gray-300">회사</h6>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li><Link href="#" className="hover:text-white transition-colors">이용약관</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">개인정보처리방침</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors">문의하기</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
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
