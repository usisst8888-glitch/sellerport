/**
 * 플랫폼 수수료 설정 API
 * GET /api/profit/platforms - 모든 플랫폼의 수수료 구조 반환
 * GET /api/profit/platforms?platform=naver - 특정 플랫폼의 수수료 구조 반환
 *
 * 프론트엔드의 PLATFORM_FEE_CONFIG와 동기화된 데이터를 제공합니다.
 */

import { NextRequest, NextResponse } from 'next/server'

interface CategoryConfig {
  id: string
  name: string
  fee: number
}

interface ChannelConfig {
  id: string
  name: string
  baseFee: number
  paymentFee: number
  categories?: CategoryConfig[]
}

interface PlatformConfig {
  id: string
  name: string
  channels?: ChannelConfig[]
  baseFee?: number
  paymentFee?: number
  description?: string
}

// 플랫폼별 수수료 구조 (프론트엔드와 동기화)
export const PLATFORM_FEE_CONFIG: Record<string, PlatformConfig> = {
  naver: {
    id: 'naver',
    name: '네이버 스마트스토어',
    description: '채널별, 카테고리별 차등 수수료',
    channels: [
      {
        id: 'smartstore',
        name: '스마트스토어',
        baseFee: 0,
        paymentFee: 3.63,
        categories: [
          { id: 'fashion', name: '패션의류', fee: 5.63 },
          { id: 'fashion_acc', name: '패션잡화', fee: 5.63 },
          { id: 'beauty', name: '화장품/미용', fee: 5.63 },
          { id: 'digital', name: '디지털/가전', fee: 4.63 },
          { id: 'furniture', name: '가구/인테리어', fee: 5.63 },
          { id: 'food', name: '식품', fee: 5.63 },
          { id: 'baby', name: '출산/유아동', fee: 5.63 },
          { id: 'sports', name: '스포츠/레저', fee: 5.63 },
          { id: 'life', name: '생활/건강', fee: 4.63 },
          { id: 'default', name: '기타', fee: 4.63 },
        ]
      },
      {
        id: 'brandstore',
        name: '브랜드스토어',
        baseFee: 2,
        paymentFee: 3.63,
      },
      {
        id: 'window',
        name: '쇼핑윈도',
        baseFee: 6,
        paymentFee: 3.63,
      }
    ]
  },
  coupang: {
    id: 'coupang',
    name: '쿠팡',
    description: '카테고리별 차등 수수료',
    channels: [
      {
        id: 'marketplace',
        name: '마켓플레이스',
        baseFee: 10.8,
        paymentFee: 0,
        categories: [
          { id: 'fashion', name: '패션의류/잡화', fee: 10.8 },
          { id: 'beauty', name: '뷰티', fee: 10.8 },
          { id: 'food', name: '식품', fee: 10.8 },
          { id: 'baby', name: '출산/유아동', fee: 10.8 },
          { id: 'home', name: '홈/리빙', fee: 10.8 },
          { id: 'digital', name: '가전디지털', fee: 7.8 },
          { id: 'sports', name: '스포츠/레저', fee: 10.8 },
          { id: 'book', name: '도서/음반', fee: 6.0 },
          { id: 'default', name: '기타', fee: 10.8 },
        ]
      },
      {
        id: 'rocket',
        name: '로켓그로스',
        baseFee: 10.8,
        paymentFee: 3,
      }
    ]
  },
  cafe24: {
    id: 'cafe24',
    name: '카페24 (자사몰)',
    description: '자사몰 - PG 수수료만',
    baseFee: 0,
    paymentFee: 3.3,
  },
  imweb: {
    id: 'imweb',
    name: '아임웹 (자사몰)',
    description: '자사몰 - PG 수수료만',
    baseFee: 0,
    paymentFee: 3.3,
  },
  godomall: {
    id: 'godomall',
    name: '고도몰 (자사몰)',
    description: '자사몰 - PG 수수료만',
    baseFee: 0,
    paymentFee: 3.3,
  },
  makeshop: {
    id: 'makeshop',
    name: '메이크샵 (자사몰)',
    description: '자사몰 - PG 수수료만',
    baseFee: 0,
    paymentFee: 3.3,
  },
  etc: {
    id: 'etc',
    name: '기타',
    description: '기본 PG 수수료',
    baseFee: 0,
    paymentFee: 3.3,
  }
}

