/**
 * Instagram 미디어(게시물) 목록 API
 * 연결된 Instagram 계정의 게시물 목록을 가져옵니다
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface InstagramMedia {
  id: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink: string
  caption?: string
  timestamp: string
  like_count?: number
  comments_count?: number
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 쿼리 파라미터에서 Instagram Account ID 가져오기
    const searchParams = request.nextUrl.searchParams
    const instagramAccountId = searchParams.get('instagramAccountId')

    if (!instagramAccountId) {
      return NextResponse.json({ error: 'instagramAccountId is required' }, { status: 400 })
    }

    // 해당 Instagram 계정 정보 가져오기
    const { data: account } = await supabase
      .from('instagram_accounts')
      .select('id, access_token, instagram_user_id')
      .eq('id', instagramAccountId)
      .eq('user_id', user.id)
      .single()

    if (!account) {
      return NextResponse.json({ error: 'Instagram account not found' }, { status: 404 })
    }

    const accessToken = account.access_token
    const instagramUserId = account.instagram_user_id

    if (!accessToken || !instagramUserId) {
      return NextResponse.json({ error: 'Instagram credentials not found' }, { status: 400 })
    }

    // Instagram Graph API로 미디어 목록 가져오기
    // Instagram Login API 토큰은 graph.instagram.com 사용
    const mediaUrl = new URL(`https://graph.instagram.com/v24.0/me/media`)
    mediaUrl.searchParams.set('access_token', accessToken)
    mediaUrl.searchParams.set('fields', 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp')
    mediaUrl.searchParams.set('limit', '25') // 최근 25개

    const response = await fetch(mediaUrl.toString())
    const data = await response.json()

    if (data.error) {
      console.error('Instagram API error:', data.error)
      return NextResponse.json({
        error: data.error.message || 'Failed to fetch Instagram media'
      }, { status: 400 })
    }

    const media: InstagramMedia[] = data.data || []

    return NextResponse.json({ success: true, data: media })
  } catch (error) {
    console.error('Instagram media API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
