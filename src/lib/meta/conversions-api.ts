/**
 * Meta Conversions API (CAPI) 클라이언트
 *
 * Facebook/Instagram 광고의 서버 사이드 전환 추적
 * - Purchase (구매)
 * - AddToCart (장바구니 추가)
 * - ViewContent (상품 조회)
 * - Lead (문의/회원가입)
 *
 * 참조: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import crypto from 'crypto'

interface MetaApiConfig {
  pixelId: string
  accessToken: string
  testEventCode?: string // 테스트 이벤트 코드 (개발용)
}

interface UserData {
  em?: string // 이메일 (SHA256 해시)
  ph?: string // 전화번호 (SHA256 해시)
  fn?: string // 이름 (SHA256 해시)
  ln?: string // 성 (SHA256 해시)
  ct?: string // 도시 (SHA256 해시)
  st?: string // 주/도 (SHA256 해시)
  zp?: string // 우편번호 (SHA256 해시)
  country?: string // 국가 (SHA256 해시)
  external_id?: string // 외부 ID (SHA256 해시)
  client_ip_address?: string
  client_user_agent?: string
  fbc?: string // Facebook Click ID
  fbp?: string // Facebook Browser ID
}

// 사용자 데이터 입력 타입
interface UserDataInput {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  city?: string
  state?: string
  zipCode?: string
  country?: string
  externalId?: string
  clientIp?: string
  userAgent?: string
  fbc?: string
  fbp?: string
}

interface CustomData {
  value?: number
  currency?: string
  content_name?: string
  content_category?: string
  content_ids?: string[]
  content_type?: string
  num_items?: number
  order_id?: string
}

interface ServerEvent {
  event_name: string
  event_time: number
  event_id?: string
  event_source_url?: string
  action_source: 'website' | 'app' | 'phone_call' | 'chat' | 'email' | 'other'
  user_data: UserData
  custom_data?: CustomData
  opt_out?: boolean
}

interface MetaApiResponse {
  events_received: number
  messages: string[]
  fbtrace_id: string
}

export class MetaConversionsAPI {
  private config: MetaApiConfig
  private baseUrl = 'https://graph.facebook.com/v18.0'

  constructor(config: MetaApiConfig) {
    this.config = config
  }

  /**
   * SHA256 해시 생성 (Meta 표준)
   */
  private hashValue(value: string): string {
    return crypto
      .createHash('sha256')
      .update(value.trim().toLowerCase())
      .digest('hex')
  }

  /**
   * 사용자 데이터 해시 처리
   */
  private hashUserData(userData: UserDataInput): UserData {
    const hashed: UserData = {}

    if (userData.email) hashed.em = this.hashValue(userData.email)
    if (userData.phone) hashed.ph = this.hashValue(userData.phone.replace(/\D/g, ''))
    if (userData.firstName) hashed.fn = this.hashValue(userData.firstName)
    if (userData.lastName) hashed.ln = this.hashValue(userData.lastName)
    if (userData.city) hashed.ct = this.hashValue(userData.city)
    if (userData.state) hashed.st = this.hashValue(userData.state)
    if (userData.zipCode) hashed.zp = this.hashValue(userData.zipCode)
    if (userData.country) hashed.country = this.hashValue(userData.country)
    if (userData.externalId) hashed.external_id = this.hashValue(userData.externalId)
    if (userData.clientIp) hashed.client_ip_address = userData.clientIp
    if (userData.userAgent) hashed.client_user_agent = userData.userAgent
    if (userData.fbc) hashed.fbc = userData.fbc
    if (userData.fbp) hashed.fbp = userData.fbp

    return hashed
  }

  /**
   * 이벤트 전송
   */
  async sendEvent(event: ServerEvent): Promise<MetaApiResponse> {
    const url = `${this.baseUrl}/${this.config.pixelId}/events`

    const payload: Record<string, unknown> = {
      data: [event],
      access_token: this.config.accessToken,
    }

    if (this.config.testEventCode) {
      payload.test_event_code = this.config.testEventCode
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Meta CAPI 오류: ${error}`)
    }

    return response.json()
  }

  /**
   * 구매 이벤트
   */
  async trackPurchase(params: {
    userData: UserDataInput
    value: number
    currency?: string
    orderId: string
    productIds?: string[]
    productName?: string
    numItems?: number
    eventSourceUrl?: string
  }): Promise<MetaApiResponse> {
    const event: ServerEvent = {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: `purchase_${params.orderId}_${Date.now()}`,
      event_source_url: params.eventSourceUrl,
      action_source: 'website',
      user_data: this.hashUserData(params.userData),
      custom_data: {
        value: params.value,
        currency: params.currency || 'KRW',
        content_ids: params.productIds,
        content_name: params.productName,
        content_type: 'product',
        num_items: params.numItems || 1,
        order_id: params.orderId,
      },
    }

    return this.sendEvent(event)
  }

  /**
   * 장바구니 추가 이벤트
   */
  async trackAddToCart(params: {
    userData: UserDataInput
    value: number
    currency?: string
    productId: string
    productName?: string
    eventSourceUrl?: string
  }): Promise<MetaApiResponse> {
    const event: ServerEvent = {
      event_name: 'AddToCart',
      event_time: Math.floor(Date.now() / 1000),
      event_id: `atc_${params.productId}_${Date.now()}`,
      event_source_url: params.eventSourceUrl,
      action_source: 'website',
      user_data: this.hashUserData(params.userData),
      custom_data: {
        value: params.value,
        currency: params.currency || 'KRW',
        content_ids: [params.productId],
        content_name: params.productName,
        content_type: 'product',
      },
    }

    return this.sendEvent(event)
  }

  /**
   * 상품 조회 이벤트
   */
  async trackViewContent(params: {
    userData: UserDataInput
    value?: number
    currency?: string
    productId: string
    productName?: string
    category?: string
    eventSourceUrl?: string
  }): Promise<MetaApiResponse> {
    const event: ServerEvent = {
      event_name: 'ViewContent',
      event_time: Math.floor(Date.now() / 1000),
      event_id: `vc_${params.productId}_${Date.now()}`,
      event_source_url: params.eventSourceUrl,
      action_source: 'website',
      user_data: this.hashUserData(params.userData),
      custom_data: {
        value: params.value,
        currency: params.currency || 'KRW',
        content_ids: [params.productId],
        content_name: params.productName,
        content_category: params.category,
        content_type: 'product',
      },
    }

    return this.sendEvent(event)
  }

  /**
   * 리드 이벤트 (회원가입, 문의 등)
   */
  async trackLead(params: {
    userData: UserDataInput
    value?: number
    currency?: string
    leadType?: string
    eventSourceUrl?: string
  }): Promise<MetaApiResponse> {
    const event: ServerEvent = {
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: `lead_${Date.now()}`,
      event_source_url: params.eventSourceUrl,
      action_source: 'website',
      user_data: this.hashUserData(params.userData),
      custom_data: {
        value: params.value,
        currency: params.currency || 'KRW',
        content_name: params.leadType,
      },
    }

    return this.sendEvent(event)
  }

  /**
   * 커스텀 이벤트
   */
  async trackCustomEvent(params: {
    eventName: string
    userData: UserDataInput
    customData?: CustomData
    eventSourceUrl?: string
  }): Promise<MetaApiResponse> {
    const event: ServerEvent = {
      event_name: params.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: `${params.eventName.toLowerCase()}_${Date.now()}`,
      event_source_url: params.eventSourceUrl,
      action_source: 'website',
      user_data: this.hashUserData(params.userData),
      custom_data: params.customData,
    }

    return this.sendEvent(event)
  }
}

/**
 * Meta Conversions API 인스턴스 생성 헬퍼
 */
export function createMetaClient(
  pixelId: string,
  accessToken: string,
  testEventCode?: string
): MetaConversionsAPI {
  return new MetaConversionsAPI({
    pixelId,
    accessToken,
    testEventCode,
  })
}
