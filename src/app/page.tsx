'use client'

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const router = useRouter()

  // Supabase가 홈으로 리다이렉트할 때 code 파라미터를 감지하여 reset-password로 전달
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    if (code) {
      // code가 있으면 바로 비밀번호 재설정 페이지로 리다이렉트
      router.replace(`/reset-password?code=${code}`)
      return
    }
  }, [router])

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsLoggedIn(!!user)
    }
    checkAuth()
  }, [])

  // 방문자 로그 전송
  useEffect(() => {
    const logVisit = async () => {
      try {
        // 고유 방문자 ID 생성/조회 (localStorage)
        let visitorId = localStorage.getItem('sp_visitor_id')
        if (!visitorId) {
          visitorId = crypto.randomUUID()
          localStorage.setItem('sp_visitor_id', visitorId)
        }

        // 세션 ID (sessionStorage)
        let sessionId = sessionStorage.getItem('sp_session_id')
        if (!sessionId) {
          sessionId = crypto.randomUUID()
          sessionStorage.setItem('sp_session_id', sessionId)
        }

        // UTM 파라미터 추출
        const urlParams = new URLSearchParams(window.location.search)

        // 추적 링크 ID 확인 (URL 파라미터 또는 쿠키에서)
        const spClick = urlParams.get('sp_click')
        const spTrackingLink = document.cookie
          .split('; ')
          .find(row => row.startsWith('sp_tracking_link='))
          ?.split('=')[1]

        await fetch('/api/analytics/visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pagePath: window.location.pathname,
            utmSource: urlParams.get('utm_source'),
            utmMedium: urlParams.get('utm_medium'),
            utmCampaign: urlParams.get('utm_campaign'),
            utmContent: urlParams.get('utm_content'),
            utmTerm: urlParams.get('utm_term'),
            referer: document.referrer || null,
            visitorId,
            sessionId,
            spClick: spClick || null,
            trackingLinkId: spTrackingLink || null,
          }),
        })
      } catch (error) {
        // 로그 실패해도 무시 (사용자 경험에 영향 X)
        console.error('Visit log error:', error)
      }
    }

    logVisit()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setIsLoggedIn(false)
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white overflow-hidden">
      {/* 헤더 */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-[#0A0F1C]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="셀러포트"
                width={140}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard">
                    <Button className="bg-blue-500 hover:bg-blue-400 text-white font-medium">
                      대시보드
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="text-gray-300 hover:text-white hover:bg-white/10"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                      로그인
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-blue-500 hover:bg-blue-400 text-white font-medium">
                      무료로 시작하기
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <main className="pt-16">
        <section className="relative bg-[#0A0F1C]">
          {/* 배경 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-transparent to-transparent"></div>
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-blue-500/8 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-1/4 w-72 h-72 bg-cyan-500/8 rounded-full blur-3xl"></div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* 왼쪽: 메시지 */}
              <div className="text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 mb-6">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                  <span className="text-blue-300 text-sm font-medium">7일 무료 체험</span>
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6">
                  어떤 콘텐츠가<br/>
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    돈 버는지
                  </span>
                  <br/>알고 계세요?
                </h1>

                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                  릴스 10개 올렸는데, 주문은 어디서 온 걸까요?<br/>
                  <span className="text-white">셀러포트가 바로 알려드립니다.</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <Link href="/signup">
                    <Button size="lg" className="bg-blue-500 hover:bg-blue-400 text-white text-lg px-8 h-14 font-semibold rounded-xl shadow-lg shadow-blue-500/25 border-0">
                      무료로 시작하기
                    </Button>
                  </Link>
                  <Link href="#how-it-works">
                    <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 h-14 rounded-xl bg-white/5">
                      어떻게 작동하나요?
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center gap-6 text-sm text-gray-400">
                  {['스마트스토어', '카페24', '아임웹'].map((platform) => (
                    <div key={platform} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span>{platform}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 오른쪽: 데모 미리보기 */}
              <div className="relative">
                {/* 배경 글로우 효과 */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-3xl blur-2xl"></div>

                <div className="relative bg-[#111827] rounded-2xl border border-white/10 p-5 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#FF5F57]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#28CA41]"></div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">콘텐츠별 주문 현황</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-semibold">신상 릴스</p>
                          <p className="text-sm text-gray-500">3일 전</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-emerald-400 font-bold text-lg">23건</p>
                        <p className="text-sm text-gray-500">₩1.84M</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-semibold">착샷 피드</p>
                          <p className="text-sm text-gray-500">1주일 전</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-400 font-bold text-lg">5건</p>
                        <p className="text-sm text-gray-500">₩400K</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-400 to-red-500 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-semibold">스토리 광고</p>
                          <p className="text-sm text-gray-500">광고비 ₩50K</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-rose-400 font-bold text-lg">0건</p>
                        <p className="text-sm text-gray-500">효과없음</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <p className="text-blue-300 font-medium text-sm text-center flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      릴스 콘텐츠에 집중하세요!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3단계 설명 */}
        <section id="how-it-works" className="py-20 bg-[#0A0F1C]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                3단계로 끝
              </h2>
              <p className="text-gray-400 text-lg">복잡한 설정 없이 바로 시작</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="relative p-6 rounded-2xl bg-[#111827] border border-white/5 hover:border-blue-500/30 transition-all group">
                <div className="absolute -top-4 left-6 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">1</div>
                <div className="pt-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">쇼핑몰 연결</h3>
                  <p className="text-gray-400">스마트스토어, 카페24, 아임웹<br/>클릭 한 번으로 연동 완료</p>
                </div>
              </div>

              <div className="relative p-6 rounded-2xl bg-[#111827] border border-white/5 hover:border-sky-500/30 transition-all group">
                <div className="absolute -top-4 left-6 w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">2</div>
                <div className="pt-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">콘텐츠 발행</h3>
                  <p className="text-gray-400">콘텐츠 등록하면<br/><span className="text-sky-300 font-medium">추적 링크 자동 생성</span></p>
                </div>
              </div>

              <div className="relative p-6 rounded-2xl bg-[#111827] border border-white/5 hover:border-cyan-500/30 transition-all group">
                <div className="absolute -top-4 left-6 w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">3</div>
                <div className="pt-4">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">주문 확인</h3>
                  <p className="text-gray-400">어떤 콘텐츠에서 주문 왔는지<br/>대시보드에서 바로 확인</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 이런 고민 + 요금제 합치기 */}
        <section className="py-20 bg-[#111827]/50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* 왼쪽: 고민 */}
              <div>
                <h3 className="text-3xl sm:text-4xl font-bold mb-8 text-white">
                  이런 고민 있으시죠?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#111827] border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      "릴스 10개 올렸는데, <span className="text-blue-300 font-medium">어떤 게 주문으로 이어졌는지</span> 모르겠어요"
                    </p>
                  </div>
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#111827] border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      "광고비는 나가는데, <span className="text-sky-300 font-medium">어떤 광고가 효과 있는지</span> 감으로만 판단해요"
                    </p>
                  </div>
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#111827] border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      "주문은 들어오는데, <span className="text-cyan-300 font-medium">어떤 콘텐츠 덕분인지</span> 알 수가 없어요"
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <div className="w-10 h-1 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"></div>
                  <p className="text-blue-300 font-semibold">셀러포트가 정확히 알려드립니다</p>
                </div>
              </div>

              {/* 오른쪽: 요금제 */}
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 rounded-3xl blur-2xl"></div>
                <div className="relative rounded-2xl p-8 bg-[#111827] border border-white/10 shadow-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-2xl font-bold text-white">프리미엄</h4>
                    <span className="px-4 py-1.5 rounded-full bg-blue-500/15 text-blue-300 text-sm font-bold border border-blue-500/20">
                      7일 무료
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-5xl font-bold text-white">12,900원</span>
                    <span className="text-gray-400 text-lg">/월</span>
                  </div>

                  <div className="space-y-3 mb-6">
                    {['무제한 추적 링크', '콘텐츠별 주문 추적', '실시간 대시보드', '멀티 쇼핑몰 지원'].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 text-gray-300">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <Link href="/signup">
                    <Button className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white text-lg font-semibold rounded-xl shadow-lg shadow-blue-500/25 border-0">
                      무료로 시작하기
                    </Button>
                  </Link>
                  <p className="text-center text-sm text-gray-500 mt-4">카드 등록 없이 바로 시작</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 간단한 CTA */}
        <section className="py-20 bg-[#0A0F1C] relative overflow-hidden">
          {/* 배경 효과 */}
          <div className="absolute inset-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/15 rounded-full blur-[100px]"></div>
            <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-cyan-500/10 rounded-full blur-[80px]"></div>
          </div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h3 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                어떤 콘텐츠가 돈 버는지,<br className="sm:hidden" /> 지금 확인하세요
              </h3>
              <p className="text-gray-400 text-lg mb-8">7일 무료 체험으로 바로 시작</p>
              <Link href="/signup">
                <Button size="lg" className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-12 h-14 text-lg rounded-xl shadow-lg shadow-blue-500/25 border-0">
                  무료로 시작하기
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-[#0A0F1C] border-t border-white/5 py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-6">
              {/* 상단: 로고 + 링크 */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Link href="/">
                  <Image
                    src="/logo.png"
                    alt="셀러포트"
                    width={120}
                    height={28}
                    className="h-7 w-auto"
                  />
                </Link>
                <div className="flex gap-6 text-sm text-gray-400">
                  <Link href="/terms" className="hover:text-gray-300 transition-colors">이용약관</Link>
                  <Link href="/privacy" className="hover:text-gray-300 transition-colors">개인정보처리방침</Link>
                </div>
              </div>

              {/* 구분선 */}
              <div className="border-t border-white/5"></div>

              {/* 하단: 사업자 정보 */}
              <div className="text-sm text-gray-500 space-y-1">
                <p className="font-medium text-gray-400">어시스트솔루션</p>
                <p>대표: 배철응 | 사업자등록번호: 602-27-04681</p>
                <p>주소: 서울시 광진구 화양동 15-51</p>
                <p>이메일: support@sellerport.io</p>
                <p className="pt-2 text-gray-600">© 2025 SellerPort. All rights reserved.</p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
