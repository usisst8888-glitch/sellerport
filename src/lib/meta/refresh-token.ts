/**
 * Meta Access Token 갱신 유틸리티
 *
 * Meta Long-lived Token은 60일 유효하며, 만료 전에 갱신 가능
 */

import { SupabaseClient } from '@supabase/supabase-js'

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

interface RefreshResult {
  success: boolean
  accessToken?: string
  expiresAt?: string
  error?: string
}

/**
 * Meta Access Token 갱신
 *
 * @param channelId - 광고 채널 ID
 * @param currentToken - 현재 access token
 * @param supabase - Supabase 클라이언트
 * @returns 갱신 결과
 */
export async function refreshMetaToken(
  channelId: string,
  currentToken: string,
  supabase: SupabaseClient
): Promise<RefreshResult> {
  try {
    const META_APP_ID = process.env.META_APP_ID
    const META_APP_SECRET = process.env.META_APP_SECRET

    if (!META_APP_ID || !META_APP_SECRET) {
      return { success: false, error: 'Meta app configuration missing' }
    }

    // Long-lived token 갱신 요청
    const refreshUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token')
    refreshUrl.searchParams.set('grant_type', 'fb_exchange_token')
    refreshUrl.searchParams.set('client_id', META_APP_ID)
    refreshUrl.searchParams.set('client_secret', META_APP_SECRET)
    refreshUrl.searchParams.set('fb_exchange_token', currentToken)

    const response = await fetch(refreshUrl.toString())
    const data: MetaTokenResponse = await response.json()

    if (data.error) {
      console.error('Meta token refresh error:', data.error)
      return { success: false, error: data.error.message }
    }

    if (!data.access_token) {
      return { success: false, error: 'No access token in response' }
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
      return { success: false, error: 'Failed to save token' }
    }

    console.log(`Meta token refreshed for channel ${channelId}, expires at ${newExpiresAt}`)

    return {
      success: true,
      accessToken: data.access_token,
      expiresAt: newExpiresAt,
    }
  } catch (error) {
    console.error('Meta token refresh error:', error)
    return { success: false, error: 'Token refresh failed' }
  }
}
