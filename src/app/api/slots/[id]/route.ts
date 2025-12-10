/**
 * 슬롯 상세 API
 * GET /api/slots/[id] - 슬롯 상세 조회
 * PATCH /api/slots/[id] - 슬롯 수정
 * DELETE /api/slots/[id] - 슬롯 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 슬롯 상세 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { data: slot, error } = await supabase
      .from('slots')
      .select(`
        *,
        products (
          name,
          image_url,
          price
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !slot) {
      return NextResponse.json({ error: '슬롯을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: slot })

  } catch (error) {
    console.error('Slot detail error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 슬롯 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { name, status, targetUrl } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (status !== undefined) updateData.status = status
    if (targetUrl !== undefined) updateData.target_url = targetUrl

    const { data: slot, error } = await supabase
      .from('slots')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Slot update error:', error)
      return NextResponse.json({ error: '슬롯 수정에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: slot })

  } catch (error) {
    console.error('Slot update API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 슬롯 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { error } = await supabase
      .from('slots')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Slot delete error:', error)
      return NextResponse.json({ error: '슬롯 삭제에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Slot delete API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
