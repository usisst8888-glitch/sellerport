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
    const { productId, utmSource, utmMedium, utmCampaign, targetUrl, adSpend, targetRoasGreen, targetRoasYellow } = body

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

    // 상품의 판매 사이트 타입 확인 (자체몰 여부)
    let siteType: string | null = null
    if (productId) {
      const { data: product } = await supabase
        .from('products')
        .select('site_type')
        .eq('id', productId)
        .single()
      siteType = product?.site_type || null
    }

    // 자체몰(custom)은 추적 스크립트 설치 가능 → 브릿지샵 불필요
    // 네이버/쿠팡 등 외부 사이트는 스크립트 설치 불가 → 브릿지샵 필요
    const isCustomShop = siteType === 'custom' || siteType === 'cafe24'
    const needsBridgeShop = ['google', 'meta', 'tiktok'].includes(utmSource) && !isCustomShop

    // 베이스 URL 설정 (환경에 따라)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    let trackingUrl: string
    let bridgeShopUrl: string | null = null
    let goUrl: string
    let directUrl: string | null = null // 자체몰용 직접 URL

    // go URL은 항상 제공 (리다이렉트용)
    goUrl = `${baseUrl}/go/${trackingLinkId}`

    if (isCustomShop) {
      // 자체몰: 목적지 URL에 UTM 파라미터 + 추적 ID 직접 추가
      const targetWithParams = new URL(targetUrl)
      targetWithParams.searchParams.set('utm_source', utmSource)
      targetWithParams.searchParams.set('utm_medium', utmMedium)
      targetWithParams.searchParams.set('utm_campaign', utmCampaign)
      targetWithParams.searchParams.set('sp_click', trackingLinkId)
      directUrl = targetWithParams.toString()
      trackingUrl = directUrl
    } else if (needsBridgeShop) {
      // 구글/메타/틱톡 + 외부 사이트(네이버/쿠팡): 브릿지샵 필요
      const smartstoreMatch = targetUrl.match(/smartstore\.naver\.com\/([^/]+)\/products\/(\d+)/)

      if (smartstoreMatch) {
        const [, storeName, productIdFromUrl] = smartstoreMatch
        bridgeShopUrl = `${baseUrl}/bridge/${storeName}/${productIdFromUrl}?tl=${trackingLinkId}`
      } else {
        bridgeShopUrl = `${baseUrl}/bridge/shop?tl=${trackingLinkId}`
      }
      trackingUrl = bridgeShopUrl
    } else {
      // 네이버/카카오/블로그 등 + 외부 사이트: 빠른 리다이렉트
      trackingUrl = goUrl
    }

    // 추적 링크 생성
    const { data: trackingLink, error } = await supabase
      .from('tracking_links')
      .insert({
        id: trackingLinkId,
        user_id: user.id,
        product_id: productId || null,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        target_url: targetUrl,
        tracking_url: trackingUrl,
        bridge_shop_url: bridgeShopUrl,
        go_url: goUrl,
        status: 'active',
        clicks: 0,
        conversions: 0,
        revenue: 0,
        ad_spend: adSpend || 0,
        target_roas_green: targetRoasGreen ?? 300,
        target_roas_yellow: targetRoasYellow ?? 150
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
