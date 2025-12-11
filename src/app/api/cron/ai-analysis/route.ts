/**
 * AI 최적화 분석 Cron Job
 * 매일 아침 9시 실행되어 빨간불/노란불 캠페인에 대한 AI 분석 알림을 발송합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateOptimizationTips, generateAlimtalkSummary, CampaignMetrics } from '@/lib/ai/optimization-tips'
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

  console.log('[Cron] Starting AI analysis...')

  const supabase = getSupabaseAdmin()

  try {
    // 활성 캠페인 중 빨간불/노란불인 캠페인 조회 (ROAS < 300%)
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('*')
      .in('status', ['running', 'paused'])
      .lt('roas', 300) // 노란불 이하

    if (!campaigns || campaigns.length === 0) {
      console.log('[Cron] No campaigns need AI analysis')
      return NextResponse.json({ success: true, message: 'No campaigns need analysis' })
    }

    // 사용자별로 그룹화
    const userCampaigns = new Map<string, typeof campaigns>()
    campaigns.forEach(campaign => {
      const userId = campaign.user_id
      if (!userCampaigns.has(userId)) {
        userCampaigns.set(userId, [])
      }
      userCampaigns.get(userId)!.push(campaign)
    })

    let alertCount = 0
    let alimtalkCount = 0

    // 사용자별 처리
    for (const [userId, userCampaignList] of userCampaigns) {
      // 사용자 알림 설정 조회
      const { data: settings } = await supabase
        .from('alert_settings')
        .select('*')
        .eq('user_id', userId)
        .single()

      // AI 분석 결과 생성 및 저장
      for (const campaign of userCampaignList) {
        // 최근 30일 데이터 조회
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: orders } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('campaign_id', campaign.id)
          .gte('ordered_at', thirtyDaysAgo.toISOString())
          .in('order_status', ['paid', 'shipping', 'delivered'])

        const { data: clicks } = await supabase
          .from('tracking_link_clicks')
          .select('id')
          .eq('campaign_id', campaign.id)
          .gte('created_at', thirtyDaysAgo.toISOString())

        const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
        const conversions = orders?.length || 0
        const totalClicks = clicks?.length || campaign.clicks || 0
        const spent = campaign.spent || 0
        const impressions = campaign.impressions || totalClicks * 50

        const metrics: CampaignMetrics = {
          roas: spent > 0 ? Math.round((totalRevenue / spent) * 100) : 0,
          ctr: impressions > 0 ? (totalClicks / impressions) * 100 : 0,
          cvr: totalClicks > 0 ? (conversions / totalClicks) * 100 : 0,
          spent,
          revenue: totalRevenue,
          clicks: totalClicks,
          impressions,
          conversions,
          avgOrderValue: conversions > 0 ? Math.round(totalRevenue / conversions) : 0
        }

        // AI 분석 생성
        const tips = generateOptimizationTips(metrics)

        if (tips.length > 0) {
          const topTip = tips[0]
          const trafficLight = metrics.roas >= 150 ? 'yellow' : 'red'
          const emoji = trafficLight === 'yellow' ? '🟡' : '🔴'

          // 알림 저장
          await supabase.from('alerts').insert({
            user_id: userId,
            campaign_id: campaign.id,
            product_id: campaign.product_id,
            alert_type: 'ai_analysis',
            title: `${emoji} AI 분석: ${campaign.name}`,
            message: `${topTip.title}\n${topTip.description}`,
            related_data: {
              metrics,
              tips: tips.slice(0, 3).map(t => ({
                type: t.type,
                priority: t.priority,
                title: t.title,
                description: t.description
              }))
            }
          })

          alertCount++

          // 빨간불 캠페인에 알림톡 발송 (시스템 알리고 설정 사용)
          if (
            trafficLight === 'red' &&
            settings?.kakao_enabled &&
            settings?.kakao_phone &&
            process.env.ALIGO_API_KEY &&
            process.env.ALIGO_USER_ID &&
            process.env.ALIGO_SENDER_KEY
          ) {
            try {
              const aligoClient = createAligoClient(
                process.env.ALIGO_API_KEY,
                process.env.ALIGO_USER_ID,
                process.env.ALIGO_SENDER_KEY
              )

              const alimtalkMessage = generateAlimtalkSummary(campaign.name, metrics, tips)

              const result = await aligoClient.sendAlimtalk({
                receiver: settings.kakao_phone,
                templateCode: 'SELLERPORT_AI_ANALYSIS',
                message: alimtalkMessage,
                failover: {
                  type: 'LMS',
                  message: alimtalkMessage,
                },
              })

              if (result.success) {
                console.log(`[Cron] AI analysis sent for ${campaign.name} to ${settings.kakao_phone}`)
                alimtalkCount++
              } else {
                console.error(`[Cron] Failed to send AI analysis: ${result.error}`)
              }
            } catch (aligoError) {
              console.error(`[Cron] Aligo error for ${campaign.name}:`, aligoError)
            }
          }
        }
      }
    }

    console.log(`[Cron] AI analysis completed: ${alertCount} alerts created, ${alimtalkCount} alimtalks sent`)

    return NextResponse.json({
      success: true,
      campaigns: campaigns.length,
      alerts: alertCount,
      alimtalks: alimtalkCount
    })

  } catch (error) {
    console.error('[Cron] AI analysis error:', error)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
