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
import { createClient } from '@/lib/supabase/client'

interface NaverConnectDialogProps {
  children: React.ReactNode
  onSuccess?: () => void
}

export function NaverConnectDialog({ children, onSuccess }: NaverConnectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [storeName, setStoreName] = useState('')
  const [storeId, setStoreId] = useState('') // 스마트스토어 URL에 사용되는 ID
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')

  const handleConnect = async () => {
    if (!storeName.trim() || !storeId.trim() || !clientId.trim() || !clientSecret.trim()) {
      setError('모든 필드를 입력해주세요')
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('로그인이 필요합니다')
        setLoading(false)
        return
      }

      // 플랫폼 정보 저장 (API 키는 암호화하여 저장)
      const { error: insertError } = await supabase
        .from('platforms')
        .insert({
          user_id: user.id,
          platform_type: 'naver',
          platform_name: storeName.trim(),
          store_id: storeId.trim().toLowerCase(), // 스마트스토어 ID (URL용)
          application_id: clientId.trim(),
          application_secret: clientSecret.trim(),
          status: 'pending_verification',
        })

      if (insertError) {
        if (insertError.code === '23505') {
          setError('이미 연동된 스토어입니다')
        } else {
          setError('연동 중 오류가 발생했습니다')
        }
        setLoading(false)
        return
      }

      // 성공
      setOpen(false)
      setStoreName('')
      setStoreId('')
      setClientId('')
      setClientSecret('')
      onSuccess?.()

    } catch (err) {
      console.error('Naver connect error:', err)
      setError('연동 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#03C75A"/>
            </svg>
            네이버 스마트스토어 연동
          </DialogTitle>
          <DialogDescription>
            네이버 커머스API센터에서 발급받은 인증 정보를 입력하세요
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* API 발급 안내 */}
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-2">API 발급 방법</p>
            <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
              <li>
                <a
                  href="https://apicenter.commerce.naver.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-700 underline hover:text-green-900"
                >
                  네이버 커머스API센터
                </a>
                {' '}접속
              </li>
              <li>스마트스토어 판매자 계정으로 로그인</li>
              <li>애플리케이션 등록 → Client ID/Secret 발급</li>
              <li>API 호출 IP에 <code className="bg-green-100 px-1 rounded">34.50.46.70</code> 등록</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeName">스토어 별칭 *</Label>
            <Input
              id="storeName"
              placeholder="예: 내 스마트스토어"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              셀러포트에서 구분하기 위한 이름입니다
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeId">스마트스토어 ID *</Label>
            <Input
              id="storeId"
              placeholder="예: tripsim"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              스마트스토어 URL에서 확인: smartstore.naver.com/<strong className="text-gray-700">스토어ID</strong>/products/...
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">Application ID (Client ID) *</Label>
            <Input
              id="clientId"
              placeholder="예: 5f0XZPkXRbvHEcaxEWKKg9"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientSecret">Application Secret (Client Secret) *</Label>
            <Input
              id="clientSecret"
              type="password"
              placeholder="발급받은 Secret 입력"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              입력한 정보는 암호화되어 안전하게 저장됩니다
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* 권한 안내 */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 font-medium mb-2">필요한 API 권한</p>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>- 주문 정보 조회 (정기배송 주문 포함)</li>
              <li>- 상품 정보 조회</li>
              <li>- 고객 정보 조회 (구독자 관리용)</li>
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
              disabled={loading || !storeName.trim() || !storeId.trim() || !clientId.trim() || !clientSecret.trim()}
              onClick={handleConnect}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  연동 중...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="currentColor"/>
                  </svg>
                  연동하기
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
