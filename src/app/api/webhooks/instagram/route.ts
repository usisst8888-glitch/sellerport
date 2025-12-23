/**
 * Instagram Webhook Handler (Instagram Login 방식)
 *
 * Meta Developer Console에서 설정 필요:
 * 1. Instagram 제품 > Webhooks 설정
 * 2. Webhook URL: https://yourdomain.com/api/webhooks/instagram
 * 3. Verify Token: INSTAGRAM_WEBHOOK_VERIFY_TOKEN 환경변수와 동일하게 설정
 * 4. Subscribed Fields: comments, messages
 *
 * 동작 방식:
 * 1. 사용자가 Instagram 게시물에 특정 키워드로 댓글 작성
 * 2. Webhook이 댓글 이벤트 수신
 * 3. 키워드 매칭 시 해당 사용자에게 DM 발송 (추적 링크 포함)
 *
 * 참고: Instagram Login 방식에서는 Facebook Page 없이 직접 Instagram API 사용
 * https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login
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
      const instagramUserId = entry.id // 이벤트가 발생한 Instagram 계정 ID

      // 댓글 이벤트 처리
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            await handleCommentEvent(change.value, instagramUserId)
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
async function handleCommentEvent(
  commentData: {
    id: string
    text: string
    from: { id: string; username: string }
    media: { id: string }
  },
  instagramAccountId?: string
) {
  try {
    console.log('Processing comment:', commentData, 'for account:', instagramAccountId)

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

    // 팔로우 확인 요청 메시지 (Quick Reply 버튼 포함)
    const followRequestMessage = dmSettings.follow_request_message ||
      `안녕하세요! 댓글 감사합니다 🙏\n\n링크를 받으시려면 팔로우 후 아래 버튼을 눌러주세요!`

    // Instagram Private Reply API 호출 (Quick Reply 버튼 포함)
    // 사용자가 버튼을 누르면 messaging 이벤트로 수신됨
    const dmSent = await sendInstagramPrivateReplyWithQuickReply(
      commentData.id,
      followRequestMessage,
      accessToken,
      dmSettings.id,  // DM 설정 ID (버튼 클릭 시 링크 발송용)
      trackingUrl
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
        dm_message: followRequestMessage,
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

// 메시징 이벤트 처리 (DM 수신, Quick Reply 버튼 클릭 등)
async function handleMessagingEvent(event: {
  sender: { id: string }
  recipient: { id: string }
  message?: { mid: string; text: string; quick_reply?: { payload: string } }
}) {
  console.log('Messaging event:', JSON.stringify(event, null, 2))

  // Quick Reply 버튼 클릭 처리 (팔로우 확인)
  if (event.message?.quick_reply?.payload) {
    const payload = event.message.quick_reply.payload

    // payload 형식: "follow_confirmed:{dm_setting_id}:{tracking_url}"
    if (payload.startsWith('follow_confirmed:')) {
      const parts = payload.split(':')
      const dmSettingId = parts[1]
      const trackingUrl = parts.slice(2).join(':') // URL에 : 포함될 수 있음

      await handleFollowConfirmed(event.sender.id, event.recipient.id, dmSettingId, trackingUrl)
      return
    }
  }

  // 텍스트 메시지 처리 ("팔로우 했어요" 등)
  if (event.message?.text) {
    const messageText = event.message.text.toLowerCase().trim()

    // "팔로우" 관련 키워드 확인
    const followKeywords = ['팔로우', '팔로우했어요', '팔로우 했어요', '팔로했어요', 'follow', 'followed']
    const isFollowConfirm = followKeywords.some(keyword => messageText.includes(keyword))

    if (isFollowConfirm) {
      // 이 사용자의 대기 중인 DM 로그 찾기
      const { data: pendingDm } = await supabase
        .from('instagram_dm_logs')
        .select(`
          *,
          instagram_dm_settings!inner (
            id,
            dm_message,
            ad_channels!inner (
              access_token
            ),
            tracking_links (
              go_url,
              tracking_url
            )
          )
        `)
        .eq('recipient_ig_user_id', event.sender.id)
        .eq('status', 'sent')
        .order('sent_at', { ascending: false })
        .limit(1)
        .single()

      if (pendingDm) {
        const trackingUrl = pendingDm.instagram_dm_settings.tracking_links?.go_url ||
          pendingDm.instagram_dm_settings.tracking_links?.tracking_url

        if (trackingUrl) {
          await handleFollowConfirmed(
            event.sender.id,
            event.recipient.id,
            pendingDm.instagram_dm_settings.id,
            trackingUrl
          )
        }
      }
    }
  }
}

// 팔로우 확인 버튼 클릭 시 링크 발송
async function handleFollowConfirmed(
  senderId: string,
  recipientId: string,
  dmSettingId: string,
  trackingUrl: string
) {
  try {
    console.log('Follow confirmed, sending link to:', senderId)

    // DM 설정에서 액세스 토큰 가져오기
    const { data: dmSettings } = await supabase
      .from('instagram_dm_settings')
      .select(`
        *,
        ad_channels!inner (
          access_token,
          metadata
        )
      `)
      .eq('id', dmSettingId)
      .single()

    if (!dmSettings) {
      console.error('DM settings not found:', dmSettingId)
      return
    }

    const accessToken = dmSettings.ad_channels.access_token

    // 링크 메시지 발송 (24시간 윈도우 내 - 사용자가 버튼 눌렀으므로 가능)
    const linkMessage = dmSettings.dm_message ||
      `감사합니다! 요청하신 링크입니다 👇\n\n${trackingUrl}\n\n즐거운 쇼핑 되세요! 🎉`
    const finalMessage = linkMessage.replace('{{link}}', trackingUrl)

    const response = await fetch(`https://graph.instagram.com/v21.0/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: senderId },
        message: { text: finalMessage },
      }),
    })

    const result = await response.json()

    if (result.error) {
      console.error('Failed to send link message:', result.error)
    } else {
      console.log('Link message sent successfully:', result)

      // DM 로그 업데이트 (링크 발송 완료)
      await supabase
        .from('instagram_dm_logs')
        .update({
          status: 'link_sent',
          link_sent_at: new Date().toISOString(),
        })
        .eq('dm_setting_id', dmSettingId)
        .eq('recipient_ig_user_id', senderId)
    }
  } catch (error) {
    console.error('Error handling follow confirmed:', error)
  }
}

// Instagram Private Reply with Quick Reply 버튼
// 댓글에 대한 비공개 답장 + "팔로우 확인" 버튼 포함
async function sendInstagramPrivateReplyWithQuickReply(
  commentId: string,
  message: string,
  accessToken: string,
  dmSettingId: string,
  trackingUrl: string
): Promise<boolean> {
  try {
    // Private Reply API: POST /{comment-id}/private_replies
    const url = `https://graph.instagram.com/v21.0/${commentId}/private_replies`

    console.log('Sending Private Reply with Quick Reply to comment:', commentId)

    // Quick Reply 버튼 포함 메시지
    // payload에 DM 설정 ID와 추적 URL을 포함하여 버튼 클릭 시 링크 발송 가능
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          text: message,
          quick_replies: [
            {
              content_type: 'text',
              title: '✅ 팔로우 했어요!',
              payload: `follow_confirmed:${dmSettingId}:${trackingUrl}`,
            },
          ],
        },
      }),
    })

    const result = await response.json()

    if (!result.error) {
      console.log('Instagram Private Reply with Quick Reply sent successfully:', result)
      return true
    }

    // Quick Reply가 지원되지 않는 경우 일반 메시지로 재시도
    console.error('Instagram Private Reply with Quick Reply error:', result.error)

    // Fallback: 일반 텍스트 메시지로 재시도
    console.log('Retrying with plain text message...')
    const fallbackResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: message + `\n\n👉 "팔로우 했어요"라고 답장해주세요!`,
      }),
    })

    const fallbackResult = await fallbackResponse.json()

    if (!fallbackResult.error) {
      console.log('Instagram Private Reply (fallback) sent successfully:', fallbackResult)
      return true
    }

    console.error('Instagram Private Reply fallback error:', fallbackResult.error)
    return false
  } catch (error) {
    console.error('Failed to send Instagram Private Reply:', error)
    return false
  }
}
