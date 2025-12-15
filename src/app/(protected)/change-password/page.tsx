'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // 유효성 검사
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: '새 비밀번호는 6자 이상이어야 합니다' })
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: '새 비밀번호가 일치하지 않습니다' })
      setLoading(false)
      return
    }

    if (currentPassword === newPassword) {
      setMessage({ type: 'error', text: '현재 비밀번호와 다른 비밀번호를 입력해주세요' })
      setLoading(false)
      return
    }

    const supabase = createClient()

    // 현재 비밀번호 확인을 위해 재로그인 시도
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      setMessage({ type: 'error', text: '사용자 정보를 찾을 수 없습니다' })
      setLoading(false)
      return
    }

    // 현재 비밀번호로 로그인 시도하여 검증
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    })

    if (signInError) {
      setMessage({ type: 'error', text: '현재 비밀번호가 일치하지 않습니다' })
      setLoading(false)
      return
    }

    // 비밀번호 변경
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (updateError) {
      setMessage({ type: 'error', text: updateError.message })
    } else {
      setMessage({
        type: 'success',
        text: '비밀번호가 성공적으로 변경되었습니다'
      })

      // 입력 필드 초기화
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      // 2초 후 설정 페이지로 이동
      setTimeout(() => {
        router.push('/settings')
      }, 2000)
    }

    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <Link href="/settings" className="text-sm text-slate-400 hover:text-slate-300 flex items-center gap-1 mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          설정으로 돌아가기
        </Link>
        <h1 className="text-2xl font-bold text-white">비밀번호 변경</h1>
        <p className="text-slate-400 mt-1">새로운 비밀번호를 설정합니다</p>
      </div>

      {/* 비밀번호 변경 폼 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-slate-300">현재 비밀번호</Label>
            <Input
              id="currentPassword"
              type="password"
              placeholder="현재 비밀번호 입력"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-slate-300">새 비밀번호</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="6자 이상 입력"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-300">새 비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="새 비밀번호 다시 입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-sm ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30'
              }`}
            >
              {message.text}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="w-full h-11 bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
          >
            {loading ? '변경 중...' : '비밀번호 변경'}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500">
            비밀번호를 잊으셨나요?{' '}
            <Link href="/forgot-password" className="text-blue-400 hover:text-blue-300">
              비밀번호 찾기
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
