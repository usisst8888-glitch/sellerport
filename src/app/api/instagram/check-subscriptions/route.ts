/**
 * Instagram 계정의 현재 앱 구독 상태 확인
 * GET /api/instagram/check-subscriptions
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { data: accounts } = await supabase
      .from('instagram_accounts')
      .select('instagram_user_id, instagram_username, access_token')
      .eq('user_id', user.id)
      .eq('status', 'connected')

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ error: '연결된 계정이 없습니다' }, { status: 404 })
    }

    const results = []

    for (const account of accounts) {
      try {
        // 현재 구독 상태 확인
        const checkUrl = `https://graph.instagram.com/v24.0/${account.instagram_user_id}/subscribed_apps?access_token=${account.access_token}`

        const response = await fetch(checkUrl)
        const data = await response.json()

        results.push({
          username: account.instagram_username,
          instagram_user_id: account.instagram_user_id,
          subscribed_apps: data,
          status: response.status
        })
      } catch (error) {
        results.push({
          username: account.instagram_username,
          instagram_user_id: account.instagram_user_id,
          error: String(error)
        })
      }
    }

    return NextResponse.json({ results })

  } catch (error) {
    console.error('Check subscriptions error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
