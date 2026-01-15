/**
 * 잔액 조회 API
 * GET /api/balance - 사용자 잔액 조회
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 잔액 조회
    const { data: balance, error } = await supabase
      .from('user_balance')
      .select('slot_balance, updated_at')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (신규 사용자)
      console.error('Balance fetch error:', error)
      return NextResponse.json({ error: '잔액 조회에 실패했습니다' }, { status: 500 })
    }

    // 신규 사용자면 기본값으로 생성
    if (!balance) {
      const { data: newBalance } = await supabase
        .from('user_balance')
        .insert({
          user_id: user.id,
          slot_balance: 5, // 무료 슬롯 5개 제공
        })
        .select()
        .single()

      return NextResponse.json({
        success: true,
        data: {
          slotBalance: newBalance?.slot_balance || 5,
          isNewUser: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        slotBalance: balance.slot_balance,
        updatedAt: balance.updated_at,
      },
    })

  } catch (error) {
    console.error('Balance API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
