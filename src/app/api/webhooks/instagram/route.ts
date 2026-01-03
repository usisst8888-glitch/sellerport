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

// Supabase 클라이언트 생성 함수
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        fetch: (...args) => fetch(...args),
      },
      db: {
        schema: 'public',
      },
    }
  )
}

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

    // 동기적으로 처리 (Vercel 서버리스 환경에서 백그라운드 Promise가 제대로 작동하지 않음)
    console.log('Processing webhook entries synchronously...')

    for (const entry of body.entry || []) {
      const instagramUserId = entry.id // 이벤트가 발생한 Instagram 계정 ID

      // 댓글 이벤트 처리
      if (entry.changes) {
        for (const change of entry.changes) {
          if (change.field === 'comments') {
            try {
              await handleCommentEvent(change.value, instagramUserId)
            } catch (commentError) {
              console.error('Error handling comment event:', commentError)
              console.error('Comment data:', JSON.stringify(change.value))
            }
          }
        }
      }

      // 메시징 이벤트 (DM 수신 등)
      if (entry.messaging) {
        for (const messagingEvent of entry.messaging) {
          try {
            await handleMessagingEvent(messagingEvent)
          } catch (messagingError) {
            console.error('Error handling messaging event:', messagingError)
          }
        }
      }
    }

    console.log('Webhook processing completed')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Instagram Webhook error:', error)
    return NextResponse.json({ received: true }) // Meta는 200 응답 필요
  }
}

// 팔로워 여부 확인 함수 (사용 안 함 - Private Reply 실패 여부로 판단)
// Instagram API는 User consent 필요하여 직접 확인 불가능
// 대신 링크 메시지 전송 시도 → 실패하면 비팔로워로 판단
/*
async function checkIfFollower(
  myInstagramUserId: string,
  targetUserId: string,
  accessToken: string
): Promise<boolean> {
  try {
    console.log('Checking if user is follower via User Profile API:', targetUserId)

    // 방법 1: User Profile API로 is_user_follow_business 필드 직접 조회
    // GET /{user-id}?fields=id,username,is_user_follow_business,is_business_follow_user
    const profileUrl = `https://graph.instagram.com/v24.0/${targetUserId}?fields=id,username,is_user_follow_business,is_business_follow_user`

    const profileResponse = await fetch(profileUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    const profileResult = await profileResponse.json()

    console.log('User Profile API response:', JSON.stringify(profileResult, null, 2))

    if (!profileResult.error && profileResult.is_user_follow_business !== undefined) {
      const isFollower = profileResult.is_user_follow_business === true
      console.log('Follower check result from User Profile API:', isFollower)
      return isFollower
    }

    // 방법 2: Conversations API에서 participants 내부의 is_user_follow_business 확인
    // 중첩 필드로 요청: participants{id,username,is_user_follow_business}
    console.log('User Profile API failed, trying Conversations API with nested fields...')

    const conversationsUrl = `https://graph.instagram.com/v24.0/${myInstagramUserId}/conversations?platform=instagram&user_id=${targetUserId}&fields=participants{id,username,is_user_follow_business,is_business_follow_user}`

    const conversationsResponse = await fetch(conversationsUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })
    const conversationsResult = await conversationsResponse.json()

    console.log('Conversations API response:', JSON.stringify(conversationsResult, null, 2))

    if (conversationsResult.error) {
      console.error('Conversations API error:', conversationsResult.error)

      // 방법 3: 마지막으로 기본 conversations API 시도
      console.log('Trying basic Conversations API...')
      const basicUrl = `https://graph.instagram.com/v24.0/${myInstagramUserId}/conversations?platform=instagram&user_id=${targetUserId}`

      const basicResponse = await fetch(basicUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })
      const basicResult = await basicResponse.json()

      console.log('Basic Conversations API response:', JSON.stringify(basicResult, null, 2))

      if (basicResult.error) {
        console.error('All API methods failed')
        return false
      }

      // 대화가 존재하면 기본적으로 팔로워로 간주 (대화 시작 = 관계 있음)
      if (basicResult.data && basicResult.data.length > 0) {
        console.log('Conversation exists, assuming follower relationship')
        return true
      }

      return false
    }

    // conversations 데이터에서 participants 확인
    const conversations = conversationsResult.data || []

    if (conversations.length === 0) {
      console.log('No conversation found with user:', targetUserId)
      return false
    }

    // 첫 번째 대화의 participants에서 해당 사용자의 is_user_follow_business 확인
    const conversation = conversations[0]
    const participants = conversation.participants?.data || []

    for (const participant of participants) {
      // 상대방(targetUserId)의 팔로워 여부 확인
      if (participant.id === targetUserId) {
        const isFollower = participant.is_user_follow_business === true
        console.log('Follower check result from Conversations API:', isFollower, '- participant data:', participant)
        return isFollower
      }
    }

    console.log('Target user not found in participants')
    return false
  } catch (error) {
    console.error('Error checking follower status:', error)
    return false
  }
}
*/

