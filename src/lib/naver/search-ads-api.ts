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

// 키워드별 통계 (스마트스토어 전환 포함)
export interface NaverKeywordStatRecord {
  campaignId: string
  campaignName?: string
  adgroupId: string
  adgroupName?: string
  keywordId: string
  keyword: string       // 키워드 텍스트
  statDt: string        // YYYY-MM-DD
  impCnt: number        // 노출수
  clkCnt: number        // 클릭수
  salesAmt: number      // 광고비 (원)
  ccnt: number          // 전환수 (스마트스토어 자동 연동)
  convAmt: number       // 전환 매출액
  crto: number          // 전환율 (%)
  ror: number           // ROAS (%)
  avgRnk: number        // 평균 게재 순위
  ctr: number           // CTR (%)
  cpc: number           // CPC (원)
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
   * 마스터 리포트 생성 요청
   * 네이버 검색광고 API에서 통계를 조회하려면 Report API를 사용해야 함
   * @param reportType 리포트 타입 (AD, AD_DETAIL, KEYWORD, etc.)
   * @param dateStart 시작일 (YYYYMMDD)
   * @param dateEnd 종료일 (YYYYMMDD)
   */
  async createReport(
    reportType: 'AD' | 'AD_DETAIL' | 'KEYWORD' | 'AD_CONVERSION' | 'AD_EXTENSION',
    dateStart: string,
    dateEnd: string
  ): Promise<{ reportJobId: string }> {
    const path = '/ncc/reports'

    // 날짜 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
    const statDt = dateStart.replace(/-/g, '')
    const endDt = dateEnd.replace(/-/g, '')

    const body = {
      reportTp: reportType,
      statDt,
      endDt,
    }

    return this.request<{ reportJobId: string }>('POST', path, body)
  }

  /**
   * 리포트 상태 확인
   */
  async getReportStatus(reportJobId: string): Promise<{
    status: 'REGIST' | 'RUNNING' | 'BUILT' | 'ERROR'
    reportJobId: string
    downloadUrl?: string
  }> {
    const path = `/ncc/reports/${reportJobId}`
    return this.request('GET', path)
  }

  /**
   * 리포트 다운로드 (TSV 형식)
   */
  async downloadReport(downloadUrl: string): Promise<NaverStatRecord[]> {
    const response = await fetch(downloadUrl)
    if (!response.ok) {
      throw new NaverSearchAdsError('리포트 다운로드 실패', response.status)
    }

    const text = await response.text()
    return this.parseReportTsv(text)
  }

  /**
   * TSV 리포트 파싱
   */
  private parseReportTsv(tsv: string): NaverStatRecord[] {
    const lines = tsv.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split('\t')
    const records: NaverStatRecord[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t')
      const record: Record<string, string | number> = {}

      headers.forEach((header, index) => {
        const value = values[index] || ''
        // 숫자 필드 변환
        if (['impCnt', 'clkCnt', 'salesAmt', 'ccnt', 'viewCnt'].includes(header)) {
          record[header] = parseInt(value) || 0
        } else if (['ctr', 'cpc', 'crto', 'ror', 'cpConv', 'avgRnk'].includes(header)) {
          record[header] = parseFloat(value) || 0
        } else {
          record[header] = value
        }
      })

      // 캠페인 ID와 날짜가 있는 경우만 추가
      if (record.nccCampaignId || record.campaignId) {
        records.push({
          campaignId: (record.nccCampaignId || record.campaignId) as string,
          statDt: (record.statDt || record.date) as string,
          impCnt: (record.impCnt || 0) as number,
          clkCnt: (record.clkCnt || 0) as number,
          salesAmt: (record.salesAmt || record.cost || 0) as number,
          ccnt: (record.ccnt || 0) as number,
          ctr: (record.ctr || 0) as number,
          cpc: (record.cpc || 0) as number,
          avgRnk: (record.avgRnk || 0) as number,
        })
      }
    }

    return records
  }

  /**
   * 캠페인별 일별 통계 조회 (Report API 사용)
   * Report API 흐름: 생성 요청 -> 상태 확인 (BUILT까지 대기) -> 다운로드
   */
  async getCampaignStats(
    campaignIds: string[],
    dateStart: string,
    dateEnd: string
  ): Promise<NaverStatRecord[]> {
    if (campaignIds.length === 0) {
      return []
    }

    try {
      // 1. 리포트 생성 요청
      const { reportJobId } = await this.createReport('AD', dateStart, dateEnd)

      // 2. 리포트 빌드 완료까지 대기 (최대 30초)
      let status = 'REGIST'
      let downloadUrl = ''
      let attempts = 0
      const maxAttempts = 15

      while (status !== 'BUILT' && status !== 'ERROR' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2초 대기
        const reportStatus = await this.getReportStatus(reportJobId)
        status = reportStatus.status
        if (reportStatus.downloadUrl) {
          downloadUrl = reportStatus.downloadUrl
        }
        attempts++
      }

      if (status === 'ERROR') {
        throw new NaverSearchAdsError('리포트 생성 실패', 500)
      }

      if (!downloadUrl) {
        throw new NaverSearchAdsError('리포트 다운로드 URL을 찾을 수 없습니다', 500)
      }

      // 3. 리포트 다운로드 및 파싱
      const records = await this.downloadReport(downloadUrl)

      // 4. 요청된 캠페인 ID에 해당하는 데이터만 필터링
      const campaignIdSet = new Set(campaignIds)
      return records.filter(r => campaignIdSet.has(r.campaignId))

    } catch (error) {
      // Report API 실패 시 대체 방법 시도 (Stat API)
      console.warn('Report API failed, trying Stat API:', error)
      return this.getCampaignStatsLegacy(campaignIds, dateStart, dateEnd)
    }
  }

