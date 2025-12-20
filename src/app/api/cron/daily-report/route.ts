/**
 * 일일 리포트 Cron Job
 * 매일 밤 9시에 실행되어 당일 성과 요약 알림을 발송합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAligoClient } from '@/lib/aligo/alimtalk-api'

// 서비스 롤 키로 Supabase 접근 (RLS 우회)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] Starting daily report...')

  const supabase = getSupabaseAdmin()

  try {
    // 일일 리포트를 원하는 사용자 목록
    const { data: settings } = await supabase
      .from('alert_settings')
      .select('user_id, kakao_phone, kakao_enabled')
      .eq('daily_report_enabled', true)

    if (!settings || settings.length === 0) {
      return NextResponse.json({ success: true, message: 'No users want daily report' })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let reportsSent = 0

    for (const setting of settings) {
      // 오늘 주문 집계
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, profit')
        .eq('user_id', setting.user_id)
        .gte('ordered_at', today.toISOString())
        .lt('ordered_at', tomorrow.toISOString())

      const orderCount = orders?.length || 0
      const totalRevenue = orders?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0
      const totalProfit = orders?.reduce((s, o) => s + (o.profit || 0), 0) || 0

      // 오늘 클릭 수
      const { count: clickCount } = await supabase
        .from('tracking_link_clicks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', setting.user_id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString())

      // 전환율 계산
      const conversionRate = clickCount && clickCount > 0
        ? ((orderCount / clickCount) * 100).toFixed(1)
        : '0'

      // 알림 생성
      const dateStr = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
      const title = `📊 ${dateStr} 일일 리포트`
      const message = [
        `📦 주문: ${orderCount}건`,
        `💰 매출: ${totalRevenue.toLocaleString()}원`,
        `📈 순이익: ${totalProfit.toLocaleString()}원`,
        `🎯 전환율: ${conversionRate}%`,
      ].filter(Boolean).join('\n')

      await supabase.from('alerts').insert({
        user_id: setting.user_id,
        alert_type: 'daily_report',
        title,
        message,
        related_data: {
          date: today.toISOString(),
          orderCount,
          totalRevenue,
          totalProfit,
          clickCount,
          conversionRate,
        }
      })

      reportsSent++

      // 알림톡 발송 (시스템 알리고 설정 사용)
      if (setting.kakao_enabled && setting.kakao_phone &&
          process.env.ALIGO_API_KEY && process.env.ALIGO_USER_ID && process.env.ALIGO_SENDER_KEY) {
        try {
          const aligoClient = createAligoClient(
            process.env.ALIGO_API_KEY,
            process.env.ALIGO_USER_ID,
            process.env.ALIGO_SENDER_KEY
          )

          const alimtalkMessage = `[셀러포트 일일 리포트]\n\n${dateStr} 실적 요약\n${message}`

          const result = await aligoClient.sendAlimtalk({
            receiver: setting.kakao_phone,
            templateCode: 'SELLERPORT_DAILY_REPORT',
            message: alimtalkMessage,
            failover: {
              type: 'LMS',
              message: alimtalkMessage,
            },
          })

          if (result.success) {
            console.log(`[DailyReport] Sent to ${setting.kakao_phone}, messageId: ${result.messageId}`)
          } else {
            console.error(`[DailyReport] Failed to send to ${setting.kakao_phone}: ${result.error}`)
          }
        } catch (aligoError) {
          console.error(`[DailyReport] Aligo error for ${setting.kakao_phone}:`, aligoError)
        }
      }
    }

    console.log(`[Cron] Daily reports sent: ${reportsSent}`)

    return NextResponse.json({
      success: true,
      reports: reportsSent
    })

  } catch (error) {
    console.error('[Cron] Daily report error:', error)
    return NextResponse.json({ error: 'Report failed' }, { status: 500 })
  }
}
