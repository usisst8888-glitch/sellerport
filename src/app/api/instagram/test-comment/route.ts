/**
 * 테스트용: Instagram 게시물에 댓글 달기
 * POST /api/instagram/test-comment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { mediaId, message } = await request.json()

    if (!mediaId || !message) {
      return NextResponse.json({ error: 'mediaId와 message가 필요합니다' }, { status: 400 })
    }

    // Instagram 계정 조회 (access_token 포함)
    const { data: account } = await supabase
      .from('instagram_accounts')
      .select('access_token, instagram_username')
      .eq('user_id', user.id)
      .eq('status', 'connected')
      .single()

    if (!account) {
      return NextResponse.json({ error: '연결된 Instagram 계정이 없습니다' }, { status: 404 })
    }

    // Instagram Graph API로 댓글 달기
    const commentUrl = `https://graph.instagram.com/v24.0/${mediaId}/comments`

    const response = await fetch(commentUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        message: message,
        access_token: account.access_token,
      }).toString(),
    })

    const data = await response.json()

    if (data.error) {
      console.error('Comment creation error:', data.error)
      return NextResponse.json({
        error: '댓글 생성 실패',
        details: data.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      comment_id: data.id,
      message: `${account.instagram_username} 계정으로 댓글 생성 완료`
    })

  } catch (error) {
    console.error('Test comment error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
