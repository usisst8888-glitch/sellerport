/**
 * 결제 승인 API
 * POST /api/payments/confirm
 *
 * 토스페이먼츠 결제를 승인하고 사용자 잔액을 충전합니다.
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
    const { paymentKey, orderId, amount, productType, quantity } = body

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다' }, { status: 400 })
    }

    // 토스페이먼츠 클라이언트 생성
    const tossClient = createTossPaymentsClient(
      process.env.TOSS_SECRET_KEY!,
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!
    )

    // 결제 승인
    const payment = await tossClient.confirmPayment({
      paymentKey,
      orderId,
      amount,
    })

    // 결제 성공 시 잔액 충전
    if (payment.status === 'DONE') {
      // 현재 잔액 조회
      const { data: currentBalance } = await supabase
        .from('user_balance')
        .select('slot_balance')
        .eq('user_id', user.id)
        .single()

      const slotBalance = currentBalance?.slot_balance || 0

      // 잔액 업데이트
      if (productType === 'slot') {
        await supabase
          .from('user_balance')
          .upsert({
            user_id: user.id,
            slot_balance: slotBalance + (quantity || Math.floor(amount / 2000)),
          })
      }

      // 결제 기록 저장
      await supabase.from('payments').insert({
        user_id: user.id,
        payment_key: paymentKey,
        order_id: orderId,
        amount,
        product_type: productType,
        quantity: quantity || (productType === 'slot' ? Math.floor(amount / 2000) : Math.floor(amount / 15)),
        status: 'completed',
        method: payment.method,
        approved_at: payment.approvedAt,
        receipt_url: payment.receipt?.url,
      })

      return NextResponse.json({
        success: true,
        message: '결제가 완료되었습니다',
        data: {
          paymentKey: payment.paymentKey,
          orderId: payment.orderId,
          amount: payment.totalAmount,
          method: payment.method,
          approvedAt: payment.approvedAt,
          receiptUrl: payment.receipt?.url,
        },
      })
    } else {
      return NextResponse.json({
        success: false,
        error: '결제가 완료되지 않았습니다',
        status: payment.status,
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Payment confirm error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '결제 승인에 실패했습니다',
    }, { status: 500 })
  }
}
