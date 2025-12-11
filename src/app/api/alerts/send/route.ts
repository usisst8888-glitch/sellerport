/**
 * 알림 발송 API
 * POST /api/alerts/send
 *
 * 사용자에게 알림톡을 발송합니다.
 * 알림 종류: red_light, yellow_light, green_light, low_stock, daily_report
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAligoClient, AlertTemplates } from '@/lib/aligo/alimtalk-api'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const {
      alertType, // 'red_light', 'yellow_light', 'green_light', 'low_stock', 'daily_report'
      productName,
      roas,
      stock,
      date,
      orders,
      revenue,
      phoneNumber, // 수신자 전화번호 (선택, 없으면 사용자 기본 번호)
    } = body

    if (!alertType) {
      return NextResponse.json({ error: 'alertType이 필요합니다' }, { status: 400 })
    }

    // 시스템 알리고 설정 확인
    if (!process.env.ALIGO_API_KEY || !process.env.ALIGO_USER_ID || !process.env.ALIGO_SENDER_KEY) {
      return NextResponse.json({ error: '알림톡 서비스가 설정되지 않았습니다' }, { status: 500 })
    }

    // 사용자 설정 조회 (전화번호만)
    const { data: settings } = await supabase
      .from('user_settings')
      .select('phone_number')
      .eq('user_id', user.id)
      .single()

    const receiver = phoneNumber || settings?.phone_number
    if (!receiver) {
      return NextResponse.json({ error: '수신자 전화번호가 필요합니다' }, { status: 400 })
    }

    // 알리고 클라이언트 생성 (시스템 환경변수 사용)
    const aligoClient = createAligoClient(
      process.env.ALIGO_API_KEY,
      process.env.ALIGO_USER_ID,
      process.env.ALIGO_SENDER_KEY
    )

    // 메시지 생성
    let message: string
    switch (alertType) {
      case 'red_light':
        if (!productName || roas === undefined) {
          return NextResponse.json({ error: 'productName과 roas가 필요합니다' }, { status: 400 })
        }
        message = AlertTemplates.redLight(productName, roas)
        break

      case 'yellow_light':
        if (!productName) {
          return NextResponse.json({ error: 'productName이 필요합니다' }, { status: 400 })
        }
        message = AlertTemplates.yellowLight(productName)
        break

      case 'green_light':
        if (!productName || roas === undefined) {
          return NextResponse.json({ error: 'productName과 roas가 필요합니다' }, { status: 400 })
        }
        message = AlertTemplates.greenLight(productName, roas)
        break

      case 'low_stock':
        if (!productName || stock === undefined) {
          return NextResponse.json({ error: 'productName과 stock이 필요합니다' }, { status: 400 })
        }
        message = AlertTemplates.lowStock(productName, stock)
        break

      case 'daily_report':
        if (!date || orders === undefined || revenue === undefined) {
          return NextResponse.json({ error: 'date, orders, revenue가 필요합니다' }, { status: 400 })
        }
        message = AlertTemplates.dailyReport(date, orders, revenue)
        break

      default:
        return NextResponse.json({ error: '지원하지 않는 alertType입니다' }, { status: 400 })
    }

    // 알림톡 발송 (템플릿 코드는 실제 등록된 것으로 교체 필요)
    const result = await aligoClient.sendAlimtalk({
      receiver,
      templateCode: `SELLERPORT_${alertType.toUpperCase()}`, // 예: SELLERPORT_RED_LIGHT
      message,
      failover: {
        type: 'LMS',
        message, // 알림톡 실패 시 LMS로 발송
      },
    })

    if (result.success) {
      // 알림 기록 저장
      await supabase.from('alerts').insert({
        user_id: user.id,
        type: alertType,
        title: getAlertTitle(alertType),
        message,
        product_name: productName,
        is_sent: true,
        sent_at: new Date().toISOString(),
      })

      // 알림 사용량 차감
      const { data: balance } = await supabase
        .from('user_balance')
        .select('alert_balance')
        .eq('user_id', user.id)
        .single()

      if (balance && balance.alert_balance > 0) {
        await supabase
          .from('user_balance')
          .update({ alert_balance: balance.alert_balance - 1 })
          .eq('user_id', user.id)
      }

      return NextResponse.json({
        success: true,
        message: '알림이 발송되었습니다',
        messageId: result.messageId,
      })
    } else {
      // 발송 실패 기록
      await supabase.from('alerts').insert({
        user_id: user.id,
        type: alertType,
        title: getAlertTitle(alertType),
        message,
        product_name: productName,
        is_sent: false,
        error: result.error,
      })

      return NextResponse.json({
        success: false,
        error: result.error || '알림 발송에 실패했습니다',
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Alert send error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

function getAlertTitle(alertType: string): string {
  switch (alertType) {
    case 'red_light':
      return '빨간불 알림'
    case 'yellow_light':
      return '노란불 전환'
    case 'green_light':
      return '초록불 달성'
    case 'low_stock':
      return '재고 부족'
    case 'daily_report':
      return '일일 리포트'
    default:
      return '알림'
  }
}
