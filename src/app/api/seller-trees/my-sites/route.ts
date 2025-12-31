import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 사용자의 쇼핑몰 목록 조회
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: sites, error } = await supabase
      .from('my_sites')
      .select('id, site_type, site_name, store_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching my sites:', error)
      return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
    }

    return NextResponse.json({ sites: sites || [] })
  } catch (error) {
    console.error('My sites API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
