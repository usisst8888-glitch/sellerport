/**
 * 알리고 알림톡 API 클라이언트
 *
 * 카카오 알림톡/친구톡 발송을 위한 알리고 API 연동
 * - 알림톡 발송 (템플릿 기반)
 * - 친구톡 발송 (광고/마케팅)
 * - 발송 결과 조회
 *
 * 참조: https://smartsms.aligo.in/admin/api/kakao.html
 */

interface AligoConfig {
  apiKey: string
  userId: string
  senderKey: string // 발신프로필 키
}

interface AlimtalkButton {
  name: string
  linkType: 'WL' | 'AL' | 'BK' | 'MD' | 'DS' // 웹링크, 앱링크, 봇키워드, 메시지전달, 배송조회
  linkTypeName?: string
  linkPc?: string
  linkMo?: string
  linkAnd?: string
  linkIos?: string
}

interface SendAlimtalkParams {
  receiver: string // 수신자 전화번호
  templateCode: string // 템플릿 코드
  subject?: string // 알림톡 제목 (30자 이내)
  message: string // 알림톡 내용 (1000자 이내)
  buttons?: AlimtalkButton[]
  failover?: {
    type: 'SMS' | 'LMS' | 'MMS'
    subject?: string
    message: string
  }
}

interface SendFriendtalkParams {
  receiver: string
  subject?: string
  message: string
  imageUrl?: string
  buttons?: AlimtalkButton[]
  adFlag?: 'Y' | 'N' // 광고 표시 여부
}

interface AligoResponse {
  code: number
  message: string
  info?: {
    type: string
    mid: number
    current: string
    unit: number
    total: number
    scnt: number
    fcnt: number
  }
}

interface SendResult {
  success: boolean
  messageId?: number
  error?: string
}

export class AligoAlimtalkAPI {
  private config: AligoConfig
  private baseUrl = 'https://kakaoapi.aligo.in'

  constructor(config: AligoConfig) {
    this.config = config
  }

