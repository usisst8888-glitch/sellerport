/**
 * Cloudflare R2 이미지 업로드 API
 * POST: 이미지 업로드
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// Cloudflare R2 클라이언트 설정
const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'sellerport'
const PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || ''

// 허용된 이미지 타입
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'store-customization'

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    // 파일 타입 검증
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: '허용되지 않는 파일 형식입니다. (JPG, PNG, GIF, WEBP만 가능)'
      }, { status: 400 })
    }

    // 파일 크기 검증
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        error: '파일 크기는 5MB 이하여야 합니다.'
      }, { status: 400 })
    }

    // 파일명 생성 (유저ID/폴더/타임스탬프_랜덤)
    const ext = file.name.split('.').pop() || 'jpg'
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const key = `${user.id}/${folder}/${timestamp}_${randomStr}.${ext}`

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // R2에 업로드
    await R2.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }))

    // 공개 URL 생성
    const publicUrl = `${PUBLIC_URL}/${key}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
      key: key
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      error: '업로드 중 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
