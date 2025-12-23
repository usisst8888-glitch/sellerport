/**
 * 스마트스토어 사용자정의채널 전환 데이터 API
 * POST /api/smartstore/conversions
 *
 * 크롬 확장에서 수집한 스마트스토어 사용자정의채널 데이터를 저장
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Admin 클라이언트 (RLS 우회)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ChannelData {
  deviceType: string      // PC, 모바일
  nt_source: string       // meta, facebook, google 등
  nt_medium: string       // paid, cpc, organic 등
  nt_detail?: string
  visitors: number        // 고객수
  visits: number          // 유입수
  orders: number          // 결제수 (마지막클릭 기준)
  revenue: number         // 결제금액 (마지막클릭 기준)
  ordersEstimated: number // 결제수 (기여도추정)
  revenueEstimated: number // 결제금액 (기여도추정)
  conversionRate: number  // 유입당 결제율
}

interface RequestBody {
  channels: ChannelData[]
  dateRange: {
    startDate: string
    endDate: string
  } | null
  collectedAt: string
  source: string
}

export async function POST(request: NextRequest) {
  try {
    // Authorization 헤더에서 토큰 추출
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // 토큰으로 사용자 정보 조회
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      }, { status: 401 })
    }

    const body: RequestBody = await request.json()
    const { channels, dateRange, collectedAt, source } = body

    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return NextResponse.json({
        success: false,
        error: '채널 데이터가 없습니다.'
      }, { status: 400 })
    }

    console.log(`[Smartstore Conversions] User: ${user.id}, Channels: ${channels.length}`)

    // 유효한 채널 필터링 (전체 행 제외)
    const validChannels = channels.filter(ch =>
      ch.nt_source &&
      ch.nt_source !== '전체' &&
      ch.nt_source !== ''
    )

    if (validChannels.length === 0) {
      return NextResponse.json({
        success: false,
        error: '유효한 채널 데이터가 없습니다.'
      }, { status: 400 })
    }

    // 날짜 범위 파싱
    const startDate = dateRange?.startDate || new Date().toISOString().split('T')[0]
    const endDate = dateRange?.endDate || new Date().toISOString().split('T')[0]

    // 기존 데이터 삭제 (같은 날짜 범위)
    await supabaseAdmin
      .from('smartstore_channel_stats')
      .delete()
      .eq('user_id', user.id)
      .eq('start_date', startDate)
      .eq('end_date', endDate)

    // 새 데이터 삽입
    const insertData = validChannels.map(channel => ({
      user_id: user.id,
      device_type: channel.deviceType || 'all',
      nt_source: channel.nt_source,
      nt_medium: channel.nt_medium || '',
      nt_detail: channel.nt_detail || '',
      visitors: channel.visitors || 0,
      visits: channel.visits || 0,
      orders: channel.orders || 0,
      revenue: channel.revenue || 0,
      orders_estimated: channel.ordersEstimated || 0,
      revenue_estimated: channel.revenueEstimated || 0,
      conversion_rate: channel.conversionRate || 0,
      start_date: startDate,
      end_date: endDate,
      collected_at: collectedAt,
      source: source || 'chrome-extension'
    }))

    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from('smartstore_channel_stats')
      .insert(insertData)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)

      // 테이블이 없으면 생성 안내
      if (insertError.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: 'smartstore_channel_stats 테이블이 없습니다. 관리자에게 문의하세요.'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: false,
        error: `데이터 저장 실패: ${insertError.message}`
      }, { status: 500 })
    }

    console.log(`[Smartstore Conversions] Inserted ${insertedData?.length || 0} records`)

    return NextResponse.json({
      success: true,
      data: {
        inserted: insertedData?.length || 0,
        dateRange: { startDate, endDate },
        channels: validChannels.map(ch => ({
          source: ch.nt_source,
          medium: ch.nt_medium
        }))
      }
    })

  } catch (error) {
    console.error('Smartstore conversions error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// GET: 사용자의 스마트스토어 채널 통계 조회
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다.'
      }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 토큰입니다.'
      }, { status: 401 })
    }

    // URL 파라미터에서 날짜 범위 추출
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let query = supabaseAdmin
      .from('smartstore_channel_stats')
      .select('*')
      .eq('user_id', user.id)
      .order('visits', { ascending: false })

    if (startDate) {
      query = query.gte('start_date', startDate)
    }
    if (endDate) {
      query = query.lte('end_date', endDate)
    }

    const { data, error } = await query

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({
        success: false,
        error: '데이터 조회 실패'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Smartstore conversions GET error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
