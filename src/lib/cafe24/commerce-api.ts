/**
 * 카페24 Commerce API 클라이언트
 *
 * 카페24 쇼핑몰 API 연동
 * - OAuth 2.0 인증
 * - 상품 조회
 * - 주문 조회
 */

interface Cafe24ApiConfig {
  clientId: string
  clientSecret: string
  mallId: string // 쇼핑몰 ID (예: myshop)
  accessToken?: string
  refreshToken?: string
}

interface Cafe24TokenResponse {
  access_token: string
  expires_at: string // ISO 8601 format
  refresh_token: string
  refresh_token_expires_at: string
  client_id: string
  mall_id: string
  user_id: string
  scopes: string[]
  issued_at: string
}

// 카페24 상품
interface Cafe24Product {
  shop_no: number
  product_no: number
  product_code: string
  custom_product_code: string
  product_name: string
  eng_product_name: string | null
  supply_product_name: string
  model_name: string
  price: string // 문자열로 반환됨
  retail_price: string
  supply_price: string
  display: string // T/F
  selling: string // T/F
  product_condition: string
  product_used_month: number
  summary_description: string
  simple_description: string
  product_tag: string[]
  buy_limit_by_product: string
  buy_limit_type: string
  buy_unit_type: string
  buy_unit: number
  order_quantity_limit_type: string
  minimum_quantity: number
  maximum_quantity: number
  points_by_product: string
  adult_certification: string
  detail_image: string
  list_image: string
  tiny_image: string
  small_image: string
  has_option: string
  option_type: string
  created_date: string
  updated_date: string
  quantity: number // 재고
  additional_information: Array<{
    key: string
    name: string
    value: string
  }>
}

// 카페24 주문
interface Cafe24Order {
  shop_no: number
  order_id: string
  order_date: string
  order_status: string // N00: 입금전, N10: 상품준비중, N20: 배송준비중, N21: 배송중, N22: 배송완료 등
  payment_status: string // F: 미결제, M: 부분결제, T: 결제완료
  payment_date: string | null
  member_id: string
  member_group_no: number
  billing_name: string
  total_product_price: string
  total_shipping_fee: string
  total_order_amount: string
  payment_amount: string
  payment_method: string[]
  order_from: string // PC: PC, M: 모바일
  items: Cafe24OrderItem[]
}

interface Cafe24OrderItem {
  shop_no: number
  item_no: number
  order_id: string
  order_item_code: string
  product_no: number
  product_code: string
  product_name: string
  product_option: string
  quantity: number
  product_price: string
  option_price: string
  additional_discount_price: string
  coupon_discount_price: string
  app_item_discount_amount: string
  payment_amount: string
  order_status: string
  status_text: string
  shipping_status: string
  refund_amount: string
}

interface Cafe24ProductsResponse {
  products: Cafe24Product[]
  links: Array<{ rel: string; href: string }>
}

interface Cafe24OrdersResponse {
  orders: Cafe24Order[]
  links: Array<{ rel: string; href: string }>
}

export class Cafe24CommerceAPI {
  private config: Cafe24ApiConfig
  private baseUrl: string

  constructor(config: Cafe24ApiConfig) {
    this.config = config
    // 카페24 API 기본 URL (mallId 기반)
    this.baseUrl = `https://${config.mallId}.cafe24api.com/api/v2`
  }

  /**
   * API 요청 헬퍼
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: Record<string, unknown>
  ): Promise<T> {
    if (!this.config.accessToken) {
      throw new Error('Access token이 필요합니다. 먼저 인증을 완료해주세요.')
    }

    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
      'X-Cafe24-Api-Version': '2024-06-01'
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }

    console.log(`[Cafe24 API] ${method} ${url}`)

    const response = await fetch(url, options)
    const responseData = await response.json()

    if (!response.ok) {
      console.error('[Cafe24 API] Error:', responseData)
      throw new Error(responseData.error?.message || `API 오류: ${response.status}`)
    }

    return responseData as T
  }

  /**
   * Access Token 설정
   */
  setAccessToken(accessToken: string) {
    this.config.accessToken = accessToken
  }

