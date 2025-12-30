/**
 * Meta Access Token 갱신 API
 * POST /api/ad-channels/meta/refresh-token
 *
 * Meta Long-lived Token은 만료 60일 전부터 갱신 가능
 * 갱신된 토큰도 60일 유효
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface MetaTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
  error?: {
    message: string
    type: string
    code: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { channelId } = body

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID required' }, { status: 400 })
    }

    // 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'meta')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    const currentToken = channel.access_token
    if (!currentToken) {
      return NextResponse.json({ error: 'No access token found' }, { status: 400 })
    }

    const META_APP_ID = process.env.META_APP_ID
    const META_APP_SECRET = process.env.META_APP_SECRET

    if (!META_APP_ID || !META_APP_SECRET) {
      return NextResponse.json({ error: 'Meta app configuration missing' }, { status: 500 })
    }

    // Long-lived token 갱신 요청
    // Meta API: 기존 long-lived token을 사용하여 새 long-lived token 발급
    const refreshUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    refreshUrl.searchParams.set('grant_type', 'fb_exchange_token')
    refreshUrl.searchParams.set('client_id', META_APP_ID)
    refreshUrl.searchParams.set('client_secret', META_APP_SECRET)
    refreshUrl.searchParams.set('fb_exchange_token', currentToken)

    const response = await fetch(refreshUrl.toString())
    const data: MetaTokenResponse = await response.json()

    if (data.error) {
      console.error('Meta token refresh error:', data.error)

      // 토큰이 완전히 만료되어 갱신 불가능한 경우
      if (data.error.code === 190 || data.error.type === 'OAuthException') {
        await supabase
          .from('ad_channels')
          .update({ status: 'token_expired' })
          .eq('id', channelId)

        return NextResponse.json({
          error: 'Token cannot be refreshed. Please reconnect your Meta account.',
          needsReconnect: true
        }, { status: 401 })
      }

      return NextResponse.json({ error: data.error.message }, { status: 400 })
    }

    if (!data.access_token) {
      return NextResponse.json({ error: 'Failed to refresh token' }, { status: 500 })
    }

    // 새 토큰 저장
    const expiresIn = data.expires_in || 5184000 // 기본 60일
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    const { error: updateError } = await supabase
      .from('ad_channels')
      .update({
        access_token: data.access_token,
        token_expires_at: newExpiresAt,
        status: 'connected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', channelId)

    if (updateError) {
      console.error('Failed to save refreshed token:', updateError)
      return NextResponse.json({ error: 'Failed to save token' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      expiresAt: newExpiresAt,
    })
  } catch (error) {
    console.error('Meta token refresh error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
