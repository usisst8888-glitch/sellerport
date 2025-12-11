/**
 * 디자인 의뢰 상세 API
 * GET /api/design-requests/[id] - 의뢰 상세 조회
 * PATCH /api/design-requests/[id] - 의뢰 상태 업데이트
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 의뢰 상세 조회
export async function GET(
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
    const { data: designRequest, error } = await supabase
      .from('design_requests')
      .select(`
        *,
        designer:designers(
          id,
          user_id,
          name,
          specialty,
          profile_image_url,
          rating,
          review_count
        ),
        requester:profiles!design_requests_requester_id_fkey(
          id,
          business_name,
          phone
        ),
        messages:design_messages(
          id,
          sender_id,
          message,
          attachments,
          is_read,
          created_at
        )
      `)
      .eq('id', id)
      .single()

    if (error || !designRequest) {
      return NextResponse.json({ error: '의뢰를 찾을 수 없습니다' }, { status: 404 })
    }

    // 권한 확인 (의뢰자 또는 디자이너만)
    const isRequester = designRequest.requester_id === user.id
    const isDesigner = designRequest.designer?.user_id === user.id

    if (!isRequester && !isDesigner) {
      return NextResponse.json({ error: '조회 권한이 없습니다' }, { status: 403 })
    }

    // 응답 데이터 포맷팅
    const formattedRequest = {
      id: designRequest.id,
      status: designRequest.status,
      serviceType: designRequest.service_type,
      productName: designRequest.product_name,
      productUrl: designRequest.product_url,
      requirements: designRequest.requirements,
      budgetRange: designRequest.budget_range,
      referenceUrls: designRequest.reference_urls || [],
      deadline: designRequest.deadline,
      price: designRequest.price,
      deliveryFiles: designRequest.delivery_files || [],
      revisionCount: designRequest.revision_count,
      maxRevisions: designRequest.max_revisions,
      designer: designRequest.designer ? {
        id: designRequest.designer.id,
        name: designRequest.designer.name,
        specialty: designRequest.designer.specialty,
        profileImageUrl: designRequest.designer.profile_image_url,
        rating: parseFloat(designRequest.designer.rating) || 0,
        reviewCount: designRequest.designer.review_count,
      } : null,
      requester: designRequest.requester ? {
        id: designRequest.requester.id,
        businessName: designRequest.requester.business_name,
        phone: isDesigner ? designRequest.requester.phone : undefined, // 디자이너에게만 전화번호 노출
      } : null,
      messages: designRequest.messages?.map((m: {
        id: string
        sender_id: string
        message: string
        attachments: string[]
        is_read: boolean
        created_at: string
      }) => ({
        id: m.id,
        senderId: m.sender_id,
        isOwn: m.sender_id === user.id,
        message: m.message,
        attachments: m.attachments || [],
        isRead: m.is_read,
        createdAt: m.created_at,
      })).sort((a: { createdAt: string }, b: { createdAt: string }) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ) || [],
      isRequester,
      isDesigner,
      createdAt: designRequest.created_at,
      acceptedAt: designRequest.accepted_at,
      completedAt: designRequest.completed_at,
    }

    return NextResponse.json({
      success: true,
      data: formattedRequest
    })

  } catch (error) {
    console.error('Design request detail API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 의뢰 상태 업데이트
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

    // 의뢰 조회
    const { data: designRequest } = await supabase
      .from('design_requests')
      .select(`
        *,
        designer:designers(user_id)
      `)
      .eq('id', id)
      .single()

    if (!designRequest) {
      return NextResponse.json({ error: '의뢰를 찾을 수 없습니다' }, { status: 404 })
    }

    const isRequester = designRequest.requester_id === user.id
    const isDesigner = designRequest.designer?.user_id === user.id

    if (!isRequester && !isDesigner) {
      return NextResponse.json({ error: '수정 권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const { action, price, deliveryFiles } = body

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    // 상태 변경 액션 처리
    switch (action) {
      case 'accept': // 디자이너가 수락
        if (!isDesigner) {
          return NextResponse.json({ error: '디자이너만 수락할 수 있습니다' }, { status: 403 })
        }
        if (designRequest.status !== 'pending') {
          return NextResponse.json({ error: '대기 중인 의뢰만 수락할 수 있습니다' }, { status: 400 })
        }
        updateData.status = 'accepted'
        updateData.accepted_at = new Date().toISOString()
        if (price) updateData.price = price
        break

      case 'reject': // 디자이너가 거절
        if (!isDesigner) {
          return NextResponse.json({ error: '디자이너만 거절할 수 있습니다' }, { status: 403 })
        }
        if (designRequest.status !== 'pending') {
          return NextResponse.json({ error: '대기 중인 의뢰만 거절할 수 있습니다' }, { status: 400 })
        }
        updateData.status = 'cancelled'
        break

      case 'start': // 디자이너가 작업 시작
        if (!isDesigner) {
          return NextResponse.json({ error: '디자이너만 작업을 시작할 수 있습니다' }, { status: 403 })
        }
        if (designRequest.status !== 'accepted') {
          return NextResponse.json({ error: '수락된 의뢰만 작업을 시작할 수 있습니다' }, { status: 400 })
        }
        updateData.status = 'in_progress'
        break

      case 'deliver': // 디자이너가 납품
        if (!isDesigner) {
          return NextResponse.json({ error: '디자이너만 납품할 수 있습니다' }, { status: 403 })
        }
        if (!['in_progress', 'revision'].includes(designRequest.status)) {
          return NextResponse.json({ error: '진행 중인 의뢰만 납품할 수 있습니다' }, { status: 400 })
        }
        if (!deliveryFiles || deliveryFiles.length === 0) {
          return NextResponse.json({ error: '납품 파일이 필요합니다' }, { status: 400 })
        }
        updateData.status = 'delivered'
        updateData.delivery_files = deliveryFiles
        break

      case 'request_revision': // 의뢰자가 수정 요청
        if (!isRequester) {
          return NextResponse.json({ error: '의뢰자만 수정 요청할 수 있습니다' }, { status: 403 })
        }
        if (designRequest.status !== 'delivered') {
          return NextResponse.json({ error: '납품된 의뢰만 수정 요청할 수 있습니다' }, { status: 400 })
        }
        if (designRequest.revision_count >= designRequest.max_revisions) {
          return NextResponse.json({ error: '최대 수정 횟수를 초과했습니다' }, { status: 400 })
        }
        updateData.status = 'revision'
        updateData.revision_count = designRequest.revision_count + 1
        break

      case 'complete': // 의뢰자가 완료 확정
        if (!isRequester) {
          return NextResponse.json({ error: '의뢰자만 완료 확정할 수 있습니다' }, { status: 403 })
        }
        if (designRequest.status !== 'delivered') {
          return NextResponse.json({ error: '납품된 의뢰만 완료 확정할 수 있습니다' }, { status: 400 })
        }
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
        break

      case 'cancel': // 의뢰 취소
        if (!isRequester && !isDesigner) {
          return NextResponse.json({ error: '취소 권한이 없습니다' }, { status: 403 })
        }
        if (!['pending', 'accepted'].includes(designRequest.status)) {
          return NextResponse.json({ error: '진행 전 의뢰만 취소할 수 있습니다' }, { status: 400 })
        }
        updateData.status = 'cancelled'
        break

      default:
        return NextResponse.json({ error: '올바르지 않은 액션입니다' }, { status: 400 })
    }

    const { data: updatedRequest, error } = await supabase
      .from('design_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Design request update error:', error)
      return NextResponse.json({ error: '의뢰 상태 업데이트에 실패했습니다' }, { status: 500 })
    }

    const statusMessages: Record<string, string> = {
      'accepted': '의뢰가 수락되었습니다',
      'cancelled': '의뢰가 취소되었습니다',
      'in_progress': '작업이 시작되었습니다',
      'delivered': '납품이 완료되었습니다',
      'revision': '수정 요청이 접수되었습니다',
      'completed': '의뢰가 완료되었습니다'
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRequest.id,
        status: updatedRequest.status
      },
      message: statusMessages[updatedRequest.status] || '상태가 업데이트되었습니다'
    })

  } catch (error) {
    console.error('Design request update API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
