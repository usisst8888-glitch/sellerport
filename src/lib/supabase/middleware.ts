import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 보호된 경로
const protectedRoutes = ['/dashboard', '/settings', '/subscribers', '/my-sites']
// 인증된 사용자가 접근하면 안 되는 경로
const authRoutes = ['/login', '/signup']

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 갱신 및 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // 보호된 경로에 비로그인 사용자 접근 시 로그인으로 리다이렉트
  if (protectedRoutes.some(route => path.startsWith(route)) && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 로그인된 사용자가 로그인/회원가입 페이지 접근 시 대시보드로 리다이렉트
  if (authRoutes.some(route => path.startsWith(route)) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}
