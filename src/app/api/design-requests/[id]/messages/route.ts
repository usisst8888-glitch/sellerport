/**
 * 디자인 의뢰 메시지 API
 * GET /api/design-requests/[id]/messages - 메시지 목록 조회
 * POST /api/design-requests/[id]/messages - 메시지 전송
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 메시지 목록 조회
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

    // 의뢰 권한 확인
    const { data: designRequest } = await supabase
      .from('design_requests')
      .select('requester_id, designer:designers(user_id)')
      .eq('id', id)
      .single()

    if (!designRequest) {
      return NextResponse.json({ error: '의뢰를 찾을 수 없습니다' }, { status: 404 })
    }

    const isRequester = designRequest.requester_id === user.id
    const designerData = designRequest.designer as unknown as { user_id: string } | null
    const isDesigner = designerData?.user_id === user.id

    if (!isRequester && !isDesigner) {
      return NextResponse.json({ error: '조회 권한이 없습니다' }, { status: 403 })
    }

    // 메시지 조회
    const { data: messages, error } = await supabase
      .from('design_messages')
      .select(`
        *,
        sender:profiles!design_messages_sender_id_fkey(
          id,
          business_name
        )
      `)
      .eq('request_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Messages fetch error:', error)
      return NextResponse.json({ error: '메시지 조회에 실패했습니다' }, { status: 500 })
    }

    // 읽지 않은 메시지 읽음 처리
    await supabase
      .from('design_messages')
      .update({ is_read: true })
      .eq('request_id', id)
      .neq('sender_id', user.id)
      .eq('is_read', false)

    // 응답 데이터 포맷팅
    const formattedMessages = messages?.map(m => ({
      id: m.id,
      senderId: m.sender_id,
      senderName: m.sender?.business_name || '알 수 없음',
      isOwn: m.sender_id === user.id,
      message: m.message,
      attachments: m.attachments || [],
      isRead: m.is_read,
      createdAt: m.created_at,
    }))

    return NextResponse.json({
      success: true,
      data: formattedMessages
    })

  } catch (error) {
    console.error('Messages API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 메시지 전송
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

    // 의뢰 권한 확인
    const { data: designRequest } = await supabase
      .from('design_requests')
      .select('requester_id, designer:designers(user_id), status')
      .eq('id', id)
      .single()

    if (!designRequest) {
      return NextResponse.json({ error: '의뢰를 찾을 수 없습니다' }, { status: 404 })
    }

    const isRequester = designRequest.requester_id === user.id
    const designerData2 = designRequest.designer as unknown as { user_id: string } | null
    const isDesigner = designerData2?.user_id === user.id

    if (!isRequester && !isDesigner) {
      return NextResponse.json({ error: '메시지 전송 권한이 없습니다' }, { status: 403 })
    }

    // 취소/완료된 의뢰에는 메시지 불가
    if (['cancelled', 'completed'].includes(designRequest.status as string)) {
      return NextResponse.json({ error: '종료된 의뢰에는 메시지를 보낼 수 없습니다' }, { status: 400 })
    }

    const body = await request.json()
    const { message, attachments } = body

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: '메시지 내용이 필요합니다' }, { status: 400 })
    }

    // 메시지 생성
    const { data: newMessage, error } = await supabase
      .from('design_messages')
      .insert({
        request_id: id,
        sender_id: user.id,
        message: message.trim(),
        attachments: attachments || []
      })
      .select()
      .single()

    if (error) {
      console.error('Message create error:', error)
      return NextResponse.json({ error: '메시지 전송에 실패했습니다' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newMessage.id,
        senderId: newMessage.sender_id,
        isOwn: true,
        message: newMessage.message,
        attachments: newMessage.attachments || [],
        createdAt: newMessage.created_at,
      },
      message: '메시지가 전송되었습니다'
    })

  } catch (error) {
    console.error('Message create API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
