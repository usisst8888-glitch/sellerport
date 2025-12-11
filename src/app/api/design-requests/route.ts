/**
 * 디자인 의뢰 API
 * GET /api/design-requests - 의뢰 목록 조회
 * POST /api/design-requests - 새 의뢰 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 의뢰 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role') || 'requester' // requester 또는 designer
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let query = supabase
      .from('design_requests')
      .select(`
        *,
        designer:designers(
          id,
          name,
          specialty,
          profile_image_url,
          rating
        ),
        requester:profiles!design_requests_requester_id_fkey(
          id,
          business_name
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // 역할에 따른 필터
    if (role === 'requester') {
      query = query.eq('requester_id', user.id)
    } else if (role === 'designer') {
      // 디자이너 ID 조회
      const { data: designer } = await supabase
        .from('designers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!designer) {
        return NextResponse.json({ error: '디자이너 정보를 찾을 수 없습니다' }, { status: 404 })
      }

      query = query.eq('designer_id', designer.id)
    }

    // 상태 필터
    if (status) {
      query = query.eq('status', status)
    }

    const { data: requests, error, count } = await query

    if (error) {
      console.error('Design requests fetch error:', error)
      return NextResponse.json({ error: '의뢰 목록 조회에 실패했습니다' }, { status: 500 })
    }

    // 응답 데이터 포맷팅
    const formattedRequests = requests?.map(req => ({
      id: req.id,
      status: req.status,
      serviceType: req.service_type,
      productName: req.product_name,
      productUrl: req.product_url,
      requirements: req.requirements,
      budgetRange: req.budget_range,
      referenceUrls: req.reference_urls || [],
      deadline: req.deadline,
      price: req.price,
      deliveryFiles: req.delivery_files || [],
      revisionCount: req.revision_count,
      maxRevisions: req.max_revisions,
      designer: req.designer ? {
        id: req.designer.id,
        name: req.designer.name,
        specialty: req.designer.specialty,
        profileImageUrl: req.designer.profile_image_url,
        rating: parseFloat(req.designer.rating) || 0,
      } : null,
      requester: req.requester ? {
        id: req.requester.id,
        businessName: req.requester.business_name,
      } : null,
      createdAt: req.created_at,
      acceptedAt: req.accepted_at,
      completedAt: req.completed_at,
    }))

    return NextResponse.json({
      success: true,
      data: formattedRequests,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Design requests API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 새 의뢰 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = await request.json()
    const {
      designerId,
      serviceType,
      productName,
      productUrl,
      requirements,
      budgetRange,
      referenceUrls,
      deadline
    } = body

    // 필수 필드 검증
    if (!designerId || !serviceType) {
      return NextResponse.json({ error: '디자이너와 서비스 유형은 필수입니다' }, { status: 400 })
    }

    // 디자이너 존재 확인
    const { data: designer } = await supabase
      .from('designers')
      .select('id, name, is_active')
      .eq('id', designerId)
      .single()

    if (!designer || !designer.is_active) {
      return NextResponse.json({ error: '해당 디자이너를 찾을 수 없습니다' }, { status: 404 })
    }

    // 의뢰 생성
    const { data: designRequest, error } = await supabase
      .from('design_requests')
      .insert({
        requester_id: user.id,
        designer_id: designerId,
        service_type: serviceType,
        product_name: productName,
        product_url: productUrl,
        requirements,
        budget_range: budgetRange,
        reference_urls: referenceUrls || [],
        deadline: deadline || null,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Design request create error:', error)
      return NextResponse.json({ error: '의뢰 생성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: designRequest.id,
        status: designRequest.status,
        designerName: designer.name
      },
      message: '의뢰가 성공적으로 전송되었습니다'
    })

  } catch (error) {
    console.error('Design request create API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