// 링크 메시지 발송 함수 (Private Reply - 누구에게나 발송 가능)
// 팔로워 체크 불필요 모드에서 사용
async function sendLinkViaPrivateReply(
  commentId: string,
  dmSettings: {
    id: string
    dm_message: string
    tracking_link_id: string
    instagram_media_url?: string
    tracking_links?: { go_url?: string; tracking_url?: string; post_name?: string }
  },
  accessToken: string,
  trackingUrl: string
): Promise<boolean> {
  try {
    const dmMessageText = dmSettings.dm_message || '감사합니다! 요청하신 링크입니다 👇'
    const productName = dmSettings.tracking_links?.post_name || '상품 보기'
    const productImageUrl = dmSettings.instagram_media_url || null

    const url = `https://graph.instagram.com/v24.0/me/messages`

    console.log('Sending link message via Private Reply (no follower check)...')

    let response

    if (productImageUrl) {
      // Generic Template (이미지 카드 + 버튼)
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: { comment_id: commentId }, // Private Reply
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'generic',
                elements: [{
                  title: productName,
                  subtitle: dmMessageText,
                  image_url: productImageUrl,
                  default_action: { type: 'web_url', url: trackingUrl },
                  buttons: [{ type: 'web_url', url: trackingUrl, title: '바로가기' }],
                }],
              },
            },
          },
        }),
      })
    } else {
      // Button Template (텍스트 + 버튼)
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: { comment_id: commentId }, // Private Reply
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'button',
                text: dmMessageText,
                buttons: [{ type: 'web_url', url: trackingUrl, title: '바로가기' }],
              },
            },
          },
        }),
      })
    }

    const result = await response.json()

    if (result.error) {
      console.error('Link message via Private Reply error:', result.error)
      // 템플릿 실패 시 일반 텍스트로 재시도
      const fallbackResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: { comment_id: commentId }, // Private Reply
          message: { text: `${dmMessageText}\n\n👉 ${trackingUrl}` },
        }),
      })
      const fallbackResult = await fallbackResponse.json()
      if (fallbackResult.error) {
        console.error('Fallback link message error:', fallbackResult.error)
        return false
      }
    }

    console.log('Link message sent successfully via Private Reply')
    return true
  } catch (error) {
    console.error('Error sending link via Private Reply:', error)
    return false
  }
}

