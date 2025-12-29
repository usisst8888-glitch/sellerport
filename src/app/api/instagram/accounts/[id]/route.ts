import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Instagram 계정 연결 해제 API
 * DELETE /api/instagram/accounts/[id]
 *
 * 1. Meta API에서 앱 권한 해제
 * 2. DB에서 계정 및 관련 DM 설정 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: accountId } = await params
    const supabase = await createClient()

    // 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // 계정 조회 (본인 소유 확인)
    const { data: account, error: fetchError } = await supabase
      .from('instagram_accounts')
      .select('id, instagram_user_id, access_token, user_id')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !account) {
      return NextResponse.json({ error: '계정을 찾을 수 없습니다' }, { status: 404 })
    }

    // 1. Meta API에서 앱 권한 해제 (access_token이 있는 경우)
    if (account.access_token) {
      try {
        // Meta Graph API: 앱 권한 해제
        // https://developers.facebook.com/docs/graph-api/reference/user/permissions/
        const revokeUrl = `https://graph.instagram.com/${account.instagram_user_id}/permissions`
        const revokeResponse = await fetch(revokeUrl, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: account.access_token,
          }),
        })

        const revokeResult = await revokeResponse.json()

        if (!revokeResponse.ok) {
          // 권한 해제 실패해도 DB 삭제는 진행 (토큰 만료 등)
          console.warn('Meta permission revoke warning:', revokeResult)
        } else {
          console.log('Meta permission revoked successfully:', revokeResult)
        }
      } catch (revokeError) {
        // Meta API 오류는 로그만 남기고 계속 진행
        console.error('Meta API revoke error:', revokeError)
      }
    }

    // 2. 관련 DM 설정 삭제
    const { error: dmDeleteError } = await supabase
      .from('instagram_dm_settings')
      .delete()
      .eq('instagram_account_id', accountId)

    if (dmDeleteError) {
      console.error('DM settings delete error:', dmDeleteError)
      // 계속 진행
    }

    // 3. Instagram 계정 삭제
    const { error: deleteError } = await supabase
      .from('instagram_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Instagram account delete error:', deleteError)
      return NextResponse.json({ error: '계정 삭제에 실패했습니다' }, { status: 500 })
    }

    console.log('Instagram account disconnected:', {
      userId: user.id,
      accountId,
      instagramUserId: account.instagram_user_id,
    })

    return NextResponse.json({
      success: true,
      message: 'Instagram 계정 연결이 해제되었습니다',
    })

  } catch (error) {
    console.error('Instagram disconnect error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
