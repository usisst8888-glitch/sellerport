import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* 헤더 */}
      <header className="border-b bg-white/80 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">셀러포트</h1>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">로그인</Button>
              </Link>
              <Link href="/signup">
                <Button>무료로 시작하기</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <main className="pt-16">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            이커머스 정기구독<br />
            <span className="text-blue-600">통합 관리의 시작</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            여러 플랫폼의 정기구독 고객을 한 곳에서 관리하고,
            알림톡으로 고객 이탈을 막으세요.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6">
                무료로 시작하기
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                로그인
              </Button>
            </Link>
          </div>
        </section>

        {/* 기능 소개 */}
        <section className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-16">
              왜 셀러포트인가요?
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-2">통합 관리</h4>
                <p className="text-gray-600">
                  네이버 스마트스토어, 카페24, 아임웹 등 여러 플랫폼의 구독자를 한 곳에서
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-2">카카오 알림톡</h4>
                <p className="text-gray-600">
                  결제 실패, 배송 알림, 재구독 유도까지 자동 알림톡 발송
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold mb-2">이탈 방지</h4>
                <p className="text-gray-600">
                  결제 실패 고객 자동 감지, 이탈 예측으로 선제적 대응
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 플랜 소개 */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-16">
              요금제
            </h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { name: 'Free', price: '0', subscribers: '10명', platforms: '1개' },
                { name: 'Basic', price: '50,000', subscribers: '100명', platforms: '2개' },
                { name: 'Pro', price: '100,000', subscribers: '500명', platforms: '4개', popular: true },
                { name: 'Enterprise', price: '200,000', subscribers: '무제한', platforms: '무제한' },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-2xl p-6 ${
                    plan.popular
                      ? 'bg-blue-600 text-white ring-4 ring-blue-600 ring-offset-2'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  {plan.popular && (
                    <span className="text-xs font-semibold bg-white text-blue-600 px-2 py-1 rounded-full">
                      인기
                    </span>
                  )}
                  <h4 className={`text-xl font-bold mt-4 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h4>
                  <p className={`text-3xl font-bold mt-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    ₩{plan.price}
                    <span className={`text-sm font-normal ${plan.popular ? 'text-blue-100' : 'text-gray-500'}`}>/월</span>
                  </p>
                  <ul className={`mt-6 space-y-3 text-sm ${plan.popular ? 'text-blue-100' : 'text-gray-600'}`}>
                    <li>구독자 {plan.subscribers}</li>
                    <li>플랫폼 {plan.platforms}</li>
                    <li>알림톡 발송</li>
                  </ul>
                  <Link href="/signup" className="block mt-6">
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-white text-blue-600 hover:bg-blue-50'
                          : ''
                      }`}
                      variant={plan.popular ? 'secondary' : 'default'}
                    >
                      시작하기
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-4 md:mb-0">
                <h5 className="text-white font-bold text-lg">셀러포트</h5>
                <p className="text-sm mt-1">어시스트 솔루션 (602-27-04681)</p>
              </div>
              <div className="text-sm">
                © 2024 SellerPort. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
