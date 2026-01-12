/**
 * YouTube 영상 업로드 API
 * - YouTube Data API v3를 사용하여 영상 업로드
 * - Resumable upload 방식 사용
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 토큰 갱신 함수
async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    const data = await response.json()
    return data.access_token || null
  } catch (error) {
    console.error('Failed to refresh token:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // FormData로 받기 (파일 포함)
    const formData = await request.formData()
    const adChannelId = formData.get('adChannelId') as string
    const title = formData.get('title') as string || '제목 없음'
    const description = formData.get('description') as string || ''
    const tags = formData.get('tags') as string || '' // 쉼표로 구분된 태그
    const privacyStatus = formData.get('privacyStatus') as string || 'private' // public, unlisted, private
    const categoryId = formData.get('categoryId') as string || '22' // 22 = People & Blogs
    const file = formData.get('file') as File

    if (!adChannelId) {
      return NextResponse.json({ error: '채널 ID가 필요합니다' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: '업로드할 파일이 없습니다' }, { status: 400 })
    }

    // 파일 타입 확인
    if (!file.type.startsWith('video/')) {
      return NextResponse.json({ error: '동영상 파일만 업로드할 수 있습니다' }, { status: 400 })
    }

    // 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', adChannelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'youtube')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다' }, { status: 404 })
    }

    if (!channel.access_token) {
      return NextResponse.json({ error: '액세스 토큰이 없습니다. 다시 연동해주세요.' }, { status: 400 })
    }

    let accessToken = channel.access_token

    // 토큰 만료 확인 및 갱신
    const tokenExpiry = new Date(channel.token_expires_at)
    if (tokenExpiry < new Date()) {
      if (!channel.refresh_token) {
        return NextResponse.json({
          error: '토큰이 만료되었습니다. YouTube 채널을 다시 연동해주세요.'
        }, { status: 400 })
      }

      const newAccessToken = await refreshAccessToken(channel.refresh_token)
      if (!newAccessToken) {
        return NextResponse.json({
          error: '토큰 갱신에 실패했습니다. YouTube 채널을 다시 연동해주세요.'
        }, { status: 400 })
      }

      accessToken = newAccessToken

      // 새 토큰 저장
      await supabase
        .from('ad_channels')
        .update({
          access_token: newAccessToken,
          token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString() // 1시간
        })
        .eq('id', adChannelId)
    }

    console.log('YouTube upload request:', {
      channelId: channel.account_id,
      title,
      fileSize: file.size,
      fileType: file.type
    })

    // 태그 파싱
    const tagList = tags ? tags.split(',').map(t => t.trim()).filter(t => t) : []

    // YouTube Data API - Resumable upload
    // Step 1: 업로드 세션 시작
    const metadata = {
      snippet: {
        title,
        description,
        tags: tagList,
        categoryId,
      },
      status: {
        privacyStatus,
        selfDeclaredMadeForKids: false,
      },
    }

    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Length': file.size.toString(),
          'X-Upload-Content-Type': file.type,
        },
        body: JSON.stringify(metadata),
      }
    )

    if (!initResponse.ok) {
      const errorData = await initResponse.json()
      console.error('YouTube upload init error:', errorData)

      // 권한 에러 체크
      if (errorData.error?.code === 403) {
        return NextResponse.json({
          success: false,
          error: 'YouTube 업로드 권한이 없습니다. 채널을 다시 연동해주세요.',
          details: errorData.error
        }, { status: 403 })
      }

      return NextResponse.json({
        success: false,
        error: errorData.error?.message || '업로드 초기화 실패',
        details: errorData.error
      }, { status: 400 })
    }

    const uploadUrl = initResponse.headers.get('location')
    if (!uploadUrl) {
      return NextResponse.json({
        success: false,
        error: '업로드 URL을 받지 못했습니다'
      }, { status: 400 })
    }

    // Step 2: 실제 파일 업로드
    const fileBuffer = await file.arrayBuffer()

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
        'Content-Length': file.size.toString(),
      },
      body: fileBuffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('YouTube upload error:', errorText)
      return NextResponse.json({
        success: false,
        error: '영상 업로드에 실패했습니다',
        details: errorText
      }, { status: 400 })
    }

    const uploadResult = await uploadResponse.json()

    console.log('YouTube upload success:', {
      videoId: uploadResult.id,
      title: uploadResult.snippet?.title
    })

    // 업로드된 영상 정보 저장 (ad_performance 또는 별도 테이블에)
    // 나중에 분석 데이터 조회할 때 사용
    const videoUrl = `https://www.youtube.com/watch?v=${uploadResult.id}`

    return NextResponse.json({
      success: true,
      videoId: uploadResult.id,
      videoUrl,
      title: uploadResult.snippet?.title,
      thumbnailUrl: uploadResult.snippet?.thumbnails?.default?.url,
      message: '영상이 업로드되었습니다!'
    })

  } catch (error) {
    console.error('YouTube upload error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}
