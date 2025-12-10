/**
 * 캠페인 상세 API
 * GET /api/campaigns/[id] - 캠페인 상세 조회
 * PATCH /api/campaigns/[id] - 캠페인 수정 (상태 변경 포함)
 * DELETE /api/campaigns/[id] - 캠페인 삭제
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 신호등 판정 함수
function getTrafficLight(roas: number): 'green' | 'yellow' | 'red' {
  if (roas >= 300) return 'green'
  if (roas >= 150) return 'yellow'
  return 'red'
}

// 캠페인 상세 조회
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

    // 캠페인 조회
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        products (
          id,
          name,
          image_url,
          price,
          cost
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !campaign) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    // 일별 통계 조회 (최근 30일)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: dailyStats } = await supabase
      .from('campaign_daily_stats')
      .select('*')
      .eq('campaign_id', id)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        trafficLight: getTrafficLight(campaign.roas || 0),
        dailyStats: dailyStats || []
      }
    })

  } catch (error) {
    console.error('Campaign detail error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 캠페인 수정
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
    const { name, status, dailyBudget, trackingUrl, spent, revenue } = body

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {}

    if (name !== undefined) updateData.name = name
    if (status !== undefined) updateData.status = status
    if (dailyBudget !== undefined) updateData.daily_budget = dailyBudget
    if (trackingUrl !== undefined) updateData.tracking_url = trackingUrl
    if (spent !== undefined) updateData.spent = spent
    if (revenue !== undefined) {
      updateData.revenue = revenue
      // ROAS 재계산
      const currentSpent = spent !== undefined ? spent : (await supabase
        .from('campaigns')
        .select('spent')
        .eq('id', id)
        .single()).data?.spent || 0

      if (currentSpent > 0) {
        updateData.roas = Math.round((revenue / currentSpent) * 100)
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: '수정할 항목이 없습니다' }, { status: 400 })
    }

    // 캠페인 수정
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Campaign update error:', error)
      return NextResponse.json({ error: '캠페인 수정에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        trafficLight: getTrafficLight(campaign.roas || 0)
      }
    })

  } catch (error) {
    console.error('Campaign update API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 캠페인 삭제
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
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Campaign delete error:', error)
      return NextResponse.json({ error: '캠페인 삭제에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Campaign delete API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
