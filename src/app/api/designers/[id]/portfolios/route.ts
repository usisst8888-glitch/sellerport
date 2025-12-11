/**
 * 디자이너 포트폴리오 API
 * GET /api/designers/[id]/portfolios - 포트폴리오 목록 조회
 * POST /api/designers/[id]/portfolios - 포트폴리오 추가
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 포트폴리오 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const serviceType = searchParams.get('service_type')

    let query = supabase
      .from('designer_portfolios')
      .select('*')
      .eq('designer_id', id)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    if (serviceType) {
      query = query.eq('service_type', serviceType)
    }

    const { data: portfolios, error } = await query

    if (error) {
      console.error('Portfolios fetch error:', error)
      return NextResponse.json({ error: '포트폴리오 조회에 실패했습니다' }, { status: 500 })
    }

    const formattedPortfolios = portfolios?.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      serviceType: p.service_type,
      imageUrls: p.image_urls || [],
      beforeImageUrl: p.before_image_url,
      afterImageUrl: p.after_image_url,
      clientName: p.client_name,
      isFeatured: p.is_featured,
      createdAt: p.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: formattedPortfolios
    })

  } catch (error) {
    console.error('Portfolios API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 포트폴리오 추가
export async function POST(
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
      return NextResponse.json({ error: '추가 권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      category,
      serviceType,
      imageUrls,
      beforeImageUrl,
      afterImageUrl,
      clientName,
      isFeatured
    } = body

    // 필수 필드 검증
    if (!title) {
      return NextResponse.json({ error: '제목은 필수입니다' }, { status: 400 })
    }

    // 포트폴리오 생성
    const { data: portfolio, error } = await supabase
      .from('designer_portfolios')
      .insert({
        designer_id: id,
        title,
        description,
        category,
        service_type: serviceType,
        image_urls: imageUrls || [],
        before_image_url: beforeImageUrl,
        after_image_url: afterImageUrl,
        client_name: clientName,
        is_featured: isFeatured || false
      })
      .select()
      .single()

    if (error) {
      console.error('Portfolio create error:', error)
      return NextResponse.json({ error: '포트폴리오 추가에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: portfolio.id,
        title: portfolio.title,
        category: portfolio.category,
        serviceType: portfolio.service_type,
        isFeatured: portfolio.is_featured
      },
      message: '포트폴리오가 추가되었습니다'
    })

  } catch (error) {
    console.error('Portfolio create API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
