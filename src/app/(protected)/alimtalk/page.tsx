import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AlimtalkPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">알림톡</h1>
          <p className="text-gray-500 mt-1">카카오 알림톡 발송 및 관리</p>
        </div>
        <Button disabled>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          새 템플릿
        </Button>
      </div>

      {/* 잔액 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>알림톡 잔액</CardDescription>
            <CardTitle className="text-3xl">0원</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" disabled>충전하기</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>이번 달 발송</CardDescription>
            <CardTitle className="text-3xl">0건</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>발송 단가</CardDescription>
            <CardTitle className="text-3xl">22원</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-gray-500">Free 플랜 기준</p>
          </CardContent>
        </Card>
      </div>

      {/* 템플릿 목록 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>알림톡 템플릿</CardTitle>
          <CardDescription>발송에 사용할 템플릿을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 mb-4">등록된 템플릿이 없습니다</p>
            <Button disabled>템플릿 만들기</Button>
          </div>
        </CardContent>
      </Card>

      {/* 발송 내역 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 발송 내역</CardTitle>
          <CardDescription>최근 7일간 발송 내역</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500">발송 내역이 없습니다</p>
          </div>
        </CardContent>
      </Card>

      {/* 알리고 연동 안내 */}
      <Card className="mt-6 bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">알리고 API 연동 필요</p>
              <p className="text-xs text-yellow-700 mt-1">
                알림톡 발송을 위해서는 알리고 계정과 API 키가 필요합니다.
                설정에서 API 키를 등록해주세요.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
