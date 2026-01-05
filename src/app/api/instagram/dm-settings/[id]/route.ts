/**
 * Instagram DM 설정 상세 API
 * GET - 단일 설정 조회
 * PATCH - 설정 수정
 * DELETE - 설정 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

// 단일 DM 설정 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: setting, error } = await supabase
      .from('instagram_dm_settings')
      .select(`
        *,
        ad_channels (
          id,
          channel_name,
          account_name,
          metadata
        ),
        tracking_links (
          id,
          utm_campaign,
          target_url,
          go_url,
          post_name,
          clicks,
          conversions
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error) {
      console.error('Failed to fetch DM setting:', error)
      return NextResponse.json({ error: 'DM 설정을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: setting })
  } catch (error) {
    console.error('DM setting GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DM 설정 수정
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 해당 설정이 사용자의 것인지 확인
    const { data: existing } = await supabase
      .from('instagram_dm_settings')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'DM 설정을 찾을 수 없습니다' }, { status: 404 })
    }

    const body = await request.json()
    const {
      triggerKeywords,
      dmMessage,
      includeFollowCta,
      followCtaMessage,
      followButtonText,
      requireFollow,
      isActive,
    } = body

    // 수정 가능한 필드만 업데이트
    const updateData: Record<string, unknown> = {}

    if (triggerKeywords !== undefined) {
      updateData.trigger_keywords = triggerKeywords
    }
    if (dmMessage !== undefined) {
      updateData.dm_message = dmMessage
    }
    if (includeFollowCta !== undefined) {
      updateData.include_follow_cta = includeFollowCta
    }
    if (followCtaMessage !== undefined) {
      updateData.follow_cta_message = followCtaMessage
    }
    if (followButtonText !== undefined) {
      updateData.follow_button_text = followButtonText
    }
    if (requireFollow !== undefined) {
      updateData.require_follow = requireFollow
    }
    if (isActive !== undefined) {
      updateData.is_active = isActive
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '수정할 내용이 없습니다' }, { status: 400 })
    }

    updateData.updated_at = new Date().toISOString()

    const { data: setting, error } = await supabase
      .from('instagram_dm_settings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update DM setting:', error)
      return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: setting })
  } catch (error) {
    console.error('DM setting PATCH API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DM 설정 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 해당 설정이 사용자의 것인지 확인 + tracking_link_id 가져오기
    const { data: existing } = await supabase
      .from('instagram_dm_settings')
      .select('id, user_id, tracking_link_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: 'DM 설정을 찾을 수 없습니다' }, { status: 404 })
    }

    // DM 설정 삭제
    const { error } = await supabase
      .from('instagram_dm_settings')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete DM setting:', error)
      return NextResponse.json({ error: 'Failed to delete setting' }, { status: 500 })
    }

    // 연결된 tracking_link도 삭제
    if (existing.tracking_link_id) {
      const { error: trackingError } = await supabase
        .from('tracking_links')
        .delete()
        .eq('id', existing.tracking_link_id)
        .eq('user_id', user.id)

      if (trackingError) {
        console.error('Failed to delete tracking link:', trackingError)
        // tracking_link 삭제 실패해도 DM 설정은 이미 삭제됨
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DM setting DELETE API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
