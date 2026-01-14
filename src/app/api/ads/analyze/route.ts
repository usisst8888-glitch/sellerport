/**
 * 광고 크리에이티브 분석 API
 * - Instagram: 피드(이미지), 캐러셀(여러 이미지), 릴스(영상)
 * - YouTube: 영상 (yt-dlp로 다운로드)
 *
 * Claude Vision API로 크리에이티브 + 성과 지표 분석
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import Anthropic from '@anthropic-ai/sdk'

const execAsync = promisify(exec)

// Cloudflare R2 클라이언트
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

// Claude 클라이언트
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY,
})

// 요청 타입
interface AnalyzeRequest {
  platform: 'instagram' | 'meta'
  contentType: 'image' | 'carousel' | 'reels'
  // Instagram / Meta 유료 광고
  imageUrls?: string[]  // 피드/캐러셀 이미지 URL들
  videoUrl?: string     // 릴스/영상 광고 URL (Meta API에서 제공)
  // 성과 지표
  metrics: {
    impressions: number
    clicks: number
    ctr: number          // 클릭률 (%)
    conversions: number
    revenue: number      // 매출
    adSpend: number      // 광고비
    roas: number         // ROAS (%)
  }
  // 추가 정보
  campaignName?: string
  postName?: string
  adName?: string       // Meta 광고명
}

// R2에 파일 업로드
async function uploadToR2(buffer: Buffer, key: string, contentType: string): Promise<string> {
  await R2.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }))
  return `${PUBLIC_URL}/${key}`
}

// R2에서 파일 삭제
async function deleteFromR2(key: string): Promise<void> {
  try {
    await R2.send(new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }))
  } catch (error) {
    console.error('R2 delete error:', error)
  }
}

// R2에서 파일 다운로드
async function downloadFromR2(key: string): Promise<Buffer> {
  const response = await R2.send(new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  }))
  const stream = response.Body as NodeJS.ReadableStream
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

// Instagram 릴스 영상 다운로드
async function downloadInstagramVideo(videoUrl: string, outputPath: string): Promise<void> {
  // Meta API에서 제공하는 직접 URL로 다운로드
  const response = await fetch(videoUrl)
  if (!response.ok) {
    throw new Error('Instagram 영상 다운로드 실패')
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(outputPath, buffer)
}

// 영상에서 프레임 추출 (ffmpeg)
async function extractFrames(videoPath: string, outputDir: string, frameCount: number = 5): Promise<string[]> {
  // 영상 길이 확인
  const durationCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
  const { stdout: durationStr } = await execAsync(durationCmd)
  const duration = parseFloat(durationStr.trim())

  // 균등 간격으로 프레임 추출
  const framePaths: string[] = []
  const interval = duration / (frameCount + 1)

  for (let i = 1; i <= frameCount; i++) {
    const timestamp = interval * i
    const outputPath = path.join(outputDir, `frame_${i}.jpg`)
    const command = `ffmpeg -ss ${timestamp} -i "${videoPath}" -vframes 1 -q:v 2 "${outputPath}" -y`

    try {
      await execAsync(command, { timeout: 30000 })
      framePaths.push(outputPath)
    } catch (error) {
      console.error(`Frame extraction error at ${timestamp}s:`, error)
    }
  }

  return framePaths
}

// URL에서 이미지를 base64로 변환
async function urlToBase64(url: string): Promise<{ base64: string; mediaType: string }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`이미지 다운로드 실패: ${url}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  const base64 = buffer.toString('base64')
  const contentType = response.headers.get('content-type') || 'image/jpeg'
  return { base64, mediaType: contentType }
}

// 파일을 base64로 변환
function fileToBase64(filePath: string): { base64: string; mediaType: string } {
  const buffer = fs.readFileSync(filePath)
  const base64 = buffer.toString('base64')
  return { base64, mediaType: 'image/jpeg' }
}

// Claude Vision으로 광고 분석
async function analyzeWithClaude(
  images: Array<{ base64: string; mediaType: string }>,
  metrics: AnalyzeRequest['metrics'],
  platform: string,
  contentType: string,
  additionalInfo: { campaignName?: string; postName?: string }
): Promise<string> {
  const contentBlocks: Anthropic.Messages.ContentBlockParam[] = []

  // 이미지들 추가
  for (const img of images) {
    contentBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: img.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
        data: img.base64,
      },
    })
  }

  // 플랫폼 라벨
  const platformLabel = platform === 'instagram' ? '인스타그램' : 'Meta 유료 광고'
  const contentTypeLabel = contentType === 'carousel' ? '캐러셀' : contentType === 'reels' ? '릴스' : '피드'

  // 분석 프롬프트 추가
  const prompt = `당신은 디지털 마케팅 및 광고 크리에이티브 전문가입니다.
${platformLabel} ${contentTypeLabel} 광고를 분석해주세요.

## 광고 정보
- 플랫폼: ${platformLabel}
- 형식: ${contentType === 'carousel' ? '캐러셀 (여러 이미지)' : contentType === 'reels' ? '릴스 (숏폼 영상)' : '피드 (단일 이미지)'}
${additionalInfo.campaignName ? `- 캠페인명: ${additionalInfo.campaignName}` : ''}
${additionalInfo.postName ? `- 게시물명/광고명: ${additionalInfo.postName}` : ''}

## 현재 성과 지표
- 노출수: ${metrics.impressions.toLocaleString()}회
- 클릭수: ${metrics.clicks.toLocaleString()}회
- 클릭률(CTR): ${metrics.ctr.toFixed(2)}%
- 전환수: ${metrics.conversions}건
- 매출: ${metrics.revenue.toLocaleString()}원
- 광고비: ${metrics.adSpend.toLocaleString()}원
- ROAS: ${metrics.roas.toFixed(0)}%

## 분석 요청
위 이미지${images.length > 1 ? '들' : ''}은 광고 크리에이티브${contentType === 'reels' || contentType === 'reels' ? '의 주요 장면들' : ''}입니다.

다음 항목들을 분석해주세요:

### 1. 크리에이티브 분석
- 시각적 요소 (색상, 구도, 이미지 품질)
- 텍스트/카피 (가독성, 메시지 전달력)
- 브랜딩 요소
- 후킹 포인트 (관심을 끄는 요소)
${contentType === 'reels' || contentType === 'reels' ? '- 영상 흐름 (도입-전개-마무리)' : ''}
${contentType === 'carousel' ? '- 캐러셀 스토리텔링 (이미지 간 연결성)' : ''}

### 2. 성과 진단
- CTR ${metrics.ctr >= 2 ? '좋음' : metrics.ctr >= 1 ? '보통' : '낮음'}: 원인 분석
- ROAS ${metrics.roas >= 300 ? '좋음' : metrics.roas >= 150 ? '보통' : '낮음'}: 원인 분석
- 전환 퍼널 이슈 추정

### 3. 개선 제안 (우선순위별)
- 즉시 적용 가능한 개선점 (1-2개)
- 중기적 개선 방향 (1-2개)
- A/B 테스트 제안 (1개)

### 4. 예상 효과
개선 적용 시 예상되는 지표 변화

간결하고 실행 가능한 조언을 해주세요. 마크다운 형식으로 작성해주세요.`

  contentBlocks.push({
    type: 'text',
    text: prompt,
  })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: contentBlocks,
      },
    ],
  })

  const textBlock = response.content.find(block => block.type === 'text')
  return textBlock ? textBlock.text : '분석 결과를 생성하지 못했습니다.'
}

export async function POST(request: NextRequest) {
  const r2KeysToDelete: string[] = []
  const localFilesToDelete: string[] = []

  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    const body: AnalyzeRequest = await request.json()
    const { platform, contentType, imageUrls, videoUrl, metrics, campaignName, postName } = body

    // 분석할 이미지들
    const imagesToAnalyze: Array<{ base64: string; mediaType: string }> = []

    // === Instagram 처리 ===
    if (platform === 'instagram') {
      if (contentType === 'image' || contentType === 'carousel') {
        // 피드/캐러셀: 이미지 URL을 base64로 변환
        if (!imageUrls || imageUrls.length === 0) {
          return NextResponse.json({ error: '이미지 URL이 필요합니다.' }, { status: 400 })
        }

        for (const url of imageUrls) {
          const { base64, mediaType } = await urlToBase64(url)
          imagesToAnalyze.push({ base64, mediaType })
        }
      } else if (contentType === 'reels') {
        // 릴스: 영상 다운로드 → 프레임 추출
        if (!videoUrl) {
          return NextResponse.json({ error: '영상 URL이 필요합니다.' }, { status: 400 })
        }

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-analyze-'))
        const videoPath = path.join(tempDir, 'video.mp4')
        localFilesToDelete.push(tempDir)

        // Instagram 영상 다운로드
        await downloadInstagramVideo(videoUrl, videoPath)
        localFilesToDelete.push(videoPath)

        // 프레임 추출
        const framePaths = await extractFrames(videoPath, tempDir, 5)
        localFilesToDelete.push(...framePaths)

        // 프레임을 base64로 변환
        for (const framePath of framePaths) {
          const { base64, mediaType } = fileToBase64(framePath)
          imagesToAnalyze.push({ base64, mediaType })
        }
      }
    }

    // === Meta 유료 광고 처리 ===
    if (platform === 'meta') {
      if (contentType === 'image' || contentType === 'carousel') {
        // 이미지/캐러셀 광고: 이미지 URL을 base64로 변환
        if (!imageUrls || imageUrls.length === 0) {
          return NextResponse.json({ error: '이미지 URL이 필요합니다.' }, { status: 400 })
        }

        for (const url of imageUrls) {
          const { base64, mediaType } = await urlToBase64(url)
          imagesToAnalyze.push({ base64, mediaType })
        }
      } else if (contentType === 'reels') {
        // 영상 광고: Meta에서 제공하는 source URL로 다운로드 → 프레임 추출
        if (!videoUrl) {
          return NextResponse.json({ error: '영상 URL이 필요합니다.' }, { status: 400 })
        }

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ad-analyze-'))
        const videoPath = path.join(tempDir, 'video.mp4')
        localFilesToDelete.push(tempDir)

        // Meta 영상 다운로드
        await downloadInstagramVideo(videoUrl, videoPath)
        localFilesToDelete.push(videoPath)

        // 프레임 추출
        const framePaths = await extractFrames(videoPath, tempDir, 5)
        localFilesToDelete.push(...framePaths)

        // 프레임을 base64로 변환
        for (const framePath of framePaths) {
          const { base64, mediaType } = fileToBase64(framePath)
          imagesToAnalyze.push({ base64, mediaType })
        }
      }
    }

    // 분석할 이미지가 없으면 에러
    if (imagesToAnalyze.length === 0) {
      return NextResponse.json({ error: '분석할 이미지가 없습니다.' }, { status: 400 })
    }

    // Claude Vision으로 분석
    const analysis = await analyzeWithClaude(
      imagesToAnalyze,
      metrics,
      platform,
      contentType,
      { campaignName, postName }
    )

    return NextResponse.json({
      success: true,
      analysis,
      imageCount: imagesToAnalyze.length,
    })

  } catch (error) {
    console.error('Ad analysis error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '광고 분석 중 오류가 발생했습니다.'
    }, { status: 500 })

  } finally {
    // 정리: R2 파일 삭제
    for (const key of r2KeysToDelete) {
      await deleteFromR2(key)
    }

    // 정리: 로컬 파일 삭제
    for (const filePath of localFilesToDelete) {
      try {
        const stat = fs.statSync(filePath)
        if (stat.isDirectory()) {
          fs.rmSync(filePath, { recursive: true, force: true })
        } else {
          fs.unlinkSync(filePath)
        }
      } catch (e) {
        // 이미 삭제되었거나 없는 파일은 무시
      }
    }
  }
}
