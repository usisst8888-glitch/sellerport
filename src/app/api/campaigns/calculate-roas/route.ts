/**
 * ROAS 자동 계산 API
 * POST /api/campaigns/calculate-roas - 캠페인별 ROAS 계산 및 신호등 알림
 *
 * 이 API는 주문 동기화 후 또는 Cron Job으로 실행됩니다.
 * - 캠페인별 ROAS 계산
 * - 신호등 상태 변경 시 알림 생성
 * - 빨간불 캠페인 알림톡 발송
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 신호등 기준
const TRAFFIC_LIGHT = {
  GREEN: 300,   // ROAS 300% 이상
  YELLOW: 150,  // ROAS 150% 이상
  RED: 0        // ROAS 150% 미만
}

function getTrafficLight(roas: number): 'green' | 'yellow' | 'red' {
  if (roas >= TRAFFIC_LIGHT.GREEN) return 'green'
  if (roas >= TRAFFIC_LIGHT.YELLOW) return 'yellow'
  return 'red'
}

function getTrafficLightEmoji(light: string): string {
  switch (light) {
    case 'green': return '🟢'
    case 'yellow': return '🟡'
    case 'red': return '🔴'
    default: return '⚪'
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const cronSecret = request.headers.get('x-cron-secret')
    const isCronJob = cronSecret === process.env.CRON_SECRET

    let userId: string | null = null

    if (!isCronJob) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
      }
      userId = user.id
    }

    // Body에서 campaignId 확인
    let campaignId: string | null = null
    try {
      const body = await request.json()
      campaignId = body.campaignId || null
    } catch {
      // Body 없어도 OK
    }

    // 계산할 캠페인 목록 조회
    let query = supabase
      .from('campaigns')
      .select(`
        *,
        products (
          id,
          name,
          price,
          cost
        )
      `)
      .in('status', ['running', 'paused'])

    if (userId) {
      query = query.eq('user_id', userId)
    }
    if (campaignId) {
      query = query.eq('id', campaignId)
    }

    const { data: campaigns, error: campaignError } = await query

    if (campaignError || !campaigns) {
      return NextResponse.json({ error: '캠페인 조회 실패' }, { status: 500 })
    }

    const results: Array<{
      campaignId: string
      name: string
      oldRoas: number
      newRoas: number
      oldLight: string
      newLight: string
      alertCreated: boolean
    }> = []

    for (const campaign of campaigns) {
      const oldRoas = campaign.roas || 0
      const oldLight = getTrafficLight(oldRoas)

      // 최근 30일간 해당 캠페인의 주문 집계
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('total_amount, quantity')
        .eq('campaign_id', campaign.id)
        .gte('ordered_at', thirtyDaysAgo.toISOString())
        .in('order_status', ['paid', 'shipping', 'delivered'])

      if (orderError) {
        console.error(`Campaign ${campaign.id} orders error:`, orderError)
        continue
      }

      // 매출 합계
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const totalConversions = orders?.length || 0

      // ROAS 계산
      const spent = campaign.spent || 0
      const newRoas = spent > 0 ? Math.round((totalRevenue / spent) * 100) : 0
      const newLight = getTrafficLight(newRoas)

      // 캠페인 업데이트
      await supabase
        .from('campaigns')
        .update({
          revenue: totalRevenue,
          conversions: totalConversions,
          roas: newRoas
        })
        .eq('id', campaign.id)

      // 일별 통계 저장
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('campaign_daily_stats')
        .upsert({
          campaign_id: campaign.id,
          user_id: campaign.user_id,
          date: today,
          spent: spent,
          clicks: campaign.clicks || 0,
          conversions: totalConversions,
          revenue: totalRevenue,
          roas: newRoas
        }, {
          onConflict: 'campaign_id,date'
        })

      let alertCreated = false

      // 신호등 변경 시 알림 생성
      if (oldLight !== newLight) {
        const alertType = `${newLight}_light`
        const emoji = getTrafficLightEmoji(newLight)

        let title = ''
        let message = ''

        switch (newLight) {
          case 'red':
            title = `${emoji} 광고 효율 경고`
            message = `[${campaign.name}] 캠페인의 ROAS가 ${newRoas}%로 떨어졌습니다. 광고 중단 또는 수정을 권장합니다.`
            break
          case 'yellow':
            title = `${emoji} 광고 효율 주의`
            message = `[${campaign.name}] 캠페인의 ROAS가 ${newRoas}%입니다. 소재나 타겟 점검이 필요합니다.`
            break
          case 'green':
            title = `${emoji} 광고 효율 좋음`
            message = `[${campaign.name}] 캠페인의 ROAS가 ${newRoas}%로 상승했습니다! 예산을 늘려보세요.`
            break
        }

        // 알림 생성
        await supabase.from('alerts').insert({
          user_id: campaign.user_id,
          campaign_id: campaign.id,
          product_id: campaign.product_id,
          alert_type: alertType,
          title,
          message,
          related_data: {
            oldRoas,
            newRoas,
            oldLight,
            newLight,
            spent,
            revenue: totalRevenue,
            conversions: totalConversions
          }
        })

        alertCreated = true

        // 빨간불인 경우 알림톡 발송 (알림 설정 확인)
        if (newLight === 'red') {
          const { data: settings } = await supabase
            .from('alert_settings')
            .select('red_light_enabled, kakao_enabled, kakao_phone')
            .eq('user_id', campaign.user_id)
            .single()

          if (settings?.red_light_enabled && settings?.kakao_enabled && settings?.kakao_phone) {
            // 알림톡 발송 API 호출
            try {
              await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/alerts/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  userId: campaign.user_id,
                  phone: settings.kakao_phone,
                  templateCode: 'RED_LIGHT_ALERT',
                  variables: {
                    campaignName: campaign.name,
                    roas: newRoas,
                    recommendation: 'AI 추천: 타겟 연령대를 25-34세로 좁혀보세요'
                  }
                })
              })
            } catch (err) {
              console.error('Alimtalk send error:', err)
            }
          }
        }
      }

      results.push({
        campaignId: campaign.id,
        name: campaign.name,
        oldRoas,
        newRoas,
        oldLight,
        newLight,
        alertCreated
      })
    }

    return NextResponse.json({
      success: true,
      message: `${campaigns.length}개 캠페인 ROAS 계산 완료`,
      data: {
        total: campaigns.length,
        alerts: results.filter(r => r.alertCreated).length,
        results
      }
    })

  } catch (error) {
    console.error('ROAS calculation error:', error)
    return NextResponse.json({ error: 'ROAS 계산에 실패했습니다' }, { status: 500 })
  }
}
