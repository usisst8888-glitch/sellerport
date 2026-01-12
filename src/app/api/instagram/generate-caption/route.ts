/**
 * Instagram 캡션 생성 API
 * - Claude API를 사용하여 이미지/동영상 썸네일을 분석하고 캡션과 해시태그 생성
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const contentType = formData.get('contentType') as string || 'feed'
    const additionalPrompt = formData.get('additionalPrompt') as string || ''

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다' }, { status: 400 })
    }

    // 파일을 base64로 변환
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')

    // 미디어 타입 결정
    let mediaType: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' = 'image/jpeg'
    if (file.type === 'image/png') {
      mediaType = 'image/png'
    } else if (file.type === 'image/gif') {
      mediaType = 'image/gif'
    } else if (file.type === 'image/webp') {
      mediaType = 'image/webp'
    }

    // 동영상인 경우 에러 (현재는 이미지만 지원)
    if (file.type.startsWith('video/')) {
      return NextResponse.json({
        error: '동영상은 현재 지원되지 않습니다. 대표 이미지를 업로드해주세요.'
      }, { status: 400 })
    }

    // Claude API 호출
    const anthropic = new Anthropic()

    const contentTypeKorean = contentType === 'feed' ? '피드' : contentType === 'reels' ? '릴스' : '스토리'

    const systemPrompt = `당신은 인스타그램 마케팅 전문가입니다.
이미지를 분석하여 해당 콘텐츠에 적합한 인스타그램 캡션과 해시태그를 작성해주세요.

규칙:
1. 캡션은 한국어로 작성하고, 자연스럽고 친근한 톤으로 작성해주세요.
2. 이모지를 적절히 사용하여 시각적으로 매력적으로 만들어주세요.
3. 해시태그는 10-15개 정도로 작성하고, 관련성 높은 것부터 나열해주세요.
4. 한국에서 인기 있는 해시태그를 우선적으로 사용해주세요.
5. 콘텐츠 유형(${contentTypeKorean})에 맞게 작성해주세요.
6. 캡션과 해시태그 사이에는 빈 줄 2개를 넣어주세요.

응답 형식:
캡션 내용

해시태그들`

    const userPrompt = additionalPrompt
      ? `이 이미지에 대한 인스타그램 ${contentTypeKorean} 캡션과 해시태그를 작성해주세요.\n\n추가 요청사항: ${additionalPrompt}`
      : `이 이미지에 대한 인스타그램 ${contentTypeKorean} 캡션과 해시태그를 작성해주세요.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
      system: systemPrompt,
    })

    // 텍스트 응답 추출
    const textContent = response.content.find(c => c.type === 'text')
    const caption = textContent?.type === 'text' ? textContent.text : ''

    return NextResponse.json({
      success: true,
      caption,
    })

  } catch (error) {
    console.error('Caption generation error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '캡션 생성 중 오류가 발생했습니다'
    }, { status: 500 })
  }
}
