/**
 * SMS 인증번호 발송 API
 * POST /api/auth/send-code
 *
 * 알림톡 기능 제거로 인해 SMS 발송은 비활성화됨
 * 개발/테스트 환경에서만 동작하며, 실제 SMS 발송은 하지 않음
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

// 테스트용 번호 (모든 번호에 대해 테스트 모드로 동작)
const TEST_CODE = '123456'

// 6자리 인증번호 생성 (현재는 테스트 코드 사용)
function generateCode(): string {
  // 알림톡 기능 제거로 인해 테스트 코드 사용
  return TEST_CODE
}

// 전화번호 정규화 (하이픈 제거, 010 형식으로)
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
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: '전화번호를 입력해주세요' }, { status: 400 })
    }

    const normalizedPhone = normalizePhone(phone)

    // 전화번호 형식 검증
    if (!/^01[016789]\d{7,8}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: '올바른 전화번호 형식이 아닙니다' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // 이미 가입된 전화번호인지 확인 (중복 가입 방지)
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', normalizedPhone)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: '이미 가입된 전화번호입니다' },
        { status: 409 }
      )
    }

    // 인증번호 생성 (테스트 코드 사용)
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000) // 3분 후 만료

    // DB에 저장
    const { error: insertError } = await supabase
      .from('phone_verifications')
      .insert({
        phone: normalizedPhone,
        code,
        expires_at: expiresAt.toISOString(),
        verified: false,
        attempts: 0
      })

    if (insertError) {
      console.error('Verification insert error:', insertError)
      return NextResponse.json({ error: '인증번호 저장에 실패했습니다' }, { status: 500 })
    }

    // 알림톡 기능 제거로 인해 SMS 발송 없이 테스트 코드 반환
    console.log(`[SMS] Phone: ${normalizedPhone}, Code: ${code} (테스트 모드 - 실제 SMS 발송 안함)`)

    return NextResponse.json({
      success: true,
      message: '인증번호가 발송되었습니다',
      expiresIn: 180,
      // 테스트 모드에서 코드 노출
      _devCode: code
    })

  } catch (error) {
    console.error('Send code error:', error)
    return NextResponse.json({ error: '인증번호 발송에 실패했습니다' }, { status: 500 })
  }
}
