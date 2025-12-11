/**
 * 네이버 Commerce API 클라이언트
 *
 * 네이버 스마트스토어 API 연동
 * - 상품 조회
 * - 주문 조회
 * - 주문 상태 변경
 */

import bcrypt from 'bcryptjs'

interface NaverApiConfig {
  applicationId: string
  applicationSecret: string
}

interface NaverTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
}

// 채널 상품 정보 (실제 응답에서 상품 정보가 여기에 있음)
interface NaverChannelProduct {
  groupProductNo?: number
  originProductNo: number
  channelProductNo: number
  channelServiceType: string // STOREFARM, WINDOW, AFFILIATE
  injectProductNo?: number
  categoryId: string
  name: string
  sellerManagementCode?: string
  statusType: string // WAIT, SALE, OUTOFSTOCK, etc.
  channelProductDisplayStatusType?: string
  salePrice: number
  discountedPrice?: number
  stockQuantity: number
  knowledgeShoppingProductRegistration?: boolean
  deliveryAttributeType?: string
  deliveryFee?: number
  returnFee?: number
  exchangeFee?: number
  representativeImage?: {
    url: string
  }
  modelId?: number
  modelName?: string
  brandName?: string
  manufacturerName?: string
  regDate?: string
  modifiedDate?: string
}

// 상품 목록 조회 응답의 contents 항목
interface NaverProductContent {
  groupProductNo?: number
  originProductNo: number
  channelProducts: NaverChannelProduct[]
}

// 하위 호환성을 위한 기존 인터페이스 (내부 변환용)
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

// 정산 관련 인터페이스
interface NaverSettlement {
  productOrderId: string
  orderId: string
  settleAmount: number // 정산 금액 (수수료 차감 후 실제 받는 금액)
  settleExpectDate: string // 정산 예정일
  commissionAmount: number // 판매 수수료
  paymentCommission: number // 결제 수수료
  totalCommission: number // 총 수수료 (판매 + 결제)
  saleAmount: number // 판매 금액
  deliveryFeeAmount: number // 배송비
  productName: string
  quantity: number
  orderDate: string
  settleStatus: string // 정산 상태 (SCHEDULED: 정산예정, COMPLETED: 정산완료, DEFERRED: 정산보류)
}

interface NaverSettlementsResponse {
  data: {
    contents: NaverSettlement[]
    totalElements: number
    totalPages: number
  }
}

// 정산 내역 export용 인터페이스
export interface NaverSettlementInfo {
  productOrderId: string
  orderId: string
  settlementAmount: number // 실제 정산 금액
  totalCommission: number // 총 수수료
  commissionRate: number // 수수료율 (계산값)
  saleAmount: number // 판매 금액
  settleStatus: string
  settleExpectDate: string
}

interface NaverOrdersResponse {
  data: {
    contents: NaverOrder[]
    totalElements: number
    totalPages: number
  }
}

