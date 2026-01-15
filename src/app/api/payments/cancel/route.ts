/**
 * 결제 취소 API
 * POST /api/payments/cancel
 *
 * 결제를 취소하고 잔액을 차감합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTossPaymentsClient } from '@/lib/tosspayments/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { paymentKey, cancelReason, cancelAmount } = body

    if (!paymentKey || !cancelReason) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    // 결제 내역 확인
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('payment_key', paymentKey)
      .eq('user_id', user.id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: '결제 내역을 찾을 수 없습니다' }, { status: 404 })
    }

    if (payment.status === 'cancelled') {
      return NextResponse.json({ error: '이미 취소된 결제입니다' }, { status: 400 })
    }

    // 토스페이먼츠 클라이언트 생성
    const tossClient = createTossPaymentsClient(
      process.env.TOSS_SECRET_KEY!,
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
    )

    // 결제 취소
    const cancelResult = await tossClient.cancelPayment({
      paymentKey,
      cancelReason,
      cancelAmount: cancelAmount || payment.amount,
    })

    // 취소 성공 시 잔액 차감
    if (cancelResult.status === 'CANCELED' || cancelResult.status === 'PARTIAL_CANCELED') {
      const cancelledAmount = cancelAmount || payment.amount

      // 현재 잔액 조회
      const { data: currentBalance } = await supabase
        .from('user_balance')
        .select('slot_balance')
        .eq('user_id', user.id)
        .single()

      if (currentBalance && payment.product_type === 'slot') {
        const slotsToRemove = Math.floor(cancelledAmount / 2000)
        const newBalance = Math.max(0, currentBalance.slot_balance - slotsToRemove)
        await supabase
          .from('user_balance')
          .update({ slot_balance: newBalance })
          .eq('user_id', user.id)
      }

      // 결제 상태 업데이트
      await supabase
        .from('payments')
        .update({
          status: cancelResult.status === 'CANCELED' ? 'cancelled' : 'partial_cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_reason: cancelReason,
        })
        .eq('payment_key', paymentKey)

      return NextResponse.json({
        success: true,
        message: '결제가 취소되었습니다',
        data: {
          paymentKey: cancelResult.paymentKey,
          status: cancelResult.status,
          cancelledAmount: cancelledAmount,
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        error: '결제 취소에 실패했습니다',
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Payment cancel error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '결제 취소에 실패했습니다',
    }, { status: 500 })
  }
}
