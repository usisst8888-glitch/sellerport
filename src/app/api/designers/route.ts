/**
 * 디자이너 API
 * GET /api/designers - 디자이너 목록 조회
 * POST /api/designers - 디자이너 등록 (디자이너 회원가입)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 디자이너 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // 필터 파라미터
    const serviceType = searchParams.get('service_type')
    const minRating = searchParams.get('min_rating')
    const isVerified = searchParams.get('verified')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // 기본 쿼리
    let query = supabase
      .from('designers')
      .select(`
        *,
        portfolios:designer_portfolios(
          id,
          title,
          category,
          service_type,
          image_urls,
          is_featured
        )
      `, { count: 'exact' })
      .eq('is_active', true)
      .order('rating', { ascending: false })
      .order('completed_projects', { ascending: false })
      .range(offset, offset + limit - 1)

    // 서비스 타입 필터
    if (serviceType) {
      query = query.contains('service_types', [serviceType])
    }

    // 최소 평점 필터
    if (minRating) {
      query = query.gte('rating', parseFloat(minRating))
    }

    // 인증 디자이너만
    if (isVerified === 'true') {
      query = query.eq('is_verified', true)
    }

    // 검색어 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,specialty.ilike.%${search}%`)
    }

    const { data: designers, error, count } = await query

    if (error) {
      console.error('Designers fetch error:', error)
      return NextResponse.json({ error: '디자이너 목록 조회에 실패했습니다' }, { status: 500 })
    }

    // 응답 데이터 포맷팅
    const formattedDesigners = designers?.map(designer => ({
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
      portfolios: designer.portfolios?.filter((p: { is_featured: boolean }) => p.is_featured).slice(0, 3) || [],
      createdAt: designer.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: formattedDesigners,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Designers API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 디자이너 등록
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 이미 디자이너로 등록되어 있는지 확인
    const { data: existingDesigner } = await supabase
      .from('designers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingDesigner) {
      return NextResponse.json({ error: '이미 디자이너로 등록되어 있습니다' }, { status: 400 })
    }

    const body = await request.json()
    const {
      name,
      specialty,
      bio,
      profileImageUrl,
      priceMin,
      priceMax,
      serviceTypes,
      tags,
      portfolioCategories,
      bankName,
      bankAccount,
      bankHolder
    } = body

    // 필수 필드 검증
    if (!name || !specialty) {
      return NextResponse.json({ error: '이름과 전문분야는 필수입니다' }, { status: 400 })
    }

    // 디자이너 생성
    const { data: designer, error } = await supabase
      .from('designers')
      .insert({
        user_id: user.id,
        name,
        specialty,
        bio,
        profile_image_url: profileImageUrl,
        price_min: priceMin,
        price_max: priceMax,
        service_types: serviceTypes || [],
        tags: tags || [],
        portfolio_categories: portfolioCategories || [],
        bank_name: bankName,
        bank_account: bankAccount,
        bank_holder: bankHolder,
        is_active: true,
        is_verified: false // 관리자 승인 후 인증
      })
      .select()
      .single()

    if (error) {
      console.error('Designer create error:', error)
      return NextResponse.json({ error: '디자이너 등록에 실패했습니다' }, { status: 500 })
    }

    // 프로필 유형을 디자이너로 업데이트
    await supabase
      .from('profiles')
      .update({ user_type: 'designer' })
      .eq('id', user.id)

    return NextResponse.json({
      success: true,
      data: {
        id: designer.id,
        name: designer.name,
        specialty: designer.specialty,
        isVerified: designer.is_verified
      },
      message: '디자이너로 등록되었습니다. 검토 후 인증이 완료됩니다.'
    })

  } catch (error) {
    console.error('Designer create API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