// 링크 메시지 발송 함수 (일반 DM - 팔로워만 가능)
// 팔로워에게만 성공, 비팔로워는 실패
// 팔로워 체크 필요 모드에서 버튼 클릭 시 사용
async function sendLinkMessageViaPrivateReply(
  commentId: string,
  dmSettings: {
    id: string
    dm_message: string
    tracking_link_id: string
    instagram_media_url?: string
    tracking_links?: { go_url?: string; tracking_url?: string; post_name?: string }
  },
  accessToken: string,
  trackingUrl: string,
  recipientUserId: string // 팔로워 체크를 위해 일반 DM 사용
): Promise<boolean> {
  try {
    const dmMessageText = dmSettings.dm_message || '감사합니다! 요청하신 링크입니다 👇'
    const productName = dmSettings.tracking_links?.post_name || '상품 보기'
    const productImageUrl = dmSettings.instagram_media_url || null

    const url = `https://graph.instagram.com/v24.0/me/messages`

    console.log('Sending link message as regular DM (follower check)...')

    let response

    if (productImageUrl) {
      // Generic Template (이미지 카드 + 버튼)
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: { id: recipientUserId }, // 일반 DM (팔로워만 성공)
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'generic',
                elements: [{
                  title: productName,
                  subtitle: dmMessageText,
                  image_url: productImageUrl,
                  default_action: { type: 'web_url', url: trackingUrl },
                  buttons: [{ type: 'web_url', url: trackingUrl, title: '바로가기' }],
                }],
              },
            },
          },
        }),
      })
    } else {
      // Button Template (텍스트 + 버튼)
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: { id: recipientUserId }, // 일반 DM (팔로워만 성공)
          message: {
            attachment: {
              type: 'template',
              payload: {
                template_type: 'button',
                text: dmMessageText,
                buttons: [{ type: 'web_url', url: trackingUrl, title: '바로가기' }],
              },
            },
          },
        }),
      })
    }

    const result = await response.json()

    if (result.error) {
      console.error('Link message via regular DM error:', result.error)
      // 템플릿 실패 시 일반 텍스트로 재시도
      const fallbackResponse = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          recipient: { id: recipientUserId }, // 일반 DM (팔로워만 성공)
          message: { text: `${dmMessageText}\n\n👉 ${trackingUrl}` },
        }),
      })
      const fallbackResult = await fallbackResponse.json()
      if (fallbackResult.error) {
        console.error('Fallback link message error:', fallbackResult.error)
        return false
      }
      console.log('Link message sent via fallback text:', fallbackResult)
      return true
    }

    console.log('Link message via Private Reply sent successfully:', result)
    return true
  } catch (error) {
    console.error('Error sending link message via Private Reply:', error)
    return false
  }
}

