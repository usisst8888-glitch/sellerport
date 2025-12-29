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
    // 같은 media ID에 여러 설정이 있을 수 있으므로 가장 최근 것 사용
    const { data: dmSettingsList, error: dmSettingsError } = await supabase
      .from('instagram_dm_settings')
      .select(`
        *,
        instagram_accounts!inner (
          id,
          user_id,
          access_token,
          instagram_user_id
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
      .order('created_at', { ascending: false })
      .limit(1)

    if (dmSettingsError) {
      console.error('Error fetching DM settings:', dmSettingsError)
      return
    }

    const dmSettings = dmSettingsList?.[0]

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
    const accessToken = dmSettings.instagram_accounts.access_token
    const instagramUserId = dmSettings.instagram_accounts.instagram_user_id
    const trackingUrl = dmSettings.tracking_links?.go_url || dmSettings.tracking_links?.tracking_url

    if (!accessToken || !instagramUserId || !trackingUrl) {
      console.error('Missing required data for DM:', { accessToken: !!accessToken, instagramUserId, trackingUrl })
      return
    }

    // 팔로우 확인 요청 메시지 (Quick Reply 버튼 포함)
    // DB 필드: follow_cta_message (클라이언트에서 followMessage로 입력)
    const followRequestMessage = dmSettings.follow_cta_message ||
      `팔로우를 완료하셨다면 아래 버튼을 눌러 확인해주세요! 팔로워에게만 본래의DM이 보내집니다!`

    // 버튼 텍스트 (DB에서 가져오거나 기본값 사용)
    const followButtonText = dmSettings.follow_button_text || '팔로우 했어요!'

    // Instagram Private Reply API 호출 (Quick Reply 버튼 포함)
    // 사용자가 버튼을 누르면 messaging 이벤트로 수신됨
    const dmSent = await sendInstagramPrivateReplyWithQuickReply(
      commentData.id,
      followRequestMessage,
      accessToken,
      dmSettings.id,  // DM 설정 ID (버튼 클릭 시 링크 발송용)
      trackingUrl,
      followButtonText
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

// 메시징 이벤트 처리 (DM 수신, Quick Reply/Postback 버튼 클릭 등)
async function handleMessagingEvent(event: {
  sender: { id: string }
  recipient: { id: string }
  message?: { mid: string; text: string; quick_reply?: { payload: string } }
  postback?: { mid: string; title: string; payload: string }
}) {
  console.log('Messaging event:', JSON.stringify(event, null, 2))

  // Postback 버튼 클릭 처리 (Button Template의 버튼)
  if (event.postback?.payload) {
    const payload = event.postback.payload

    // payload 형식: "follow_confirmed:{dm_setting_id}:{tracking_url}"
    if (payload.startsWith('follow_confirmed:')) {
      const parts = payload.split(':')
      const dmSettingId = parts[1]
      const trackingUrl = parts.slice(2).join(':') // URL에 : 포함될 수 있음

      await handleFollowConfirmed(event.sender.id, event.recipient.id, dmSettingId, trackingUrl)
      return
    }
  }

  // Quick Reply 버튼 클릭 처리 (팔로우 확인) - 폴백용
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
            instagram_accounts!inner (
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
// 팔로우가 안 되어 있으면 에러 발생 → 팔로우 요청 메시지 다시 발송
async function handleFollowConfirmed(
  senderId: string,
  recipientId: string,
  dmSettingId: string,
  trackingUrl: string
) {
  try {
    console.log('Follow confirmed button clicked, attempting to send link to:', senderId)

    // DM 설정에서 액세스 토큰 가져오기
    const { data: dmSettings } = await supabase
      .from('instagram_dm_settings')
      .select(`
        *,
        instagram_accounts!inner (
          access_token,
          instagram_user_id
        )
      `)
      .eq('id', dmSettingId)
      .single()

    if (!dmSettings) {
      console.error('DM settings not found:', dmSettingId)
      return
    }

    const accessToken = dmSettings.instagram_accounts.access_token

    // 팔로워용 DM 메시지 생성
    const dmMessageText = dmSettings.dm_message || '감사합니다! 요청하신 링크입니다 👇'

    // 상품 정보 가져오기 (Generic Template용)
    let productName = dmSettings.tracking_links?.post_name || '상품 보기'
    let productImageUrl = dmSettings.instagram_media_url || null

    // tracking_links에서 product 정보 가져오기
    if (dmSettings.tracking_link_id) {
      const { data: trackingLinkWithProduct } = await supabase
        .from('tracking_links')
        .select('products(name, image_url)')
        .eq('id', dmSettings.tracking_link_id)
        .single()

      if (trackingLinkWithProduct?.products) {
        const product = trackingLinkWithProduct.products as { name?: string; image_url?: string }
        productName = product.name || productName
        productImageUrl = product.image_url || productImageUrl
      }
    }

    // DM 발송 시도 - Generic Template 사용 (이미지 카드 + 버튼)
    // https://developers.facebook.com/docs/messenger-platform/instagram/features/generic-template
    let response

    if (productImageUrl) {
      // 이미지가 있으면 Generic Template 사용 (카드 형식)
      response = await fetch(`https://graph.instagram.com/v21.0/me/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'generic',
                elements: [
                  {
                    title: productName,
                    subtitle: dmMessageText,
                    image_url: productImageUrl,
                    default_action: {
                      type: 'web_url',
                      url: trackingUrl,
                    },
                    buttons: [
                      {
                        type: 'web_url',
                        url: trackingUrl,
                        title: '바로가기',
                      },
                    ],
                  },
                ],
              },
            },
          },
        }),
      })
    } else {
      // 이미지가 없으면 Button Template 사용
      response = await fetch(`https://graph.instagram.com/v21.0/me/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'button',
                text: dmMessageText,
                buttons: [
                  {
                    type: 'web_url',
                    url: trackingUrl,
                    title: '바로가기',
                  },
                ],
              },
            },
          },
        }),
      })
    }

    const result = await response.json()

    if (result.error) {
      // 에러 발생 = 팔로우가 안 되어 있음
      // 팔로우 요청 메시지 다시 발송
      console.log('Failed to send link (user may not be following), sending follow request again:', result.error)

      const followRequestMessage = dmSettings.follow_cta_message ||
        `아직 팔로우가 확인되지 않았어요! 😅\n\n팔로우 후 다시 버튼을 눌러주세요!`

      // 버튼 텍스트 (DB에서 가져오거나 기본값 사용)
      const followButtonText = dmSettings.follow_button_text || '팔로우 했어요!'

      // 팔로우 요청 메시지 재발송 (Postback 버튼 사용 - 말풍선 안에 버튼)
      await fetch(`https://graph.instagram.com/v21.0/me/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: { id: senderId },
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'button',
                text: followRequestMessage,
                buttons: [
                  {
                    type: 'postback',
                    title: followButtonText,
                    payload: `follow_confirmed:${dmSettingId}:${trackingUrl}`,
                  },
                ],
              },
            },
          },
        }),
      })

      console.log('Follow request message with button sent again to:', senderId)
    } else {
      // 성공 = 팔로워임, 링크 발송 완료
      console.log('Link message sent successfully (user is a follower):', result)

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

// Instagram Private Reply with Button Template
// 댓글에 대한 비공개 답장 + "팔로우 확인" 버튼 포함 (말풍선 안에 버튼)
// 참고: https://developers.facebook.com/docs/messenger-platform/instagram/features/private-replies
async function sendInstagramPrivateReplyWithQuickReply(
  commentId: string,
  message: string,
  accessToken: string,
  dmSettingId: string,
  trackingUrl: string,
  buttonText: string = '팔로우 했어요!'
): Promise<boolean> {
  try {
    // Private Reply API: POST /me/messages with recipient.comment_id
    // 댓글 ID를 recipient로 사용하여 Private Reply 발송
    const url = `https://graph.instagram.com/v21.0/me/messages`

    console.log('Sending Private Reply with Button Template to comment:', commentId)

    // Button Template 사용 - 말풍선 안에 버튼 표시
    // postback 버튼으로 클릭 시 messaging webhook 이벤트 발생
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: {
          comment_id: commentId,
        },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'button',
              text: message,
              buttons: [
                {
                  type: 'postback',
                  title: buttonText,
                  payload: `follow_confirmed:${dmSettingId}:${trackingUrl}`,
                },
              ],
            },
          },
        },
      }),
    })

    const result = await response.json()

    if (!result.error) {
      console.log('Instagram Private Reply with Button Template sent successfully:', result)
      return true
    }

    // Button Template이 지원되지 않는 경우 Quick Reply로 재시도
    console.error('Instagram Private Reply with Button Template error:', result.error)
    console.log('Retrying with Quick Reply...')

    const quickReplyResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: {
          comment_id: commentId,
        },
        message: {
          text: message,
          quick_replies: [
            {
              content_type: 'text',
              title: buttonText,
              payload: `follow_confirmed:${dmSettingId}:${trackingUrl}`,
            },
          ],
        },
      }),
    })

    const quickReplyResult = await quickReplyResponse.json()

    if (!quickReplyResult.error) {
      console.log('Instagram Private Reply with Quick Reply sent successfully:', quickReplyResult)
      return true
    }

    // 마지막 Fallback: 일반 텍스트 메시지
    console.error('Instagram Private Reply with Quick Reply error:', quickReplyResult.error)
    console.log('Retrying with plain text message...')

    const fallbackResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: {
          comment_id: commentId,
        },
        message: {
          text: message + `\n\n👉 "팔로우 했어요"라고 답장해주세요!`,
        },
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
