/**
 * OG 이미지 추출 유틸리티
 * URL에서 Open Graph 이미지를 추출
 */

/**
 * URL에서 OG 이미지를 추출
 * 스마트스토어, 일반 쇼핑몰 등에서 상품 썸네일 가져오기
 */
export async function extractOgImage(url: string): Promise<string | null> {
  try {
    // 타임아웃 설정 (3초)
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html',
      },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      console.log('OG image fetch failed:', response.status)
      return null
    }

    const html = await response.text()

    // OG 이미지 추출 (og:image 메타 태그)
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)

    if (ogImageMatch && ogImageMatch[1]) {
      const ogImage = ogImageMatch[1]
      console.log('Extracted OG image:', ogImage)
      return ogImage
    }

    // 네이버 스마트스토어 전용: 상품 이미지 패턴
    if (url.includes('smartstore.naver.com') || url.includes('brand.naver.com')) {
      // 스마트스토어 JSON-LD에서 이미지 추출 시도
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
      if (jsonLdMatch) {
        try {
          const jsonLd = JSON.parse(jsonLdMatch[1])
          if (jsonLd.image) {
            const image = Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image
            console.log('Extracted image from JSON-LD:', image)
            return image
          }
        } catch {
          // JSON 파싱 실패 무시
        }
      }
    }

    // twitter:image 폴백
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)

    if (twitterImageMatch && twitterImageMatch[1]) {
      console.log('Extracted Twitter image:', twitterImageMatch[1])
      return twitterImageMatch[1]
    }

    console.log('No OG image found for:', url)
    return null
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('OG image fetch timeout:', url)
    } else {
      console.error('OG image extraction error:', error)
    }
    return null
  }
}

/**
 * URL이 스마트스토어인지 확인
 */
export function isSmartStoreUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('smartstore.naver.com') ||
           urlObj.hostname.includes('brand.naver.com')
  } catch {
    return false
  }
}
