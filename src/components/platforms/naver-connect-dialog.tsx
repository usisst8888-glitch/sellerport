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
  const [error, setError] = useState<string | null>(null)

  const [storeName, setStoreName] = useState('')
  const [applicationId, setApplicationId] = useState('')
  const [applicationSecret, setApplicationSecret] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 현재 사용자 확인
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('로그인이 필요합니다')
      }

      // 플랫폼 연동 정보 저장
      const { error: insertError } = await supabase
        .from('platforms')
        .insert({
          user_id: user.id,
          platform_type: 'naver',
          platform_name: storeName,
          application_id: applicationId,
          application_secret: applicationSecret,
          status: 'connected',
        })

      if (insertError) {
        throw insertError
      }

      // 성공
      setOpen(false)
      setStoreName('')
      setApplicationId('')
      setApplicationSecret('')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '연동에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>네이버 스마트스토어 연동</DialogTitle>
          <DialogDescription>
            네이버 커머스API 센터에서 발급받은 인증 정보를 입력하세요
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">스토어 이름</Label>
            <Input
              id="storeName"
              placeholder="예: 내 스마트스토어"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              구분을 위한 이름입니다 (자유롭게 입력)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicationId">애플리케이션 ID</Label>
            <Input
              id="applicationId"
              placeholder="애플리케이션 ID 입력"
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="applicationSecret">애플리케이션 시크릿</Label>
            <Input
              id="applicationSecret"
              type="password"
              placeholder="애플리케이션 시크릿 입력"
              value={applicationSecret}
              onChange={(e) => setApplicationSecret(e.target.value)}
              required
            />
          </div>

          {/* 안내 */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-800 font-medium mb-1">API 발급 방법</p>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>네이버 커머스API 센터 접속</li>
              <li>통합매니저 계정으로 로그인</li>
              <li>내스토어 애플리케이션 → 애플리케이션 등록</li>
              <li>발급된 ID와 시크릿을 위에 입력</li>
            </ol>
            <a
              href="https://api.commerce.naver.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 underline mt-2 inline-block"
            >
              커머스API 센터 바로가기 →
            </a>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? '연동 중...' : '연동하기'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
