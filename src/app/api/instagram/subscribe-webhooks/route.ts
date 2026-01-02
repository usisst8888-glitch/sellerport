/**
 * 기존 Instagram 계정들을 웹훅에 구독시키는 API
 * GET /api/instagram/subscribe-webhooks
 *
 * 모든 연결된 Instagram 계정에 대해 subscribed_apps API 호출
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
      .select('id, instagram_user_id, access_token, instagram_username')
      .eq('user_id', user.id)
      .eq('status', 'connected')

    if (accountsError) {
      console.error('Failed to fetch Instagram accounts:', accountsError)
      return NextResponse.json({ error: '계정 조회 실패' }, { status: 500 })
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        message: '연결된 Instagram 계정이 없습니다',
        results: []
      })
    }

    // 각 계정에 대해 웹훅 구독
    const results = []

    for (const account of accounts) {
      try {
        const subscribeUrl = `https://graph.instagram.com/v21.0/${account.instagram_user_id}/subscribed_apps`

        console.log('Subscribing webhook for account:', account.instagram_username)

        const subscribeResponse = await fetch(subscribeUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            subscribed_fields: 'comments,messages,messaging_postbacks',
            access_token: account.access_token
          }).toString()
        })

        const subscribeResult = await subscribeResponse.json()

        if (subscribeResult.error) {
          console.error(`Failed to subscribe webhook for ${account.instagram_username}:`, subscribeResult.error)
          results.push({
            account: account.instagram_username,
            instagram_user_id: account.instagram_user_id,
            success: false,
            error: subscribeResult.error
          })
        } else {
          console.log(`Webhook subscribed successfully for ${account.instagram_username}:`, subscribeResult)
          results.push({
            account: account.instagram_username,
            instagram_user_id: account.instagram_user_id,
            success: true,
            result: subscribeResult
          })
        }
      } catch (error) {
        console.error(`Error subscribing webhook for ${account.instagram_username}:`, error)
        results.push({
          account: account.instagram_username,
          instagram_user_id: account.instagram_user_id,
          success: false,
          error: String(error)
        })
      }
    }

    return NextResponse.json({
      message: '웹훅 구독 완료',
      total: accounts.length,
      results
    })

  } catch (error) {
    console.error('Subscribe webhooks API error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
