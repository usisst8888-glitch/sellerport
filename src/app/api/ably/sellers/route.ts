/**
 * 에이블리 셀러 정보 API
 * POST /api/ably/sellers - 셀러 정보 저장
 * GET /api/ably/sellers - 셀러 목록 조회
 * GET /api/ably/sellers?format=csv - CSV 다운로드
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface SellerInfo {
  상호: string
  대표자: string
  주소: string
  사업자등록번호: string
  통신판매업신고번호: string
  이메일: string
  전화번호: string
  url: string
  collectedAt: string
}

// POST: 셀러 정보 저장
export async function POST(request: NextRequest) {
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

    const body: SellerInfo = await request.json()

    if (!body.상호) {
      return NextResponse.json({
        success: false,
        error: '상호는 필수입니다.'
      }, { status: 400 })
    }

    // 중복 체크
    const { data: existing } = await supabaseAdmin
      .from('ably_sellers')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_name', body.상호)
      .eq('business_number', body.사업자등록번호 || '')
      .single()

    if (existing) {
      // 기존 데이터 개수 조회
      const { count } = await supabaseAdmin
        .from('ably_sellers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      return NextResponse.json({
        success: true,
        duplicate: true,
        totalCount: count || 0,
        message: '이미 저장된 셀러입니다.'
      })
    }

    // 새 데이터 저장
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('ably_sellers')
      .insert({
        user_id: user.id,
        company_name: body.상호,
        representative: body.대표자 || '',
        address: body.주소 || '',
        business_number: body.사업자등록번호 || '',
        ecommerce_number: body.통신판매업신고번호 || '',
        email: body.이메일 || '',
        phone: body.전화번호 || '',
        source_url: body.url || '',
        collected_at: body.collectedAt || new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)

      if (insertError.code === '42P01') {
        return NextResponse.json({
          success: false,
          error: 'ably_sellers 테이블이 없습니다. 마이그레이션을 실행해주세요.'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: false,
        error: insertError.message
      }, { status: 500 })
    }

    // 전체 개수 조회
    const { count } = await supabaseAdmin
      .from('ably_sellers')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    console.log(`[Ably Sellers] Saved: ${body.상호}, Total: ${count}`)

    return NextResponse.json({
      success: true,
      duplicate: false,
      totalCount: count || 0,
      data: inserted
    })

  } catch (error) {
    console.error('Ably sellers POST error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// GET: 셀러 목록 조회 또는 CSV 다운로드
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

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format')

    // 데이터 조회
    const { data: sellers, error } = await supabaseAdmin
      .from('ably_sellers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    // CSV 다운로드
    if (format === 'csv') {
      const headers = ['순번', '상호', '대표자', '주소', '사업자등록번호', '통신판매업신고번호', '이메일', '전화번호', 'URL', '수집일시']
      const rows = (sellers || []).map((seller, index) => [
        index + 1,
        seller.company_name || '',
        seller.representative || '',
        seller.address || '',
        seller.business_number || '',
        seller.ecommerce_number || '',
        seller.email || '',
        seller.phone || '',
        seller.source_url || '',
        seller.collected_at ? new Date(seller.collected_at).toLocaleString('ko-KR') : ''
      ])

      const BOM = '\uFEFF'
      const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      const date = new Date().toISOString().split('T')[0]

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="셀러정보_${date}.csv"`
        }
      })
    }

    // JSON 응답
    return NextResponse.json({
      success: true,
      data: sellers,
      count: sellers?.length || 0
    })

  } catch (error) {
    console.error('Ably sellers GET error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// DELETE: 전체 삭제
export async function DELETE(request: NextRequest) {
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

    const { error } = await supabaseAdmin
      .from('ably_sellers')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Ably sellers DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
