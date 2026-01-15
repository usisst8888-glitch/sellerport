/**
 * AI 최적화 분석 Cron Job
 * [비활성화] campaigns 테이블이 삭제되어 더 이상 사용하지 않습니다.
 * ad_channels 기반 광고 성과 분석으로 대체될 예정입니다.
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // campaigns 테이블이 삭제되어 비활성화됨
  return NextResponse.json({
    success: true,
    message: 'AI analysis disabled - campaigns table removed',
    campaigns: 0
  })
}
