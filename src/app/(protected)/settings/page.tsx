import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">설정</h1>
        <p className="text-slate-400 mt-1">계정 및 사업자 정보를 관리합니다</p>
      </div>

      <div className="space-y-6">
        {/* 계정 정보 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">계정 정보</h2>
          <p className="text-sm text-slate-400 mb-5">로그인 계정 정보입니다</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">이메일</Label>
              <Input
                value={user?.email || ''}
                className="bg-slate-700 border-slate-600 text-white"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">가입일</Label>
              <Input
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : ''}
                className="bg-slate-700 border-slate-600 text-white"
                disabled
              />
            </div>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">사업자 정보</h2>
          <p className="text-sm text-slate-400 mb-5">정기구독 서비스를 운영하는 사업자 정보입니다</p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name" className="text-slate-300">상호명</Label>
                <Input
                  id="business_name"
                  placeholder="상호명을 입력하세요"
                  defaultValue={profile?.business_name || ''}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_number" className="text-slate-300">사업자등록번호</Label>
                <Input
                  id="business_number"
                  placeholder="000-00-00000"
                  defaultValue={profile?.business_number || ''}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner_name" className="text-slate-300">대표자명</Label>
                <Input
                  id="owner_name"
                  placeholder="대표자명을 입력하세요"
                  defaultValue={profile?.owner_name || ''}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">연락처</Label>
                <Input
                  id="phone"
                  placeholder="010-0000-0000"
                  defaultValue={profile?.phone || ''}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white" disabled>저장하기</Button>
          </div>
        </div>

        {/* 플랜 정보 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">플랜 정보</h2>
          <p className="text-sm text-slate-400 mb-5">현재 이용 중인 플랜입니다</p>

          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div>
              <p className="font-semibold text-lg text-white">Free 플랜</p>
              <p className="text-sm text-slate-400">구독자 10명, 플랫폼 1개</p>
            </div>
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700" disabled>플랜 업그레이드</Button>
          </div>
        </div>

        {/* 카카오톡 채널 설정 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">카카오톡 채널</h2>
          <p className="text-sm text-slate-400 mb-5">알림톡 발송에 사용할 카카오톡 채널을 등록합니다</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kakao_channel" className="text-slate-300">카카오톡 채널 ID</Label>
              <Input
                id="kakao_channel"
                placeholder="@채널아이디"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">카카오톡 채널 관리자센터에서 확인할 수 있습니다</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                셀러포트에서 알림톡 발송 API를 제공합니다. 별도의 알리고 계약이 필요 없습니다.
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white" disabled>채널 등록</Button>
          </div>
        </div>

        {/* 위험 구역 */}
        <div className="bg-slate-800 border border-red-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-1">위험 구역</h2>
          <p className="text-sm text-slate-400 mb-5">되돌릴 수 없는 작업입니다</p>

          <Button variant="destructive" className="bg-red-600 hover:bg-red-500" disabled>계정 삭제</Button>
        </div>
      </div>
    </div>
  )
}
