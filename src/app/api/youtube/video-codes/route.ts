/**
 * 유튜브 쇼츠 영상번호 API
 * GET: 영상번호 목록 조회 (tracking_links에서 video_code가 있는 것만)
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

    // tracking_links에서 video_code가 있는 것만 조회
    const { data, error } = await supabaseAdmin
      .from('tracking_links')
      .select('*')
      .eq('user_id', user.id)
      .not('video_code', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({
        success: false,
        error: '데이터 조회 실패'
      }, { status: 500 })
    }

    // store_slug 가져오기: 기존 데이터 또는 유튜브 채널에서
    let storeSlug = data?.find(item => item.store_slug)?.store_slug || null

    if (!storeSlug) {
      // 유튜브 채널의 account_name을 slug로 변환
      const { data: youtubeChannel } = await supabaseAdmin
        .from('ad_channels')
        .select('account_name, channel_name')
        .eq('user_id', user.id)
        .eq('channel_type', 'youtube')
        .eq('status', 'connected')
        .limit(1)

      if (youtubeChannel && youtubeChannel.length > 0) {
        const accountName = youtubeChannel[0].account_name || youtubeChannel[0].channel_name
        if (accountName) {
          storeSlug = accountName
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')

          if (!storeSlug) {
            storeSlug = `store-${user.id.substring(0, 8)}`
          }
        }
      }

      if (!storeSlug) {
        storeSlug = `store-${user.id.substring(0, 8)}`
      }
    }

    return NextResponse.json({
      success: true,
      data,
      storeSlug
    })

  } catch (error) {
    console.error('YouTube video codes GET error:', error)
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

    // store_slug 결정: 기존 데이터 또는 유튜브 채널 account_name 사용
    let finalStoreSlug: string | null = null

    // 1. 기존 tracking_links에서 store_slug 가져오기
    const { data: existingData } = await supabaseAdmin
      .from('tracking_links')
      .select('store_slug')
      .eq('user_id', user.id)
      .not('store_slug', 'is', null)
      .limit(1)

    if (existingData && existingData.length > 0) {
      finalStoreSlug = existingData[0].store_slug
    } else {
      // 2. 유튜브 채널의 account_name을 slug로 변환해서 사용
      const { data: youtubeChannel } = await supabaseAdmin
        .from('ad_channels')
        .select('account_name, channel_name')
        .eq('user_id', user.id)
        .eq('channel_type', 'youtube')
        .eq('status', 'connected')
        .limit(1)

      if (youtubeChannel && youtubeChannel.length > 0) {
        const accountName = youtubeChannel[0].account_name || youtubeChannel[0].channel_name
        if (accountName) {
          // 한글/특수문자 제거, 영문 소문자/숫자/하이픈만 허용
          finalStoreSlug = accountName
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')

          // 빈 문자열이면 user id 일부 사용
          if (!finalStoreSlug) {
            finalStoreSlug = `store-${user.id.substring(0, 8)}`
          }
        }
      }

      // 3. 유튜브 채널도 없으면 기본값
      if (!finalStoreSlug) {
        finalStoreSlug = `store-${user.id.substring(0, 8)}`
      }
    }

    // 중복 체크 (같은 유저, 같은 영상번호)
    const { data: existing } = await supabaseAdmin
      .from('tracking_links')
      .select('id')
      .eq('user_id', user.id)
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
    const trackingLinkId = `yt_${videoCode.toLowerCase()}_${Date.now().toString(36)}`
    const trackingLinkData: Record<string, unknown> = {
      id: trackingLinkId,
      user_id: user.id,
      channel_type: 'youtube',
      post_name: `쇼츠 ${videoCode}${videoTitle ? ` - ${videoTitle}` : ''}`,
      target_url: targetUrl,
      video_code: videoCode,
      store_slug: finalStoreSlug,
      status: 'active',
      // utm_source는 항상 설정 (UI 표시용)
      utm_source: 'youtube',
      utm_medium: 'shorts',
      utm_campaign: `video_${videoCode.toLowerCase()}`
    }

    if (isSmartStore) {
      // 네이버 스마트스토어: NT 파라미터 추가 사용
      trackingLinkData.nt_source = 'youtube'
      trackingLinkData.nt_medium = 'shorts'
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
    console.error('YouTube video codes POST error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
