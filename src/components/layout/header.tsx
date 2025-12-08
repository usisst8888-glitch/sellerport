'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MobileSidebar } from './mobile-sidebar'

interface HeaderProps {
  email?: string
}

export function Header({ email }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = email ? email.charAt(0).toUpperCase() : 'U'

  return (
    <header className="sticky top-0 z-40 bg-slate-900/60 backdrop-blur-xl border-b border-white/5">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* 모바일 메뉴 */}
        <div className="flex items-center md:hidden">
          <MobileSidebar />
          <div className="ml-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <span className="text-white font-bold text-xs">S</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
              셀러포트
            </span>
          </div>
        </div>

        {/* 데스크톱 빈 공간 */}
        <div className="hidden md:block" />

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-3">
          {/* 알림 버튼 (추후 사용) */}
          <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/5 rounded-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-xl hover:bg-white/5 p-0">
                <Avatar className="h-9 w-9 rounded-xl">
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-slate-900/95 backdrop-blur-xl border-white/10 rounded-xl shadow-2xl p-1">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <Avatar className="h-10 w-10 rounded-xl">
                  <AvatarFallback className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <p className="text-sm font-medium text-white truncate max-w-[160px]">{email}</p>
                  <p className="text-xs text-slate-400">Free 플랜</p>
                </div>
              </div>
              <DropdownMenuSeparator className="bg-white/5 my-1" />
              <DropdownMenuItem asChild className="text-slate-300 focus:bg-white/5 focus:text-white rounded-lg cursor-pointer">
                <a href="/settings" className="flex items-center gap-2 py-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  설정
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-slate-300 focus:bg-white/5 focus:text-white rounded-lg cursor-pointer">
                <a href="/settings/plan" className="flex items-center gap-2 py-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  플랜 관리
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/5 my-1" />
              <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:bg-red-500/10 focus:text-red-300 rounded-lg cursor-pointer">
                <div className="flex items-center gap-2 py-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  로그아웃
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
