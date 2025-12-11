/**
 * 디자이너 상세 API
 * GET /api/designers/[id] - 디자이너 상세 조회
 * PATCH /api/designers/[id] - 디자이너 정보 수정
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 디자이너 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // 디자이너 조회
    const { data: designer, error } = await supabase
      .from('designers')
      .select(`
        *,
        portfolios:designer_portfolios(
          id,
          title,
          description,
          category,
          service_type,
          image_urls,
          before_image_url,
          after_image_url,
          client_name,
          is_featured,
          created_at
        ),
        reviews:designer_reviews(
          id,
          rating,
          content,
          created_at,
          reviewer:profiles!designer_reviews_reviewer_id_fkey(
            business_name
          )
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !designer) {
      return NextResponse.json({ error: '디자이너를 찾을 수 없습니다' }, { status: 404 })
    }

    // 응답 데이터 포맷팅
    const formattedDesigner = {
      id: designer.id,
      name: designer.name,
      specialty: designer.specialty,
      bio: designer.bio,
      profileImageUrl: designer.profile_image_url,
      rating: parseFloat(designer.rating) || 0,
      reviewCount: designer.review_count || 0,
      completedProjects: designer.completed_projects || 0,
      priceRange: designer.price_min
        ? `${designer.price_min}만원~${designer.price_max ? designer.price_max + '만원' : ''}`
        : '협의',
      priceMin: designer.price_min,
      priceMax: designer.price_max,
      responseTime: designer.response_time,
      isOnline: designer.is_online,
      isVerified: designer.is_verified,
      serviceTypes: designer.service_types || [],
      tags: designer.tags || [],
      portfolioCategories: designer.portfolio_categories || [],
      portfolios: designer.portfolios?.map((p: {
        id: string
        title: string
        description: string
        category: string
        service_type: string
        image_urls: string[]
        before_image_url: string
        after_image_url: string
        client_name: string
        is_featured: boolean
        created_at: string
      }) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        serviceType: p.service_type,
        imageUrls: p.image_urls,
        beforeImageUrl: p.before_image_url,
        afterImageUrl: p.after_image_url,
        clientName: p.client_name,
        isFeatured: p.is_featured,
        createdAt: p.created_at,
      })) || [],
      reviews: designer.reviews?.map((r: {
        id: string
        rating: number
        content: string
        created_at: string
        reviewer: { business_name: string }
      }) => ({
        id: r.id,
        rating: r.rating,
        content: r.content,
        createdAt: r.created_at,
        reviewerName: r.reviewer?.business_name || '익명',
      })) || [],
      createdAt: designer.created_at,
    }

    return NextResponse.json({
      success: true,
      data: formattedDesigner
    })

  } catch (error) {
    console.error('Designer detail API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 디자이너 정보 수정
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
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 본인의 디자이너 프로필인지 확인
    const { data: designer } = await supabase
      .from('designers')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!designer || designer.user_id !== user.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    // 업데이트 가능한 필드들
    if (body.name !== undefined) updateData.name = body.name
    if (body.specialty !== undefined) updateData.specialty = body.specialty
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.profileImageUrl !== undefined) updateData.profile_image_url = body.profileImageUrl
    if (body.priceMin !== undefined) updateData.price_min = body.priceMin
    if (body.priceMax !== undefined) updateData.price_max = body.priceMax
    if (body.responseTime !== undefined) updateData.response_time = body.responseTime
    if (body.isOnline !== undefined) updateData.is_online = body.isOnline
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.serviceTypes !== undefined) updateData.service_types = body.serviceTypes
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.portfolioCategories !== undefined) updateData.portfolio_categories = body.portfolioCategories
    if (body.bankName !== undefined) updateData.bank_name = body.bankName
    if (body.bankAccount !== undefined) updateData.bank_account = body.bankAccount
    if (body.bankHolder !== undefined) updateData.bank_holder = body.bankHolder

    const { data: updatedDesigner, error } = await supabase
      .from('designers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Designer update error:', error)
      return NextResponse.json({ error: '디자이너 정보 수정에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedDesigner.id,
        name: updatedDesigner.name,
        specialty: updatedDesigner.specialty,
        isOnline: updatedDesigner.is_online,
        isActive: updatedDesigner.is_active
      },
      message: '디자이너 정보가 수정되었습니다'
    })

  } catch (error) {
    console.error('Designer update API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