  /**
   * 알림톡 발송
   */
  async sendAlimtalk(params: SendAlimtalkParams): Promise<SendResult> {
    const formData = new FormData()
    formData.append('apikey', this.config.apiKey)
    formData.append('userid', this.config.userId)
    formData.append('senderkey', this.config.senderKey)
    formData.append('tpl_code', params.templateCode)
    formData.append('sender', '') // 발신번호 (알림톡은 필수 아님)
    formData.append('receiver_1', params.receiver)
    formData.append('subject_1', params.subject || '')
    formData.append('message_1', params.message)

    if (params.buttons && params.buttons.length > 0) {
      formData.append('button_1', JSON.stringify({
        button: params.buttons.map(btn => ({
          name: btn.name,
          linkType: btn.linkType,
          linkTypeName: btn.linkTypeName || '',
          linkPc: btn.linkPc || '',
          linkMo: btn.linkMo || '',
          linkAnd: btn.linkAnd || '',
          linkIos: btn.linkIos || '',
        }))
      }))
    }

    // 실패 시 문자 발송 설정
    if (params.failover) {
      formData.append('failover', 'Y')
      formData.append('fsubject_1', params.failover.subject || '')
      formData.append('fmessage_1', params.failover.message)
    }

    try {
      const response = await fetch(`${this.baseUrl}/akv10/alimtalk/send/`, {
        method: 'POST',
        body: formData,
      })

      const result: AligoResponse = await response.json()

      if (result.code === 0) {
        return {
          success: true,
          messageId: result.info?.mid,
        }
      } else {
        return {
          success: false,
          error: result.message,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }
    }
  }

  /**
   * 친구톡 발송 (이미지 없음)
   */
  async sendFriendtalk(params: SendFriendtalkParams): Promise<SendResult> {
    const formData = new FormData()
    formData.append('apikey', this.config.apiKey)
    formData.append('userid', this.config.userId)
    formData.append('senderkey', this.config.senderKey)
    formData.append('sender', '') // 발신번호
    formData.append('receiver_1', params.receiver)
    formData.append('subject_1', params.subject || '')
    formData.append('message_1', params.message)

    if (params.adFlag) {
      formData.append('adFlag', params.adFlag)
    }

    if (params.buttons && params.buttons.length > 0) {
      formData.append('button_1', JSON.stringify({
        button: params.buttons.map(btn => ({
          name: btn.name,
          linkType: btn.linkType,
          linkTypeName: btn.linkTypeName || '',
          linkPc: btn.linkPc || '',
          linkMo: btn.linkMo || '',
        }))
      }))
    }

    try {
      const response = await fetch(`${this.baseUrl}/akv10/friend/send/`, {
        method: 'POST',
        body: formData,
      })

      const result: AligoResponse = await response.json()

      if (result.code === 0) {
        return {
          success: true,
          messageId: result.info?.mid,
        }
      } else {
        return {
          success: false,
          error: result.message,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }
    }
  }

  /**
   * 발송 결과 조회
   */
  async getMessageStatus(messageId: number): Promise<{
    success: boolean
    status?: string
    error?: string
  }> {
    const formData = new FormData()
    formData.append('apikey', this.config.apiKey)
    formData.append('userid', this.config.userId)
    formData.append('mid', messageId.toString())

    try {
      const response = await fetch(`${this.baseUrl}/akv10/history/list/`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.code === 0) {
        return {
          success: true,
          status: result.list?.[0]?.status || 'unknown',
        }
      } else {
        return {
          success: false,
          error: result.message,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }
    }
  }

  /**
   * 템플릿 목록 조회
   */
  async getTemplates(): Promise<{
    success: boolean
    templates?: Array<{
      templtCode: string
      templtName: string
      templtContent: string
      status: string
    }>
    error?: string
  }> {
    const formData = new FormData()
    formData.append('apikey', this.config.apiKey)
    formData.append('userid', this.config.userId)
    formData.append('senderkey', this.config.senderKey)

    try {
      const response = await fetch(`${this.baseUrl}/akv10/template/list/`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.code === 0) {
        return {
          success: true,
          templates: result.list || [],
        }
      } else {
        return {
          success: false,
          error: result.message,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }
    }
  }

  /**
   * 잔여 포인트 조회
   */
  async getBalance(): Promise<{
    success: boolean
    balance?: number
    error?: string
  }> {
    const formData = new FormData()
    formData.append('apikey', this.config.apiKey)
    formData.append('userid', this.config.userId)

    try {
      const response = await fetch(`${this.baseUrl}/akv10/token/`, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.code === 0) {
        return {
          success: true,
          balance: result.info?.remain || 0,
        }
      } else {
        return {
          success: false,
          error: result.message,
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      }
    }
  }
}

/**
 * 알리고 알림톡 API 인스턴스 생성 헬퍼
 */
export function createAligoClient(
  apiKey: string,
  userId: string,
  senderKey: string
): AligoAlimtalkAPI {
  return new AligoAlimtalkAPI({
    apiKey,
    userId,
    senderKey,
  })
}

/**
 * 알림 메시지 템플릿 헬퍼
 */
export const AlertTemplates = {
  // 빨간불 알림
  redLight: (productName: string, roas: number) =>
    `[셀러포트 알림]\n\n${productName} 상품의 ROAS가 ${roas}%로 하락했습니다.\n\n광고 효율이 낮습니다. 상세페이지나 광고 소재 개선을 권장합니다.`,

  // 노란불 전환 알림
  yellowLight: (productName: string) =>
    `[셀러포트 알림]\n\n${productName} 상품이 노란불로 전환되었습니다.\n\n광고 효율이 보통 수준입니다. 모니터링을 계속해주세요.`,

  // 초록불 달성 알림
  greenLight: (productName: string, roas: number) =>
    `[셀러포트 알림]\n\n축하합니다! ${productName} 상품이 ROAS ${roas}%를 달성했습니다.\n\n광고가 효율적으로 운영되고 있습니다.`,

  // 재고 부족 알림
  lowStock: (productName: string, stock: number) =>
    `[셀러포트 알림]\n\n${productName} 상품의 재고가 ${stock}개 남았습니다.\n\n재고 보충을 권장합니다.`,

  // 일일 리포트
  dailyReport: (date: string, orders: number, revenue: number) =>
    `[셀러포트 일일 리포트]\n\n${date} 실적 요약\n- 주문: ${orders}건\n- 매출: ${revenue.toLocaleString()}원\n\n자세한 내용은 대시보드에서 확인하세요.`,
}
