import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // 성공하면 next 파라미터로 리다이렉트
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // 에러 시 로그인 페이지로
  return NextResponse.redirect(new URL('/login?error=auth_callback_error', requestUrl.origin))
}
