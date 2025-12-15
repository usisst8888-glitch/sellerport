import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  scope: string
}

interface GoogleAdsCustomer {
  resourceName: string
  id: string
  descriptiveName: string
  currencyCode: string
  timeZone: string
  manager?: boolean
}

interface GoogleAdsCustomersResponse {
  resourceNames: string[]
}

// Google OAuth 콜백 처리
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // 사용자가 거부하거나 에러 발생
    if (error) {
      console.error('Google OAuth error:', error, errorDescription)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=${encodeURIComponent(errorDescription || error)}`
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=invalid_request`
      )
    }

    // state에서 user_id 추출
    let userId: string
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = stateData.userId

      // timestamp 검증 (10분 이내)
      if (Date.now() - stateData.timestamp > 10 * 60 * 1000) {
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=state_expired`
        )
      }
    } catch {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=invalid_state`
      )
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
    const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    const GOOGLE_ADS_LOGIN_CUSTOMER_ID = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=configuration_error`
      )
    }

    // 1. Authorization code를 Access token으로 교환
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }),
    })

    const tokenData: GoogleTokenResponse = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error('Failed to get access token:', tokenData)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=token_exchange_failed`
      )
    }

    // 2. Google Ads API로 접근 가능한 고객(계정) 목록 가져오기
    let customers: GoogleAdsCustomer[] = []

    if (GOOGLE_ADS_DEVELOPER_TOKEN) {
      try {
        // 먼저 접근 가능한 고객 목록 가져오기
        const customersResponse = await fetch(
          'https://googleads.googleapis.com/v18/customers:listAccessibleCustomers',
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
            },
          }
        )

        const customersData: GoogleAdsCustomersResponse = await customersResponse.json()

        if (customersData.resourceNames && customersData.resourceNames.length > 0) {
          // 각 고객의 상세 정보 가져오기
          for (const resourceName of customersData.resourceNames) {
            const customerId = resourceName.replace('customers/', '')

            try {
              const customerResponse = await fetch(
                `https://googleads.googleapis.com/v18/${resourceName}`,
                {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${tokenData.access_token}`,
                    'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
                    ...(GOOGLE_ADS_LOGIN_CUSTOMER_ID && {
                      'login-customer-id': GOOGLE_ADS_LOGIN_CUSTOMER_ID,
                    }),
                  },
                }
              )

              if (customerResponse.ok) {
                const customerData = await customerResponse.json()
                customers.push({
                  resourceName: resourceName,
                  id: customerId,
                  descriptiveName: customerData.descriptiveName || `Account ${customerId}`,
                  currencyCode: customerData.currencyCode || 'KRW',
                  timeZone: customerData.timeZone || 'Asia/Seoul',
                  manager: customerData.manager || false,
                })
              }
            } catch (customerError) {
              console.error(`Failed to fetch customer ${customerId}:`, customerError)
            }
          }
        }
      } catch (adsError) {
        console.error('Failed to fetch Google Ads customers:', adsError)
        // Google Ads API 에러가 발생해도 계속 진행 (토큰만 저장)
      }
    }

    // 3. Supabase에 저장
    const supabase = await createClient()

    // 관리자 계정이 아닌 첫 번째 계정 사용 (또는 첫 번째 계정)
    const activeCustomer = customers.find(c => !c.manager) || customers[0]

    const channelData = {
      user_id: userId,
      channel_type: 'google_ads',
      channel_name: activeCustomer?.descriptiveName || 'Google Ads',
      account_id: activeCustomer?.id || 'pending',
      account_name: activeCustomer?.descriptiveName || 'Google Ads Account',
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      status: customers.length > 0 ? 'connected' : 'pending_setup',
      last_sync_at: new Date().toISOString(),
      metadata: {
        currency: activeCustomer?.currencyCode || 'KRW',
        timezone: activeCustomer?.timeZone || 'Asia/Seoul',
        customer_id: activeCustomer?.id,
        all_customers: customers.map(c => ({
          id: c.id,
          name: c.descriptiveName,
          currency: c.currencyCode,
          manager: c.manager,
        })),
        developer_token_configured: !!GOOGLE_ADS_DEVELOPER_TOKEN,
      },
    }

    // 기존 연동이 있는지 확인
    const { data: existingChannel } = await supabase
      .from('ad_channels')
      .select('id')
      .eq('user_id', userId)
      .eq('channel_type', 'google_ads')
      .maybeSingle()

    if (existingChannel) {
      // 기존 연동 업데이트
      await supabase
        .from('ad_channels')
        .update(channelData)
        .eq('id', existingChannel.id)
    } else {
      // 새 연동 생성
      const { error: insertError } = await supabase
        .from('ad_channels')
        .insert(channelData)

      if (insertError) {
        console.error('Failed to save ad channel:', insertError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=save_failed`
        )
      }
    }

    // 성공 시 ad-channels 페이지로 리다이렉트
    const successMessage = customers.length > 0
      ? 'google_ads_connected'
      : 'google_ads_pending'

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?success=${successMessage}`
    )
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/ad-channels?error=internal_error`
    )
  }
}