/**
 * 수수료 계산 유틸리티 함수
 */
export function calculatePlatformFee(
  platform: string,
  channel: string | null,
  category: string | null,
  price: number,
  customFeeRate?: number
): {
  totalFee: number
  feeRate: number
  breakdown: string
  details: {
    platform: string
    channel?: string
    category?: string
    baseFee?: number
    paymentFee?: number
  }
} {
  // 사용자 지정 수수료율이 있으면 우선 적용
  if (customFeeRate !== undefined && customFeeRate >= 0) {
    const totalFee = Math.round(price * (customFeeRate / 100))
    return {
      totalFee,
      feeRate: customFeeRate,
      breakdown: `직접 입력 ${customFeeRate}%`,
      details: { platform, channel: channel || undefined, category: category || undefined }
    }
  }

  const config = PLATFORM_FEE_CONFIG[platform]
  if (!config) {
    const defaultFee = 3.3
    return {
      totalFee: Math.round(price * (defaultFee / 100)),
      feeRate: defaultFee,
      breakdown: `기타 ${defaultFee}%`,
      details: { platform: 'etc' }
    }
  }

  let feeRate = 0
  let breakdown = ''
  const details: {
    platform: string
    channel?: string
    category?: string
    baseFee?: number
    paymentFee?: number
  } = { platform }

  if (config.channels && channel) {
    const channelConfig = config.channels.find(c => c.id === channel)
    if (channelConfig) {
      details.channel = channel

      if (channelConfig.categories && category) {
        const categoryConfig = channelConfig.categories.find(c => c.id === category)
        if (categoryConfig) {
          feeRate = categoryConfig.fee
          breakdown = `${channelConfig.name} ${categoryConfig.name} ${feeRate}%`
          details.category = category
        } else {
          const defaultCategory = channelConfig.categories.find(c => c.id === 'default')
          feeRate = defaultCategory?.fee || (channelConfig.baseFee + channelConfig.paymentFee)
          breakdown = `${channelConfig.name} ${feeRate}%`
        }
      } else {
        // 채널에 카테고리가 없는 경우
        feeRate = Math.round((channelConfig.baseFee + channelConfig.paymentFee) * 100) / 100
        details.baseFee = channelConfig.baseFee
        details.paymentFee = channelConfig.paymentFee
        breakdown = channelConfig.paymentFee > 0
          ? `${channelConfig.name} (판매 ${channelConfig.baseFee}% + 결제 ${channelConfig.paymentFee}%) = ${feeRate}%`
          : `${channelConfig.name} ${feeRate}%`
      }
    }
  } else {
    // 채널이 없는 플랫폼 (자사몰 등)
    feeRate = Math.round(((config.baseFee || 0) + (config.paymentFee || 0)) * 100) / 100
    details.baseFee = config.baseFee
    details.paymentFee = config.paymentFee
    breakdown = config.paymentFee && config.paymentFee > 0
      ? `PG수수료 ${config.paymentFee}%`
      : `${feeRate}%`
  }

  const totalFee = Math.round(price * (feeRate / 100))
  return {
    totalFee,
    feeRate: Math.round(feeRate * 100) / 100,
    breakdown,
    details
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('platform')

    // 특정 플랫폼 정보 요청
    if (platformId) {
      const config = PLATFORM_FEE_CONFIG[platformId]
      if (!config) {
        return NextResponse.json({
          success: false,
          error: '존재하지 않는 플랫폼입니다'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: config
      })
    }

    // 모든 플랫폼 목록 반환
    const platforms = Object.values(PLATFORM_FEE_CONFIG)

    return NextResponse.json({
      success: true,
      data: {
        platforms,
        summary: {
          total: platforms.length,
          withChannels: platforms.filter(p => p.channels).length,
          selfHosted: platforms.filter(p => !p.channels && p.baseFee === 0).length
        }
      }
    })

  } catch (error) {
    console.error('Get platforms error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다'
    }, { status: 500 })
  }
}
