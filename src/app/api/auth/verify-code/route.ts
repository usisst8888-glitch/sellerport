/**
 * SMS 인증번호 확인 API
 * POST /api/auth/verify-code
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 서비스 롤 키로 Supabase 접근
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(url, key)
}

// 전화번호 정규화
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.startsWith('82')) {
    return '0' + cleaned.slice(2)
  }
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code } = body

    if (!phone || !code) {
      return NextResponse.json(
        { error: '전화번호와 인증번호를 입력해주세요' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phone)
    const supabase = getSupabaseAdmin()

    // 가장 최근 인증 요청 조회
    const { data: verification, error: selectError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (selectError || !verification) {
      return NextResponse.json(
        { error: '인증 요청을 찾을 수 없습니다. 다시 인증번호를 요청해주세요' },
        { status: 400 }
      )
    }

    // 만료 확인
    if (new Date(verification.expires_at) < new Date()) {
      return NextResponse.json(
        { error: '인증번호가 만료되었습니다. 다시 요청해주세요' },
        { status: 400 }
      )
    }

    // 시도 횟수 확인 (최대 5회)
    if (verification.attempts >= 5) {
      return NextResponse.json(
        { error: '인증 시도 횟수를 초과했습니다. 다시 인증번호를 요청해주세요' },
        { status: 400 }
      )
    }

    // 시도 횟수 증가
    await supabase
      .from('phone_verifications')
      .update({ attempts: verification.attempts + 1 })
      .eq('id', verification.id)

    // 인증번호 확인
    if (verification.code !== code) {
      const remainingAttempts = 4 - verification.attempts
      return NextResponse.json(
        {
          error: `인증번호가 일치하지 않습니다. (${remainingAttempts}회 남음)`,
          remainingAttempts
        },
        { status: 400 }
      )
    }

    // 인증 성공 - verified로 표시
    await supabase
      .from('phone_verifications')
      .update({ verified: true })
      .eq('id', verification.id)

    // 인증 토큰 생성 (회원가입 시 사용)
    const verificationToken = Buffer.from(
      JSON.stringify({
        phone: normalizedPhone,
        verifiedAt: new Date().toISOString(),
        exp: Date.now() + 10 * 60 * 1000 // 10분 유효
      })
    ).toString('base64')

    return NextResponse.json({
      success: true,
      message: '전화번호 인증이 완료되었습니다',
      phone: normalizedPhone,
      verificationToken
    })

  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json({ error: '인증 확인에 실패했습니다' }, { status: 500 })
  }
}
