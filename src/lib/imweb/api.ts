/**
 * 아임웹 API 클라이언트
 *
 * 아임웹 쇼핑몰/웹사이트 API 연동
 * - OAuth 2.0 인증
 * - 주문 조회
 * - 회원 조회
 * - 상품 조회
 */

// 아임웹 OAuth 토큰 응답
interface ImwebTokenResponse {
  accessToken: string
  refreshToken: string
  scope: string
}

// 아임웹 주문
interface ImwebOrder {
  order_no: string
  order_id: string
  order_time: string
  pay_time: string | null
  status: string
  pay_type: string
  device: string
  order_price_info: {
    total_price: number
    pay_price: number
    deliv_price: number
    island_price: number
    coupon_price: number
    point_price: number
    etc_price: number
  }
  orderer: {
    member_code: string | null
    name: string
    email: string
    call: string
  }
  form_data: Record<string, unknown>[]
  product_list: ImwebOrderProduct[]
}

interface ImwebOrderProduct {
  prod_no: string
  prod_name: string
  prod_custom_code: string
  option_name_list: string[]
  option: string
  price: number
  count: number
  deliv_type: string
  deliv_price_type: string
}

// 아임웹 회원
interface ImwebMember {
  member_code: string
  member_type: string
  email: string
  name: string
  nick: string
  call: string
  access_time: string
  join_time: string
}

// 아임웹 상품
interface ImwebProduct {
  no: string
  prod_code: string
  prod_name: string
  prod_status: string
  prod_type: string
  simple_content: string
  content: string
  price: number
  price_org: number
  stock_use: string
  stock_unlimit: string
  stock: number
  categories: string[]
  images: string[]
  created_time: string
  updated_time: string
}

// API 응답 타입
interface ImwebApiResponse<T> {
  code: number
  msg: string
  data: T
}

interface ImwebListResponse<T> {
  code: number
  msg: string
  data: {
    list: T[]
    total_count: number
    page: number
    limit: number
  }
}

export class ImwebAPI {
  private accessToken: string
  private siteCode: string
  private baseUrl = 'https://openapi.imweb.me'

  constructor(accessToken: string, siteCode: string) {
    this.accessToken = accessToken
    this.siteCode = siteCode
  }

  /**
   * API 요청 헬퍼
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'x-site-code': this.siteCode
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }

    console.log(`[Imweb API] ${method} ${url}`)

    const response = await fetch(url, options)
    const responseData = await response.json()

    if (!response.ok || responseData.code !== 200) {
      console.error('[Imweb API] Error:', responseData)
      throw new Error(responseData.msg || `API 오류: ${response.status}`)
    }

    return responseData as T
  }

  /**
   * Access Token 업데이트
   */
  setAccessToken(accessToken: string) {
    this.accessToken = accessToken
  }

  /**
   * 주문 목록 조회
   */
  async getOrders(
    page: number = 1,
    limit: number = 100,
    startDate?: string,
    endDate?: string
  ): Promise<ImwebListResponse<ImwebOrder>> {
    let endpoint = `/v2/shop/orders?page=${page}&limit=${limit}`

    if (startDate) {
      endpoint += `&start_time=${startDate}`
    }
    if (endDate) {
      endpoint += `&end_time=${endDate}`
    }

    return this.request<ImwebListResponse<ImwebOrder>>('GET', endpoint)
  }

  /**
   * 주문 상세 조회
   */
  async getOrder(orderNo: string): Promise<ImwebApiResponse<ImwebOrder>> {
    return this.request<ImwebApiResponse<ImwebOrder>>('GET', `/v2/shop/orders/${orderNo}`)
  }

  /**
   * 회원 목록 조회
   */
  async getMembers(
    page: number = 1,
    limit: number = 100
  ): Promise<ImwebListResponse<ImwebMember>> {
    return this.request<ImwebListResponse<ImwebMember>>(
      'GET',
      `/v2/members?page=${page}&limit=${limit}`
    )
  }

  /**
   * 회원 상세 조회
   */
  async getMember(memberCode: string): Promise<ImwebApiResponse<ImwebMember>> {
    return this.request<ImwebApiResponse<ImwebMember>>('GET', `/v2/members/${memberCode}`)
  }

  /**
   * 상품 목록 조회
   */
  async getProducts(
    page: number = 1,
    limit: number = 100
  ): Promise<ImwebListResponse<ImwebProduct>> {
    return this.request<ImwebListResponse<ImwebProduct>>(
      'GET',
      `/v2/shop/products?page=${page}&limit=${limit}`
    )
  }

  /**
   * 상품 상세 조회
   */
  async getProduct(prodNo: string): Promise<ImwebApiResponse<ImwebProduct>> {
    return this.request<ImwebApiResponse<ImwebProduct>>('GET', `/v2/shop/products/${prodNo}`)
  }

  /**
   * 사이트 정보 조회
   */
  async getSiteInfo(): Promise<ImwebApiResponse<{ site_code: string; site_name: string; domain: string }>> {
    return this.request<ImwebApiResponse<{ site_code: string; site_name: string; domain: string }>>(
      'GET',
      '/v2/sites/info'
    )
  }
}

/**
 * OAuth 인증 URL 생성
 */
export function getImwebAuthUrl(state: string): string {
  const clientId = process.env.IMWEB_CLIENT_ID
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sellerport.app'}/api/auth/imweb/callback`
  // 필요한 권한 (scope)
  const scope = 'site:read,shop.order:read,member:read,shop.product:read,site.script:write'

  return `https://openapi.imweb.me/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`
}

/**
 * Authorization Code로 Access Token 발급
 */
export async function exchangeImwebToken(code: string): Promise<ImwebTokenResponse> {
  const clientId = process.env.IMWEB_CLIENT_ID!
  const clientSecret = process.env.IMWEB_CLIENT_SECRET!
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sellerport.app'}/api/auth/imweb/callback`

  const url = 'https://openapi.imweb.me/oauth2/token'

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('[Imweb Token] Error:', data)
    throw new Error(data.error_description || data.msg || 'Token exchange failed')
  }

  return {
    accessToken: data.accessToken || data.access_token,
    refreshToken: data.refreshToken || data.refresh_token,
    scope: data.scope
  }
}

/**
 * Refresh Token으로 Access Token 갱신
 */
export async function refreshImwebToken(refreshToken: string): Promise<ImwebTokenResponse> {
  const clientId = process.env.IMWEB_CLIENT_ID!
  const clientSecret = process.env.IMWEB_CLIENT_SECRET!

  const url = 'https://openapi.imweb.me/oauth2/token'

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  })

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  })

  const data = await response.json()

  if (!response.ok) {
    console.error('[Imweb Token Refresh] Error:', data)
    throw new Error(data.error_description || data.msg || 'Token refresh failed')
  }

  return {
    accessToken: data.accessToken || data.access_token,
    refreshToken: data.refreshToken || data.refresh_token,
    scope: data.scope
  }
}

/**
 * 아임웹 API 클라이언트 생성 헬퍼
 */
export function createImwebClient(accessToken: string, siteCode: string): ImwebAPI {
  return new ImwebAPI(accessToken, siteCode)
}
