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
    <header className="sticky top-0 z-40 bg-white border-b">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* 모바일 메뉴 */}
        <div className="flex items-center md:hidden">
          <MobileSidebar />
          <span className="ml-2 text-lg font-bold">셀러포트</span>
        </div>

        {/* 데스크톱 빈 공간 */}
        <div className="hidden md:block" />

        {/* 우측 메뉴 */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{email}</p>
                  <p className="text-xs text-gray-500">Free 플랜</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/settings">설정</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/settings/plan">플랜 관리</a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                로그아웃
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
