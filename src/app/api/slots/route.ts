/**
 * 슬롯 API
 * GET /api/slots - 슬롯 목록 조회
 * POST /api/slots - 새 슬롯 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

// 슬롯 목록 조회
export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 슬롯 목록 조회
    const { data: slots, error } = await supabase
      .from('slots')
      .select(`
        *,
        products (
          name,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Slots fetch error:', error)
      return NextResponse.json({ error: '슬롯 조회에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: slots })

  } catch (error) {
    console.error('Slots API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 새 슬롯 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, utmSource, utmMedium, utmCampaign, targetUrl, name } = body

    if (!utmSource || !utmMedium || !utmCampaign || !targetUrl) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
    }

    // 사용자 잔액 확인
    const { data: balance } = await supabase
      .from('user_balance')
      .select('slot_balance')
      .eq('user_id', user.id)
      .single()

    // 잔액이 없거나 0인 경우 (무료 슬롯 5개 제공 로직은 별도)
    const currentBalance = balance?.slot_balance || 0

    // 슬롯 ID 생성
    const slotId = `SL-${nanoid(8).toUpperCase()}`

    // 추적 URL 생성
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/t/${slotId}`

    // 슬롯 생성
    const { data: slot, error } = await supabase
      .from('slots')
      .insert({
        id: slotId,
        user_id: user.id,
        product_id: productId || null,
        name: name || `${utmSource} - ${utmCampaign}`,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        target_url: targetUrl,
        tracking_url: trackingUrl,
        status: 'active',
        clicks: 0,
        conversions: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Slot create error:', error)
      return NextResponse.json({ error: '슬롯 생성에 실패했습니다' }, { status: 500 })
    }

    // 잔액 차감 (유료인 경우)
    if (currentBalance > 0) {
      await supabase
        .from('user_balance')
        .update({ slot_balance: currentBalance - 1 })
        .eq('user_id', user.id)
    }

    return NextResponse.json({
      success: true,
      data: slot,
      trackingUrl
    })

  } catch (error) {
    console.error('Slot create API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
