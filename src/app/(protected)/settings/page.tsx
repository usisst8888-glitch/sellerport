import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-500 mt-1">계정 및 사업자 정보를 관리합니다</p>
      </div>

      <div className="space-y-6">
        {/* 계정 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>계정 정보</CardTitle>
            <CardDescription>로그인 계정 정보입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>이메일</Label>
              <Input value={user?.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>가입일</Label>
              <Input
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : ''}
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* 사업자 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>사업자 정보</CardTitle>
            <CardDescription>정기구독 서비스를 운영하는 사업자 정보입니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">상호명</Label>
                <Input
                  id="business_name"
                  placeholder="상호명을 입력하세요"
                  defaultValue={profile?.business_name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_number">사업자등록번호</Label>
                <Input
                  id="business_number"
                  placeholder="000-00-00000"
                  defaultValue={profile?.business_number || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner_name">대표자명</Label>
                <Input
                  id="owner_name"
                  placeholder="대표자명을 입력하세요"
                  defaultValue={profile?.owner_name || ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  placeholder="010-0000-0000"
                  defaultValue={profile?.phone || ''}
                />
              </div>
            </div>
            <Button disabled>저장하기</Button>
          </CardContent>
        </Card>

        {/* 플랜 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>플랜 정보</CardTitle>
            <CardDescription>현재 이용 중인 플랜입니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-lg">Free 플랜</p>
                <p className="text-sm text-gray-500">구독자 10명, 플랫폼 1개</p>
              </div>
              <Button variant="outline" disabled>플랜 업그레이드</Button>
            </div>
          </CardContent>
        </Card>

        {/* API 설정 */}
        <Card>
          <CardHeader>
            <CardTitle>API 설정</CardTitle>
            <CardDescription>외부 서비스 연동을 위한 API 키를 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="aligo_key">알리고 API 키</Label>
              <Input
                id="aligo_key"
                type="password"
                placeholder="알리고 API 키를 입력하세요"
              />
              <p className="text-xs text-gray-500">카카오 알림톡 발송에 사용됩니다</p>
            </div>
            <Button disabled>저장하기</Button>
          </CardContent>
        </Card>

        {/* 위험 구역 */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">위험 구역</CardTitle>
            <CardDescription>되돌릴 수 없는 작업입니다</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" disabled>계정 삭제</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
