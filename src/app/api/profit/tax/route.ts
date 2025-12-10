/**
 * 세금 계산 API
 * POST /api/profit/tax - 부가세/종소세 계산
 *
 * 부가세 (간이과세자 vs 일반과세자)
 * - 간이과세자: 매출 × 업종별 부가가치율 × 10%
 * - 일반과세자: 매출세액 - 매입세액
 *
 * 종합소득세 (과세표준별 세율)
 * - 1,400만원 이하: 6%
 * - 5,000만원 이하: 15% - 126만원
 * - 8,800만원 이하: 24% - 576만원
 * - 1.5억 이하: 35% - 1,544만원
 * - 3억 이하: 38% - 1,994만원
 * - 5억 이하: 40% - 2,594만원
 * - 10억 이하: 42% - 3,594만원
 * - 10억 초과: 45% - 6,594만원
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface TaxCalculateRequest {
  // 매출/비용 정보
  revenue: number           // 총 매출 (연간)
  expense: number           // 총 비용 (연간)
  purchaseAmount?: number   // 매입액 (부가세 계산용)

  // 사업자 정보
  taxType: 'simple' | 'general'  // 간이과세자 / 일반과세자
  businessType?: string          // 업종 (간이과세자용)

  // 기타 소득
  otherIncome?: number      // 기타 소득 (근로소득 등)

  // 공제 항목
  deductions?: {
    insurance?: number      // 보험료 공제
    pension?: number        // 연금 공제
    medical?: number        // 의료비 공제
    education?: number      // 교육비 공제
    donation?: number       // 기부금 공제
    other?: number          // 기타 공제
  }
}

// 간이과세자 업종별 부가가치율 (%)
const SIMPLE_TAX_RATES: Record<string, number> = {
  'retail': 15,              // 소매업
  'manufacturing': 20,       // 제조업
  'agriculture': 10,         // 농업, 수산업
  'service': 30,             // 서비스업
  'food': 40,                // 음식점업
  'construction': 30,        // 건설업
  'realestate': 40,          // 부동산업
  'etc': 30                  // 기타 (기본값)
}

// 종합소득세 세율 구간
const INCOME_TAX_BRACKETS = [
  { limit: 14000000, rate: 6, deduction: 0 },
  { limit: 50000000, rate: 15, deduction: 1260000 },
  { limit: 88000000, rate: 24, deduction: 5760000 },
  { limit: 150000000, rate: 35, deduction: 15440000 },
  { limit: 300000000, rate: 38, deduction: 19940000 },
  { limit: 500000000, rate: 40, deduction: 25940000 },
  { limit: 1000000000, rate: 42, deduction: 35940000 },
  { limit: Infinity, rate: 45, deduction: 65940000 }
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인 (선택적)
    const { data: { user } } = await supabase.auth.getUser()

    const body: TaxCalculateRequest = await request.json()

    const {
      revenue,
      expense,
      purchaseAmount = 0,
      taxType,
      businessType = 'retail',
      otherIncome = 0,
      deductions = {}
    } = body

    if (!revenue || !taxType) {
      return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
    }

    // =====================
    // 1. 부가세 계산
    // =====================
    let vat = 0
    let vatDetails: Record<string, number> = {}

    if (taxType === 'simple') {
      // 간이과세자
      const valueAddedRate = SIMPLE_TAX_RATES[businessType] || SIMPLE_TAX_RATES['etc']
      vat = Math.round(revenue * (valueAddedRate / 100) * 0.1)
      vatDetails = {
        type: 0, // 간이
        revenue,
        valueAddedRate,
        vat
      }
    } else {
      // 일반과세자
      const outputTax = Math.round(revenue / 11)  // 매출세액 (매출의 1/11)
      const inputTax = Math.round(purchaseAmount / 11)  // 매입세액
      vat = Math.max(0, outputTax - inputTax)
      vatDetails = {
        type: 1, // 일반
        revenue,
        outputTax,
        purchaseAmount,
        inputTax,
        vat
      }
    }

    // 분기별 부가세 (연간을 4로 나눔)
    const quarterlyVat = Math.round(vat / 4)

    // =====================
    // 2. 종합소득세 계산
    // =====================

    // 사업소득 = 매출 - 비용
    const businessIncome = revenue - expense

    // 총 소득 = 사업소득 + 기타소득
    const totalIncome = businessIncome + otherIncome

    // 총 공제액
    const totalDeductions = Object.values(deductions).reduce((sum, val) => sum + (val || 0), 0)

    // 과세표준 = 총 소득 - 공제액
    const taxableIncome = Math.max(0, totalIncome - totalDeductions)

    // 세율 구간 찾기
    const bracket = INCOME_TAX_BRACKETS.find(b => taxableIncome <= b.limit)!

    // 산출세액 = 과세표준 × 세율 - 누진공제
    const calculatedTax = Math.round(taxableIncome * (bracket.rate / 100) - bracket.deduction)

    // 지방소득세 (종소세의 10%)
    const localTax = Math.round(calculatedTax * 0.1)

    // 총 소득세
    const totalIncomeTax = calculatedTax + localTax

    // =====================
    // 결과 정리
    // =====================
    const result = {
      // 입력값 요약
      input: {
        revenue,
        expense,
        taxType,
        businessType,
        otherIncome,
        totalDeductions
      },

      // 부가세
      vat: {
        annual: vat,
        quarterly: quarterlyVat,
        details: vatDetails,
        note: taxType === 'simple'
          ? '간이과세자는 연 1회 (다음해 1월) 신고'
          : '일반과세자는 연 2회 (1월, 7월) 신고'
      },

      // 종합소득세
      incomeTax: {
        businessIncome,
        totalIncome,
        taxableIncome,
        taxRate: bracket.rate,
        calculatedTax,
        localTax,
        totalTax: totalIncomeTax,
        effectiveRate: totalIncome > 0
          ? Math.round((totalIncomeTax / totalIncome) * 100 * 100) / 100
          : 0,
        note: '매년 5월 종합소득세 신고'
      },

      // 총 세금
      summary: {
        annualVat: vat,
        annualIncomeTax: totalIncomeTax,
        totalAnnualTax: vat + totalIncomeTax,
        monthlyTaxReserve: Math.round((vat + totalIncomeTax) / 12),
        afterTaxIncome: businessIncome - vat - totalIncomeTax
      }
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Tax calculate error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