  /**
   * 캠페인별 통계 조회 (레거시 Stat API - 백업용)
   */
  private async getCampaignStatsLegacy(
    campaignIds: string[],
    dateStart: string,
    dateEnd: string
  ): Promise<NaverStatRecord[]> {
    const path = '/stats'

    // 각 캠페인별로 개별 요청
    const allStats: NaverStatRecord[] = []

    for (const campaignId of campaignIds) {
      try {
        const body = {
          id: campaignId,
          fields: ['impCnt', 'clkCnt', 'salesAmt', 'ctr', 'cpc', 'avgRnk'],
          timeRange: {
            since: dateStart,
            until: dateEnd,
          },
          datePreset: 'custom',
          timeIncrement: '1',
        }

        const result = await this.request<{ data: NaverStatRecord[] }>('POST', path, body)
        if (result.data) {
          allStats.push(...result.data)
        }
      } catch (err) {
        console.error(`Failed to get stats for campaign ${campaignId}:`, err)
      }
    }

    return allStats
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

  /**
   * 키워드별 통계 조회 (KEYWORD Report API 사용)
   * 스마트스토어 전환 데이터 포함
   */
  async getKeywordStats(
    dateStart: string,
    dateEnd: string
  ): Promise<NaverKeywordStatRecord[]> {
    try {
      // 1. 키워드 리포트 생성 요청
      const { reportJobId } = await this.createReport('KEYWORD', dateStart, dateEnd)

      // 2. 리포트 빌드 완료까지 대기 (최대 30초)
      let status = 'REGIST'
      let downloadUrl = ''
      let attempts = 0
      const maxAttempts = 15

      while (status !== 'BUILT' && status !== 'ERROR' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // 2초 대기
        const reportStatus = await this.getReportStatus(reportJobId)
        status = reportStatus.status
        if (reportStatus.downloadUrl) {
          downloadUrl = reportStatus.downloadUrl
        }
        attempts++
      }

      if (status === 'ERROR') {
        throw new NaverSearchAdsError('키워드 리포트 생성 실패', 500)
      }

      if (!downloadUrl) {
        throw new NaverSearchAdsError('키워드 리포트 다운로드 URL을 찾을 수 없습니다', 500)
      }

      // 3. 리포트 다운로드 및 파싱
      const response = await fetch(downloadUrl)
      if (!response.ok) {
        throw new NaverSearchAdsError('키워드 리포트 다운로드 실패', response.status)
      }

      const text = await response.text()
      return this.parseKeywordReportTsv(text)

    } catch (error) {
      console.error('Keyword Report API failed:', error)
      throw error
    }
  }

  /**
   * 키워드 TSV 리포트 파싱
   */
  private parseKeywordReportTsv(tsv: string): NaverKeywordStatRecord[] {
    const lines = tsv.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split('\t')
    const records: NaverKeywordStatRecord[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split('\t')
      const record: Record<string, string | number> = {}

      headers.forEach((header, index) => {
        const value = values[index] || ''
        // 숫자 필드 변환
        if (['impCnt', 'clkCnt', 'salesAmt', 'ccnt', 'convAmt'].includes(header)) {
          record[header] = parseInt(value) || 0
        } else if (['ctr', 'cpc', 'crto', 'ror', 'avgRnk'].includes(header)) {
          record[header] = parseFloat(value) || 0
        } else {
          record[header] = value
        }
      })

      // 키워드 ID가 있는 경우만 추가
      if (record.nccKeywordId || record.keywordId) {
        records.push({
          campaignId: (record.nccCampaignId || record.campaignId || '') as string,
          campaignName: (record.campaignName || record.nccCampaignName || '') as string,
          adgroupId: (record.nccAdgroupId || record.adgroupId || '') as string,
          adgroupName: (record.adgroupName || record.nccAdgroupName || '') as string,
          keywordId: (record.nccKeywordId || record.keywordId) as string,
          keyword: (record.keyword || record.kwdText || '') as string,
          statDt: (record.statDt || record.date || '') as string,
          impCnt: (record.impCnt || 0) as number,
          clkCnt: (record.clkCnt || 0) as number,
          salesAmt: (record.salesAmt || record.cost || 0) as number,
          ccnt: (record.ccnt || record.convCnt || 0) as number,
          convAmt: (record.convAmt || record.convValue || 0) as number,
          crto: (record.crto || record.convRate || 0) as number,
          ror: (record.ror || record.roas || 0) as number,
          avgRnk: (record.avgRnk || record.avgPosition || 0) as number,
          ctr: (record.ctr || 0) as number,
          cpc: (record.cpc || 0) as number,
        })
      }
    }

    return records
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
