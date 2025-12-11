/**
 * AI 최적화 추천 시스템
 * ROAS 및 캠페인 성과 데이터를 분석하여 최적화 제안을 생성합니다.
 */

export interface CampaignMetrics {
  roas: number
  ctr: number // 클릭률
  cvr: number // 전환율
  spent: number
  revenue: number
  clicks: number
  impressions: number
  conversions: number
  avgOrderValue: number
}

export interface OptimizationTip {
  type: 'budget' | 'creative' | 'targeting' | 'landing' | 'timing' | 'product'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  expectedImpact: string
  actionItems: string[]
}

// ROAS 기준
const ROAS_THRESHOLDS = {
  EXCELLENT: 500, // 500% 이상: 예산 증액 권장
  GOOD: 300, // 300% 이상: 유지
  WARNING: 150, // 150% 이상: 주의
  CRITICAL: 100, // 100% 미만: 긴급 조치 필요
}

// CTR 기준 (평균 1-2%)
const CTR_THRESHOLDS = {
  GOOD: 2.0,
  AVERAGE: 1.0,
  LOW: 0.5,
}

// CVR 기준 (이커머스 평균 2-3%)
const CVR_THRESHOLDS = {
  GOOD: 3.0,
  AVERAGE: 1.5,
  LOW: 0.5,
}

/**
 * 캠페인 성과 분석 및 최적화 제안 생성
 */
export function generateOptimizationTips(metrics: CampaignMetrics): OptimizationTip[] {
  const tips: OptimizationTip[] = []

  // 1. ROAS 기반 분석
  if (metrics.roas >= ROAS_THRESHOLDS.EXCELLENT) {
    tips.push({
      type: 'budget',
      priority: 'high',
      title: '예산 증액 추천',
      description: `현재 ROAS ${metrics.roas}%로 매우 우수합니다. 예산을 늘려 수익을 극대화하세요.`,
      expectedImpact: '매출 20-50% 증가 가능',
      actionItems: [
        '일일 예산 30-50% 증액',
        '유사 타겟으로 확장',
        '다른 플랫폼에도 동일 소재 테스트'
      ]
    })
  } else if (metrics.roas < ROAS_THRESHOLDS.CRITICAL) {
    tips.push({
      type: 'budget',
      priority: 'high',
      title: '광고 일시 중단 권장',
      description: `ROAS ${metrics.roas}%로 손실이 발생 중입니다. 광고를 중단하고 원인을 분석하세요.`,
      expectedImpact: '추가 손실 방지',
      actionItems: [
        '광고 일시 중단',
        '경쟁사 상세페이지 분석',
        '상품 가격 경쟁력 재검토',
        '신규 소재로 A/B 테스트 재시작'
      ]
    })
  } else if (metrics.roas < ROAS_THRESHOLDS.WARNING) {
    tips.push({
      type: 'budget',
      priority: 'medium',
      title: '예산 조정 필요',
      description: `ROAS ${metrics.roas}%로 개선이 필요합니다. 예산을 줄이고 최적화에 집중하세요.`,
      expectedImpact: 'ROAS 50-100% 개선 가능',
      actionItems: [
        '일일 예산 50% 감소',
        '고효율 시간대에 집중',
        '타겟 범위 조정'
      ]
    })
  }

  // 2. CTR 기반 분석 (광고 소재 문제)
  if (metrics.ctr < CTR_THRESHOLDS.LOW && metrics.impressions > 1000) {
    tips.push({
      type: 'creative',
      priority: 'high',
      title: '광고 소재 개선 시급',
      description: `CTR ${metrics.ctr.toFixed(2)}%로 매우 낮습니다. 광고 소재가 눈에 띄지 않고 있습니다.`,
      expectedImpact: 'CTR 2-3배 증가 가능',
      actionItems: [
        '썸네일 이미지 교체 (밝은 색상, 큰 텍스트)',
        '혜택 강조 (할인율, 무료배송 등)',
        '광고 문구에 긴급성 추가 (오늘만, 한정수량 등)',
        '영상 소재 테스트 권장'
      ]
    })
  } else if (metrics.ctr < CTR_THRESHOLDS.AVERAGE && metrics.impressions > 1000) {
    tips.push({
      type: 'creative',
      priority: 'medium',
      title: '광고 소재 테스트 권장',
      description: `CTR ${metrics.ctr.toFixed(2)}%로 평균 이하입니다. 다양한 소재로 A/B 테스트를 진행하세요.`,
      expectedImpact: 'CTR 30-50% 개선 가능',
      actionItems: [
        '3-5개의 다른 이미지로 테스트',
        '다양한 문구 테스트 (질문형, 숫자 활용 등)',
        '경쟁사 광고 소재 분석'
      ]
    })
  }

  // 3. CVR 기반 분석 (상세페이지/랜딩페이지 문제)
  if (metrics.cvr < CVR_THRESHOLDS.LOW && metrics.clicks > 50) {
    tips.push({
      type: 'landing',
      priority: 'high',
      title: '상세페이지 긴급 개선 필요',
      description: `전환율 ${metrics.cvr.toFixed(2)}%로 매우 낮습니다. 클릭은 있지만 구매로 이어지지 않고 있습니다.`,
      expectedImpact: '전환율 2-5배 증가 가능',
      actionItems: [
        '상세페이지 상단에 핵심 혜택 강조',
        '리뷰/후기 노출 강화',
        '신뢰 요소 추가 (인증마크, 보증정책 등)',
        '모바일 화면 최적화 확인',
        '구매 버튼 위치/색상 점검'
      ]
    })

    // 디자이너 연결 제안
    tips.push({
      type: 'product',
      priority: 'medium',
      title: '전문 디자이너 상담 추천',
      description: '상세페이지 개선이 필요합니다. 셀러포트 인증 디자이너에게 문의해보세요.',
      expectedImpact: '전문가의 상세페이지 개선으로 전환율 50-200% 증가 사례 다수',
      actionItems: [
        '디자이너 연결 페이지에서 견적 문의',
        '현재 상세페이지 문제점 분석 요청',
        '경쟁사 대비 개선 포인트 파악'
      ]
    })
  } else if (metrics.cvr < CVR_THRESHOLDS.AVERAGE && metrics.clicks > 50) {
    tips.push({
      type: 'landing',
      priority: 'medium',
      title: '상세페이지 최적화 권장',
      description: `전환율 ${metrics.cvr.toFixed(2)}%로 개선의 여지가 있습니다.`,
      expectedImpact: '전환율 30-50% 개선 가능',
      actionItems: [
        '상세페이지 A/B 테스트 시작',
        '구매자 후기 상단 배치',
        '비교표/스펙 정보 추가'
      ]
    })
  }

  // 4. 타겟팅 분석
  if (metrics.impressions > 10000 && metrics.clicks < 100 && metrics.ctr > CTR_THRESHOLDS.AVERAGE) {
    tips.push({
      type: 'targeting',
      priority: 'medium',
      title: '타겟팅 정밀화 필요',
      description: '노출은 많지만 관련성 높은 고객에게 도달하지 못하고 있을 수 있습니다.',
      expectedImpact: '광고비 효율 20-40% 개선',
      actionItems: [
        '관심사 타겟팅 세분화',
        '구매이력 기반 맞춤 타겟',
        '제외 타겟 설정 (이미 구매한 고객 등)'
      ]
    })
  }

  // 5. 평균 주문금액 기반 분석
  if (metrics.avgOrderValue > 0 && metrics.conversions > 5) {
    if (metrics.avgOrderValue < 30000) {
      tips.push({
        type: 'product',
        priority: 'low',
        title: '객단가 상승 전략 검토',
        description: `평균 주문금액 ${metrics.avgOrderValue.toLocaleString()}원으로 낮습니다.`,
        expectedImpact: '매출 20-30% 증가 가능',
        actionItems: [
          '세트 상품/번들 구성',
          '무료배송 기준 금액 설정',
          '추가 구매 유도 상품 추천'
        ]
      })
    }
  }

  // 6. 예산 사용 패턴 분석
  if (metrics.spent > 100000 && metrics.roas < ROAS_THRESHOLDS.GOOD) {
    tips.push({
      type: 'timing',
      priority: 'medium',
      title: '광고 운영 시간 최적화',
      description: '예산 소진 대비 성과가 낮습니다. 효율적인 시간대에 집중하세요.',
      expectedImpact: '같은 예산으로 10-20% 더 많은 전환',
      actionItems: [
        '시간대별 성과 분석',
        '주말/평일 성과 비교',
        '저성과 시간대 예산 축소'
      ]
    })
  }

  // 우선순위 정렬
  const priorityOrder = { high: 0, medium: 1, low: 2 }
  tips.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

  return tips.slice(0, 5) // 최대 5개 팁 반환
}