  /**
   * Refresh Token으로 Access Token 갱신
   */
  async refreshAccessToken(refreshToken: string): Promise<Cafe24TokenResponse> {
    const url = `https://${this.config.mallId}.cafe24api.com/api/v2/oauth/token`

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })

    const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error_description || 'Token refresh failed')
    }

    // 새 토큰 저장
    this.config.accessToken = data.access_token
    this.config.refreshToken = data.refresh_token

    return data as Cafe24TokenResponse
  }

  /**
   * 상품 목록 조회
   */
  async getProducts(limit: number = 100, offset: number = 0): Promise<Cafe24ProductsResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      selling: 'T' // 판매중인 상품만
    })

    return this.request<Cafe24ProductsResponse>(
      'GET',
      `/admin/products?${params.toString()}`
    )
  }

  /**
   * 상품 상세 조회
   */
  async getProduct(productNo: number): Promise<{ product: Cafe24Product }> {
    return this.request<{ product: Cafe24Product }>(
      'GET',
      `/admin/products/${productNo}`
    )
  }

  /**
   * 주문 목록 조회
   */
  async getOrders(
    startDate: string, // YYYY-MM-DD
    endDate: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<Cafe24OrdersResponse> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      limit: limit.toString(),
      offset: offset.toString(),
      order_status: 'N00,N10,N20,N21,N22,N30,N40' // 대부분의 주문 상태
    })

    return this.request<Cafe24OrdersResponse>(
      'GET',
      `/admin/orders?${params.toString()}`
    )
  }

  /**
   * 최근 7일 주문 조회
   */
  async getRecentOrders(): Promise<Cafe24OrdersResponse> {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const endDate = now.toISOString().split('T')[0]
    const startDate = sevenDaysAgo.toISOString().split('T')[0]

    return this.getOrders(startDate, endDate)
  }

  /**
   * 주문 상세 조회
   */
  async getOrder(orderId: string): Promise<{ order: Cafe24Order }> {
    return this.request<{ order: Cafe24Order }>(
      'GET',
      `/admin/orders/${orderId}`
    )
  }

  /**
   * 스토어 정보 조회
   */
  async getStoreInfo(): Promise<{ store: { mall_id: string; shop_name: string; base_domain: string } }> {
    return this.request<{ store: { mall_id: string; shop_name: string; base_domain: string } }>(
      'GET',
      '/admin/store'
    )
  }
}

/**
 * 카페24 API 클라이언트 생성 헬퍼
 */
export function createCafe24Client(mallId: string, accessToken?: string): Cafe24CommerceAPI {
  const client = new Cafe24CommerceAPI({
    clientId: process.env.CAFE24_CLIENT_ID || '',
    clientSecret: process.env.CAFE24_CLIENT_SECRET || '',
    mallId,
    accessToken
  })

  return client
}

/**
 * OAuth 인증 URL 생성
 */
export function getCafe24AuthUrl(mallId: string, state: string): string {
  const clientId = process.env.CAFE24_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sellerport.app'}/api/auth/cafe24/callback`
  const scope = 'mall.read_store,mall.read_product,mall.read_order,mall.read_salesreport'

  return `https://${mallId}.cafe24api.com/api/v2/oauth/authorize?` +
    `response_type=code&` +
    `client_id=${clientId}&` +
    `state=${state}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${scope}`
}

/**
 * Authorization Code로 Access Token 발급
 */
export async function exchangeCafe24Token(
  mallId: string,
  code: string
): Promise<Cafe24TokenResponse> {
  const clientId = process.env.CAFE24_CLIENT_ID!
  const clientSecret = process.env.CAFE24_CLIENT_SECRET!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sellerport.app'}/api/auth/cafe24/callback`

  const url = `https://${mallId}.cafe24api.com/api/v2/oauth/token`

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri
  })

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('[Cafe24 Token] Error:', data)
    throw new Error(data.error_description || 'Token exchange failed')
  }

  return data as Cafe24TokenResponse
}
