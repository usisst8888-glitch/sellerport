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

    // 알림 설정 조회
    const { data: alertSettingsData } = await supabase
      .from('alert_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const alertSettings = alertSettingsData ? {
      orderAlert: alertSettingsData.order_alert_enabled ?? true,
      redLightAlert: alertSettingsData.red_light_enabled ?? true,
      dailySummary: alertSettingsData.daily_report_enabled ?? false,
      yellowLightAlert: alertSettingsData.yellow_light_enabled ?? false,
      kakaoEnabled: alertSettingsData.kakao_enabled ?? false,
      kakaoPhone: alertSettingsData.kakao_phone || '',
    } : {
      orderAlert: true,
      redLightAlert: true,
      dailySummary: false,
      yellowLightAlert: false,
      kakaoEnabled: false,
      kakaoPhone: '',
    }

    // 알리고 설정 조회
    const aligoSettings = alertSettingsData ? {
      aligoApiKey: alertSettingsData.aligo_api_key ? '********' : '',
      aligoUserId: alertSettingsData.aligo_user_id || '',
      aligoSenderKey: alertSettingsData.aligo_sender_key ? '********' : '',
    } : {
      aligoApiKey: '',
      aligoUserId: '',
      aligoSenderKey: '',
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
          plan: 'free',
          planStartedAt: null,
          planExpiresAt: null,
          subscriberCount: 0,
          siteCount: 0,
          userType: 'seller',
          approvalStatus: 'approved',
          businessLicenseUrl: null,
          isNewUser: true,
          alertSettings,
          aligoSettings
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
        plan: profile.plan,
        planStartedAt: profile.plan_started_at,
        planExpiresAt: profile.plan_expires_at,
        subscriberCount: profile.subscriber_count,
        siteCount: profile.platform_count,
        userType: profile.user_type || 'seller',
        approvalStatus: profile.approval_status || 'approved',
        businessLicenseUrl: profile.business_license_url,
        approvedAt: profile.approved_at,
        rejectionReason: profile.rejection_reason,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        alertSettings,
        aligoSettings
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
    const { businessName, businessNumber, ownerName, phone, userType, businessLicenseUrl, alertSettings, aligoSettings } = body

    // 알림 설정 업데이트
    if (alertSettings) {
      const alertUpdateData: Record<string, unknown> = {
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      if (alertSettings.orderAlert !== undefined) alertUpdateData.order_alert_enabled = alertSettings.orderAlert
      if (alertSettings.redLightAlert !== undefined) alertUpdateData.red_light_enabled = alertSettings.redLightAlert
      if (alertSettings.dailySummary !== undefined) alertUpdateData.daily_report_enabled = alertSettings.dailySummary
      if (alertSettings.yellowLightAlert !== undefined) alertUpdateData.yellow_light_enabled = alertSettings.yellowLightAlert
      if (alertSettings.kakaoEnabled !== undefined) alertUpdateData.kakao_enabled = alertSettings.kakaoEnabled
      if (alertSettings.kakaoPhone !== undefined) alertUpdateData.kakao_phone = alertSettings.kakaoPhone

      const { error: alertError } = await supabase
        .from('alert_settings')
        .upsert(alertUpdateData, { onConflict: 'user_id' })

      if (alertError) {
        console.error('Alert settings update error:', alertError)
      }

      return NextResponse.json({ success: true, message: '알림 설정이 저장되었습니다' })
    }

    // 알리고 설정 업데이트
    if (aligoSettings) {
      const aligoUpdateData: Record<string, unknown> = {
        user_id: user.id,
        updated_at: new Date().toISOString()
      }

      // 마스킹된 값(********)은 업데이트하지 않음
      if (aligoSettings.aligoApiKey && aligoSettings.aligoApiKey !== '********') {
        aligoUpdateData.aligo_api_key = aligoSettings.aligoApiKey
      }
      if (aligoSettings.aligoUserId) {
        aligoUpdateData.aligo_user_id = aligoSettings.aligoUserId
      }
      if (aligoSettings.aligoSenderKey && aligoSettings.aligoSenderKey !== '********') {
        aligoUpdateData.aligo_sender_key = aligoSettings.aligoSenderKey
      }

      const { error: aligoError } = await supabase
        .from('alert_settings')
        .upsert(aligoUpdateData, { onConflict: 'user_id' })

      if (aligoError) {
        console.error('Aligo settings update error:', aligoError)
        return NextResponse.json({ error: '알리고 설정 저장에 실패했습니다' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: '알리고 설정이 저장되었습니다' })
    }

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
        plan: profile.plan,
        planStartedAt: profile.plan_started_at,
        planExpiresAt: profile.plan_expires_at,
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
