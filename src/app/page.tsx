'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// 사이트 로고 컴포넌트
const NaverLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#03C75A"/>
  </svg>
)

const CoupangLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="16" fill="#E31837"/>
    <text x="50" y="62" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">CPNG</text>
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

const CustomSiteLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none">
    <rect width="100" height="100" rx="16" fill="#10B981"/>
    <path d="M30 35h40M30 50h40M30 65h25" stroke="white" strokeWidth="6" strokeLinecap="round"/>
  </svg>
)

// 카운터 애니메이션 훅
function useCountUp(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.5 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    let startTime: number
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime
      const progress = Math.min((currentTime - startTime) / duration, 1)

      const easeProgress = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeProgress * end))

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isVisible, end, duration])

  return { count, ref }
}


export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const stat1 = useCountUp(99, 2000)
  const stat2 = useCountUp(847, 1500)
  const stat3 = useCountUp(24, 1800)
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
    <div className="min-h-screen bg-slate-800 text-white overflow-hidden">
      {/* 헤더 */}
      <header className="fixed top-0 w-full z-50 border-b border-slate-700/50 bg-slate-800/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold">S</span>
              </div>
              셀러포트
            </h1>
            <div className="flex items-center gap-3">
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard">
                    <Button className="bg-blue-600 text-white hover:bg-blue-500 transition-all duration-200">
                      대시보드
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="text-slate-300 hover:text-white hover:bg-slate-700"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-700">
                      로그인
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-blue-600 text-white hover:bg-blue-500 transition-all duration-200">
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
        <section className="relative min-h-[90vh] flex items-center">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-animate" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-400/40 bg-blue-500/10 backdrop-blur-sm text-sm text-blue-300 mb-8 animate-fade-in hover:bg-blue-500/20 transition-colors cursor-default">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400"></span>
              </span>
              모든 온라인 비즈니스를 위한 광고 성과 분석 플랫폼
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-fade-in-up">
              <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                광고 전환 추적
              </span>
              부터
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">
                성과 분석
              </span>
              까지
            </h2>

            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
              광고 효율을 <span className="text-green-400 font-semibold">🟢</span><span className="text-yellow-400 font-semibold">🟡</span><span className="text-red-400 font-semibold">🔴</span> 신호등으로 한눈에 파악하고,
              <br className="hidden sm:block" />
              모든 채널의 성과를 통합 관리하세요
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
              <Link href="/signup">
                <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-500 text-lg px-8 h-14 w-full sm:w-auto transition-all duration-200">
                  무료로 시작하기
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 text-lg px-8 h-14 w-full sm:w-auto transition-all duration-200">
                  기능 살펴보기
                </Button>
              </Link>
            </div>

            {/* 핵심 가치 플로우 */}
            <div className="mt-16 p-6 rounded-2xl bg-slate-900/50 border border-slate-700/50 max-w-4xl mx-auto animate-fade-in-up animation-delay-600">
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-sm sm:text-base">
                <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300">광고 집행</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300">전환 추적</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300">데이터 수집</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-pink-500/20 text-pink-300">성과 분석</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">신호등 알림</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-1.5 rounded-lg bg-green-500/20 text-green-300 font-semibold">광고 최적화</span>
              </div>
            </div>

            {/* 핵심 수치 */}
            <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-slate-700/50 max-w-3xl mx-auto animate-fade-in-up animation-delay-600">
              <div className="group" ref={stat1.ref}>
                <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-110">
                  {stat1.count}.9%
                </p>
                <p className="text-sm text-slate-400 mt-2">서비스 안정성</p>
              </div>
              <div className="group" ref={stat2.ref}>
                <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-110">
                  {stat2.count}+
                </p>
                <p className="text-sm text-slate-400 mt-2">가입자 수</p>
              </div>
              <div className="group" ref={stat3.ref}>
                <p className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent transition-transform duration-300 group-hover:scale-110">
                  {stat3.count}/7
                </p>
                <p className="text-sm text-slate-400 mt-2">실시간 모니터링</p>
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </section>

        {/* 문제 공감 섹션 */}
        <section className="py-20 bg-slate-900/80 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-widest">Pain Points</p>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                이런 경험 <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">있으시죠?</span>
              </h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: '📱', text: '인스타 열심히 올리는데 뭐가 효과 있는지 모름' },
                { icon: '💸', text: '광고비는 나가는데 매출이랑 연결이 안 됨' },
                { icon: '🤝', text: '인플루언서한테 협찬 줬는데 효과가 있었는지 모름' },
                { icon: '📊', text: '엑셀로 정리하다가 포기' },
                { icon: '📋', text: '대행사 보고서 믿는 수밖에 없음' },
                { icon: '🧮', text: '매출 100만원인데 실제로 얼마 남았지?' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-red-500/30 transition-all duration-300 flex items-start gap-3"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <p className="text-slate-300 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-xl text-slate-400">
                이제 <span className="text-blue-400 font-semibold">셀러포트</span>로 해결하세요
              </p>
            </div>
          </div>
        </section>

        {/* 타겟별 케이스 섹션 */}
        <section className="py-20 bg-slate-800 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-widest">Use Cases</p>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                이렇게 <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">해결했어요</span>
              </h3>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* 케이스 A */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-blue-600/10 to-slate-800/50 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-xl">📱</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">인스타 운영 초보 셀러</h4>
                    <p className="text-xs text-slate-400">SNS 마케팅</p>
                  </div>
                </div>

                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-300">
                    <span className="font-semibold">문제:</span> "주문 들어왔는데 어떤 게시물 보고 온 건지 모름"
                  </p>
                </div>

                <div className="mb-4 p-3 rounded-lg bg-slate-900/50 space-y-2">
                  <p className="text-xs text-slate-500 mb-2">셀러포트 분석 결과</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">릴스 A</span>
                    <span className="text-sm text-emerald-400 font-bold">주문 12건</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">착샷 게시물</span>
                    <span className="text-sm text-yellow-400 font-bold">주문 2건</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">스토리</span>
                    <span className="text-sm text-red-400 font-bold">주문 0건</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm text-emerald-300">
                    <span className="font-semibold">결론:</span> "아, 릴스가 진짜 효과 있네. 릴스 더 만들어야겠다"
                  </p>
                </div>
              </div>

              {/* 케이스 B */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-violet-600/10 to-slate-800/50 border border-violet-500/30 hover:border-violet-400/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <span className="text-xl">💰</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">광고비 쓰는 셀러</h4>
                    <p className="text-xs text-slate-400">유료 광고</p>
                  </div>
                </div>

                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-300">
                    <span className="font-semibold">문제:</span> "여기저기 광고하는데 뭐가 효과인지 모름"
                  </p>
                </div>

                <div className="mb-4 p-3 rounded-lg bg-slate-900/50 space-y-2">
                  <p className="text-xs text-slate-500 mb-2">셀러포트 분석 결과</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">네이버 광고</span>
                    <span className="text-sm text-emerald-400 font-bold">ROAS 320% 🟢</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">카카오 광고</span>
                    <span className="text-sm text-red-400 font-bold">ROAS 85% 🔴</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm text-emerald-300">
                    <span className="font-semibold">결론:</span> "네이버에 예산 집중하자!"
                  </p>
                </div>
              </div>

              {/* 케이스 C */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-pink-600/10 to-slate-800/50 border border-pink-500/30 hover:border-pink-400/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <span className="text-xl">🤝</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">인플루언서 협찬 셀러</h4>
                    <p className="text-xs text-slate-400">협찬 마케팅</p>
                  </div>
                </div>

                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-300">
                    <span className="font-semibold">문제:</span> "협찬비 50만원 줬는데 효과 있었나?"
                  </p>
                </div>

                <div className="mb-4 p-3 rounded-lg bg-slate-900/50 space-y-2">
                  <p className="text-xs text-slate-500 mb-2">셀러포트 분석 결과</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">인플루언서 A</span>
                    <span className="text-sm text-red-400 font-bold">50만원 → 매출 12만원</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-300">인플루언서 B</span>
                    <span className="text-sm text-emerald-400 font-bold">30만원 → 매출 89만원</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-sm text-emerald-300">
                    <span className="font-semibold">결론:</span> "B한테 더 줘야겠네"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 마진/세금 자동 계산 섹션 - 정식 오픈 후 활성화 예정 */}
        {/*
        <section className="py-20 bg-slate-900/80 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-widest">Profit Calculator</p>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                진짜 남는 돈, <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">자동으로 계산</span>해드려요
              </h3>
              <p className="text-slate-400 text-lg">
                "매출 100만원인데 실제로 얼마 남았지?" → 바로 확인 가능
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">플랫폼 수수료 자동 반영</h4>
                    <p className="text-slate-400 text-sm">네이버 정산 API 연동으로 실제 수수료 자동 계산</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-violet-500/30 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">순이익 자동 계산</h4>
                    <p className="text-slate-400 text-sm">원가, 배송비, 광고비 → 순이익까지 자동 계산</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-pink-500/30 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">세금 예상 금액까지</h4>
                    <p className="text-slate-400 text-sm">부가세, 종소세 예상 금액 미리 확인</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700/50">
                <div className="text-center mb-6">
                  <p className="text-slate-500 text-xs mb-2">이번 달 매출</p>
                  <p className="text-4xl font-bold text-white">₩3,500,000</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-slate-400 text-sm">원가</span>
                    <span className="text-red-400 text-sm">-₩1,400,000</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-slate-400 text-sm">플랫폼 수수료</span>
                    <span className="text-red-400 text-sm">-₩385,000</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-slate-400 text-sm">배송비</span>
                    <span className="text-red-400 text-sm">-₩180,000</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700/30">
                    <span className="text-slate-400 text-sm">광고비</span>
                    <span className="text-red-400 text-sm">-₩450,000</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t-2 border-emerald-500/30">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">실제 순수익</span>
                    <span className="text-2xl font-bold text-emerald-400">₩1,085,000</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-slate-500 text-xs">순이익률</span>
                    <span className="text-emerald-400 text-sm font-semibold">31%</span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-xs text-blue-300">
                    💡 예상 부가세: ₩108,500 / 예상 종소세: ₩65,100
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        */}

        {/* 카톡 알림 섹션 */}
        <section className="py-20 bg-slate-900/80 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-widest">KakaoTalk Alerts</p>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                중요한 건 <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">카톡으로 바로</span> 알려드려요
              </h3>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 주문 알림 */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-600/10 to-slate-800/50 border border-amber-500/30 hover:border-amber-400/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">🔔</span>
                </div>
                <h4 className="font-bold text-amber-400 mb-2">주문 알림</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  유입경로 + 상품 + 전환 정보 포함 주문 알림
                </p>
              </div>

              {/* 빨간불 경고 */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-red-600/10 to-slate-800/50 border border-red-500/30 hover:border-red-400/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">🚨</span>
                </div>
                <h4 className="font-bold text-red-400 mb-2">빨간불 경고</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  효율 낮은 광고 즉시 알림으로 광고비 낭비 방지
                </p>
              </div>

              {/* 일일 요약 */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-blue-600/10 to-slate-800/50 border border-blue-500/30 hover:border-blue-400/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h4 className="font-bold text-blue-400 mb-2">일일 요약</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  매일 밤 당일 매출, 광고 성과 리포트 자동 발송
                </p>
              </div>

              {/* 주간 리포트 */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-violet-600/10 to-slate-800/50 border border-violet-500/30 hover:border-violet-400/50 transition-all">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center mb-4">
                  <span className="text-2xl">📈</span>
                </div>
                <h4 className="font-bold text-violet-400 mb-2">주간 리포트</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  주간 성과 요약 및 채널별 비교 분석 리포트
                </p>
              </div>
            </div>

            {/* 카톡 알림 예시 */}
            <div className="mt-12 flex justify-center">
              <div className="max-w-sm w-full p-4 rounded-2xl bg-[#FFE812] shadow-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-800">S</span>
                  </div>
                  <span className="font-bold text-slate-800">셀러포트</span>
                </div>
                <div className="bg-white rounded-xl p-4 space-y-2">
                  <p className="text-slate-800 text-sm font-semibold">🔴 빨간불 알림</p>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    [메타 광고 - 겨울 신상] 캠페인의 ROAS가 85%로 하락했습니다.
                    <br/><br/>
                    💡 광고비 대비 매출이 낮아요. 소재나 타겟을 점검해보세요!
                  </p>
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-blue-500 text-xs font-semibold">대시보드에서 확인하기 →</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 광고 효율 신호등 섹션 */}
        <section className="py-20 bg-slate-900/80 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-widest">Traffic Light System</p>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                광고 효율을 <span className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 bg-clip-text text-transparent">신호등</span>으로 한눈에
              </h3>
              <p className="text-slate-400 text-lg">
                복잡한 ROAS 계산 필요 없이, 색상만 보면 됩니다
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* 초록불 */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-green-600/20 to-slate-800/50 border border-green-500/30 hover:border-green-400/50 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                    <span className="text-2xl">🟢</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-green-400">초록불</h4>
                    <p className="text-sm text-slate-400">ROAS 300% 이상</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "이 광고 효율 좋아요!<br/>예산 늘려보세요"
                </p>
              </div>

              {/* 노란불 */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-yellow-600/20 to-slate-800/50 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                    <span className="text-2xl">🟡</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-yellow-400">노란불</h4>
                    <p className="text-sm text-slate-400">ROAS 150-300%</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "보통이에요.<br/>소재나 타겟 점검 필요"
                </p>
              </div>

              {/* 빨간불 */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-red-600/20 to-slate-800/50 border border-red-500/30 hover:border-red-400/50 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/50">
                    <span className="text-2xl">🔴</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-red-400">빨간불</h4>
                    <p className="text-sm text-slate-400">ROAS 150% 미만</p>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "효율 낮아요!<br/>중단 또는 수정 권장 + 즉시 카톡 알림"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 핵심 차별화 - 경쟁사 비교 */}
        <section className="py-20 bg-slate-800 relative">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-widest">Why SellerPort</p>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                셀러포트만의 <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">차별화</span>
              </h3>
              <p className="text-slate-400">다른 서비스와 비교해보세요</p>
            </div>

            <div className="overflow-x-auto">
              <div className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm min-w-[640px]">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="px-6 py-4 text-left text-slate-400 font-medium">기능</th>
                      <th className="px-4 py-4 text-center text-slate-400 font-medium">A사</th>
                      <th className="px-4 py-4 text-center text-slate-400 font-medium">B사</th>
                      <th className="px-4 py-4 text-center text-slate-400 font-medium">C사</th>
                      <th className="px-6 py-4 text-center text-white font-bold bg-blue-600/20">셀러포트</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-700/30">
                      <td className="px-6 py-4 font-medium text-slate-300">메타 전환 추적</td>
                      <td className="px-4 py-4 text-center text-green-400">O</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-green-400">O</td>
                      <td className="px-6 py-4 text-center text-green-400 font-bold bg-blue-600/10">O</td>
                    </tr>
                    <tr className="border-b border-slate-700/30">
                      <td className="px-6 py-4 font-medium text-slate-300">구글/네이버/카카오 전환</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-green-400">O</td>
                      <td className="px-6 py-4 text-center text-green-400 font-bold bg-blue-600/10">O</td>
                    </tr>
                    <tr className="border-b border-slate-700/30">
                      <td className="px-6 py-4 font-medium text-slate-300">광고 효율 신호등</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-6 py-4 text-center text-green-400 font-bold bg-blue-600/10">O</td>
                    </tr>
                    <tr className="border-b border-slate-700/30">
                      <td className="px-6 py-4 font-medium text-slate-300">광고 성과 분석</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-green-400">O</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-6 py-4 text-center text-green-400 font-bold bg-blue-600/10">O</td>
                    </tr>
                    <tr className="border-b border-slate-700/30">
                      <td className="px-6 py-4 font-medium text-slate-300">채널별 통합 대시보드</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-6 py-4 text-center text-green-400 font-bold bg-blue-600/10">O</td>
                    </tr>
                    <tr className="border-b border-slate-700/30">
                      <td className="px-6 py-4 font-medium text-slate-300">빨간불 즉시 카톡 알림</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-6 py-4 text-center text-green-400 font-bold bg-blue-600/10">O</td>
                    </tr>
                    <tr className="border-b border-slate-700/30">
                      <td className="px-6 py-4 font-medium text-slate-300">멀티 스토어 통합 관리</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-green-400">O</td>
                      <td className="px-4 py-4 text-center text-green-400">O</td>
                      <td className="px-6 py-4 text-center text-green-400 font-bold bg-blue-600/10">O</td>
                    </tr>
                    <tr className="border-b border-slate-700/30">
                      <td className="px-6 py-4 font-medium text-slate-300">디자이너 연결 (썸네일)</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-6 py-4 text-center text-green-400 font-bold bg-blue-600/10">O</td>
                    </tr>
                    <tr className="bg-gradient-to-r from-blue-600/20 to-violet-600/20">
                      <td className="px-6 py-4 font-bold text-white">첫 채널 무료</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-4 py-4 text-center text-slate-500">X</td>
                      <td className="px-6 py-4 text-center text-green-400 font-bold bg-blue-600/10">O</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* 핵심 기능 */}
        <section id="features" className="py-24 bg-slate-900/50 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-800/50 via-transparent to-slate-800/50 pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-widest">Features</p>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                모든 온라인 비즈니스를 위한 <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">올인원 솔루션</span>
              </h3>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                쇼핑몰부터 서비스 사이트까지, 광고 전환 추적과 성과 분석을 셀러포트 하나로 해결하세요
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 전환 추적 */}
              <div className="group p-6 rounded-2xl bg-gradient-to-b from-blue-600/20 to-slate-800/50 border border-blue-500/30 hover:border-blue-400 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/20">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-2 text-blue-400">광고 전환 추적</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  메타, 구글, 네이버, 카카오<br/>
                  모든 광고 채널 전환 추적
                </p>
              </div>

              {/* 신호등 시스템 */}
              <div className="group p-6 rounded-2xl bg-gradient-to-b from-emerald-600/20 to-slate-800/50 border-2 border-emerald-500/50 hover:border-emerald-400 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-emerald-500/20">
                <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                  핵심 기능
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/30">
                  <span className="text-xl">🚦</span>
                </div>
                <h4 className="text-lg font-bold mb-2 text-emerald-400">광고 효율 신호등</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  🟢🟡🔴 ROAS 기반 실시간 효율 표시<br/>
                  빨간불 시 즉시 카톡 알림
                </p>
              </div>

              {/* 광고 채널 통합 */}
              <div className="group p-6 rounded-2xl bg-gradient-to-b from-violet-600/20 to-slate-800/50 border border-violet-500/30 hover:border-violet-400 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-violet-500/20">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-2 text-violet-400">광고 채널 통합</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  메타, 네이버, 구글, 카카오<br/>
                  모든 광고를 한 곳에서 관리
                </p>
              </div>

              {/* 실시간 대시보드 */}
              <div className="group p-6 rounded-2xl bg-gradient-to-b from-pink-600/20 to-slate-800/50 border border-pink-500/30 hover:border-pink-400 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-pink-500/20">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-pink-600 flex items-center justify-center mb-4 shadow-lg shadow-pink-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-2 text-pink-400">실시간 대시보드</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  클릭, 전환, 매출 데이터<br/>
                  실시간으로 한눈에 확인
                </p>
              </div>

              {/* 카톡 알림 */}
              <div className="group p-6 rounded-2xl bg-gradient-to-b from-amber-600/20 to-slate-800/50 border border-amber-500/30 hover:border-amber-400 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-500/20">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-2 text-amber-400">카카오 알림톡</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  주문 알림, 일일 요약<br/>
                  🔴 빨간불 알림 + 주간 리포트
                </p>
              </div>

              {/* 디자이너 연결 */}
              <div className="group p-6 rounded-2xl bg-gradient-to-b from-cyan-600/20 to-slate-800/50 border border-cyan-500/30 hover:border-cyan-400 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-cyan-500/20">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold mb-2 text-cyan-400">디자이너 연결</h4>
                <p className="text-slate-400 text-sm leading-relaxed">
                  썸네일 마켓플레이스<br/>
                  전문 디자이너에게 의뢰
                </p>
              </div>
            </div>

            {/* 추가 기능 */}
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">추적 링크 생성</h4>
                    <p className="text-slate-400 text-sm">광고 캠페인별 추적 링크 발급 및 성과 분석</p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">멀티 스토어 통합</h4>
                    <p className="text-slate-400 text-sm">여러 스토어를 한 대시보드에서 관리</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 셀러 워크플로우 */}
        <section className="py-24 bg-slate-800 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-violet-600/5" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-widest">Workflow</p>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                이렇게 <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">간단하게</span> 사용하세요
              </h3>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                { step: '1', title: '사이트 연동', desc: '쇼핑몰, 서비스, 자체 사이트 등', color: 'blue' },
                { step: '2', title: '광고 연동', desc: '메타, 구글, 네이버 광고 연결', color: 'violet' },
                { step: '3', title: '신호등 확인', desc: '🟢🟡🔴 광고 효율 실시간 확인', color: 'emerald' },
                { step: '4', title: '성과 확인', desc: '효율, 전환율 한눈에 파악', color: 'pink' },
              ].map((item, index) => (
                <div key={index} className="relative">
                  <div className="flex flex-col items-center text-center p-6">
                    <div className={`w-12 h-12 rounded-full bg-${item.color}-500/20 flex items-center justify-center mb-4 border-2 border-${item.color}-500/50`}>
                      <span className={`text-xl font-bold text-${item.color}-400`}>{item.step}</span>
                    </div>
                    <h4 className="font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-10 -right-2 text-slate-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 고객 사례 - 정식 오픈 후 활성화 예정 */}
        {/*
        <section className="py-24 bg-slate-900/80 relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-widest">Success Stories</p>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                셀러포트와 함께 <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">성장한 고객들</span>
              </h3>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-800/50 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold">
                    김
                  </div>
                  <div>
                    <p className="font-semibold text-white">김OO 셀러</p>
                    <p className="text-sm text-slate-400">패션잡화 · 스마트스토어</p>
                  </div>
                </div>
                <div className="mb-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">광고 효율 개선</span>
                    <span className="text-green-400 font-bold">+127%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">월 순이익 증가</span>
                    <span className="text-emerald-400 font-bold">+340만원</span>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "🔴 빨간불 알림 덕분에 효율 낮은 광고를 바로 잡을 수 있었어요.
                  예전엔 ROAS 계산하느라 시간 다 썼는데, 이제 신호등만 보면 끝!"
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-800/50 border border-slate-700/50 hover:border-violet-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold">
                    이
                  </div>
                  <div>
                    <p className="font-semibold text-white">이OO 셀러</p>
                    <p className="text-sm text-slate-400">건강식품 · 쿠팡 + 스마트스토어</p>
                  </div>
                </div>
                <div className="mb-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">관리 시간 절감</span>
                    <span className="text-blue-400 font-bold">-70%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">세금 절약</span>
                    <span className="text-violet-400 font-bold">+89만원</span>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "멀티 스토어 운영하면서 마진 계산이 너무 복잡했는데,
                  셀러포트가 자동으로 해주니까 본업에 집중할 수 있어요. 세금 계산도 덤!"
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
                    박
                  </div>
                  <div>
                    <p className="font-semibold text-white">박OO 대표</p>
                    <p className="text-sm text-slate-400">온라인 교육 · 자체 제작 사이트</p>
                  </div>
                </div>
                <div className="mb-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/30">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400 text-sm">전환율 상승</span>
                    <span className="text-amber-400 font-bold">+45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">광고비 절감</span>
                    <span className="text-cyan-400 font-bold">-35%</span>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  "자체 사이트에 추적 코드만 설치하면 되니까 정말 간편해요.
                  어떤 광고가 실제 결제로 이어지는지 바로 파악되니 광고비 낭비가 확 줄었어요!"
                </p>
              </div>
            </div>

            <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 via-violet-600/10 to-pink-600/10 border border-slate-700/50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <p className="text-3xl font-bold text-blue-400">평균 127%</p>
                  <p className="text-sm text-slate-400 mt-1">ROAS 개선</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-violet-400">평균 70%</p>
                  <p className="text-sm text-slate-400 mt-1">관리 시간 절감</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-emerald-400">평균 +230만</p>
                  <p className="text-sm text-slate-400 mt-1">월 순이익 증가</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-pink-400">98%</p>
                  <p className="text-sm text-slate-400 mt-1">만족도</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        */}

        {/* 요금 안내 */}
        <section id="pricing" className="py-24 bg-slate-900/80 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <p className="text-blue-400 font-semibold mb-3 text-sm uppercase tracking-widest">Pricing</p>
              <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                합리적인 <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">요금제</span>
              </h3>
              <p className="text-slate-400 text-lg">비즈니스 규모에 맞는 플랜을 선택하세요</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* 무료 */}
              <div className="rounded-2xl p-6 bg-slate-800/50 border border-white/10 hover:border-white/20 transition-all duration-300">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-white">무료</h4>
                  <p className="text-xs text-slate-400 mt-1">셀러포트를 처음 사용하는 분께</p>
                </div>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">0원</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">알림톡 미포함</p>
                </div>
                <ul className="space-y-2 mb-6">
                  {['추적 링크 5개', '기본 전환 추적', '신호등 시스템', '실시간 대시보드', '디자이너 연결'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                    무료로 시작하기
                  </Button>
                </Link>
              </div>

              {/* 베이직 - 인기 */}
              <div className="relative rounded-2xl p-6 bg-gradient-to-b from-blue-600/20 to-slate-800/50 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-500 text-white text-xs font-bold">
                  인기
                </div>
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-white">베이직</h4>
                  <p className="text-xs text-slate-400 mt-1">본격적으로 광고 효율을 관리하는 셀러</p>
                </div>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">55,000원</span>
                    <span className="text-slate-400 text-sm">/월</span>
                  </div>
                  <p className="text-xs text-emerald-400 mt-1">알림톡 300건 포함</p>
                </div>
                <ul className="space-y-2 mb-6">
                  {['무제한 추적 링크', '모든 채널 전환 추적', '🟢🟡🔴 신호등 시스템', '광고 성과 분석', '카톡 알림', '디자이너 연결'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white">
                    베이직 시작하기
                  </Button>
                </Link>
              </div>

              {/* 프로 */}
              <div className="rounded-2xl p-6 bg-slate-800/50 border border-white/10 hover:border-white/20 transition-all duration-300">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-white">프로</h4>
                  <p className="text-xs text-slate-400 mt-1">대규모 광고 운영 및 인플루언서 협업</p>
                </div>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">110,000원</span>
                    <span className="text-slate-400 text-sm">/월</span>
                  </div>
                  <p className="text-xs text-emerald-400 mt-1">알림톡 1,000건 포함</p>
                </div>
                <ul className="space-y-2 mb-6">
                  {['베이직의 모든 기능', '인플루언서 자동 매칭', '채널 URL 전체 공개', '우선 고객 지원', '상세 리포트'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/signup">
                  <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white">
                    프로 시작하기
                  </Button>
                </Link>
              </div>

              {/* 엔터프라이즈 */}
              <div className="rounded-2xl p-6 bg-gradient-to-b from-violet-600/10 to-slate-800/50 border border-violet-500/30 hover:border-violet-500/50 transition-all duration-300">
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-white">엔터프라이즈</h4>
                  <p className="text-xs text-slate-400 mt-1">대기업/에이전시를 위한 맞춤 솔루션</p>
                </div>
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">별도 협의</span>
                  </div>
                  <p className="text-xs text-violet-400 mt-1">알림톡 협의</p>
                </div>
                <ul className="space-y-2 mb-6">
                  {['프로의 모든 기능', 'API 제공', '전담 매니저', '맞춤 리포트', '온보딩 지원', 'SLA 보장'].map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="mailto:contact@sellerport.app?subject=엔터프라이즈 문의">
                  <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                    문의하기
                  </Button>
                </Link>
              </div>
            </div>

            <p className="text-center text-slate-500 text-sm mt-8">
              * 알림톡 초과 시 15원/건으로 추가 충전 가능 · VAT 별도
            </p>
          </div>
        </section>

        {/* 지원 사이트 */}
        <section className="py-20 bg-slate-800 relative overflow-hidden">
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-slate-400 mb-12 font-medium uppercase tracking-widest text-sm">연동 지원 사이트</p>
            <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-10">
              {[
                { Logo: NaverLogo, name: '스마트스토어' },
                { Logo: CoupangLogo, name: '쿠팡' },
                { Logo: Cafe24Logo, name: '카페24' },
                { Logo: ImwebLogo, name: '아임웹' },
                { Logo: GodoLogo, name: '고도몰' },
                { Logo: MakeshopLogo, name: '메이크샵' },
                { Logo: CustomSiteLogo, name: '자체 제작 사이트' },
              ].map(({ Logo, name }) => (
                <div key={name} className="flex flex-col items-center gap-3 group">
                  <div className="w-16 h-16 rounded-2xl bg-slate-700/80 border border-slate-600 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-blue-500/50 overflow-hidden backdrop-blur-sm">
                    <Logo className="w-10 h-10" />
                  </div>
                  <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 transition-colors">{name}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-500 text-sm mt-8">
              워드프레스, Wix, Shopify 등 모든 웹사이트에 추적 코드 설치 지원
            </p>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="py-28 bg-slate-900/80">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 className="text-4xl sm:text-5xl font-bold mb-6 text-white leading-tight">
              지금 바로 시작하세요
            </h3>
            <p className="text-lg text-slate-400 mb-4">
              쇼핑몰, 서비스 사이트, 자체 제작 사이트 모두 <span className="text-blue-400 font-semibold">무료</span>로 시작하세요
            </p>
            <p className="text-slate-500 mb-10">
              광고 전환 추적 · 성과 분석 · 신호등 알림 · 카톡 알림 · 디자이너 연결 모두 무료!
            </p>
            <Link href="/signup">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-500 text-lg px-12 h-14 transition-all duration-200">
                무료로 시작하기
              </Button>
            </Link>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="bg-slate-900 border-t border-slate-700/50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-12">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-violet-600 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold">S</span>
                  </div>
                  <h5 className="text-xl font-bold">셀러포트</h5>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                  모든 온라인 비즈니스를 위한 광고 성과 분석 플랫폼.
                  광고 전환 추적부터 성과 분석, 디자이너 연결까지.
                </p>
              </div>
              <div>
                <h6 className="font-semibold mb-4 text-slate-200">서비스</h6>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><Link href="#features" className="hover:text-white transition-colors duration-300">기능 소개</Link></li>
                  <li><Link href="#pricing" className="hover:text-white transition-colors duration-300">요금 안내</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors duration-300">고객 사례</Link></li>
                </ul>
              </div>
              <div>
                <h6 className="font-semibold mb-4 text-slate-200">회사</h6>
                <ul className="space-y-3 text-sm text-slate-400">
                  <li><Link href="/terms" className="hover:text-white transition-colors duration-300">이용약관</Link></li>
                  <li><Link href="/privacy" className="hover:text-white transition-colors duration-300">개인정보처리방침</Link></li>
                  <li><Link href="#" className="hover:text-white transition-colors duration-300">문의하기</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-16 pt-8 border-t border-slate-700/50">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs text-slate-500 mb-1">서비스 운영</p>
                  <p className="text-sm text-slate-400">
                    어시스트솔루션 (602-27-04681) 대표 배철응
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    서울시 광진구 화양동 15-51
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">결제 및 고객센터 운영</p>
                  <p className="text-sm text-slate-400">
                    (주)리프컴퍼니 (413-87-02826) 대표 박상호
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    서울시 광진구 구의동 218-13 202호
                  </p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-slate-500">
                  © 2025 SellerPort. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
