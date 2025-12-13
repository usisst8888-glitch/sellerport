import crypto from 'crypto'

const BASE_URL = 'https://api.naver.com'

export interface NaverSearchAdsConfig {
  customerId: string    // 고객 ID
  apiKey: string        // 액세스 라이선스
  secretKey: string     // 비밀키
}

export interface NaverCampaign {
  nccCampaignId: string
  customerId: number
  name: string
  campaignTp: string  // WEB_SITE, SHOPPING, etc.
  status: string      // ELIGIBLE, PAUSED, etc.
  statusReason: string
  expectCost: number
  budget: number
  budgetLock: boolean
  dailyBudget: number
  usePeriod: boolean
  periodStartDt?: string
  periodEndDt?: string
  useDailyBudget: boolean
  deliveryMethod: string
  regTm: string
  editTm: string
}

export interface NaverAdGroup {
  nccAdgroupId: string
  nccCampaignId: string
  customerId: number
  name: string
  status: string
  adgroupAttrJson: {
    bidAmt?: number
    useGroupBid?: boolean
  }
  regTm: string
  editTm: string
}

export interface NaverStatRecord {
  campaignId: string
  adgroupId?: string
  keywordId?: string
  statDt: string        // YYYY-MM-DD
  impCnt: number        // 노출수
  clkCnt: number        // 클릭수
  salesAmt: number      // 광고비 (원)
  ccnt?: number         // 전환수 (네이버 제공 시)
  crto?: number         // 전환율
  viewCnt?: number      // 조회수
  ror?: number          // 수익률
  cpConv?: number       // 전환당 비용
  avgRnk?: number       // 평균 게재 순위
  ctr?: number          // CTR
  cpc?: number          // CPC
}

export interface NaverBizMoney {
  customerId: number
  budget: number
  refund: number
  deferred: number
  bizmoney: number
}

interface NaverApiError {
  code: number
  message: string
  status?: string
}

export class NaverSearchAdsAPI {
  private config: NaverSearchAdsConfig

  constructor(config: NaverSearchAdsConfig) {
    this.config = config
  }

  /**
   * HMAC-SHA256 서명 생성
   */
  private generateSignature(timestamp: string, method: string, path: string): string {
    const message = `${timestamp}.${method}.${path}`
    const hmac = crypto.createHmac('sha256', this.config.secretKey)
    hmac.update(message)
    return hmac.digest('base64')
  }

  /**
   * API 요청 헤더 생성
   */
  private getHeaders(method: string, path: string): Record<string, string> {
    const timestamp = String(Date.now())
    const signature = this.generateSignature(timestamp, method, path)

    return {
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Timestamp': timestamp,
      'X-API-KEY': this.config.apiKey,
      'X-Customer': this.config.customerId,
      'X-Signature': signature,
    }
  }

  /**
   * API 요청 실행
   */
  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers = this.getHeaders(method, path)
    const url = `${BASE_URL}${path}`

    const options: RequestInit = {
      method,
      headers,
    }

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(url, options)

    if (!response.ok) {
      const errorData: NaverApiError = await response.json().catch(() => ({
        code: response.status,
        message: response.statusText,
      }))

      throw new NaverSearchAdsError(
        errorData.message || 'API request failed',
        errorData.code || response.status
      )
    }

    // 응답이 비어있는 경우 처리
    const text = await response.text()
    if (!text) {
      return {} as T
    }

