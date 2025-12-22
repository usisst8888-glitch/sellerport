/**
 * Instagram Webhook API
 * Meta에서 댓글 이벤트를 수신하고 DM 자동발송 처리
 *
 * GET - Webhook 인증 (Meta 콘솔에서 검증 시 호출)
 * POST - 이벤트 수신 (댓글, 멘션 등)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Webhook 검증용 토큰 (Meta 콘솔에 설정한 것과 동일해야 함)
const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'sellerport_webhook_verify_2024'

// Supabase Admin 클라이언트 (서버 간 통신용)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook 인증 (GET)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  console.log('Instagram Webhook verification:', { mode, token, challenge })

  // Meta가 보낸 토큰 검증
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  console.error('Webhook verification failed')
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// 이벤트 수신 (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Instagram Webhook received:', JSON.stringify(body, null, 2))

    // Instagram 댓글 이벤트 처리
    if (body.object === 'instagram') {
      for (const entry of body.entry || []) {
        // 댓글 이벤트
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === 'comments') {
              await handleCommentEvent(change.value, entry.id)
            }
          }
        }

        // 멘션 이벤트 (선택적)
        if (entry.messaging) {
          for (const message of entry.messaging) {
            console.log('Messaging event:', message)
          }
        }
      }
    }

    // Meta는 항상 200 OK를 기대
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    // 에러가 나도 200 반환 (Meta가 재시도하지 않도록)
    return NextResponse.json({ success: true })
  }
}

// 댓글 이벤트 처리
async function handleCommentEvent(commentData: {
  id: string
  text: string
  from: { id: string; username: string }
  media: { id: string }
}, instagramUserId: string) {
  try {
    console.log('Processing comment:', commentData)

    const { id: commentId, text: commentText, from: commenter, media } = commentData
    const mediaId = media?.id

    if (!mediaId || !commentText || !commenter) {
      console.log('Missing required comment data')
      return
    }

    // 해당 게시물에 대한 DM 설정 찾기
    const { data: dmSettings } = await supabaseAdmin
      .from('instagram_dm_settings')
      .select(`
        *,
        ad_channels (
          id,
          user_id,
          access_token,
          metadata
        ),
        tracking_links (
          id,
          go_url
        )
      `)
      .eq('instagram_media_id', mediaId)
      .eq('is_active', true)
      .single()

    if (!dmSettings) {
      console.log('No DM setting found for media:', mediaId)
      return
    }

    // 키워드 매칭 확인
    const keywords = dmSettings.trigger_keywords || []
    const commentLower = commentText.toLowerCase()
    const hasKeyword = keywords.some((keyword: string) =>
      commentLower.includes(keyword.toLowerCase())
    )

    if (!hasKeyword) {
      console.log('No keyword match for comment:', commentText)
      return
    }

    // 이미 DM을 보낸 사용자인지 확인
    const { data: existingDm } = await supabaseAdmin
      .from('instagram_dm_logs')
      .select('id')
      .eq('dm_setting_id', dmSettings.id)
      .eq('recipient_instagram_id', commenter.id)
      .single()

    if (existingDm) {
      console.log('DM already sent to user:', commenter.username)
      return
    }

    // 팔로워 확인 (필요 시)
    const accessToken = dmSettings.ad_channels?.access_token
    const instagramAccountId = dmSettings.ad_channels?.metadata?.instagram_user_id

    if (!accessToken || !instagramAccountId) {
      console.error('Missing access token or Instagram account ID')
      return
    }

    // 팔로워 여부 확인
    let isFollower = false
    try {
      // Instagram Graph API로 팔로워 확인
      // 참고: 이 API는 제한적이므로 실제로는 다른 방식 필요할 수 있음
      const followerCheckUrl = `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=business_discovery.username(${commenter.username}){follows_count}&access_token=${accessToken}`
      // 실제 구현에서는 팔로워 확인 로직 추가
      isFollower = true // 임시로 true 설정
    } catch {
      console.log('Could not verify follower status')
    }

    // DM 메시지 결정
    let messageToSend: string
    if (!isFollower && dmSettings.include_follow_cta && dmSettings.follow_cta_message) {
      // 비팔로워에게는 팔로우 요청 메시지
      messageToSend = dmSettings.follow_cta_message
    } else {
      // 팔로워에게는 링크 포함 메시지
      const trackingUrl = dmSettings.tracking_links?.go_url || ''
      messageToSend = `${dmSettings.dm_message}\n\n${trackingUrl}`
    }

    // DM 발송
    const dmSent = await sendInstagramDm(
      instagramAccountId,
      commenter.id,
      messageToSend,
      accessToken
    )

    if (dmSent) {
      // DM 발송 로그 저장
      await supabaseAdmin
        .from('instagram_dm_logs')
        .insert({
          dm_setting_id: dmSettings.id,
          recipient_instagram_id: commenter.id,
          recipient_username: commenter.username,
          comment_id: commentId,
          comment_text: commentText,
          message_sent: messageToSend,
          is_follower: isFollower,
          sent_at: new Date().toISOString()
        })

      // DM 발송 카운트 업데이트
      await supabaseAdmin
        .from('instagram_dm_settings')
        .update({
          total_dms_sent: (dmSettings.total_dms_sent || 0) + 1,
          last_dm_sent_at: new Date().toISOString()
        })
        .eq('id', dmSettings.id)

      console.log('DM sent successfully to:', commenter.username)
    }

  } catch (error) {
    console.error('Comment event handling error:', error)
  }
}

// Instagram DM 발송
async function sendInstagramDm(
  senderAccountId: string,
  recipientId: string,
  message: string,
  accessToken: string
): Promise<boolean> {
  try {
    // Instagram Graph API - Send Message
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${senderAccountId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          access_token: accessToken
        })
      }
    )

    const result = await response.json()

    if (result.error) {
      console.error('Instagram DM send error:', result.error)
      return false
    }

    console.log('DM sent:', result)
    return true
  } catch (error) {
    console.error('DM send request failed:', error)
    return false
  }
}
