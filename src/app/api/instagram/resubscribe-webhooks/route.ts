/**
 * 기존 Instagram 계정들을 웹훅에 다시 구독
 * GET /api/instagram/resubscribe-webhooks
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 연결된 모든 Instagram 계정 조회
    const { data: accounts, error: accountsError } = await supabase
      .from('instagram_accounts')
      .select('id, instagram_user_id, instagram_username, access_token')
      .eq('user_id', user.id)
      .eq('status', 'connected')

    if (accountsError) {
      console.error('Failed to fetch accounts:', accountsError)
      return NextResponse.json({ error: '계정 조회 실패' }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        message: '연결된 Instagram 계정이 없습니다',
        results: []
      })
    }

    const results = []

    for (const account of accounts) {
      try {
        const subscribeUrl = `https://graph.instagram.com/v24.0/${account.instagram_user_id}/subscribed_apps`

        console.log('Subscribing account:', account.instagram_username)

        const response = await fetch(subscribeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            subscribed_fields: 'comments,messages,messaging_postbacks,live_comments',
            access_token: account.access_token,
          }).toString(),
        })

        const data = await response.json()

        if (data.error) {
          console.error(`Failed for ${account.instagram_username}:`, data.error)
          results.push({
            username: account.instagram_username,
            instagram_user_id: account.instagram_user_id,
            success: false,
            error: data.error
          })
        } else {
          console.log(`Success for ${account.instagram_username}:`, data)
          results.push({
            username: account.instagram_username,
            instagram_user_id: account.instagram_user_id,
            success: true,
            data
          })
        }
      } catch (error) {
        console.error(`Error for ${account.instagram_username}:`, error)
        results.push({
          username: account.instagram_username,
          instagram_user_id: account.instagram_user_id,
          success: false,
          error: String(error)
        })
      }
    }

    return NextResponse.json({
      message: '웹훅 재구독 완료',
      total: accounts.length,
      results
    })

  } catch (error) {
    console.error('Resubscribe webhooks error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
