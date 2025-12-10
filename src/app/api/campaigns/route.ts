/**
 * 캠페인 API
 * GET /api/campaigns - 캠페인 목록 조회
 * POST /api/campaigns - 새 캠페인 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 신호등 판정 함수
function getTrafficLight(roas: number): 'green' | 'yellow' | 'red' {
  if (roas >= 300) return 'green'
  if (roas >= 150) return 'yellow'
  return 'red'
}

// 캠페인 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const status = searchParams.get('status')

    // 캠페인 목록 조회
    let query = supabase
      .from('campaigns')
      .select(`
        *,
        products (
          id,
          name,
          image_url,
          price
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (productId) {
      query = query.eq('product_id', productId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: campaigns, error } = await query

    if (error) {
      console.error('Campaigns fetch error:', error)
      return NextResponse.json({ error: '캠페인 조회에 실패했습니다' }, { status: 500 })
    }

    // 신호등 상태 추가
    const campaignsWithLight = campaigns?.map(campaign => ({
      ...campaign,
      trafficLight: getTrafficLight(campaign.roas || 0)
    }))

    return NextResponse.json({ success: true, data: campaignsWithLight })

  } catch (error) {
    console.error('Campaigns API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 새 캠페인 생성
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
      productId,
      name,
      platform,
      dailyBudget = 0,
      trackingUrl,
      externalCampaignId
    } = body

    if (!productId || !name || !platform) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
    }

    // 상품 존재 확인
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: '상품을 찾을 수 없습니다' }, { status: 404 })
    }

    // 캠페인 생성
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        product_id: productId,
        name,
        platform,
        daily_budget: dailyBudget,
        tracking_url: trackingUrl || null,
        external_campaign_id: externalCampaignId || null,
        status: 'running',
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        roas: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Campaign create error:', error)
      return NextResponse.json({ error: '캠페인 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        trafficLight: 'red' // 새 캠페인은 빨간불로 시작
      }
    })

  } catch (error) {
    console.error('Campaign create API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
