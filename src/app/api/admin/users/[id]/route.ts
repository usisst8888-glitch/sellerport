/**
 * 관리자 - 회원 상세/승인 API
 * GET /api/admin/users/[id] - 회원 상세 조회
 * PATCH /api/admin/users/[id] - 회원 승인/거절/유형 변경
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 회원 상세 조회
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

    // 현재 사용자가 관리자/매니저인지 확인
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!currentProfile || !['admin', 'manager'].includes(currentProfile.user_type)) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    // 회원 조회
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: '회원을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        businessName: profile.business_name,
        businessNumber: profile.business_number,
        ownerName: profile.owner_name,
        phone: profile.phone,
        userType: profile.user_type,
        approvalStatus: profile.approval_status,
        businessLicenseUrl: profile.business_license_url,
        approvedAt: profile.approved_at,
        approvedBy: profile.approved_by,
        rejectionReason: profile.rejection_reason,
        createdAt: profile.created_at
      }
    })

  } catch (error) {
    console.error('Admin user detail API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 회원 승인/거절/유형 변경
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

    // 현재 사용자가 관리자/매니저인지 확인
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (!currentProfile || !['admin', 'manager'].includes(currentProfile.user_type)) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const { action, userType, rejectionReason } = body

    const updateData: Record<string, unknown> = {}

    // 승인 처리
    if (action === 'approve') {
      updateData.approval_status = 'approved'
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = user.id
      updateData.rejection_reason = null
    }

    // 거절 처리
    if (action === 'reject') {
      updateData.approval_status = 'rejected'
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = user.id
      updateData.rejection_reason = rejectionReason || '관리자에 의해 거절되었습니다'
    }

    // 회원 유형 변경 (관리자만 가능)
    if (userType && currentProfile.user_type === 'admin') {
      updateData.user_type = userType
      // admin이나 manager로 변경하면 자동 승인
      if (['admin', 'manager'].includes(userType)) {
        updateData.approval_status = 'approved'
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '수정할 항목이 없습니다' }, { status: 400 })
    }

    // 프로필 수정
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: '회원 정보 수정에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: profile.id,
        email: profile.email,
        userType: profile.user_type,
        approvalStatus: profile.approval_status,
        approvedAt: profile.approved_at,
        rejectionReason: profile.rejection_reason
      }
    })

  } catch (error) {
    console.error('Admin user update API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