/**
 * 알림톡용 간단 요약 메시지 생성
 */
export function generateAlimtalkSummary(
  campaignName: string,
  metrics: CampaignMetrics,
  tips: OptimizationTip[]
): string {
  const topTip = tips[0]
  if (!topTip) return ''

  const roasEmoji = metrics.roas >= ROAS_THRESHOLDS.GOOD ? '🟢' :
                    metrics.roas >= ROAS_THRESHOLDS.WARNING ? '🟡' : '🔴'

  return `[셀러포트 AI 분석]
${roasEmoji} ${campaignName}

📊 현재 성과
- ROAS: ${metrics.roas}%
- 전환율: ${metrics.cvr.toFixed(1)}%
- 클릭률: ${metrics.ctr.toFixed(1)}%

💡 핵심 추천
${topTip.title}
${topTip.description}

👉 자세한 분석은 셀러포트 앱에서 확인하세요.`
}

/**
 * 전체 캠페인 분석 리포트 생성
 */
export function generateDailyReport(campaigns: { name: string; metrics: CampaignMetrics }[]): {
  summary: string
  topPerformers: string[]
  needsAttention: string[]
  totalTips: number
} {
  let totalTips = 0
  const topPerformers: string[] = []
  const needsAttention: string[] = []

  campaigns.forEach(({ name, metrics }) => {
    const tips = generateOptimizationTips(metrics)
    totalTips += tips.length

    if (metrics.roas >= ROAS_THRESHOLDS.EXCELLENT) {
      topPerformers.push(`${name} (ROAS ${metrics.roas}%)`)
    } else if (metrics.roas < ROAS_THRESHOLDS.WARNING) {
      needsAttention.push(`${name} (ROAS ${metrics.roas}%)`)
    }
  })

  const summary = `오늘의 분석 결과:
- 총 ${campaigns.length}개 캠페인 분석
- 우수 캠페인: ${topPerformers.length}개
- 주의 필요: ${needsAttention.length}개
- 최적화 제안: ${totalTips}개`

  return {
    summary,
    topPerformers,
    needsAttention,
    totalTips
  }
}
