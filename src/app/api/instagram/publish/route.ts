/**
 * Instagram 콘텐츠 발행 API
 * - 피드, 릴스, 스토리 발행
 * - Cloudflare R2에 이미지 업로드 후 Instagram Graph API로 발행
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

// FormData 처리를 위한 설정
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Cloudflare R2 클라이언트 설정
const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
  },
})

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
    const contentType = formData.get('contentType') as string || 'feed'
    const caption = formData.get('caption') as string || ''
    const files = formData.getAll('files') as File[]

    if (!adChannelId) {
      return NextResponse.json({ error: '채널 ID가 필요합니다' }, { status: 400 })
    }

    if (files.length === 0) {
      return NextResponse.json({ error: '업로드할 파일이 없습니다' }, { status: 400 })
    }

    // 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', adChannelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'instagram')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다' }, { status: 404 })
    }

    if (!channel.access_token) {
      return NextResponse.json({ error: '액세스 토큰이 없습니다. 다시 연동해주세요.' }, { status: 400 })
    }

    const accessToken = channel.access_token
    let igUserId = channel.account_id

    console.log('Instagram publish request:', {
      igUserId,
      contentType,
      filesCount: files.length,
      hasCaption: !!caption
    })

    // account_id가 올바른지 /me 엔드포인트로 확인
    try {
      const meResponse = await fetch(
        `https://graph.instagram.com/v24.0/me?fields=user_id,username&access_token=${accessToken}`
      )
      const meData = await meResponse.json()

      if (meData.error) {
        console.error('Instagram /me error:', meData.error)
        return NextResponse.json({
          success: false,
          error: '인스타그램 토큰이 유효하지 않습니다. 계정을 다시 연동해주세요.'
        }, { status: 400 })
      }

      const actualUserId = meData.user_id?.toString()
      if (actualUserId && actualUserId !== igUserId) {
        console.log('Instagram account_id mismatch detected, auto-fixing...', {
          stored_account_id: igUserId,
          actual_user_id: actualUserId
        })

        // 자동으로 올바른 account_id로 업데이트
        const { error: updateError } = await supabase
          .from('ad_channels')
          .update({
            account_id: actualUserId,
            metadata: {
              ...((channel.metadata as Record<string, unknown>) || {}),
              instagram_user_id: actualUserId,
              previous_account_id: igUserId, // 디버깅용 기존 ID 보존
              auto_fixed_at: new Date().toISOString()
            }
          })
          .eq('id', adChannelId)

        if (updateError) {
          console.error('Failed to auto-fix account_id:', updateError)
          return NextResponse.json({
            success: false,
            error: '인스타그램 계정 정보가 일치하지 않습니다. 광고 채널에서 인스타그램 연동을 삭제하고 다시 연동해주세요.'
          }, { status: 400 })
        }

        console.log('Successfully auto-fixed Instagram account_id')
        // 수정된 ID로 계속 진행
        igUserId = actualUserId
      }
    } catch (verifyError) {
      console.error('Failed to verify Instagram account:', verifyError)
      // 검증 실패해도 일단 진행 (기존 동작 유지)
    }

    // 1. 파일들을 R2에 업로드
    const uploadedUrls: string[] = []
    const uploadedKeys: string[] = [] // 삭제를 위해 키도 저장
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'sellerport'
    const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || ''

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // 파일 확장자 추출
      const ext = file.name.split('.').pop() || (file.type.startsWith('video/') ? 'mp4' : 'jpg')
      const fileName = `instagram/${user.id}/${Date.now()}_${i}.${ext}`

      // R2에 업로드
      await r2Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
      }))

      uploadedUrls.push(`${publicUrl}/${fileName}`)
      uploadedKeys.push(fileName)
    }

    console.log('R2 upload completed:', { uploadedUrls })

    // 2. Instagram Graph API로 발행
    let mediaId: string
    let permalink: string = ''

    if (contentType === 'reels') {
      // 릴스 발행 (동영상)
      const containerResponse = await fetch(
        `https://graph.instagram.com/v24.0/${igUserId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            video_url: uploadedUrls[0],
            caption: caption,
            media_type: 'REELS',
            access_token: accessToken
          })
        }
      )
      const containerData = await containerResponse.json()

      console.log('Container API response (reels):', JSON.stringify(containerData))

      if (containerData.error) {
        console.error('Container creation error:', containerData.error)
        return NextResponse.json({
          success: false,
          error: containerData.error.message || '미디어 컨테이너 생성 실패',
          details: containerData.error
        }, { status: 400 })
      }

      if (!containerData.id) {
        console.error('Container created but no ID returned (reels):', containerData)
        return NextResponse.json({
          success: false,
          error: '컨테이너 생성 후 ID를 받지 못했습니다',
          details: containerData
        }, { status: 400 })
      }

      // 릴스는 처리 시간이 필요할 수 있음 - 상태 확인
      const containerId = containerData.id
      let status = 'IN_PROGRESS'
      let attempts = 0
      const maxAttempts = 30 // 최대 30번 확인 (약 1분)

      while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2초 대기

        const statusResponse = await fetch(
          `https://graph.instagram.com/v24.0/${containerId}?fields=status_code&access_token=${accessToken}`
        )
        const statusData = await statusResponse.json()
        status = statusData.status_code || 'FINISHED'
        attempts++
      }

      if (status !== 'FINISHED') {
        return NextResponse.json({
          success: false,
          error: '동영상 처리 중입니다. 잠시 후 다시 시도해주세요.'
        }, { status: 400 })
      }

      // 발행
      const publishResponse = await fetch(
        `https://graph.instagram.com/v24.0/${igUserId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerId,
            access_token: accessToken
          })
        }
      )
      const publishData = await publishResponse.json()

      console.log('Publish API response (reels):', JSON.stringify(publishData))

      if (publishData.error) {
        console.error('Publish error:', publishData.error)
        return NextResponse.json({
          success: false,
          error: publishData.error.message || '발행 실패',
          details: publishData.error
        }, { status: 400 })
      }

      if (!publishData.id) {
        console.error('Publish succeeded but no media ID returned (reels):', publishData)
        return NextResponse.json({
          success: false,
          error: '발행 후 미디어 ID를 받지 못했습니다',
          details: publishData
        }, { status: 400 })
      }

      mediaId = publishData.id

    } else if (contentType === 'story') {
      // 스토리 발행
      const isVideo = files[0].type.startsWith('video/')

      const containerResponse = await fetch(
        `https://graph.instagram.com/v24.0/${igUserId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [isVideo ? 'video_url' : 'image_url']: uploadedUrls[0],
            media_type: 'STORIES',
            access_token: accessToken
          })
        }
      )
      const containerData = await containerResponse.json()

      console.log('Container API response (story):', JSON.stringify(containerData))

      if (containerData.error) {
        console.error('Container creation error:', containerData.error)
        return NextResponse.json({
          success: false,
          error: containerData.error.message || '미디어 컨테이너 생성 실패',
          details: containerData.error
        }, { status: 400 })
      }

      if (!containerData.id) {
        console.error('Container created but no ID returned (story):', containerData)
        return NextResponse.json({
          success: false,
          error: '컨테이너 생성 후 ID를 받지 못했습니다',
          details: containerData
        }, { status: 400 })
      }

      // 발행
      const publishResponse = await fetch(
        `https://graph.instagram.com/v24.0/${igUserId}/media_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creation_id: containerData.id,
            access_token: accessToken
          })
        }
      )
      const publishData = await publishResponse.json()

      console.log('Publish API response (story):', JSON.stringify(publishData))

      if (publishData.error) {
        console.error('Publish error:', publishData.error)
        return NextResponse.json({
          success: false,
          error: publishData.error.message || '발행 실패',
          details: publishData.error
        }, { status: 400 })
      }

      if (!publishData.id) {
        console.error('Publish succeeded but no media ID returned (story):', publishData)
        return NextResponse.json({
          success: false,
          error: '발행 후 미디어 ID를 받지 못했습니다',
          details: publishData
        }, { status: 400 })
      }

      mediaId = publishData.id

    } else {
      // 피드 발행 (단일 이미지 또는 캐러셀)
      if (uploadedUrls.length === 1) {
        // 단일 이미지
        const containerResponse = await fetch(
          `https://graph.instagram.com/v24.0/${igUserId}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_url: uploadedUrls[0],
              caption: caption,
              access_token: accessToken
            })
          }
        )
        const containerData = await containerResponse.json()

        console.log('Container API response (feed):', JSON.stringify(containerData))

        if (containerData.error) {
          console.error('Container creation error:', containerData.error)
          return NextResponse.json({
            success: false,
            error: containerData.error.message || '미디어 컨테이너 생성 실패',
            details: containerData.error
          }, { status: 400 })
        }

        if (!containerData.id) {
          console.error('Container created but no ID returned:', containerData)
          return NextResponse.json({
            success: false,
            error: '컨테이너 생성 후 ID를 받지 못했습니다',
            details: containerData
          }, { status: 400 })
        }

        // 발행
        const publishResponse = await fetch(
          `https://graph.instagram.com/v24.0/${igUserId}/media_publish`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: containerData.id,
              access_token: accessToken
            })
          }
        )
        const publishData = await publishResponse.json()

        console.log('Publish API response (feed):', JSON.stringify(publishData))

        if (publishData.error) {
          console.error('Publish error:', publishData.error)
          return NextResponse.json({
            success: false,
            error: publishData.error.message || '발행 실패',
            details: publishData.error
          }, { status: 400 })
        }

        if (!publishData.id) {
          console.error('Publish succeeded but no media ID returned:', publishData)
          return NextResponse.json({
            success: false,
            error: '발행 후 미디어 ID를 받지 못했습니다',
            details: publishData
          }, { status: 400 })
        }

        mediaId = publishData.id

      } else {
        // 캐러셀 (여러 이미지)
        const childIds: string[] = []

        // 각 이미지에 대해 자식 컨테이너 생성
        for (const url of uploadedUrls) {
          const childResponse = await fetch(
            `https://graph.instagram.com/v24.0/${igUserId}/media`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                image_url: url,
                is_carousel_item: true,
                access_token: accessToken
              })
            }
          )
          const childData = await childResponse.json()

          if (childData.error) {
            console.error('Child container error:', childData.error)
            return NextResponse.json({
              success: false,
              error: childData.error.message || '캐러셀 아이템 생성 실패'
            }, { status: 400 })
          }

          childIds.push(childData.id)
        }

        // 캐러셀 컨테이너 생성
        const carouselResponse = await fetch(
          `https://graph.instagram.com/v24.0/${igUserId}/media`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              media_type: 'CAROUSEL',
              caption: caption,
              children: childIds,
              access_token: accessToken
            })
          }
        )
        const carouselData = await carouselResponse.json()

        if (carouselData.error) {
          console.error('Carousel container error:', carouselData.error)
          return NextResponse.json({
            success: false,
            error: carouselData.error.message || '캐러셀 컨테이너 생성 실패'
          }, { status: 400 })
        }

        // 발행
        const publishResponse = await fetch(
          `https://graph.instagram.com/v24.0/${igUserId}/media_publish`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: carouselData.id,
              access_token: accessToken
            })
          }
        )
        const publishData = await publishResponse.json()

        if (publishData.error) {
          console.error('Publish error:', publishData.error)
          return NextResponse.json({
            success: false,
            error: publishData.error.message || '발행 실패'
          }, { status: 400 })
        }

        mediaId = publishData.id
      }
    }

    // 3. 발행된 미디어 정보 가져오기
    try {
      const mediaInfoResponse = await fetch(
        `https://graph.instagram.com/v24.0/${mediaId}?fields=id,permalink,timestamp&access_token=${accessToken}`
      )
      const mediaInfo = await mediaInfoResponse.json()
      permalink = mediaInfo.permalink || ''
    } catch {
      // permalink 가져오기 실패해도 발행은 성공
    }

    // 4. 발행 완료 후 R2에서 파일 삭제
    try {
      for (const key of uploadedKeys) {
        await r2Client.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: key,
        }))
      }
      console.log(`Deleted ${uploadedKeys.length} files from R2 after successful publish`)
    } catch (deleteError) {
      // 삭제 실패해도 발행은 성공이므로 에러만 로깅
      console.error('Failed to delete files from R2:', deleteError)
    }

    return NextResponse.json({
      success: true,
      mediaId,
      permalink,
      message: '발행이 완료되었습니다!'
    })

  } catch (error) {
    console.error('Instagram publish error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '발행 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}