    return JSON.parse(text) as T
  }

  /**
   * 캠페인 목록 조회
   */
  async getCampaigns(): Promise<NaverCampaign[]> {
    return this.request<NaverCampaign[]>('GET', '/ncc/campaigns')
  }

  /**
   * 특정 캠페인 조회
   */
  async getCampaign(campaignId: string): Promise<NaverCampaign> {
    return this.request<NaverCampaign>('GET', `/ncc/campaigns/${campaignId}`)
  }

  /**
   * 광고그룹 목록 조회
   */
  async getAdGroups(campaignId?: string): Promise<NaverAdGroup[]> {
    const path = campaignId
      ? `/ncc/adgroups?nccCampaignId=${campaignId}`
      : '/ncc/adgroups'
    return this.request<NaverAdGroup[]>('GET', path)
  }

  /**
   * 일별 통계 조회
   * @param dateStart 시작일 (YYYY-MM-DD)
   * @param dateEnd 종료일 (YYYY-MM-DD)
   * @param ids 캠페인/광고그룹/키워드 ID 목록
   * @param fields 조회할 필드 목록
   * @param timeIncrement 시간 단위 (allDays: 전체, 1: 일별)
   */
  async getStats(
    dateStart: string,
    dateEnd: string,
    ids: string[],
    fields: string[] = ['impCnt', 'clkCnt', 'salesAmt', 'ctr', 'cpc'],
    timeIncrement: 'allDays' | '1' = '1'
  ): Promise<{ data: NaverStatRecord[] }> {
    const path = '/stats'

    const body = {
      id: ids,
      fields,
      timeRange: {
        since: dateStart,
        until: dateEnd,
      },
      datePreset: 'custom',
      timeIncrement,
    }

    return this.request<{ data: NaverStatRecord[] }>('POST', path, body)
  }

  /**
   * 캠페인별 일별 통계 조회 (간편 메서드)
   */
  async getCampaignStats(
    campaignIds: string[],
    dateStart: string,
    dateEnd: string
  ): Promise<NaverStatRecord[]> {
    if (campaignIds.length === 0) {
      return []
    }

    const result = await this.getStats(
      dateStart,
      dateEnd,
      campaignIds,
      ['impCnt', 'clkCnt', 'salesAmt', 'ctr', 'cpc', 'avgRnk'],
      '1'
    )

    return result.data || []
  }

  /**
   * 계정 잔액 조회
   */
  async getBizMoney(): Promise<NaverBizMoney> {
    return this.request<NaverBizMoney>('GET', '/billing/bizmoney')
  }

  /**
   * API 키 유효성 검증 (캠페인 조회로 확인)
   */
  async validateCredentials(): Promise<{ valid: boolean; message?: string }> {
    try {
      await this.getCampaigns()
      return { valid: true }
    } catch (error) {
      if (error instanceof NaverSearchAdsError) {
        return { valid: false, message: error.message }
      }
      return { valid: false, message: '알 수 없는 오류가 발생했습니다' }
    }
  }
}

/**
 * 네이버 검색광고 API 에러
 */
export class NaverSearchAdsError extends Error {
  code: number

  constructor(message: string, code: number) {
    super(message)
    this.name = 'NaverSearchAdsError'
    this.code = code
  }

  /**
   * 사용자 친화적 에러 메시지 반환
   */
  getUserMessage(): string {
    switch (this.code) {
      case 400:
        return '잘못된 요청입니다. 입력값을 확인해주세요.'
      case 401:
        return 'API 키가 유효하지 않습니다. 키를 확인해주세요.'
      case 403:
        return 'API 사용 권한이 없습니다. 권한을 확인해주세요.'
      case 404:
        return '요청한 리소스를 찾을 수 없습니다.'
      case 429:
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      case 1018:
        return '서명이 유효하지 않습니다. Secret Key를 확인해주세요.'
      case 1019:
        return '타임스탬프가 유효하지 않습니다.'
      default:
        return this.message || '알 수 없는 오류가 발생했습니다.'
    }
  }
}

/**
 * 날짜 유틸리티
 */
export function getDateRange(daysAgo: number = 7): { dateStart: string; dateEnd: string } {
  const today = new Date()
  const dateEnd = today.toISOString().split('T')[0]

  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - daysAgo)
  const dateStart = startDate.toISOString().split('T')[0]

  return { dateStart, dateEnd }
}
