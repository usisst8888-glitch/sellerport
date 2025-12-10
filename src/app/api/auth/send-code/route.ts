/**
 * SMS 인증번호 발송 API
 * POST /api/auth/send-code
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS } from '@/lib/aligo/alimtalk-api'

// 서비스 롤 키로 Supabase 접근
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(url, key)
}

// 테스트용 번호 (알리고 심사 완료 전까지)
const TEST_PHONE = '01071838563'
const TEST_CODE = '123456'

// 6자리 인증번호 생성
function generateCode(phone: string): string {
  // 테스트 번호는 고정 코드 사용
  if (phone === TEST_PHONE) {
    return TEST_CODE
  }
  return Math.floor(100000 + Math.random() * 900000).toString()
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

    // 최근 1분 내 요청 횟수 확인 (스팸 방지)
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString()
    const { data: recentRequests } = await supabase
      .from('phone_verifications')
      .select('id')
      .eq('phone', normalizedPhone)
      .gte('created_at', oneMinuteAgo)

    if (recentRequests && recentRequests.length >= 1) {
      return NextResponse.json(
        { error: '1분 후에 다시 시도해주세요' },
        { status: 429 }
      )
    }

    // 하루 최대 5회 제한
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const { data: todayRequests } = await supabase
      .from('phone_verifications')
      .select('id')
      .eq('phone', normalizedPhone)
      .gte('created_at', todayStart.toISOString())

    if (todayRequests && todayRequests.length >= 5) {
      return NextResponse.json(
        { error: '일일 인증 횟수를 초과했습니다. 내일 다시 시도해주세요' },
        { status: 429 }
      )
    }

    // 인증번호 생성
    const code = generateCode(normalizedPhone)
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000) // 3분 후 만료
    const isTestPhone = normalizedPhone === TEST_PHONE

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

    // 테스트 번호는 SMS 발송 건너뛰기
    if (isTestPhone) {
      console.log(`[Test] Phone: ${normalizedPhone}, Code: ${code}`)
      return NextResponse.json({
        success: true,
        message: '인증번호가 발송되었습니다 (테스트)',
        expiresIn: 180
      })
    }

    // SMS 발송
    const message = `[셀러포트] 인증번호는 [${code}]입니다. 3분 내에 입력해주세요.`

    try {
      await sendSMS(normalizedPhone, message)
    } catch (smsError) {
      console.error('SMS send error:', smsError)
      // SMS 발송 실패해도 개발 환경에서는 코드 반환 (테스트용)
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: '인증번호가 발송되었습니다',
          // 개발 환경에서만 코드 노출
          _devCode: code
        })
      }
      return NextResponse.json({ error: 'SMS 발송에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '인증번호가 발송되었습니다',
      expiresIn: 180 // 3분
    })

  } catch (error) {
    console.error('Send code error:', error)
    return NextResponse.json({ error: '인증번호 발송에 실패했습니다' }, { status: 500 })
  }
}
