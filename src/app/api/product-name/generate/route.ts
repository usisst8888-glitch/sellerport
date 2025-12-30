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

    const { platform, keyword, description, productNames } = await request.json()

    if (!platform || !keyword || !productNames || productNames.length === 0) {
      return NextResponse.json({
        error: '플랫폼, 키워드, 상품명 리스트가 필요합니다'
      }, { status: 400 })
    }

    // Gemini API 호출
    const generatedNames = await generateProductNamesWithGemini(
      platform,
      keyword,
      productNames,
      description
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
  productNames: string[],
  description?: string
): Promise<GeneratedProductName[]> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    console.error('Gemini API key not configured')
    // API 키가 없으면 기본 상품명 생성 로직 사용
    return generateFallbackNames(keyword, productNames)
  }

  const platformName = platform === 'naver' ? '네이버 스마트스토어' : '쿠팡'

  // 제품 설명이 있으면 프롬프트에 추가
  const descriptionSection = description
    ? `\n\n내 제품 특징:\n${description}`
    : ''

  const prompt = `당신은 ${platformName} 상품명 전문가입니다.

다음은 "${keyword}" 키워드로 검색된 경쟁 상품명들입니다:
${productNames.slice(0, 10).map((name, i) => `${i + 1}. ${name}`).join('\n')}${descriptionSection}

위 상품명들을 분석하여 다음 조건에 맞는 SEO 최적화된 상품명 10개를 생성해주세요:

조건:
1. 반드시 50자 이상 100자 이내로 작성
2. 핵심 키워드를 앞쪽에 배치
3. ${platformName} 검색 알고리즘에 최적화
4. 구매 전환율을 높이는 매력적인 문구 포함
5. 이모지, 특수문자, 괄호() 절대 사용 금지
6. 각 상품명은 고유해야 함
7. 순수 텍스트 상품명만 작성
8. 같은 단어가 연속으로 반복되면 안됨${description ? '\n9. 제품 특징을 자연스럽게 반영' : ''}

응답 형식:
- 번호 없이 상품명만 작성
- 각 상품명을 새 줄로 구분
- 이모지나 특수기호 절대 포함하지 않기
- 괄호나 설명 추가하지 않기`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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

    console.log('Gemini raw response:', generatedText)

    // 줄바꿈으로 분리하여 상품명 추출
    const names = generatedText
      .split('\n')
      .map((line: string) => {
        // 번호 제거 (1. 2. 등) - 더 다양한 패턴 지원
        let cleaned = line.replace(/^[\d]+[.\)]\s*/, '').trim()
        // 별표, 하이픈 등 마커 제거
        cleaned = cleaned.replace(/^[-*•]\s*/, '').trim()
        // 이모지 제거 (더 포괄적인 범위)
        cleaned = cleaned.replace(/[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]/gu, '')
        // 괄호와 그 내용 제거
        cleaned = cleaned.replace(/\([^)]*\)/g, '').trim()
        // 대괄호와 그 내용 제거
        cleaned = cleaned.replace(/\[[^\]]*\]/g, '').trim()
        // 중괄호와 그 내용 제거
        cleaned = cleaned.replace(/\{[^}]*\}/g, '').trim()
        // 연속 공백 제거
        cleaned = cleaned.replace(/\s+/g, ' ').trim()
        return cleaned
      })
      .map((line: string) => {
        // 연속 중복 단어 제거 (예: "수세미 수세미" -> "수세미")
        const words = line.split(' ')
        const deduped: string[] = []
        for (const word of words) {
          if (deduped.length === 0 || deduped[deduped.length - 1] !== word) {
            deduped.push(word)
          }
        }
        return deduped.join(' ')
      })
      .filter((line: string) => {
        // 최소 50자 이상, 100자 이하인 유효한 상품명만
        if (line.length < 50 || line.length > 100) return false
        // 연속 중복 패턴 체크 (붙어있는 경우: 수세미수세미)
        if (/(.{2,})\1/.test(line)) return false
        return true
      })
      .slice(0, 10)

    console.log('Parsed product names:', names, 'count:', names.length)

    if (names.length === 0) {
      return generateFallbackNames(keyword, productNames)
    }

    // 10개 미만이면 fallback으로 채우기
    let result = names.map((name: string) => ({
      name,
      charCount: name.length
    }))

    if (result.length < 10) {
      const fallbackNames = generateFallbackNames(keyword, productNames)
      const needed = 10 - result.length
      result = [...result, ...fallbackNames.slice(0, needed)]
    }

    return result

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

  // 상위 키워드 조합으로 상품명 생성 (최소 50자 이상)
  const templates = [
    `${keyword} ${keywords[0] || '프리미엄'} ${keywords[1] || '고급'} 인기상품 베스트셀러 당일발송 무료배송 고객만족 보장 정품`,
    `${keyword} ${keywords[0] || '고급형'} 프리미엄 품질 보장 정품 인증 빠른배송 추천상품 베스트셀러 고객만족`,
    `${keywords[0] || '프리미엄'} ${keyword} ${keywords[1] || '특가'} 당일발송 무료배송 고객만족 보장 정품 인증 추천상품`,
    `${keyword} ${keywords[0] || '고급'} 고급형 ${keywords[2] || '인기'} 추천 베스트 프리미엄 정품 당일출고 무료배송 고객만족`,
    `베스트셀러 ${keyword} ${keywords[0] || '특가'} ${keywords[1] || '할인'} 인기상품 무료배송 당일출고 프리미엄 품질 보장`,
    `${keyword} ${keywords[1] || '프리미엄'} ${keywords[2] || '고급'} 무료배송 빠른배송 고객만족 보장 정품 인증 추천상품 베스트`,
    `${keyword} ${keywords[0] || '인기'} 인기상품 ${keywords[3] || '특가'} 고객만족 정품 빠른배송 추천 프리미엄 당일출고 무료배송`,
    `프리미엄 ${keyword} ${keywords[1] || '고급형'} 정품 인증 당일발송 무료배송 베스트 고객만족 품질보장 추천상품`,
    `${keyword} ${keywords[2] || '특가'} ${keywords[0] || '할인'} 최저가 추천 베스트 인기상품 빠른배송 프리미엄 정품 고객만족`,
    `${keyword} ${keywords[0] || '고급'} ${keywords[1] || '프리미엄'} 베스트 인기상품 당일출고 무료배송 정품 품질보장 고객만족`,
  ]

  return templates.map(name => {
    // 연속 중복 단어 제거
    const words = name.trim().split(' ')
    const deduped: string[] = []
    for (const word of words) {
      if (word && (deduped.length === 0 || deduped[deduped.length - 1] !== word)) {
        deduped.push(word)
      }
    }
    const cleanedName = deduped.join(' ').substring(0, 100)
    return {
      name: cleanedName,
      charCount: cleanedName.length
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
