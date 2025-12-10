/**
 * 관리자 - 회원 관리 API
 * GET /api/admin/users - 회원 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 회원 목록 조회 (관리자 전용)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

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

    // 필터 파라미터 가져오기
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, approved, rejected
    const userType = searchParams.get('userType') // seller, agency

    // 회원 목록 조회
    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('approval_status', status)
    }

    if (userType) {
      query = query.eq('user_type', userType)
    }

    const { data: users, error } = await query

    if (error) {
      console.error('Users fetch error:', error)
      return NextResponse.json({ error: '회원 목록 조회에 실패했습니다' }, { status: 500 })
    }

    // 응답 데이터 변환
    const formattedUsers = users?.map(profile => ({
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
      rejectionReason: profile.rejection_reason,
      createdAt: profile.created_at
    })) || []

    return NextResponse.json({
      success: true,
      data: formattedUsers
    })

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
