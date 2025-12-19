import crypto from 'crypto'

/**
 * 네이버 GFA (성과형 디스플레이 광고) API
 * API 문서: https://gfa.naver.com/partner/help/api
 */

const BASE_URL = 'https://api.gfa.naver.com'

export interface NaverGFAConfig {
  customerId: string    // 광고주 ID (bsn_id)
  apiKey: string        // API Key (Access License)
  secretKey: string     // Secret Key
}

export interface GFACampaign {
  campaignId: string
  campaignName: string
  campaignType: string  // DISPLAY, VIDEO 등
  status: string        // ACTIVE, PAUSED, DELETED 등
  budget: number
  dailyBudget: number
  startDate?: string
  endDate?: string
  regDate: string
  modDate: string
}

export interface GFAAdGroup {
  adGroupId: string
  campaignId: string
  adGroupName: string
  status: string
  bidType: string
  bidAmount: number
  regDate: string
  modDate: string
}

export interface GFAStatRecord {
  campaignId: string
  campaignName?: string
  adGroupId?: string
  statDate: string      // YYYY-MM-DD
  impressions: number   // 노출수
  clicks: number        // 클릭수
  cost: number          // 광고비 (원)
  conversions?: number  // 전환수
  conversionValue?: number  // 전환 매출
  ctr?: number          // CTR (%)
  cpc?: number          // CPC (원)
  cpm?: number          // CPM (원)
  reach?: number        // 도달수 (유니크 사용자)
  frequency?: number    // 노출 빈도
}

export interface GFABudgetInfo {
  customerId: string
  totalBudget: number
  usedBudget: number
  remainingBudget: number
}

interface GFAApiError {
  code: string
  message: string
  status?: number
}

export class NaverGFAAPI {
  private config: NaverGFAConfig

  constructor(config: NaverGFAConfig) {
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
      const errorData: GFAApiError = await response.json().catch(() => ({
        code: String(response.status),
        message: response.statusText,
      }))

      throw new NaverGFAError(
        errorData.message || 'API request failed',
        errorData.code || String(response.status)
      )
    }

    const text = await response.text()
    if (!text) {
      return {} as T
    }

    return JSON.parse(text) as T
  }

  /**
   * 캠페인 목록 조회
   */
  async getCampaigns(): Promise<GFACampaign[]> {
    const result = await this.request<{ content: GFACampaign[] }>('GET', '/api/v1/campaigns')
    return result.content || []
  }

  /**
   * 특정 캠페인 조회
   */
  async getCampaign(campaignId: string): Promise<GFACampaign> {
    return this.request<GFACampaign>('GET', `/api/v1/campaigns/${campaignId}`)
  }

  /**
   * 광고그룹 목록 조회
   */
  async getAdGroups(campaignId?: string): Promise<GFAAdGroup[]> {
    const path = campaignId
      ? `/api/v1/adgroups?campaignId=${campaignId}`
      : '/api/v1/adgroups'
    const result = await this.request<{ content: GFAAdGroup[] }>('GET', path)
    return result.content || []
  }

  /**
   * 캠페인 통계 조회
   * @param campaignIds 캠페인 ID 목록
   * @param dateStart 시작일 (YYYY-MM-DD)
   * @param dateEnd 종료일 (YYYY-MM-DD)
   */
  async getCampaignStats(
    campaignIds: string[],
    dateStart: string,
    dateEnd: string
  ): Promise<GFAStatRecord[]> {
    if (campaignIds.length === 0) {
      return []
    }

    const body = {
      campaignIds,
      dateRange: {
        startDate: dateStart,
        endDate: dateEnd,
      },
      metrics: ['impressions', 'clicks', 'cost', 'ctr', 'cpc', 'cpm', 'reach', 'frequency'],
      dimension: 'DATE',
    }

    const result = await this.request<{ data: GFAStatRecord[] }>('POST', '/api/v1/stats/campaigns', body)
    return result.data || []
  }

  /**
   * 광고그룹 통계 조회
   */
  async getAdGroupStats(
    adGroupIds: string[],
    dateStart: string,
    dateEnd: string
  ): Promise<GFAStatRecord[]> {
    if (adGroupIds.length === 0) {
      return []
    }

    const body = {
      adGroupIds,
      dateRange: {
        startDate: dateStart,
        endDate: dateEnd,
      },
      metrics: ['impressions', 'clicks', 'cost', 'ctr', 'cpc', 'cpm'],
      dimension: 'DATE',
    }

    const result = await this.request<{ data: GFAStatRecord[] }>('POST', '/api/v1/stats/adgroups', body)
    return result.data || []
  }

  /**
   * 일별 통계 조회 (전체 계정)
   */
  async getDailyStats(dateStart: string, dateEnd: string): Promise<GFAStatRecord[]> {
    const body = {
      dateRange: {
        startDate: dateStart,
        endDate: dateEnd,
      },
      metrics: ['impressions', 'clicks', 'cost', 'ctr', 'cpc', 'cpm', 'reach', 'frequency'],
      dimension: 'DATE',
    }

    const result = await this.request<{ data: GFAStatRecord[] }>('POST', '/api/v1/stats/account', body)
    return result.data || []
  }

  /**
   * 예산 정보 조회
   */
  async getBudgetInfo(): Promise<GFABudgetInfo> {
    return this.request<GFABudgetInfo>('GET', '/api/v1/budget')
  }

  /**
   * API 키 유효성 검증
   */
  async validateCredentials(): Promise<{ valid: boolean; message?: string }> {
    try {
      await this.getCampaigns()
      return { valid: true }
    } catch (error) {
      if (error instanceof NaverGFAError) {
        return { valid: false, message: error.message }
      }
      return { valid: false, message: '알 수 없는 오류가 발생했습니다' }
    }
  }
}

/**
 * 네이버 GFA API 에러
 */
export class NaverGFAError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'NaverGFAError'
    this.code = code
  }

  /**
   * 사용자 친화적 에러 메시지 반환
   */
  getUserMessage(): string {
    switch (this.code) {
      case '400':
        return '잘못된 요청입니다. 입력값을 확인해주세요.'
      case '401':
        return 'API 키가 유효하지 않습니다. 키를 확인해주세요.'
      case '403':
        return 'API 사용 권한이 없습니다. 권한을 확인해주세요.'
      case '404':
        return '요청한 리소스를 찾을 수 없습니다.'
      case '429':
        return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      case '500':
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      case 'INVALID_SIGNATURE':
        return '서명이 유효하지 않습니다. Secret Key를 확인해주세요.'
      case 'INVALID_TIMESTAMP':
        return '타임스탬프가 유효하지 않습니다.'
      case 'INVALID_API_KEY':
        return 'API Key가 유효하지 않습니다.'
      case 'INVALID_CUSTOMER':
        return '광고주 ID가 유효하지 않습니다.'
      default:
        return this.message || '알 수 없는 오류가 발생했습니다.'
    }
  }
}

/**
 * 날짜 유틸리티
 */
export function getGFADateRange(daysAgo: number = 7): { dateStart: string; dateEnd: string } {
  const today = new Date()
  const dateEnd = today.toISOString().split('T')[0]

  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - daysAgo)
  const dateStart = startDate.toISOString().split('T')[0]

  return { dateStart, dateEnd }
}
