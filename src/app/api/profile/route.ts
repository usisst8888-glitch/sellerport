/**
 * 프로필 API
 * GET /api/profile - 프로필 조회
 * PATCH /api/profile - 프로필 수정
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 프로필 조회
export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 프로필 조회
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Profile fetch error:', error)
      return NextResponse.json({ error: '프로필 조회에 실패했습니다' }, { status: 500 })
    }

    // 프로필이 없으면 기본값 반환
    if (!profile) {
      return NextResponse.json({
        success: true,
        data: {
          id: user.id,
          email: user.email,
          businessName: null,
          businessNumber: null,
          ownerName: null,
          phone: null,
          subscriberCount: 0,
          siteCount: 0,
          userType: 'seller',
          approvalStatus: 'approved',
          businessLicenseUrl: null,
          isNewUser: true,
        }
      })
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
        subscriberCount: profile.subscriber_count,
        siteCount: profile.platform_count,
        userType: profile.user_type || 'seller',
        approvalStatus: profile.approval_status || 'approved',
        businessLicenseUrl: profile.business_license_url,
        approvedAt: profile.approved_at,
        rejectionReason: profile.rejection_reason,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
      }
    })

  } catch (error) {
    console.error('Profile API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 프로필 수정
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const { businessName, businessNumber, ownerName, phone, userType, businessLicenseUrl } = body

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {}

    if (businessName !== undefined) updateData.business_name = businessName
    if (businessNumber !== undefined) updateData.business_number = businessNumber
    if (ownerName !== undefined) updateData.owner_name = ownerName
    if (phone !== undefined) updateData.phone = phone
    if (businessLicenseUrl !== undefined) updateData.business_license_url = businessLicenseUrl

    // 회원 유형 변경 시 (대행사로 변경하면 승인 대기 상태로)
    if (userType !== undefined) {
      updateData.user_type = userType
      // 대행사로 변경하면 승인 대기 상태로
      if (userType === 'agency') {
        updateData.approval_status = 'pending'
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '수정할 항목이 없습니다' }, { status: 400 })
    }

    // 프로필 수정
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      return NextResponse.json({ error: '프로필 수정에 실패했습니다' }, { status: 500 })
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
        subscriberCount: profile.subscriber_count,
        siteCount: profile.platform_count,
        userType: profile.user_type,
        approvalStatus: profile.approval_status,
        businessLicenseUrl: profile.business_license_url,
        updatedAt: profile.updated_at
      }
    })

  } catch (error) {
    console.error('Profile update API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
