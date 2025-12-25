/**
 * 틱톡 영상번호 API
 * GET: 영상번호 목록 조회 (tracking_links에서 channel_type='tiktok'이고 video_code가 있는 것만)
 * POST: 영상번호 생성 (tracking_links에 video_code 포함해서 생성)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: 영상번호 목록 조회
export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    // tracking_links에서 channel_type='tiktok'이고 video_code가 있는 것만 조회
    const { data, error } = await supabaseAdmin
      .from('tracking_links')
      .select('*')
      .eq('user_id', user.id)
      .eq('channel_type', 'tiktok')
      .not('video_code', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({
        success: false,
        error: '데이터 조회 실패'
      }, { status: 500 })
    }

    // store_slug 가져오기: 가장 오래된(첫 번째 생성된) 레코드의 store_slug 사용 (일관성 유지)
    // 데이터가 created_at 내림차순이므로, store_slug가 있는 것 중 마지막(가장 오래된) 것 사용
    const itemsWithSlug = data?.filter(item => item.store_slug) || []
    let storeSlug = itemsWithSlug.length > 0 ? itemsWithSlug[itemsWithSlug.length - 1].store_slug : null

    if (!storeSlug) {
      // 새로운 slug 생성: tt-난수 형태 (채널별 고유값)
      const randomId = Math.random().toString(36).substring(2, 10)
      storeSlug = `tt-${randomId}`
    }

    return NextResponse.json({
      success: true,
      data,
      storeSlug
    })

  } catch (error) {
    console.error('TikTok video codes GET error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// POST: 영상번호 생성 (tracking_links에 직접 생성)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    const body = await request.json()
    const { videoCode, videoTitle, targetUrl } = body

    // 검증
    if (!videoCode || !targetUrl) {
      return NextResponse.json({
        success: false,
        error: '영상번호와 목적지 URL은 필수입니다.'
      }, { status: 400 })
    }

    // 영상번호 형식 검증
    const codePattern = /^[A-Z]\d{3}$/
    if (!codePattern.test(videoCode)) {
      return NextResponse.json({
        success: false,
        error: '영상번호는 A001~Z999 형식이어야 합니다.'
      }, { status: 400 })
    }

    // store_slug 결정: 기존 TikTok 데이터에서 가져오거나 새로 생성
    let finalStoreSlug: string | null = null

    // 1. 기존 TikTok tracking_links에서 가장 오래된(첫 번째 생성된) store_slug 가져오기
    const { data: existingData } = await supabaseAdmin
      .from('tracking_links')
      .select('store_slug, created_at')
      .eq('user_id', user.id)
      .eq('channel_type', 'tiktok')
      .not('store_slug', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)

    if (existingData && existingData.length > 0) {
      finalStoreSlug = existingData[0].store_slug
    } else {
      // 2. 새로운 slug 생성: tt-난수 형태 (채널별 고유값)
      const randomId = Math.random().toString(36).substring(2, 10)
      finalStoreSlug = `tt-${randomId}`
    }

    // 중복 체크 (같은 유저, 같은 채널타입, 같은 영상번호)
    const { data: existing } = await supabaseAdmin
      .from('tracking_links')
      .select('id')
      .eq('user_id', user.id)
      .eq('channel_type', 'tiktok')
      .eq('video_code', videoCode)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: false,
        error: '이미 사용 중인 영상번호입니다.'
      }, { status: 400 })
    }

    // 스마트스토어인지 확인
    const isSmartStore = targetUrl.includes('smartstore.naver.com') || targetUrl.includes('brand.naver.com')

    // tracking_links에 직접 생성
    const trackingLinkId = `tt_${videoCode.toLowerCase()}_${Date.now().toString(36)}`
    const trackingLinkData: Record<string, unknown> = {
      id: trackingLinkId,
      user_id: user.id,
      channel_type: 'tiktok',
      post_name: `틱톡 ${videoCode}${videoTitle ? ` - ${videoTitle}` : ''}`,
      target_url: targetUrl,
      video_code: videoCode,
      store_slug: finalStoreSlug,
      status: 'active',
      // utm_source는 항상 설정 (UI 표시용)
      utm_source: 'tiktok',
      utm_medium: 'video',
      utm_campaign: `video_${videoCode.toLowerCase()}`
    }

    if (isSmartStore) {
      // 네이버 스마트스토어: NT 파라미터 추가 사용
      trackingLinkData.nt_source = 'tiktok'
      trackingLinkData.nt_medium = 'video'
      trackingLinkData.nt_detail = `video_${videoCode.toLowerCase()}`
      trackingLinkData.nt_keyword = videoTitle || videoCode
    }

    const { data, error } = await supabaseAdmin
      .from('tracking_links')
      .insert(trackingLinkData)
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({
        success: false,
        error: `영상번호 생성 실패: ${error.message}`
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('TikTok video codes POST error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
