import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ShipmentsPage() {
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">발송 관리</h1>
          <p className="text-gray-500 mt-1">{today}</p>
        </div>
      </div>

      {/* 오늘 발송 현황 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>발송 예정</CardDescription>
            <CardTitle className="text-3xl">0건</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>발송 완료</CardDescription>
            <CardTitle className="text-3xl text-green-600">0건</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>발송 실패</CardDescription>
            <CardTitle className="text-3xl text-red-600">0건</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* 발송 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>오늘 발송 목록</CardTitle>
          <CardDescription>오늘 발송해야 할 정기구독 상품 목록입니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">발송 예정 건이 없습니다</h3>
            <p className="text-gray-500 mb-6 max-w-sm">
              플랫폼을 연동하고 구독자를 동기화하면<br />발송 목록이 자동으로 생성됩니다
            </p>
            <Link href="/platforms">
              <Button>
                플랫폼 연동하기
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