// 상품 목록 조회 API 실제 응답 형식
interface NaverProductsResponse {
  contents: NaverProductContent[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first?: boolean
  last?: boolean
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
   * bcrypt 기반 client_secret_sign 생성
   * 네이버 커머스 API 인증 방식:
   * 1. password = client_id + "_" + timestamp
   * 2. bcrypt hash with client_secret as salt
   * 3. base64 encode the result
   */
  private generateClientSecretSign(timestamp: string): string {
    const password = `${this.config.applicationId}_${timestamp}`
    // client_secret을 salt로 사용하여 bcrypt 해싱
    const hashed = bcrypt.hashSync(password, this.config.applicationSecret)
    // base64 인코딩
    return Buffer.from(hashed).toString('base64')
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
    const clientSecretSign = this.generateClientSecretSign(timestamp)

    const params = new URLSearchParams({
      client_id: this.config.applicationId,
      timestamp: timestamp,
      client_secret_sign: clientSecretSign,
      grant_type: 'client_credentials',
      type: 'SELF',
    })

    const tokenPath = '/external/v1/oauth2/token'
    const response = await fetch(`${this.baseUrl}${tokenPath}`, {
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

    console.log(`[NaverAPI] ${method} ${path}`)
    if (body) {
      console.log('[NaverAPI] Request body:', JSON.stringify(body))
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const responseText = await response.text()
    console.log(`[NaverAPI] Response status: ${response.status}`)
    console.log(`[NaverAPI] Response body: ${responseText.substring(0, 1000)}`)

    if (!response.ok) {
      throw new Error(`네이버 API 오류 (${response.status}): ${responseText}`)
    }

    try {
      return JSON.parse(responseText) as T
    } catch {
      throw new Error(`네이버 API JSON 파싱 오류: ${responseText}`)
    }
  }

  /**
   * 상품 목록 조회
   * POST /v1/products/search API 사용
   *
   * @param page 페이지 번호 (1부터 시작, API 스펙에 따름)
   * @param size 페이지 크기 (기본 50, 최대 500)
   */
  async getProducts(page: number = 1, size: number = 100): Promise<NaverProductsResponse> {
    // 판매 중인 상품만 조회 (SALE 상태)
    const response = await this.request<NaverProductsResponse>(
      'POST',
      '/external/v1/products/search',
      {
        page: page < 1 ? 1 : page, // 페이지는 1부터 시작
        size: Math.min(size, 500), // 최대 500개
        productStatusTypes: ['SALE', 'WAIT', 'OUTOFSTOCK'], // 판매중, 판매대기, 품절 상품 조회
        orderType: 'REG_DATE' // 등록일순 정렬
      }
    )
    return response
  }

  /**
   * 채널 상품 정보를 기존 NaverProduct 형식으로 변환
   * (하위 호환성 유지용)
   */
  convertToNaverProduct(content: NaverProductContent): NaverProduct | null {
    const channelProduct = content.channelProducts?.[0]
    if (!channelProduct) return null

    return {
      originProductNo: content.originProductNo,
      name: channelProduct.name,
      salePrice: channelProduct.salePrice,
      stockQuantity: channelProduct.stockQuantity,
      channelProducts: content.channelProducts.map(cp => ({
        channelProductNo: cp.channelProductNo,
        channelServiceType: cp.channelServiceType,
        categoryId: cp.categoryId,
        statusType: cp.statusType
      })),
      images: {
        representativeImage: channelProduct.representativeImage
      }
    }
  }

  /**
   * 상품 상세 조회
   */
  async getProduct(productNo: number): Promise<NaverProduct | null> {
    const response = await this.request<NaverProductsResponse>(
      'POST',
      '/external/v1/products/search',
      {
        searchKeywordType: 'PRODUCT_NO',
        originProductNos: [productNo],
        page: 1,
        size: 1
      }
    )

    if (!response.contents || response.contents.length === 0) {
      return null
    }

    return this.convertToNaverProduct(response.contents[0])
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

  /**
   * 정산 내역 조회 (상품주문번호 기반)
   * 네이버 Commerce API: /external/v1/settlements/product-orders
   *
   * @param productOrderIds 상품주문번호 배열 (최대 100개)
   * @returns 정산 정보 배열
   */
  async getSettlementsByProductOrderIds(productOrderIds: string[]): Promise<NaverSettlementInfo[]> {
    if (productOrderIds.length === 0) {
      return []
    }

    // 최대 100개씩 분할 요청
    const chunks: string[][] = []
    for (let i = 0; i < productOrderIds.length; i += 100) {
      chunks.push(productOrderIds.slice(i, i + 100))
    }

    const allSettlements: NaverSettlementInfo[] = []

    for (const chunk of chunks) {
      try {
        const response = await this.request<NaverSettlementsResponse>(
          'POST',
          '/external/v1/settlements/product-orders',
          {
            productOrderIds: chunk
          }
        )

        const settlements = response.data?.contents || []

        for (const settlement of settlements) {
          // 수수료율 계산 (판매금액 기준)
          const commissionRate = settlement.saleAmount > 0
            ? Math.round((settlement.totalCommission / settlement.saleAmount) * 100 * 100) / 100
            : 0

          allSettlements.push({
            productOrderId: settlement.productOrderId,
            orderId: settlement.orderId,
            settlementAmount: settlement.settleAmount,
            totalCommission: settlement.totalCommission,
            commissionRate,
            saleAmount: settlement.saleAmount,
            settleStatus: settlement.settleStatus,
            settleExpectDate: settlement.settleExpectDate
          })
        }
      } catch (error) {
        console.error('Settlement fetch error for chunk:', error)
        // 일부 실패해도 계속 진행
      }
    }

    return allSettlements
  }

  /**
   * 기간별 정산 내역 조회
   *
   * @param startDate 조회 시작일
   * @param endDate 조회 종료일
   * @param page 페이지 번호 (0부터 시작)
   * @returns 정산 내역
   */
  async getSettlementsByDate(
    startDate: Date,
    endDate: Date,
    page: number = 0
  ): Promise<{
    settlements: NaverSettlementInfo[]
    totalElements: number
    totalPages: number
  }> {
    const response = await this.request<NaverSettlementsResponse>(
      'POST',
      '/external/v1/settlements/product-orders/search',
      {
        searchType: 'SETTLE_EXPECT_DATE', // 정산 예정일 기준
        searchStartDate: startDate.toISOString().split('T')[0],
        searchEndDate: endDate.toISOString().split('T')[0],
        pageNumber: page,
        pageSize: 100
      }
    )

    const settlements = (response.data?.contents || []).map(settlement => {
      const commissionRate = settlement.saleAmount > 0
        ? Math.round((settlement.totalCommission / settlement.saleAmount) * 100 * 100) / 100
        : 0

      return {
        productOrderId: settlement.productOrderId,
        orderId: settlement.orderId,
        settlementAmount: settlement.settleAmount,
        totalCommission: settlement.totalCommission,
        commissionRate,
        saleAmount: settlement.saleAmount,
        settleStatus: settlement.settleStatus,
        settleExpectDate: settlement.settleExpectDate
      }
    })

    return {
      settlements,
      totalElements: response.data?.totalElements || 0,
      totalPages: response.data?.totalPages || 0
    }
  }

  /**
   * 주문별 정산 금액 조회 (단건)
   *
   * @param productOrderId 상품주문번호
   * @returns 정산 정보 또는 null
   */
  async getSettlementByProductOrderId(productOrderId: string): Promise<NaverSettlementInfo | null> {
    const settlements = await this.getSettlementsByProductOrderIds([productOrderId])
    return settlements.length > 0 ? settlements[0] : null
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