// 댓글 이벤트 처리
// 수정된 로직: 댓글 감지 → 먼저 팔로워인지 확인 → 팔로워 O: 바로 링크 발송 / 팔로워 X: 팔로우 요청 발송
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
    console.log('Fetching DM settings for media:', mediaId)

    // 환경 변수 확인
    console.log('Environment variables check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)
    })

    const supabase = getSupabaseClient()

    // 1. DM 설정만 빠르게 조회 (JOIN 없이)
    console.log('Starting DM settings query...')
    const { data: dmSettingsList, error: dmSettingsError } = await supabase
      .from('instagram_dm_settings')
      .select('*')
      .eq('instagram_media_id', mediaId)
      .eq('is_active', true)
      .limit(1)

    console.log('DM settings query completed')
    console.log('DM settings query result:', {
      found: dmSettingsList?.length || 0,
      error: dmSettingsError?.message,
      errorDetails: dmSettingsError,
      mediaId
    })

    if (dmSettingsError) {
      console.error('Error fetching DM settings:', dmSettingsError)
      return
    }

    if (!dmSettingsList || dmSettingsList.length === 0) {
      console.log('No DM settings found for media:', mediaId)
      return
    }

    const dmSettings = dmSettingsList[0]

    // 2. Instagram 계정 정보 조회
    const { data: instagramAccount } = await supabase
      .from('instagram_accounts')
      .select('id,user_id,access_token,instagram_user_id')
      .eq('id', dmSettings.instagram_account_id)
      .single()

    if (!instagramAccount) {
      console.error('Instagram account not found:', dmSettings.instagram_account_id)
      return
    }

    // 3. Tracking Link 정보 조회
    const { data: trackingLink } = await supabase
      .from('tracking_links')
      .select('id,tracking_url,go_url,post_name')
      .eq('id', dmSettings.tracking_link_id)
      .single()

    // dmSettings에 관련 데이터 첨부
    dmSettings.instagram_accounts = instagramAccount
    dmSettings.tracking_links = trackingLink

    console.log('Found DM settings:', {
      id: dmSettings.id,
      instagram_account_id: dmSettings.instagram_accounts?.instagram_user_id,
      has_tracking_link: !!dmSettings.tracking_links
    })

    // 키워드 매칭 확인
    const keywords = dmSettings.trigger_keywords || ['링크', '구매', '정보']
    const matched = keywords.some((keyword: string) =>
      commentText.includes(keyword.toLowerCase())
    )

    console.log('Keyword matching:', { commentText, keywords, matched })

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

    console.log('Checking for existing DM:', { existingDm: !!existingDm, commenterUsername })

    if (existingDm) {
      console.log('Already sent DM to user:', commenterUsername)
      return
    }

    // DM 발송 준비
    const accessToken = dmSettings.instagram_accounts.access_token
    const myInstagramUserId = dmSettings.instagram_accounts.instagram_user_id
    const trackingUrl = dmSettings.tracking_links?.go_url || dmSettings.tracking_links?.tracking_url

    if (!accessToken || !myInstagramUserId || !trackingUrl) {
      console.error('Missing required data for DM:', { accessToken: !!accessToken, myInstagramUserId, trackingUrl })
      return
    }

    // ⭐ 핵심 로직: require_follow 설정에 따라 분기
    const requireFollow = dmSettings.require_follow ?? false
    console.log('DM send mode:', { requireFollow })

    let dmSent = false
    let messageType: 'link' | 'follow_request' = requireFollow ? 'follow_request' : 'link'

    if (requireFollow) {
      // 옵션 1: 팔로워 체크 필요 → 팔로우 요청 메시지 먼저 발송
      console.log('Require follow mode: Sending follow request message first...')

      const followRequestMessage = dmSettings.follow_request_message || dmSettings.follow_cta_message ||
        `안녕하세요! 댓글 감사합니다 🙏\n\n링크를 받으시려면 팔로우 후 아래 버튼을 눌러주세요!`
      const followButtonText = dmSettings.follow_button_text || '팔로우 했어요!'

      dmSent = await sendInstagramPrivateReplyWithQuickReply(
        commentData.id,
        followRequestMessage,
        accessToken,
        dmSettings.id,
        trackingUrl,
        followButtonText
      )
    } else {
      // 옵션 2: 팔로워 체크 불필요 → Private Reply로 링크 바로 발송
      console.log('No follow required mode: Sending link directly via Private Reply...')

      dmSent = await sendLinkViaPrivateReply(
        commentData.id,
        dmSettings,
        accessToken,
        trackingUrl
      )
    }

    console.log('DM send result:', { dmSent, messageType })

    if (dmSent) {
      // DM 발송 로그 저장
      const logMessage = messageType === 'link'
        ? (dmSettings.dm_message || '링크 메시지')
        : (dmSettings.follow_request_message || dmSettings.follow_cta_message || '팔로우 요청 메시지')

      console.log('Saving DM log to database:', {
        dm_setting_id: dmSettings.id,
        recipient: commenterUsername,
        status: messageType === 'link' ? 'link_sent' : 'sent'
      })

      const { data: logData, error: logError } = await supabase.from('instagram_dm_logs').insert({
        dm_setting_id: dmSettings.id,
        tracking_link_id: dmSettings.tracking_link_id,
        recipient_ig_user_id: commenterIgUserId,
        recipient_username: commenterUsername,
        comment_id: commentData.id,
        comment_text: text,
        dm_message: logMessage,
        sent_at: new Date().toISOString(),
        status: messageType === 'link' ? 'link_sent' : 'sent',
      })

      if (logError) {
        console.error('Failed to save DM log:', logError)
      } else {
        console.log('DM log saved successfully:', logData)
      }

      // 통계 업데이트
      const { error: updateError } = await supabase
        .from('instagram_dm_settings')
        .update({
          total_dms_sent: (dmSettings.total_dms_sent || 0) + 1,
          last_dm_sent_at: new Date().toISOString(),
        })
        .eq('id', dmSettings.id)

      if (updateError) {
        console.error('Failed to update DM settings stats:', updateError)
      }

      console.log(`DM (${messageType}) sent successfully to:`, commenterUsername)
    } else {
      console.error('DM send failed for:', commenterUsername, { messageType })
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

  const supabase = getSupabaseClient()

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

// Instagram API로 팔로워 여부 확인
// 방법: Instagram Business Discovery API 사용
// 참고: https://developers.facebook.com/docs/instagram-api/reference/ig-user
async function checkIfFollowerByAPI(
  myInstagramUserId: string,
  userInstagramId: string,
  accessToken: string
): Promise<boolean> {
  try {
    // 먼저 해당 사용자의 관계 상태 확인
    // follows 엔드포인트 사용 (follower 관계 확인)
    const url = `https://graph.instagram.com/v24.0/${myInstagramUserId}?fields=followers_count&access_token=${accessToken}`

    console.log('Checking follower status for user:', userInstagramId)

    // Instagram Graph API는 개별 사용자의 팔로워 여부를 직접 확인하는 API가 없음
    // 대신 메시지 발송 가능 여부로 판단해야 함

    // 간단한 텍스트 메시지로 테스트 (Ice Breaker 형태)
    const testResponse = await fetch(`https://graph.instagram.com/v24.0/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: userInstagramId },
        message: {
          text: '.' // 최소한의 테스트 메시지
        },
      }),
    })

    const testResult = await testResponse.json()

    console.log('Follower test message result:', JSON.stringify(testResult, null, 2))

    // 메시지 발송이 성공하면 팔로워 또는 DM 가능 상태
    // 에러 코드 확인: 10, 551, 200 등은 권한 없음을 의미
    if (testResult.error) {
      const errorCode = testResult.error.code
      const errorMessage = testResult.error.message

      console.log(`Follower check failed - Error ${errorCode}: ${errorMessage}`)

      // 특정 에러 코드들은 비팔로워를 의미
      const nonFollowerErrors = [10, 551, 200, 100]
      if (nonFollowerErrors.includes(errorCode)) {
        return false // 확실히 비팔로워
      }

      // 기타 에러는 불확실하므로 true 반환 (안전장치)
      return true
    }

    // 성공 → 팔로워 또는 메시지 가능 상태
    return true

  } catch (error) {
    console.error('Error checking follower status:', error)
    // 에러 시 true 반환 (안전장치: 링크 발송 허용)
    return true
  }
}

// 링크 메시지 발송 함수
async function sendLinkMessage(
  senderId: string,
  accessToken: string,
  dmMessageText: string,
  trackingUrl: string,
  productImageUrl: string | null,
  productName: string
): Promise<{ success: boolean; error?: unknown }> {
  try {
    let response

    if (productImageUrl) {
      // Generic Template (이미지 카드 + 버튼)
      response = await fetch(`https://graph.instagram.com/v24.0/me/messages`, {
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
                elements: [{
                  title: productName,
                  subtitle: dmMessageText,
                  image_url: productImageUrl,
                  default_action: { type: 'web_url', url: trackingUrl },
                  buttons: [{ type: 'web_url', url: trackingUrl, title: '바로가기' }],
                }],
              },
            },
          },
        }),
      })
    } else {
      // Button Template (텍스트 + 버튼)
      response = await fetch(`https://graph.instagram.com/v24.0/me/messages`, {
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
                buttons: [{ type: 'web_url', url: trackingUrl, title: '바로가기' }],
              },
            },
          },
        }),
      })
    }

    const result = await response.json()

    console.log('Link message send result:', JSON.stringify(result, null, 2))

    if (result.error) {
      console.error('Failed to send link message:', result.error)
      return { success: false, error: result.error }
    }

    console.log('Link message sent successfully')
    return { success: true }

  } catch (error) {
    console.error('Error sending link message:', error)
    return { success: false, error }
  }
}

