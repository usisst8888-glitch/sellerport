/**
 * 알리고 SMS 발송 API
 * 회원가입 전화번호 인증용
 */

export async function sendSMS(
  receiver: string,
  message: string,
  sender?: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.ALIGO_API_KEY
  const userId = process.env.ALIGO_USER_ID
  const senderPhone = sender || process.env.ALIGO_SENDER_PHONE
  const proxyUrl = process.env.NAVER_PROXY_URL
  const proxyApiKey = process.env.NAVER_PROXY_API_KEY

  if (!apiKey || !userId || !senderPhone) {
    console.error('Aligo SMS config missing:', { apiKey: !!apiKey, userId: !!userId, senderPhone: !!senderPhone })
    throw new Error('알리고 SMS 설정이 없습니다')
  }

  // GCP 프록시 서버를 통해 발송 (고정 IP 34.64.115.226 사용)
  if (proxyUrl && proxyApiKey) {
    try {
      const response = await fetch(`${proxyUrl}/aligo/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': proxyApiKey,
        },
        body: JSON.stringify({
          key: apiKey,
          user_id: userId,
          sender: senderPhone,
          receiver,
          msg: message,
          msg_type: 'SMS',
        }),
      })

      const result = await response.json()

      if (result.result_code === '1' || result.success) {
        return { success: true }
      } else {
        console.error('Aligo SMS error (via proxy):', result)
        return { success: false, error: result.message || '발송 실패' }
      }
    } catch (error) {
      console.error('Aligo SMS proxy error:', error)
      return { success: false, error: error instanceof Error ? error.message : '프록시 오류' }
    }
  }

  // 프록시 없이 직접 호출 (개발 환경 등)
  const formData = new FormData()
  formData.append('key', apiKey)
  formData.append('user_id', userId)
  formData.append('sender', senderPhone)
  formData.append('receiver', receiver)
  formData.append('msg', message)
  formData.append('msg_type', 'SMS') // SMS, LMS, MMS

  try {
    const response = await fetch('https://apis.aligo.in/send/', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()

    // result_code: 1 = 성공
    if (result.result_code === '1') {
      return { success: true }
    } else {
      console.error('Aligo SMS error:', result)
      return { success: false, error: result.message || '발송 실패' }
    }
  } catch (error) {
    console.error('Aligo SMS fetch error:', error)
    return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류' }
  }
}
