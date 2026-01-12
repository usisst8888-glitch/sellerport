/**
 * Instagram 토큰 디버그 API
 * - 토큰의 권한 및 상태 확인
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

    // 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'instagram')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다' }, { status: 404 })
    }

    const accessToken = channel.access_token
    const igUserId = channel.account_id

    // 1. 토큰 디버그 (Meta Debug Token API)
    const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID || process.env.META_APP_ID
    const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET || process.env.META_APP_SECRET

    // 앱 액세스 토큰 생성
    const appAccessToken = `${INSTAGRAM_APP_ID}|${INSTAGRAM_APP_SECRET}`

    const debugResponse = await fetch(
      `https://graph.facebook.com/v24.0/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`
    )
    const debugData = await debugResponse.json()

    // 2. 사용자 정보 및 권한 확인
    const meResponse = await fetch(
      `https://graph.instagram.com/v24.0/me?fields=user_id,username,account_type&access_token=${accessToken}`
    )
    const meData = await meResponse.json()

    // 3. 권한 목록 확인 (permissions edge)
    const permissionsResponse = await fetch(
      `https://graph.instagram.com/v24.0/me/permissions?access_token=${accessToken}`
    )
    const permissionsData = await permissionsResponse.json()

    return NextResponse.json({
      success: true,
      channel: {
        id: channel.id,
        account_id: igUserId,
        channel_name: channel.channel_name,
        status: channel.status,
        token_expires_at: channel.token_expires_at
      },
      tokenDebug: debugData,
      userInfo: meData,
      permissions: permissionsData
    })

  } catch (error) {
    console.error('Token debug error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '토큰 디버그 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}
