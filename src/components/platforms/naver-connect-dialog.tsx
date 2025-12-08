'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface NaverConnectDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function NaverConnectDialog({ children, onSuccess }: NaverConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [storeName, setStoreName] = useState('')

  const handleConnect = () => {
    if (!storeName.trim()) {
      return
    }

    setLoading(true)

    // 스토어 이름을 state에 저장하여 콜백에서 사용
    const state = encodeURIComponent(JSON.stringify({
      storeName: storeName.trim(),
      timestamp: Date.now(),
    }))

    // 네이버 OAuth 인증 URL 생성
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID
    const redirectUri = `${window.location.origin}/api/naver/callback`

    const authUrl = new URL('https://accounts.commerce.naver.com/oauth2/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', clientId || '')
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('state', state)

    // 네이버 OAuth 페이지로 이동
    window.location.href = authUrl.toString()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#03C75A"/>
            </svg>
            네이버 스마트스토어 연동
          </DialogTitle>
          <DialogDescription>
            네이버 계정으로 로그인하여 스토어를 연동합니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">스토어 별칭</Label>
            <Input
              id="storeName"
              placeholder="예: 내 스마트스토어"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              셀러포트에서 구분하기 위한 이름입니다
            </p>
          </div>

          {/* 연동 안내 */}
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <p className="text-sm font-medium text-gray-900">연동 절차</p>
            <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
              <li>아래 버튼을 클릭하면 네이버 로그인 페이지로 이동합니다</li>
              <li>스마트스토어 판매자 계정으로 로그인합니다</li>
              <li>셀러포트의 데이터 접근을 승인합니다</li>
              <li>연동이 완료되면 자동으로 돌아옵니다</li>
            </ol>
          </div>

          {/* 권한 안내 */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 font-medium mb-2">요청하는 권한</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• 주문 정보 조회 (정기배송 주문 포함)</li>
              <li>• 상품 정보 조회</li>
              <li>• 고객 정보 조회 (구독자 관리용)</li>
            </ul>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button
              className="flex-1 bg-[#03C75A] hover:bg-[#02b351]"
              disabled={loading || !storeName.trim()}
              onClick={handleConnect}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  이동 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="currentColor"/>
                  </svg>
                  네이버로 연동하기
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
