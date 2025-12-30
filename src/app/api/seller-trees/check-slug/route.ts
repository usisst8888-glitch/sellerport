import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 슬러그 사용 가능 여부 확인
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    // 슬러그 형식 검증
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({
        available: false,
        reason: 'invalid_format',
        message: '영문 소문자, 숫자, 하이픈(-)만 사용할 수 있습니다.'
      })
    }

    // 길이 검증
    if (slug.length < 3) {
      return NextResponse.json({
        available: false,
        reason: 'too_short',
        message: '최소 3자 이상이어야 합니다.'
      })
    }

    if (slug.length > 50) {
      return NextResponse.json({
        available: false,
        reason: 'too_long',
        message: '최대 50자까지 가능합니다.'
      })
    }

    // 예약어 체크
    const reservedSlugs = ['admin', 'api', 'login', 'signup', 'dashboard', 'settings', 'help', 'support', 'about']
    if (reservedSlugs.includes(slug)) {
      return NextResponse.json({
        available: false,
        reason: 'reserved',
        message: '사용할 수 없는 주소입니다.'
      })
    }

    // 중복 확인
    const { data: existing } = await supabase
      .from('seller_trees')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json({
        available: false,
        reason: 'taken',
        message: '이미 사용 중인 주소입니다.'
      })
    }

    return NextResponse.json({
      available: true,
      message: '사용 가능한 주소입니다.'
    })
  } catch (error) {
    console.error('Check slug error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
