'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface SubscriptionInfo {
  status: 'trial' | 'active' | 'expired' | 'none'
  trialDaysLeft?: number
  planName: string
}

interface MenuItem {
  title: string
  href: string
  icon: React.ReactNode
  badge?: string
  badgeColor?: 'blue' | 'green' | 'yellow' | 'red'
  adminOnly?: boolean
}

interface SubMenuItem {
  title: string
  href: string
  badge?: string
  badgeColor?: 'blue' | 'green' | 'yellow' | 'red'
}

interface UtilityMenu {
  title: string
  icon: React.ReactNode
  items: SubMenuItem[]
}

const menuItems: MenuItem[] = [
  {
    title: '대시보드',
    href: '/dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    title: '추적 링크 관리',
    href: '/tracking-links',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    title: '광고 성과 관리',
    href: '/ad-performance',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: '인스타그램 자동 DM',
    href: '/instagram-dm',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
// 수익 계산 메뉴 - 정식 오픈 후 활성화 예정
  // {
  //   title: '수익 계산',
  //   href: '/profit',
  //   icon: (
  //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  //     </svg>
  //   ),
  // },
  // 상품 관리 - 현재 사용 안 함 (추후 활성화 예정)
  // {
  //   title: '상품 관리',
  //   href: '/products',
  //   icon: (
  //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  //     </svg>
  //   ),
  // },
  // 디자이너 연결 - 현재 숨김 처리
  // {
  //   title: '디자이너 연결',
  //   href: '/designers',
  //   icon: (
  //     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  //       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  //     </svg>
  //   ),
  // },
  {
    title: '결제 관리',
    href: '/billing',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    title: '설정',
    href: '/settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: '회원 관리',
    href: '/admin',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    adminOnly: true,
  },
  {
    title: '유입 로그',
    href: '/admin/visits',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    adminOnly: true,
  },
]

const utilityMenu: UtilityMenu = {
  title: '유틸리티',
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  items: [
    { title: '상품명 생성', href: '/product-name', badge: 'AI', badgeColor: 'blue' },
    { title: 'GIF 생성', href: '/gif-generator', badge: 'AI', badgeColor: 'blue' },
  ]
}

export function Sidebar() {
  const pathname = usePathname()
  const [userType, setUserType] = useState<string | null>(null)
  const [utilityOpen, setUtilityOpen] = useState(false)
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    status: 'none',
    planName: '무료 체험'
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/profile')
        const data = await response.json()
        if (data.success) {
          setUserType(data.data.userType)
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }
    }
    fetchProfile()
  }, [])

  // 구독 정보 가져오기
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // 구독 정보 확인
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (sub) {
          setSubscription({
            status: 'active',
            planName: '프리미엄'
          })
        } else {
          // 무료 체험 기간 계산
          const { data: profile } = await supabase
            .from('profiles')
            .select('created_at')
            .eq('id', user.id)
            .maybeSingle()

          if (profile) {
            const createdAt = new Date(profile.created_at)
            const now = new Date()
            const diffTime = now.getTime() - createdAt.getTime()
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
            const trialDaysLeft = Math.max(0, 7 - diffDays)

            if (trialDaysLeft > 0) {
              setSubscription({
                status: 'trial',
                trialDaysLeft,
                planName: '무료 체험'
              })
            } else {
              setSubscription({
                status: 'expired',
                planName: '체험 만료'
              })
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
      }
    }
    fetchSubscription()
  }, [])

  // 관리자/매니저가 아니면 adminOnly 메뉴 필터링
  const filteredMenuItems = menuItems.filter(item => {
    if (item.adminOnly) {
      return userType === 'admin' || userType === 'manager'
    }
    return true
  })

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-50">
      <div className="flex flex-col flex-grow bg-slate-900/80 backdrop-blur-xl border-r border-white/5 pt-5 pb-4 overflow-y-auto">
        {/* 로고 */}
        <div className="flex items-center flex-shrink-0 px-5">
          <Link href="/dashboard" className="flex items-center">
            <Image
              src="/logo.png"
              alt="셀러포트"
              width={140}
              height={32}
              className="h-8 w-auto"
            />
          </Link>
        </div>

        {/* 메뉴 */}
        <nav className="mt-8 flex-1 px-3 space-y-1">
          {filteredMenuItems.map((item) => {
            // /admin은 정확히 일치할 때만, 나머지는 하위 경로도 활성화
            const isActive = item.href === '/admin'
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center px-3 py-2.5 text-[15px] font-medium rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                )}
              >
                <span className={cn(
                  'mr-3 transition-all duration-200',
                  isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                )}>
                  {item.icon}
                </span>
                {item.title}
                {'badge' in item && item.badge && (
                  <span className={cn(
                    "ml-auto text-[11px] font-bold px-2 py-1 rounded-full flex items-center justify-center leading-none",
                    'badgeColor' in item && item.badgeColor === 'green'
                      ? 'bg-green-700 text-green-100'
                      : 'badgeColor' in item && item.badgeColor === 'blue'
                        ? 'bg-blue-700 text-blue-100'
                        : item.badge === '핵심'
                          ? 'bg-red-700 text-red-100'
                          : 'bg-slate-600 text-slate-200'
                  )}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}

          {/* 유틸리티 드롭다운 */}
          <div>
            <button
              onClick={() => setUtilityOpen(!utilityOpen)}
              className={cn(
                'w-full group flex items-center px-3 py-2.5 text-[15px] font-medium rounded-xl transition-all duration-200',
                utilityMenu.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
                  ? 'text-white bg-white/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              )}
            >
              <span className={cn(
                'mr-3 transition-all duration-200',
                utilityMenu.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
                  ? 'text-slate-300'
                  : 'text-slate-500 group-hover:text-slate-300'
              )}>
                {utilityMenu.icon}
              </span>
              {utilityMenu.title}
              <svg
                className={cn(
                  'ml-auto w-4 h-4 transition-transform duration-200',
                  utilityOpen ? 'rotate-180' : ''
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {utilityOpen && (
              <div className="mt-1 ml-6 space-y-1">
                {utilityMenu.items.map((subItem) => {
                  const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/')
                  return (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                        isSubActive
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      )}
                    >
                      {subItem.title}
                      {subItem.badge && (
                        <span className={cn(
                          "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          subItem.badgeColor === 'blue'
                            ? 'bg-blue-700 text-blue-100'
                            : 'bg-slate-600 text-slate-200'
                        )}>
                          {subItem.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        {/* 현재 플랜 */}
        <div className="flex-shrink-0 px-3 py-4">
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-white/5 p-4">
            <div className={cn(
              "absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2",
              subscription.status === 'active' ? 'bg-green-500/10' :
              subscription.status === 'trial' ? 'bg-blue-500/10' : 'bg-red-500/10'
            )} />
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500">현재 플랜</p>
              <p className={cn(
                "text-sm font-semibold",
                subscription.status === 'active' ? 'text-green-400' :
                subscription.status === 'trial' ? 'text-blue-400' : 'text-slate-400'
              )}>
                {subscription.status === 'active' ? '프리미엄' :
                 subscription.status === 'trial' ? '무료 체험' : '체험 만료'}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {subscription.status === 'active' ? '구독 상태' : '남은 기간'}
              </p>
              <p className={cn(
                "text-sm font-semibold",
                subscription.status === 'active' ? 'text-green-400' :
                subscription.status === 'trial' ? 'text-white' : 'text-red-400'
              )}>
                {subscription.status === 'active' ? '활성' :
                 subscription.status === 'trial' ? `${subscription.trialDaysLeft}일` : '만료됨'}
              </p>
            </div>
            {subscription.status !== 'active' && (
              <Link
                href="/billing"
                className="mt-3 inline-flex items-center text-xs text-blue-400 hover:text-blue-300 transition-colors group"
              >
                {subscription.status === 'trial' ? '프리미엄 구독하기' : '구독 시작하기'}
                <svg className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
            {subscription.status === 'active' && (
              <Link
                href="/billing"
                className="mt-3 inline-flex items-center text-xs text-slate-400 hover:text-slate-300 transition-colors group"
              >
                구독 관리
                <svg className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
