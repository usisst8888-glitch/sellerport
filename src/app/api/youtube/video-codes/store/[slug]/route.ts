/**
 * 스토어 슬러그 확인 API
 * GET: 스토어 슬러그 유효성 확인
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: 스토어 슬러그 유효성 확인
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // 1. tracking_links에서 해당 슬러그를 가진 영상번호가 있는지 확인
    const { data: trackingLinkData } = await supabaseAdmin
      .from('tracking_links')
      .select('store_slug, user_id')
      .eq('store_slug', slug)
      .eq('status', 'active')
      .not('video_code', 'is', null)
      .limit(1)

    if (trackingLinkData && trackingLinkData.length > 0) {
      return NextResponse.json({
        success: true,
        storeName: slug
      })
    }

    // 2. store-{user_id} 형태의 슬러그인 경우 해당 유저가 존재하는지 확인
    if (slug.startsWith('store-')) {
      const userIdPrefix = slug.replace('store-', '')
      const { data: userData } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .like('id', `${userIdPrefix}%`)
        .limit(1)

      if (userData && userData.length > 0) {
        return NextResponse.json({
          success: true,
          storeName: slug
        })
      }
    }

    // 3. 유튜브 채널의 account_name이 slug와 일치하는지 확인
    const { data: channelData } = await supabaseAdmin
      .from('ad_channels')
      .select('account_name, channel_name')
      .eq('channel_type', 'youtube')
      .eq('status', 'connected')

    if (channelData && channelData.length > 0) {
      // 각 채널의 account_name을 slug로 변환해서 비교
      const matchingChannel = channelData.find(channel => {
        const accountName = channel.account_name || channel.channel_name
        if (!accountName) return false

        const channelSlug = accountName
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')

        return channelSlug === slug
      })

      if (matchingChannel) {
        return NextResponse.json({
          success: true,
          storeName: matchingChannel.account_name || matchingChannel.channel_name || slug
        })
      }
    }

    return NextResponse.json({
      success: false,
      error: '존재하지 않는 스토어입니다.'
    }, { status: 404 })

  } catch (error) {
    console.error('Store slug check error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
