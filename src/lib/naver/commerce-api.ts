/**
 * 네이버 Commerce API 클라이언트
 *
 * 네이버 스마트스토어 API 연동
 * - 상품 조회
 * - 주문 조회
 * - 주문 상태 변경
 */

import crypto from 'crypto'

interface NaverApiConfig {
  applicationId: string
  applicationSecret: string
}

interface NaverTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

interface NaverProduct {
  originProductNo: number
  name: string
  salePrice: number
  stockQuantity: number
  channelProducts: Array<{
    channelProductNo: number
    channelServiceType: string
    categoryId: string
    statusType: string
  }>
  images: {
    representativeImage?: {
      url: string
    }
  }
}

interface NaverOrder {
  orderId: string
  orderDate: string
  productOrderId: string
  productOrderStatus: string
  productName: string
  quantity: number
  totalPaymentAmount: number
  productPrice: number
  shippingFee: number
  originProductNo: number
  mallId: string
  inflowPathType?: string // 유입경로
}

interface NaverOrdersResponse {
  data: {
    contents: NaverOrder[]
    totalElements: number
    totalPages: number
  }
}

interface NaverProductsResponse {
  contents: NaverProduct[]
  totalElements: number
}

export class NaverCommerceAPI {
  private config: NaverApiConfig
  private accessToken: string | null = null
  private tokenExpiresAt: number = 0
  private baseUrl = 'https://api.commerce.naver.com'

  constructor(config: NaverApiConfig) {
    this.config = config
  }

  /**
   * HMAC-SHA256 서명 생성
   */
  private generateSignature(timestamp: string, method: string, path: string): string {
    const message = `${timestamp}.${method}.${path}`
    const hmac = crypto.createHmac('sha256', this.config.applicationSecret)
    hmac.update(message)
    return hmac.digest('base64')
  }

  /**
   * 인증 토큰 발급
   */
  async getAccessToken(): Promise<string> {
    // 토큰이 유효하면 재사용
    if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
      return this.accessToken
    }

    const timestamp = Date.now().toString()
    const path = '/external/v1/oauth2/token'
    const signature = this.generateSignature(timestamp, 'POST', path)

    const params = new URLSearchParams({
      client_id: this.config.applicationId,
      timestamp: timestamp,
      client_secret_sign: signature,
      grant_type: 'client_credentials',
      type: 'SELF',
    })

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`네이버 인증 실패: ${error}`)
    }

    const data: NaverTokenResponse = await response.json()
    this.accessToken = data.access_token
    this.tokenExpiresAt = Date.now() + data.expires_in * 1000

    return this.accessToken
  }

  /**
   * API 요청 헬퍼
   */
  private async request<T>(method: string, path: string, body?: object): Promise<T> {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`네이버 API 오류 (${response.status}): ${error}`)
    }

    return response.json()
  }

  /**
   * 상품 목록 조회
   */
  async getProducts(page: number = 0, size: number = 100): Promise<NaverProductsResponse> {
    return this.request('GET', `/external/v2/products?page=${page}&size=${size}`)
  }

  /**
   * 상품 상세 조회
   */
  async getProduct(productNo: number): Promise<NaverProduct> {
    const response = await this.request<{ contents: NaverProduct[] }>(
      'POST',
      '/external/v2/products/search',
      {
        searchKeywordType: 'PRODUCT_NO',
        searchKeywords: [productNo.toString()],
      }
    )

    if (!response.contents || response.contents.length === 0) {
      throw new Error(`상품을 찾을 수 없습니다: ${productNo}`)
    }

    return response.contents[0]
  }

  /**
   * 주문 목록 조회 (변경일 기준)
   */
  async getOrdersByDate(
    startDate: string, // YYYY-MM-DDTHH:mm:ss.SSSZ
    endDate: string,
    page: number = 0
  ): Promise<NaverOrdersResponse> {
    return this.request('POST', '/external/v1/pay-order/seller/product-orders/last-changed-statuses', {
      lastChangedFrom: startDate,
      lastChangedTo: endDate,
      pageNumber: page,
      pageSize: 100,
    })
  }

  /**
   * 최근 주문 조회 (발주확인 대기)
   */
  async getNewOrders(): Promise<NaverOrdersResponse> {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    return this.request('POST', '/external/v1/pay-order/seller/product-orders/search', {
      searchType: 'PURCHASE_DECIDED_DATE',
      searchStartDate: oneWeekAgo.toISOString(),
      searchEndDate: now.toISOString(),
      productOrderStatuses: ['PAYMENT_WAITING', 'PAYED', 'DELIVERING', 'DELIVERED'],
    })
  }

  /**
   * 오늘 주문 조회
   */
  async getTodayOrders(): Promise<NaverOrdersResponse> {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    return this.request('POST', '/external/v1/pay-order/seller/product-orders/search', {
      searchType: 'ORDER_DATE',
      searchStartDate: startOfDay.toISOString(),
      searchEndDate: now.toISOString(),
    })
  }

  /**
   * 특정 기간 주문 통계
   */
  async getOrderStats(startDate: Date, endDate: Date): Promise<{
    totalOrders: number
    totalRevenue: number
    orders: NaverOrder[]
  }> {
    const response = await this.request<NaverOrdersResponse>(
      'POST',
      '/external/v1/pay-order/seller/product-orders/search',
      {
        searchType: 'ORDER_DATE',
        searchStartDate: startDate.toISOString(),
        searchEndDate: endDate.toISOString(),
      }
    )

    const orders = response.data?.contents || []
    const totalOrders = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPaymentAmount, 0)

    return {
      totalOrders,
      totalRevenue,
      orders,
    }
  }
}

/**
 * 네이버 Commerce API 인스턴스 생성 헬퍼
 */
export function createNaverClient(applicationId: string, applicationSecret: string): NaverCommerceAPI {
  return new NaverCommerceAPI({
    applicationId,
    applicationSecret,
  })
}