// 팔로우 확인 버튼 클릭 시 처리
// 수정된 로직: 먼저 팔로워 여부 확인 → 팔로워면 링크 발송, 아니면 팔로우 요청 재발송
async function handleFollowConfirmed(
  senderId: string,
  recipientId: string,
  dmSettingId: string,
  trackingUrl: string
) {
  try {
    console.log('Follow confirmed button clicked, checking follower status for:', senderId)

    const supabase = getSupabaseClient()

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
    const myInstagramUserId = dmSettings.instagram_accounts.instagram_user_id
    const requireFollow = dmSettings.require_follow ?? true // 기본값 true

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

    // ⭐ require_follow 설정에 따라 분기
    if (requireFollow) {
      // 팔로워 체크 필요: 먼저 팔로워 여부 확인
      console.log('require_follow=true: Checking if user is a follower...')

      const isFollower = await checkIfFollowerByAPI(myInstagramUserId, senderId, accessToken)

      if (!isFollower) {
        // ❌ 비팔로워: 팔로우 요청 메시지 재발송
        console.log('User is NOT a follower. Sending follow request message again...')

        const followRequestMessage = dmSettings.follow_request_message || dmSettings.follow_cta_message ||
          `아직 팔로우가 확인되지 않았어요! 😅\n\n팔로우 후 다시 버튼을 눌러주세요!`
        const followButtonText = dmSettings.follow_button_text || '팔로우 했어요!'

        await fetch(`https://graph.instagram.com/v24.0/me/messages`, {
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
                  buttons: [{
                    type: 'postback',
                    title: followButtonText,
                    payload: `follow_confirmed:${dmSettingId}:${trackingUrl}`,
                  }],
                },
              },
            },
          }),
        })

        return // 팔로워가 아니므로 종료
      }

      // ✅ 팔로워 확인됨: 링크 발송
      console.log('User IS a follower. Sending link message...')
    } else {
      // require_follow=false: 팔로워 체크 없이 바로 링크 발송
      console.log('require_follow=false: Sending link without follower check...')
    }

    // 공통: 링크 메시지 발송
    const sendResult = await sendLinkMessage(
      senderId,
      accessToken,
      dmMessageText,
      trackingUrl,
      productImageUrl,
      productName
    )

    if (sendResult.success) {
      console.log('Link message sent successfully.')

      // DM 로그 업데이트 (링크 발송 완료)
      await supabase
        .from('instagram_dm_logs')
        .update({
          status: 'link_sent',
          link_sent_at: new Date().toISOString(),
        })
        .eq('dm_setting_id', dmSettingId)
        .eq('recipient_ig_user_id', senderId)
    } else {
      console.error('Failed to send link message:', sendResult.error)
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
    const url = `https://graph.instagram.com/v24.0/me/messages`

    console.log('Sending Private Reply with Button Template to comment:', commentId)

    // web_url 버튼용 팔로우 확인 URL 생성 (PC fallback용)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sellerport.app'
    const followConfirmUrl = `${appUrl}/api/instagram/follow-confirm?dm=${dmSettingId}&url=${encodeURIComponent(trackingUrl)}&comment=${commentId}`

    // 1차 시도: Button Template with postback (모바일 앱에서 동작)
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
      console.log('Instagram Private Reply with postback Button Template sent successfully:', result)
      return true
    }

    // 2차 시도: Button Template with web_url (PC에서도 클릭 가능)
    console.error('Instagram Private Reply with postback error:', result.error)
    console.log('Retrying with web_url Button Template...')

    const webUrlResponse = await fetch(url, {
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
                  type: 'web_url',
                  url: followConfirmUrl,
                  title: buttonText,
                },
              ],
            },
          },
        },
      }),
    })

    const webUrlResult = await webUrlResponse.json()

    if (!webUrlResult.error) {
      console.log('Instagram Private Reply with web_url Button Template sent successfully:', webUrlResult)
      return true
    }

    // 3차 시도: Quick Reply (postback)
    console.error('Instagram Private Reply with web_url error:', webUrlResult.error)
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

    // 4차 시도 (마지막 Fallback): 일반 텍스트 메시지 + 링크
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
          text: `${message}\n\n👉 팔로우 확인: ${followConfirmUrl}`,
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
