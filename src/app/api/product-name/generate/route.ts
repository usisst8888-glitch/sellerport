/**
 * 상품명 생성 API
 * POST /api/product-name/generate
 *
 * Gemini API를 사용하여 SEO 최적화된 상품명을 생성합니다.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface GeneratedProductName {
  name: string
  charCount: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { platform, keyword, productNames } = await request.json()

    if (!platform || !keyword || !productNames || productNames.length === 0) {
      return NextResponse.json({
        error: '플랫폼, 키워드, 상품명 리스트가 필요합니다'
      }, { status: 400 })
    }

    // Gemini API 호출
    const generatedNames = await generateProductNamesWithGemini(
      platform,
      keyword,
      productNames
    )

    return NextResponse.json({
      success: true,
      data: {
        platform,
        keyword,
        generatedNames
      }
    })

  } catch (error) {
    console.error('Product name generation error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

/**
 * Gemini API를 사용하여 상품명 생성
 */
async function generateProductNamesWithGemini(
  platform: string,
  keyword: string,
  productNames: string[]
): Promise<GeneratedProductName[]> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error('Gemini API key not configured')
    // API 키가 없으면 기본 상품명 생성 로직 사용
    return generateFallbackNames(keyword, productNames)
  }

  const platformName = platform === 'naver' ? '네이버 스마트스토어' : '쿠팡'

  const prompt = `당신은 ${platformName} 상품명 전문가입니다.

다음은 "${keyword}" 키워드로 검색된 경쟁 상품명들입니다:
${productNames.slice(0, 10).map((name, i) => `${i + 1}. ${name}`).join('\n')}

위 상품명들을 분석하여 다음 조건에 맞는 SEO 최적화된 상품명 5개를 생성해주세요:

조건:
1. 반드시 100자 이내로 작성
2. 핵심 키워드를 앞쪽에 배치
3. ${platformName} 검색 알고리즘에 최적화
4. 구매 전환율을 높이는 매력적인 문구 포함
5. 불필요한 특수문자 사용 지양
6. 각 상품명은 고유해야 함

응답 형식:
각 상품명을 새 줄로 구분하여 5개만 작성해주세요. 번호나 설명 없이 상품명만 작성합니다.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return generateFallbackNames(keyword, productNames)
    }

    const data = await response.json()

    // Gemini 응답에서 텍스트 추출
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    // 줄바꿈으로 분리하여 상품명 추출
    const names = generatedText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && line.length <= 100)
      .slice(0, 5)

    if (names.length === 0) {
      return generateFallbackNames(keyword, productNames)
    }

    return names.map((name: string) => ({
      name,
      charCount: name.length
    }))

  } catch (error) {
    console.error('Gemini API call error:', error)
    return generateFallbackNames(keyword, productNames)
  }
}

/**
 * Gemini API가 없을 때 사용하는 대체 상품명 생성 로직
 */
function generateFallbackNames(
  keyword: string,
  productNames: string[]
): GeneratedProductName[] {
  // 키워드 분석
  const keywords = extractKeywords(productNames)

  // 상위 키워드 조합으로 상품명 생성
  const templates = [
    `${keyword} ${keywords[0] || ''} ${keywords[1] || ''} 인기상품 베스트`,
    `[특가] ${keyword} ${keywords[0] || ''} 프리미엄 품질 보장`,
    `${keywords[0] || keyword} ${keyword} ${keywords[1] || ''} 당일발송`,
    `${keyword} ${keywords[0] || ''} 고급형 ${keywords[2] || ''} 추천`,
    `베스트셀러 ${keyword} ${keywords[0] || ''} ${keywords[1] || ''} 할인`,
  ]

  return templates.map(name => {
    const trimmedName = name.trim().substring(0, 100)
    return {
      name: trimmedName,
      charCount: trimmedName.length
    }
  })
}

/**
 * 상품명에서 키워드 추출
 */
function extractKeywords(productNames: string[]): string[] {
  const wordCount: Record<string, number> = {}

  // 불용어
  const stopWords = new Set([
    '무료배송', '당일발송', '특가', '할인', '인기', '베스트',
    '추천', '고급', '프리미엄', '정품', '최저가', '핫딜',
    'NEW', 'BEST', 'HOT', '사은품', '증정', '세트',
    '개', '팩', '장', '매', '묶음', '박스', '봉'
  ])

  for (const name of productNames) {
    // 특수문자 제거 및 공백으로 분리
    const words = name
      .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2 && !stopWords.has(word))

    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1
    }
  }

  // 빈도순 정렬
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}
