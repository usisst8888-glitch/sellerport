/**
 * 디자인 의뢰 리뷰 API
 * POST /api/design-requests/[id]/review - 리뷰 작성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 리뷰 작성
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

    // 의뢰 조회
    const { data: designRequest } = await supabase
      .from('design_requests')
      .select('requester_id, designer_id, status')
      .eq('id', id)
      .single()

    if (!designRequest) {
      return NextResponse.json({ error: '의뢰를 찾을 수 없습니다' }, { status: 404 })
    }

    // 의뢰자만 리뷰 작성 가능
    if (designRequest.requester_id !== user.id) {
      return NextResponse.json({ error: '리뷰 작성 권한이 없습니다' }, { status: 403 })
    }

    // 완료된 의뢰만 리뷰 작성 가능
    if (designRequest.status !== 'completed') {
      return NextResponse.json({ error: '완료된 의뢰만 리뷰를 작성할 수 있습니다' }, { status: 400 })
    }

    // 이미 리뷰가 작성되었는지 확인
    const { data: existingReview } = await supabase
      .from('designer_reviews')
      .select('id')
      .eq('request_id', id)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: '이미 리뷰가 작성되었습니다' }, { status: 400 })
    }

    const body = await request.json()
    const { rating, content } = body

    // 평점 검증
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '평점은 1-5 사이여야 합니다' }, { status: 400 })
    }

    // 리뷰 생성
    const { data: review, error } = await supabase
      .from('designer_reviews')
      .insert({
        designer_id: designRequest.designer_id,
        reviewer_id: user.id,
        request_id: id,
        rating,
        content: content || ''
      })
      .select()
      .single()

    if (error) {
      console.error('Review create error:', error)
      return NextResponse.json({ error: '리뷰 작성에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: review.id,
        rating: review.rating,
        content: review.content
      },
      message: '리뷰가 작성되었습니다. 소중한 후기 감사합니다!'
    })

  } catch (error) {
    console.error('Review create API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
