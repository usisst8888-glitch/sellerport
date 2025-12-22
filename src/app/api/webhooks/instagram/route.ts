/**
 * Instagram Webhook Handler
 *
 * Meta Developer Console에서 설정 필요:
 * 1. Webhook URL: https://yourdomain.com/api/webhooks/instagram
 * 2. Verify Token: INSTAGRAM_WEBHOOK_VERIFY_TOKEN 환경변수와 동일하게 설정
 * 3. Subscribed Fields: comments, messages
 *
 * 동작 방식:
 * 1. 사용자가 Instagram 게시물에 특정 키워드로 댓글 작성
 * 2. Webhook이 댓글 이벤트 수신
 * 3. 키워드 매칭 시 해당 사용자에게 DM 발송 (추적 링크 포함)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase Admin Client (Webhook은 서버 인증 불가)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Webhook 검증 (Meta에서 호출)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  // Vercel 환경변수: INSTAGRAM_WEBHOOK_VERIFY_TOKEN=sellerport_webhook_2025
  const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'sellerport_webhook_2025'

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Instagram Webhook verified')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// Webhook 이벤트 처리
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('Instagram Webhook received:', JSON.stringify(body, null, 2))

    // Instagram 이벤트인지 확인
    if (body.object !== 'instagram') {
      return NextResponse.json({ received: true })
    }

    // 각 엔트리 처리
    for (const entry of body.entry || []) {
      // 댓글 이벤트 처리
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            await handleCommentEvent(change.value)
          }
        }
      }

      // 메시징 이벤트 (DM 수신 등)
      if (entry.messaging) {
        for (const messagingEvent of entry.messaging) {
          await handleMessagingEvent(messagingEvent)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Instagram Webhook error:', error)
    return NextResponse.json({ received: true }) // Meta는 200 응답 필요
  }
}

// 댓글 이벤트 처리
async function handleCommentEvent(commentData: {
  id: string
  text: string
  from: { id: string; username: string }
  media: { id: string }
}) {
  try {
    console.log('Processing comment:', commentData)

    const { text, from, media } = commentData
    const commentText = text.toLowerCase().trim()
    const commenterIgUserId = from.id
    const commenterUsername = from.username
    const mediaId = media.id

    // 해당 미디어(게시물)에 대한 DM 설정 찾기
    const { data: dmSettings } = await supabase
      .from('instagram_dm_settings')
      .select(`
        *,
        ad_channels!inner (
          id,
          user_id,
          access_token,
          metadata
        ),
        tracking_links (
          id,
          tracking_url,
          go_url,
          post_name
        )
      `)
      .eq('instagram_media_id', mediaId)
      .eq('is_active', true)
      .single()

    if (!dmSettings) {
      console.log('No DM settings found for media:', mediaId)
      return
    }

    // 키워드 매칭 확인
    const keywords = dmSettings.trigger_keywords || ['링크', '구매', '정보']
    const matched = keywords.some((keyword: string) =>
      commentText.includes(keyword.toLowerCase())
    )

    if (!matched) {
      console.log('No keyword match for comment:', commentText)
      return
    }

    // 이미 DM 발송한 사용자인지 확인 (중복 방지)
    const { data: existingDm } = await supabase
      .from('instagram_dm_logs')
      .select('id')
      .eq('dm_setting_id', dmSettings.id)
      .eq('recipient_ig_user_id', commenterIgUserId)
      .single()

    if (existingDm) {
      console.log('Already sent DM to user:', commenterUsername)
      return
    }

    // DM 발송
    const accessToken = dmSettings.ad_channels.access_token
    const instagramUserId = dmSettings.ad_channels.metadata?.instagram_user_id
    const trackingUrl = dmSettings.tracking_links?.go_url || dmSettings.tracking_links?.tracking_url

    if (!accessToken || !instagramUserId || !trackingUrl) {
      console.error('Missing required data for DM:', { accessToken: !!accessToken, instagramUserId, trackingUrl })
      return
    }

    // DM 메시지 구성
    const dmMessage = dmSettings.dm_message || `안녕하세요! 요청하신 링크입니다 👇\n\n${trackingUrl}\n\n감사합니다! 🙏`
    const finalMessage = dmMessage.replace('{{link}}', trackingUrl)

    // Instagram DM 발송 API 호출
    const dmSent = await sendInstagramDM(
      instagramUserId,
      commenterIgUserId,
      finalMessage,
      accessToken
    )

    if (dmSent) {
      // DM 발송 로그 저장
      await supabase.from('instagram_dm_logs').insert({
        dm_setting_id: dmSettings.id,
        tracking_link_id: dmSettings.tracking_link_id,
        recipient_ig_user_id: commenterIgUserId,
        recipient_username: commenterUsername,
        comment_id: commentData.id,
        comment_text: text,
        dm_message: finalMessage,
        sent_at: new Date().toISOString(),
        status: 'sent',
      })

      // 통계 업데이트
      await supabase
        .from('instagram_dm_settings')
        .update({
          total_dms_sent: (dmSettings.total_dms_sent || 0) + 1,
          last_dm_sent_at: new Date().toISOString(),
        })
        .eq('id', dmSettings.id)

      console.log('DM sent successfully to:', commenterUsername)
    }
  } catch (error) {
    console.error('Error processing comment event:', error)
  }
}

// 메시징 이벤트 처리 (DM 수신 등)
async function handleMessagingEvent(event: {
  sender: { id: string }
  recipient: { id: string }
  message?: { mid: string; text: string }
}) {
  // DM 수신 시 처리 (필요한 경우 확장)
  console.log('Messaging event:', event)
}

// Instagram DM 발송
async function sendInstagramDM(
  senderIgUserId: string,
  recipientIgUserId: string,
  message: string,
  accessToken: string
): Promise<boolean> {
  try {
    // Instagram Messaging API (Graph API v18.0)
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${senderIgUserId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientIgUserId },
          message: { text: message },
          access_token: accessToken,
        }),
      }
    )

    const result = await response.json()

    if (result.error) {
      console.error('Instagram DM API error:', result.error)
      return false
    }

    console.log('Instagram DM sent:', result)
    return true
  } catch (error) {
    console.error('Failed to send Instagram DM:', error)
    return false
  }
}
