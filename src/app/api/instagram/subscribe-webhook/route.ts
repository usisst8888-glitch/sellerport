/**
 * Instagram Webhook 상태 확인 API (Instagram Login 방식)
 *
 * Instagram Login 방식에서는 Webhook이 Meta Developer Console에서 앱 레벨로 설정됩니다.
 * 개별 사용자별 구독은 필요하지 않으며, 앱에 연결된 모든 Instagram 계정의 이벤트가 수신됩니다.
 *
 * 이 API는 연결 상태 확인 및 메타데이터 업데이트용으로 사용됩니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Webhook 상태 업데이트 (Instagram Login 방식에서는 별도 구독 불필요)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { channelId } = await request.json()

    if (!channelId) {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    // 해당 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'instagram')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Instagram channel not found' }, { status: 404 })
    }

    const authMethod = channel.metadata?.auth_method
    const accessToken = channel.access_token
    const instagramUserId = channel.metadata?.instagram_user_id

    if (!accessToken || !instagramUserId) {
      return NextResponse.json({ error: 'Missing Instagram credentials. Please reconnect.' }, { status: 400 })
    }

    // Instagram Login 방식: 유저별 Webhook 구독 필요!
    if (authMethod === 'instagram_login') {
      // Instagram 계정 정보 확인 (토큰 유효성 검증)
      const userInfoUrl = new URL(`https://graph.instagram.com/v24.0/${instagramUserId}`)
      userInfoUrl.searchParams.set('access_token', accessToken)
      userInfoUrl.searchParams.set('fields', 'id,username')

      const userInfoResponse = await fetch(userInfoUrl.toString())
      const userInfo = await userInfoResponse.json()

      if (userInfo.error) {
        console.error('Instagram token validation error:', userInfo.error)
        return NextResponse.json({
          success: false,
          error: 'Instagram token expired. Please reconnect.',
          needsReconnect: true
        }, { status: 400 })
      }

      // subscribed_apps API 호출 (재시도 로직 포함)
      let subscribeSuccess = false
      let subscribeError = null
      const maxRetries = 3

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`Attempting webhook subscription (${attempt}/${maxRetries})...`)

          const subscribeUrl = `https://graph.instagram.com/v24.0/${instagramUserId}/subscribed_apps`
          const subscribeResponse = await fetch(subscribeUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              subscribed_fields: 'comments,messages',
              access_token: accessToken,
            }).toString(),
          })

          const subscribeResult = await subscribeResponse.json()

          if (subscribeResult.error) {
            subscribeError = subscribeResult.error
            console.error(`Webhook subscription attempt ${attempt} failed:`, subscribeResult.error)

            // 일시적 에러면 재시도
            if (subscribeResult.error.is_transient && attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)) // 지수 백오프
              continue
            }
            break
          } else {
            console.log('Webhook subscription successful:', subscribeResult)
            subscribeSuccess = true
            break
          }
        } catch (error) {
          console.error(`Webhook subscription attempt ${attempt} error:`, error)
          subscribeError = error
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
          }
        }
      }

      // 메타데이터 업데이트
      await supabase
        .from('ad_channels')
        .update({
          metadata: {
            ...channel.metadata,
            webhook_subscribed: subscribeSuccess,
            webhook_subscribed_at: subscribeSuccess ? new Date().toISOString() : channel.metadata?.webhook_subscribed_at,
            last_verified_at: new Date().toISOString(),
            last_subscription_error: subscribeError ? JSON.stringify(subscribeError) : null,
          }
        })
        .eq('id', channelId)

      if (!subscribeSuccess) {
        return NextResponse.json({
          success: false,
          error: 'Webhook 구독에 실패했습니다. 나중에 다시 시도해주세요.',
          details: subscribeError,
          authMethod: 'instagram_login',
          accountVerified: true
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Webhook 구독이 완료되었습니다.',
        authMethod: 'instagram_login',
        accountVerified: true
      })
    }

    // 기존 Facebook Login 방식 (레거시 지원)
    const facebookPageId = channel.metadata?.facebook_page_id

    if (!facebookPageId) {
      return NextResponse.json({
        success: false,
        error: 'Facebook Page 연동이 필요합니다. Instagram Login 방식으로 재연결을 권장합니다.',
        suggestReconnect: true
      }, { status: 400 })
    }

    // Facebook Page를 앱에 구독 (레거시)
    const subscribeUrl = `https://graph.facebook.com/v18.0/${facebookPageId}/subscribed_apps`
    const subscribeResponse = await fetch(subscribeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        subscribed_fields: 'feed,messages',
        access_token: accessToken
      }).toString()
    })

    const subscribeResult = await subscribeResponse.json()
    console.log('Instagram Webhook subscription result:', subscribeResult)

    if (subscribeResult.error) {
      console.error('Failed to subscribe to Instagram webhooks:', subscribeResult.error)
      return NextResponse.json({
        success: false,
        error: subscribeResult.error.message || 'Failed to subscribe to webhooks'
      }, { status: 400 })
    }

    // 메타데이터 업데이트
    await supabase
      .from('ad_channels')
      .update({
        metadata: {
          ...channel.metadata,
          webhook_subscribed: true,
          webhook_subscribed_at: new Date().toISOString()
        }
      })
      .eq('id', channelId)

    return NextResponse.json({
      success: true,
      message: 'Webhook subscription successful',
      authMethod: 'facebook_login',
      result: subscribeResult
    })
  } catch (error) {
    console.error('Instagram webhook subscribe error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 현재 구독 상태 확인
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const channelId = request.nextUrl.searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 })
    }

    // 해당 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'instagram')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Instagram channel not found' }, { status: 404 })
    }

    const authMethod = channel.metadata?.auth_method

    // Instagram Login 방식
    if (authMethod === 'instagram_login') {
      return NextResponse.json({
        success: true,
        authMethod: 'instagram_login',
        note: 'Webhook은 Meta Developer Console에서 앱 레벨로 설정됩니다.',
        channelMetadata: {
          webhook_subscribed: channel.metadata?.webhook_subscribed,
          webhook_subscribed_at: channel.metadata?.webhook_subscribed_at,
          last_verified_at: channel.metadata?.last_verified_at
        }
      })
    }

    // Facebook Login 방식 (레거시)
    const facebookPageId = channel.metadata?.facebook_page_id
    const accessToken = channel.access_token

    if (!facebookPageId || !accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Missing Facebook Page credentials.',
        suggestReconnect: true
      }, { status: 400 })
    }

    // 현재 구독 상태 확인
    const statusUrl = `https://graph.facebook.com/v18.0/${facebookPageId}/subscribed_apps?access_token=${accessToken}`
    const statusResponse = await fetch(statusUrl)
    const statusResult = await statusResponse.json()

    return NextResponse.json({
      success: true,
      authMethod: 'facebook_login',
      subscriptions: statusResult.data || [],
      channelMetadata: {
        webhook_subscribed: channel.metadata?.webhook_subscribed,
        webhook_subscribed_at: channel.metadata?.webhook_subscribed_at
      }
    })
  } catch (error) {
    console.error('Instagram webhook status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
