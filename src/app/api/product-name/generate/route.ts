/**
 * 상품명 생성 API
 * POST /api/product-name/generate
 *
 * OpenAI API를 사용하여 SEO 최적화된 상품명을 생성합니다.
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

    // OpenAI API 호출
    const generatedNames = await generateProductNamesWithOpenAI(
      platform,
      keyword,
      productNames,
      description
    )

    if (generatedNames.length === 0) {
      return NextResponse.json({
        error: '상품명 생성에 실패했습니다. 다시 시도해주세요.'
      }, { status: 500 })
    }

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
 * OpenAI API를 사용하여 상품명 생성
 */
async function generateProductNamesWithOpenAI(
  platform: string,
  keyword: string,
  productNames: string[],
  description?: string
): Promise<GeneratedProductName[]> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.error('OpenAI API key not configured')
    return []
  }

  const platformName = platform === 'naver' ? '네이버 스마트스토어' : '쿠팡'

  // 제품 설명이 있으면 프롬프트에 추가
  const descriptionSection = description
    ? `\n\n내 제품 특징:\n${description}`
    : ''

  const prompt = `당신은 ${platformName} 상품명 작성 전문가입니다.

다음은 "${keyword}" 키워드로 검색된 실제 판매중인 경쟁 상품명들입니다:
${productNames.slice(0, 10).map((name, i) => `${i + 1}. ${name}`).join('\n')}${descriptionSection}

위 경쟁 상품명들의 패턴과 키워드를 분석하여 새로운 상품명 10개를 생성해주세요.

[필수 조건 - 반드시 지켜야 함]
★★★ 각 상품명은 반드시 50자 이상 100자 이하로 작성해야 합니다! ★★★
- 50자 미만인 상품명은 절대 안됩니다
- 글자 수를 세어서 50자가 안 되면 관련 키워드를 더 추가하세요

[작성 지침]
1. "${keyword}"를 상품명 앞쪽에 배치
2. 경쟁 상품명에서 자주 사용되는 제품 속성 키워드를 참고하여 자연스럽게 조합 (소재, 크기, 용도, 색상, 수량, 특징 등)
3. "무료배송", "당일발송", "고객만족", "베스트셀러", "추천상품", "품질보장", "정품인증", "인기상품" 같은 일반적인 마케팅 문구는 절대 사용 금지
4. 실제 제품의 특성을 설명하는 구체적인 단어들로 구성
5. 이모지, 특수문자, 괄호() 절대 사용 금지
6. 각 상품명은 고유해야 함
7. 같은 단어가 연속으로 반복되면 안됨${description ? '\n8. 제품 특징을 자연스럽게 반영' : ''}

[응답 형식]
- 번호 없이 상품명만 작성
- 각 상품명을 새 줄로 구분
- 이모지나 특수기호 절대 포함하지 않기
- 괄호나 설명 추가하지 않기

[예시 - 50자 이상 상품명]
수세미 천연 루파 식물성 열매 주방용 설거지 친환경 생분해 거품풍성 부드러운 소재 다용도 청소용품 세트
위 예시처럼 길게 작성하세요!`

  // 최대 2번 시도
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: '당신은 이커머스 상품명 작성 전문가입니다. 주어진 조건에 맞게 정확하게 상품명을 생성합니다.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8 + (attempt * 0.1),
          max_tokens: 2048,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('OpenAI API error:', errorText)
        continue
      }

      const data = await response.json()

      // OpenAI 응답에서 텍스트 추출
      const generatedText = data.choices?.[0]?.message?.content || ''

      console.log(`OpenAI raw response (attempt ${attempt + 1}):`, generatedText)

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
          // 따옴표 제거
          cleaned = cleaned.replace(/^["']|["']$/g, '').trim()
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
          if (line.length < 50 || line.length > 100) {
            console.log(`Filtered out (length ${line.length}): ${line}`)
            return false
          }
          // 연속 중복 패턴 체크 (붙어있는 경우: 수세미수세미)
          if (/(.{2,})\1/.test(line)) return false
          return true
        })
        .slice(0, 10)

      console.log(`Parsed product names (attempt ${attempt + 1}):`, names, 'count:', names.length)

      // 3개 이상이면 성공으로 간주
      if (names.length >= 3) {
        return names.map((name: string) => ({
          name,
          charCount: name.length
        }))
      }

      console.log(`Not enough valid names (${names.length}), retrying...`)

    } catch (error) {
      console.error(`OpenAI API call error (attempt ${attempt + 1}):`, error)
    }
  }

  return []
}
