/**
 * 스토어 검색 페이지 커스터마이징 API
 * GET: 설정 조회
 * POST: 설정 저장/업데이트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// GET: 설정 조회 (channel_type, store_slug 필요)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const channelType = searchParams.get('channel_type')
    const storeSlug = searchParams.get('store_slug')

    if (!channelType || !storeSlug) {
      return NextResponse.json({
        error: 'channel_type과 store_slug가 필요합니다.'
      }, { status: 400 })
    }

    // GET은 인증 없이 조회 가능 (공개 페이지에서 사용)
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('store_customization')
      .select('*')
      .eq('channel_type', channelType)
      .eq('store_slug', storeSlug)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error
    }

    // 데이터가 없으면 기본값 반환 (hex 색상)
    const defaultSettings = {
      channel_type: channelType,
      store_slug: storeSlug,
      background_type: 'solid',
      bg_color_hex: channelType === 'tiktok' ? '#FECDD3' : '#FECACA',
      button_color_hex: channelType === 'tiktok' ? '#F43F5E' : '#F97316',
      title_color_hex: '#1E293B',
      subtitle_color_hex: '#475569',
      button_text_color_hex: '#FFFFFF',
      header_image_url: null,
      header_image_size: 'medium',
      title_text: null,
      subtitle_text: null,
      button_text: null,
      input_bg_color_hex: null,
      input_text_color_hex: null,
      input_border_color_hex: null,
      input_show_border: true,
      quick_links: [],
      quick_link_bg_color_hex: null,
      quick_link_text_color_hex: null,
      quick_link_layout: 'single',
    }

    return NextResponse.json({
      success: true,
      data: data || defaultSettings
    })

  } catch (error) {
    console.error('Store customization GET error:', error)
    return NextResponse.json({
      error: '설정을 불러오는 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// POST: 설정 저장/업데이트
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body = await request.json()
    const {
      channel_type,
      store_slug,
      background_type,
      background_gradient,
      background_color,
      background_image_url,
      header_image_url,
      header_image_size,
      title_text,
      subtitle_text,
      button_gradient,
      button_text,
      bg_color_hex,
      button_color_hex,
      title_color_hex,
      subtitle_color_hex,
      button_text_color_hex,
      input_bg_color_hex,
      input_text_color_hex,
      input_border_color_hex,
      input_show_border,
      quick_links,
      quick_link_bg_color_hex,
      quick_link_text_color_hex,
      quick_link_layout,
    } = body

    if (!channel_type || !store_slug) {
      return NextResponse.json({
        error: 'channel_type과 store_slug가 필요합니다.'
      }, { status: 400 })
    }

    // upsert (있으면 업데이트, 없으면 생성)
    const { data, error } = await supabase
      .from('store_customization')
      .upsert({
        user_id: user.id,
        channel_type,
        store_slug,
        background_type: background_type || 'solid',
        background_gradient,
        background_color,
        background_image_url,
        header_image_url,
        header_image_size: header_image_size || 'medium',
        title_text,
        subtitle_text,
        button_gradient,
        button_text,
        bg_color_hex,
        button_color_hex,
        title_color_hex,
        subtitle_color_hex,
        button_text_color_hex,
        input_bg_color_hex,
        input_text_color_hex,
        input_border_color_hex,
        input_show_border,
        quick_links,
        quick_link_bg_color_hex,
        quick_link_text_color_hex,
        quick_link_layout,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,channel_type,store_slug'
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Store customization POST error:', error)
    return NextResponse.json({
      error: '설정을 저장하는 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
