/**
 * 마진/수익 계산 API
 * POST /api/profit/calculate - 마진 계산
 *
 * 계산 공식:
 * 매출 = 판매가 × 수량
 * 원가 = 상품원가 × 수량
 * 플랫폼 수수료 = 매출 × 수수료율
 * 배송비 = (배송비 지출 - 배송비 수입)
 * 광고비 = 총 광고비
 * 순이익 = 매출 - 원가 - 플랫폼 수수료 - 배송비 - 광고비
 * 마진율 = (순이익 / 매출) × 100
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 플랫폼별 수수료율 (%)
const PLATFORM_FEE_RATES: Record<string, number> = {
  naver: 2.73,       // 네이버 스마트스토어 (마케팅링크 기준)
  coupang: 10.8,     // 쿠팡 로켓그로스 평균
  gmarket: 12.0,     // 지마켓
  auction: 12.0,     // 옥션
  '11st': 13.0,      // 11번가
  cafe24: 0,         // 자사몰 (수수료 없음)
  imweb: 0,          // 자사몰 (수수료 없음)
  etc: 5.0           // 기타 (기본값)
}

interface CalculateRequest {
  // 매출 정보
  salePrice: number        // 판매가
  quantity: number         // 수량

  // 원가 정보
  productCost: number      // 상품 원가
  shippingCost?: number    // 배송비 지출 (발송 비용)
  shippingIncome?: number  // 배송비 수입 (고객이 낸 배송비)

  // 수수료
  platform?: string        // 플랫폼 (자동 수수료 계산)
  customFeeRate?: number   // 직접 입력한 수수료율 (%)

  // 광고비
  adCost?: number          // 광고비

  // 기타 비용
  packagingCost?: number   // 포장비
  otherCost?: number       // 기타 비용
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인 (선택적 - 비로그인도 계산 가능)
    const { data: { user } } = await supabase.auth.getUser()

    const body: CalculateRequest = await request.json()

    const {
      salePrice,
      quantity,
      productCost,
      shippingCost = 0,
      shippingIncome = 0,
      platform = 'etc',
      customFeeRate,
      adCost = 0,
      packagingCost = 0,
      otherCost = 0
    } = body

    if (!salePrice || !quantity || productCost === undefined) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
    }

    // 수수료율 결정 (직접 입력 우선)
    const feeRate = customFeeRate !== undefined
      ? customFeeRate
      : (PLATFORM_FEE_RATES[platform] || PLATFORM_FEE_RATES['etc'])

    // 계산
    const revenue = salePrice * quantity                           // 매출
    const totalCost = productCost * quantity                       // 총 원가
    const platformFee = Math.round(revenue * (feeRate / 100))      // 플랫폼 수수료
    const netShipping = shippingCost - shippingIncome              // 순 배송비 (지출 - 수입)
    const totalPackaging = packagingCost * quantity                // 총 포장비

    // 총 비용
    const totalExpense = totalCost + platformFee + netShipping + adCost + totalPackaging + otherCost

    // 순이익
    const profit = revenue - totalExpense

    // 마진율
    const marginRate = revenue > 0 ? Math.round((profit / revenue) * 100 * 100) / 100 : 0

    // ROAS (광고비 대비 매출)
    const roas = adCost > 0 ? Math.round((revenue / adCost) * 100) : 0

    // 손익분기점 (BEP) - 몇 개 팔아야 본전인가
    const profitPerUnit = (salePrice - productCost - (salePrice * feeRate / 100) - (packagingCost || 0))
    const bepQuantity = profitPerUnit > 0 ? Math.ceil((adCost + otherCost) / profitPerUnit) : 0

    // 결과
    const result = {
      // 입력값 요약
      input: {
        salePrice,
        quantity,
        productCost,
        platform,
        feeRate
      },

      // 상세 계산
      breakdown: {
        revenue,                    // 총 매출
        totalCost,                  // 총 원가
        platformFee,                // 플랫폼 수수료
        platformFeeRate: feeRate,   // 적용된 수수료율
        shippingCost,               // 배송비 지출
        shippingIncome,             // 배송비 수입
        netShipping,                // 순 배송비
        adCost,                     // 광고비
        packagingCost: totalPackaging, // 총 포장비
        otherCost,                  // 기타 비용
        totalExpense                // 총 비용
      },

      // 결과
      result: {
        profit,                     // 순이익
        marginRate,                 // 마진율 (%)
        profitPerUnit: Math.round(profit / quantity), // 개당 순이익
        roas,                       // ROAS (%)
        bepQuantity                 // 손익분기 수량
      },

      // 판정
      status: {
        isProfitable: profit > 0,
        roasLight: roas >= 300 ? 'green' : roas >= 150 ? 'yellow' : 'red',
        marginStatus: marginRate >= 30 ? 'excellent' : marginRate >= 15 ? 'good' : marginRate >= 0 ? 'low' : 'loss'
      }
    }

    // 로그인 사용자면 계산 기록 저장 (선택적)
    if (user) {
      // 필요시 계산 기록 테이블에 저장 가능
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Profit calculate error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
