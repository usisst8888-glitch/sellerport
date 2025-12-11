/**
 * 추적 링크 API
 * GET /api/tracking-links - 추적 링크 목록 조회
 * POST /api/tracking-links - 새 추적 링크 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

// 추적 링크 목록 조회
export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 추적 링크 목록 조회 (products의 price, cost 포함)
    const { data: trackingLinks, error } = await supabase
      .from('tracking_links')
      .select(`
        *,
        products (
          id,
          name,
          image_url,
          price,
          cost
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Tracking links fetch error:', error)
      return NextResponse.json({ error: '추적 링크 조회에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: trackingLinks })

  } catch (error) {
    console.error('Tracking links API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 새 추적 링크 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, utmSource, utmMedium, utmCampaign, targetUrl, name, adSpend } = body

    if (!utmSource || !utmMedium || !utmCampaign || !targetUrl) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
    }

    // 사용자 플랜 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const userPlan = profile?.plan || 'free'

    // 무료 플랜만 추적 링크 3개 제한 (basic 이상은 무제한)
    if (userPlan === 'free') {
      const { count: currentCount } = await supabase
        .from('tracking_links')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if ((currentCount || 0) >= 3) {
        return NextResponse.json({
          error: '무료 플랜은 최대 3개의 추적 링크만 사용할 수 있습니다. 플랜을 업그레이드해주세요.',
          code: 'TRACKING_LINK_LIMIT_EXCEEDED',
          currentCount: currentCount,
          limit: 3
        }, { status: 403 })
      }
    }

    // 사용자 잔액 확인 (유료 추적 링크 구매 시스템용)
    const { data: balance } = await supabase
      .from('user_balance')
      .select('slot_balance')
      .eq('user_id', user.id)
      .single()

    const currentBalance = balance?.slot_balance || 0

    // 추적 링크 ID 생성
    const trackingLinkId = `TL-${nanoid(8).toUpperCase()}`

    // 추적 URL 생성 (채널 유형에 따라 다른 URL)
    // 유료 광고 (cpc, cpm, display, shopping) → 픽셀샵 필요
    // 유기적 채널 (organic, social, referral 등) → 빠른 리다이렉트
    const isPaidAd = ['cpc', 'cpm', 'display', 'shopping'].includes(utmMedium)

    let trackingUrl: string
    let pixelShopUrl: string | null = null
    let goUrl: string

    // 스마트스토어 URL에서 스토어명과 상품ID 추출
    const smartstoreMatch = targetUrl.match(/smartstore\.naver\.com\/([^/]+)\/products\/(\d+)/)

    if (smartstoreMatch && isPaidAd) {
      // 광고용: 픽셀샵 URL (사용자 클릭 필요)
      const [, storeName, productIdFromUrl] = smartstoreMatch
      pixelShopUrl = `https://pixel.sellerport.app/${storeName}/${productIdFromUrl}?tl=${trackingLinkId}`
      trackingUrl = pixelShopUrl
    } else {
      // 유기적 채널용: 빠른 리다이렉트
      trackingUrl = `https://go.sellerport.app/${trackingLinkId}`
    }

    // go URL은 항상 제공 (유기적 채널용으로도 쓸 수 있도록)
    goUrl = `https://go.sellerport.app/${trackingLinkId}`

    // 추적 링크 생성
    const { data: trackingLink, error } = await supabase
      .from('tracking_links')
      .insert({
        id: trackingLinkId,
        user_id: user.id,
        product_id: productId || null,
        name: name || `${utmSource} - ${utmCampaign}`,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        target_url: targetUrl,
        tracking_url: trackingUrl,
        pixel_shop_url: pixelShopUrl,
        go_url: goUrl,
        status: 'active',
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ad_spend: adSpend || 0
      })
      .select()
      .single()

    if (error) {
      console.error('Tracking link create error:', error)
      return NextResponse.json({ error: '추적 링크 생성에 실패했습니다' }, { status: 500 })
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
      data: trackingLink,
      trackingUrl
    })

  } catch (error) {
    console.error('Tracking link create API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
