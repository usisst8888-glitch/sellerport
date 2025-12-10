/**
 * 토스페이먼츠 결제 API 클라이언트
 *
 * 슬롯 및 알림 충전을 위한 결제 연동
 * - 카드 결제
 * - 간편결제 (토스페이, 네이버페이, 카카오페이 등)
 * - 가상계좌
 *
 * 참조: https://docs.tosspayments.com/reference
 */

interface TossPaymentsConfig {
  secretKey: string
  clientKey: string
}

interface PaymentConfirmParams {
  paymentKey: string
  orderId: string
  amount: number
}

interface PaymentResponse {
  paymentKey: string
  orderId: string
  orderName: string
  status: string
  requestedAt: string
  approvedAt?: string
  method: string
  totalAmount: number
  balanceAmount: number
  suppliedAmount: number
  vat: number
  card?: {
    company: string
    number: string
    installmentPlanMonths: number
    isInterestFree: boolean
    approveNo: string
    cardType: string
    ownerType: string
  }
  virtualAccount?: {
    accountNumber: string
    accountType: string
    bank: string
    customerName: string
    dueDate: string
    refundStatus: string
    expired: boolean
  }
  receipt?: {
    url: string
  }
  checkout?: {
    url: string
  }
  failure?: {
    code: string
    message: string
  }
}

interface PaymentCancelParams {
  paymentKey: string
  cancelReason: string
  cancelAmount?: number
}

interface BillingKeyParams {
  customerKey: string
  authKey: string
}

interface BillingKeyResponse {
  billingKey: string
  customerKey: string
  method: string
  card?: {
    company: string
    number: string
    cardType: string
    ownerType: string
  }
}

export class TossPaymentsClient {
  private config: TossPaymentsConfig
  private baseUrl = 'https://api.tosspayments.com/v1'

  constructor(config: TossPaymentsConfig) {
    this.config = config
  }

  /**
   * Basic Auth 헤더 생성
   */
  private getAuthHeader(): string {
    const credentials = Buffer.from(`${this.config.secretKey}:`).toString('base64')
    return `Basic ${credentials}`
  }

  /**
   * 결제 승인
   */
  async confirmPayment(params: PaymentConfirmParams): Promise<PaymentResponse> {
    const response = await fetch(`${this.baseUrl}/payments/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentKey: params.paymentKey,
        orderId: params.orderId,
        amount: params.amount,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '결제 승인에 실패했습니다')
    }

    return data
  }

  /**
   * 결제 조회
   */
  async getPayment(paymentKey: string): Promise<PaymentResponse> {
    const response = await fetch(`${this.baseUrl}/payments/${paymentKey}`, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '결제 조회에 실패했습니다')
    }

    return data
  }

  /**
   * 주문 ID로 결제 조회
   */
  async getPaymentByOrderId(orderId: string): Promise<PaymentResponse> {
    const response = await fetch(`${this.baseUrl}/payments/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
      },
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '결제 조회에 실패했습니다')
    }

    return data
  }

  /**
   * 결제 취소
   */
  async cancelPayment(params: PaymentCancelParams): Promise<PaymentResponse> {
    const body: Record<string, unknown> = {
      cancelReason: params.cancelReason,
    }

    if (params.cancelAmount) {
      body.cancelAmount = params.cancelAmount
    }

    const response = await fetch(`${this.baseUrl}/payments/${params.paymentKey}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '결제 취소에 실패했습니다')
    }

    return data
  }

  /**
   * 빌링키 발급 (자동결제용)
   */
  async issueBillingKey(params: BillingKeyParams): Promise<BillingKeyResponse> {
    const response = await fetch(`${this.baseUrl}/billing/authorizations/issue`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerKey: params.customerKey,
        authKey: params.authKey,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '빌링키 발급에 실패했습니다')
    }

    return data
  }

  /**
   * 빌링키로 자동결제
   */
  async payWithBillingKey(params: {
    billingKey: string
    customerKey: string
    amount: number
    orderId: string
    orderName: string
  }): Promise<PaymentResponse> {
    const response = await fetch(`${this.baseUrl}/billing/${params.billingKey}`, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerKey: params.customerKey,
        amount: params.amount,
        orderId: params.orderId,
        orderName: params.orderName,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || '자동결제에 실패했습니다')
    }

    return data
  }

  /**
   * 클라이언트 키 반환 (프론트엔드용)
   */
  getClientKey(): string {
    return this.config.clientKey
  }
}

/**
 * 토스페이먼츠 클라이언트 생성 헬퍼
 */
export function createTossPaymentsClient(
  secretKey: string,
  clientKey: string
): TossPaymentsClient {
  return new TossPaymentsClient({
    secretKey,
    clientKey,
  })
}

/**
 * 주문 ID 생성 헬퍼
 */
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `SP_${timestamp}_${random}`.toUpperCase()
}

/**
 * 상품 정보
 */
export const Products = {
  // 슬롯 충전
  slots: (quantity: number) => ({
    name: `전환 추적 슬롯 ${quantity}개`,
    amount: quantity * 2000,
    quantity,
    type: 'slot' as const,
  }),

  // 알림 충전
  alerts: (quantity: number) => ({
    name: `알림톡 ${quantity}건`,
    amount: quantity * 15,
    quantity,
    type: 'alert' as const,
  }),

  // 슬롯 패키지
  slotPackages: {
    starter: { name: '스타터 패키지 (슬롯 10개)', amount: 18000, quantity: 10 },
    growth: { name: '그로스 패키지 (슬롯 50개)', amount: 80000, quantity: 50 },
    pro: { name: '프로 패키지 (슬롯 100개)', amount: 150000, quantity: 100 },
  },

  // 알림 패키지
  alertPackages: {
    basic: { name: '베이직 (알림 100건)', amount: 1400, quantity: 100 },
    standard: { name: '스탠다드 (알림 500건)', amount: 6500, quantity: 500 },
    premium: { name: '프리미엄 (알림 1000건)', amount: 12000, quantity: 1000 },
  },
}
