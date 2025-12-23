/**
 * 유튜브 쇼츠 영상번호 개별 API
 * GET: 영상번호 상세 조회
 * PATCH: 영상번호 수정
 * DELETE: 영상번호 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: 영상번호 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('youtube_video_codes')
      .select('*, tracking_links(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({
        success: false,
        error: '영상번호를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('YouTube video code GET error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// PATCH: 영상번호 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    // 기존 데이터 확인
    const { data: existing, error: findError } = await supabaseAdmin
      .from('youtube_video_codes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (findError || !existing) {
      return NextResponse.json({
        success: false,
        error: '영상번호를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    const body = await request.json()
    const { videoTitle, videoUrl, status } = body

    // 업데이트할 필드만 추출
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }

    if (videoTitle !== undefined) updateData.video_title = videoTitle
    if (videoUrl !== undefined) updateData.video_url = videoUrl
    if (status !== undefined) updateData.status = status

    const { data, error } = await supabaseAdmin
      .from('youtube_video_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({
        success: false,
        error: '수정에 실패했습니다.'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('YouTube video code PATCH error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// DELETE: 영상번호 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    // 영상번호 조회 (연결된 추적 링크 ID 확인)
    const { data: videoCode, error: findError } = await supabaseAdmin
      .from('youtube_video_codes')
      .select('tracking_link_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (findError || !videoCode) {
      return NextResponse.json({
        success: false,
        error: '영상번호를 찾을 수 없습니다.'
      }, { status: 404 })
    }

    // 영상번호 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('youtube_video_codes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({
        success: false,
        error: '삭제에 실패했습니다.'
      }, { status: 500 })
    }

    // 연결된 추적 링크도 삭제
    if (videoCode.tracking_link_id) {
      await supabaseAdmin
        .from('tracking_links')
        .delete()
        .eq('id', videoCode.tracking_link_id)
    }

    return NextResponse.json({
      success: true,
      message: '영상번호가 삭제되었습니다.'
    })

  } catch (error) {
    console.error('YouTube video code DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
