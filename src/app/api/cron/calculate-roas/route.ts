/**
 * ROAS 계산 Cron Job
 * 10분마다 실행되어 모든 캠페인의 ROAS를 계산하고 신호등 알림을 발송합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAligoClient, AlertTemplates } from '@/lib/aligo/alimtalk-api'

// 서비스 롤 키로 Supabase 접근 (RLS 우회)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(url, key)
}

const TRAFFIC_LIGHT = {
  GREEN: 300,
  YELLOW: 150
}

function getLight(roas: number): 'green' | 'yellow' | 'red' {
  if (roas >= TRAFFIC_LIGHT.GREEN) return 'green'
  if (roas >= TRAFFIC_LIGHT.YELLOW) return 'yellow'
  return 'red'
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[Cron] Starting ROAS calculation...')

  const supabase = getSupabaseAdmin()

  try {
    // 활성 캠페인 조회
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .in('status', ['running', 'paused'])

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json({ success: true, message: 'No campaigns' })
    }

    let alertCount = 0

    for (const campaign of campaigns) {
      const oldRoas = campaign.roas || 0
      const oldLight = getLight(oldRoas)

      // 최근 30일 주문 집계
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('campaign_id', campaign.id)
        .gte('ordered_at', thirtyDaysAgo.toISOString())
        .in('order_status', ['paid', 'shipping', 'delivered'])

      const totalRevenue = orders?.reduce((s, o) => s + (o.total_amount || 0), 0) || 0
      const totalConversions = orders?.length || 0
      const spent = campaign.spent || 0
      const newRoas = spent > 0 ? Math.round((totalRevenue / spent) * 100) : 0
      const newLight = getLight(newRoas)

      // 캠페인 업데이트
      await supabase
        .from('campaigns')
        .update({ revenue: totalRevenue, conversions: totalConversions, roas: newRoas })
        .eq('id', campaign.id)

      // 신호등 변경 시 알림
      if (oldLight !== newLight) {
        const emoji = newLight === 'green' ? '🟢' : newLight === 'yellow' ? '🟡' : '🔴'
        let title = '', message = ''

        if (newLight === 'red') {
          title = `${emoji} 광고 효율 경고`
          message = `[${campaign.name}] ROAS ${newRoas}% - 광고 중단 또는 수정 권장`
        } else if (newLight === 'yellow') {
          title = `${emoji} 광고 효율 주의`
          message = `[${campaign.name}] ROAS ${newRoas}% - 소재/타겟 점검 필요`
        } else {
          title = `${emoji} 광고 효율 좋음`
          message = `[${campaign.name}] ROAS ${newRoas}% - 예산 증액 권장!`
        }

        await supabase.from('alerts').insert({
          user_id: campaign.user_id,
          campaign_id: campaign.id,
          product_id: campaign.product_id,
          alert_type: `${newLight}_light`,
          title,
          message,
          related_data: { oldRoas, newRoas, oldLight, newLight, spent, revenue: totalRevenue }
        })

        alertCount++

        // 빨간불 알림톡 발송 (시스템 알리고 설정 사용)
        if (newLight === 'red') {
          const { data: settings } = await supabase
            .from('alert_settings')
            .select('red_light_enabled, kakao_enabled, kakao_phone')
            .eq('user_id', campaign.user_id)
            .single()

          if (settings?.red_light_enabled && settings?.kakao_enabled && settings?.kakao_phone &&
              process.env.ALIGO_API_KEY && process.env.ALIGO_USER_ID && process.env.ALIGO_SENDER_KEY) {
            try {
              const aligoClient = createAligoClient(
                process.env.ALIGO_API_KEY,
                process.env.ALIGO_USER_ID,
                process.env.ALIGO_SENDER_KEY
              )

              const alimtalkMessage = AlertTemplates.redLight(campaign.name, newRoas)

              const result = await aligoClient.sendAlimtalk({
                receiver: settings.kakao_phone,
                templateCode: 'SELLERPORT_RED_LIGHT',
                message: alimtalkMessage,
                failover: {
                  type: 'LMS',
                  message: alimtalkMessage,
                },
              })

              if (result.success) {
                console.log(`[Alert] Red light sent for ${campaign.name} to ${settings.kakao_phone}, messageId: ${result.messageId}`)
              } else {
                console.error(`[Alert] Failed to send red light for ${campaign.name}: ${result.error}`)
              }
            } catch (aligoError) {
              console.error(`[Alert] Aligo error for ${campaign.name}:`, aligoError)
            }
          }
        }
      }
    }

    console.log(`[Cron] ROAS calculated for ${campaigns.length} campaigns, ${alertCount} alerts`)

    return NextResponse.json({
      success: true,
      campaigns: campaigns.length,
      alerts: alertCount
    })

  } catch (error) {
    console.error('[Cron] ROAS error:', error)
    return NextResponse.json({ error: 'Calculation failed' }, { status: 500 })
  }
}
