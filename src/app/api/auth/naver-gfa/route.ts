import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NaverGFAAPI, NaverGFAError } from '@/lib/naver/gfa-api'

interface ConnectRequest {
  customerId: string
  apiKey: string
  secretKey: string
  accountName?: string
}

// 네이버 GFA API 키 검증 및 연동
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: ConnectRequest = await request.json()
    const { customerId, apiKey, secretKey, accountName } = body

    // 필수 필드 검증
    if (!customerId || !apiKey || !secretKey) {
      return NextResponse.json(
        { error: '광고주 ID, API Key, Secret Key를 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // 네이버 GFA API 클라이언트 생성
    const gfaApi = new NaverGFAAPI({
      customerId,
      apiKey,
      secretKey,
    })

    // API 키 검증 (캠페인 조회로 확인)
    const validation = await gfaApi.validateCredentials()

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message || 'API 키 검증에 실패했습니다.' },
        { status: 400 }
      )
    }

    // 기존 연동이 있는지 확인
    const { data: existingChannel } = await supabase
      .from('ad_channels')
      .select('id')
      .eq('user_id', user.id)
      .eq('channel_type', 'naver_gfa')
      .eq('account_id', customerId)
      .single()

    const channelData = {
      user_id: user.id,
      channel_type: 'naver_gfa',
      channel_name: accountName || '네이버 GFA',
      account_id: customerId,
      account_name: accountName || `네이버 GFA (${customerId})`,
      access_token: apiKey,
      status: 'connected',
      last_sync_at: new Date().toISOString(),
      metadata: {
        secretKey,
        customerId,
      },
    }

    if (existingChannel) {
      // 기존 연동 업데이트
      const { error: updateError } = await supabase
        .from('ad_channels')
        .update(channelData)
        .eq('id', existingChannel.id)

      if (updateError) {
        console.error('Failed to update ad channel:', updateError)
        return NextResponse.json(
          { error: '채널 업데이트에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '네이버 GFA 연동이 업데이트되었습니다.',
        channelId: existingChannel.id,
        isUpdate: true,
      })
    } else {
      // 새 연동 생성
      const { data: newChannel, error: insertError } = await supabase
        .from('ad_channels')
        .insert(channelData)
        .select('id')
        .single()

      if (insertError) {
        console.error('Failed to save ad channel:', insertError)
        return NextResponse.json(
          { error: '채널 저장에 실패했습니다.' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: '네이버 GFA가 성공적으로 연동되었습니다.',
        channelId: newChannel.id,
        isUpdate: false,
      })
    }
  } catch (error) {
    console.error('Naver GFA connect error:', error)

    if (error instanceof NaverGFAError) {
      return NextResponse.json(
        { error: error.getUserMessage() },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 연동 해제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const channelId = searchParams.get('channelId')

    if (!channelId) {
      return NextResponse.json(
        { error: '채널 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 채널 삭제 (본인 소유 확인)
    const { error: deleteError } = await supabase
      .from('ad_channels')
      .delete()
      .eq('id', channelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'naver_gfa')

    if (deleteError) {
      console.error('Failed to delete ad channel:', deleteError)
      return NextResponse.json(
        { error: '연동 해제에 실패했습니다.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '네이버 GFA 연동이 해제되었습니다.',
    })
  } catch (error) {
    console.error('Naver GFA disconnect error:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
