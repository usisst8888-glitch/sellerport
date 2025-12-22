/**
 * Instagram Webhook 구독 API
 * 기존에 연결된 Instagram 계정에 대해 Webhook 구독을 활성화합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const instagramUserId = channel.metadata?.instagram_user_id || channel.account_id
    const accessToken = channel.access_token

    if (!instagramUserId || !accessToken) {
      return NextResponse.json({ error: 'Missing Instagram credentials' }, { status: 400 })
    }

    // Instagram 비즈니스 계정에 대한 Webhook 구독
    const subscribeUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/subscribed_apps`
    const subscribeResponse = await fetch(subscribeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscribed_fields: ['comments', 'messages'],
        access_token: accessToken
      })
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

    const instagramUserId = channel.metadata?.instagram_user_id || channel.account_id
    const accessToken = channel.access_token

    if (!instagramUserId || !accessToken) {
      return NextResponse.json({ error: 'Missing Instagram credentials' }, { status: 400 })
    }

    // 현재 구독 상태 확인
    const statusUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/subscribed_apps?access_token=${accessToken}`
    const statusResponse = await fetch(statusUrl)
    const statusResult = await statusResponse.json()

    return NextResponse.json({
      success: true,
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
