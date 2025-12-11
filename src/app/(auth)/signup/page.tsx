'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type UserType = 'seller' | 'agency'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userType, setUserType] = useState<UserType>('seller')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  // 전화번호 인증 상태
  const [phone, setPhone] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isPhoneVerified, setIsPhoneVerified] = useState(false)
  const [verificationToken, setVerificationToken] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [codeSent, setCodeSent] = useState(false)

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 인증번호 발송
  const handleSendCode = async () => {
    if (!phone) {
      setMessage({ type: 'error', text: '전화번호를 입력해주세요' })
      return
    }

    setSendingCode(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      const result = await response.json()

      if (result.success) {
        setCodeSent(true)
        setCountdown(180) // 3분
        setMessage({ type: 'success', text: '인증번호가 발송되었습니다' })
        // 개발 환경에서 코드 자동 입력 (테스트용)
        if (result._devCode) {
          setVerificationCode(result._devCode)
        }
      } else {
        setMessage({ type: 'error', text: result.error || '인증번호 발송에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '인증번호 발송 중 오류가 발생했습니다' })
    } finally {
      setSendingCode(false)
    }
  }

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setMessage({ type: 'error', text: '인증번호를 입력해주세요' })
      return
    }

    setVerifyingCode(true)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: verificationCode })
      })

      const result = await response.json()

      if (result.success) {
        setIsPhoneVerified(true)
        setVerificationToken(result.verificationToken)
        setMessage({ type: 'success', text: '전화번호 인증이 완료되었습니다' })
      } else {
        setMessage({ type: 'error', text: result.error || '인증에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '인증 확인 중 오류가 발생했습니다' })
    } finally {
      setVerifyingCode(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // 전화번호 인증 확인
    if (!isPhoneVerified) {
      setMessage({ type: 'error', text: '전화번호 인증을 완료해주세요' })
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: '비밀번호가 일치하지 않습니다.' })
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: '비밀번호는 6자 이상이어야 합니다.' })
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
        data: {
          user_type: userType,
          phone: phone.replace(/[^0-9]/g, ''),
          phone_verified: true
        }
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      // 프로필에 user_type, phone 저장
      if (data.user) {
        await supabase
          .from('profiles')
          .update({
            user_type: userType,
            phone: phone.replace(/[^0-9]/g, ''),
            phone_verified: true
          })
          .eq('id', data.user.id)
      }
      setMessage({
        type: 'success',
        text: '인증 이메일을 발송했습니다. 이메일을 확인해주세요.'
      })
    }
    setLoading(false)
  }

  // 전화번호 포맷팅
  const formatPhone = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">셀러포트 회원가입</CardTitle>
          <CardDescription className="text-slate-400">
            온라인 광고 성과 측정을 시작하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {/* 사용자 유형 선택 */}
            <div className="space-y-3">
              <Label className="text-slate-300">사용자 유형</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType('seller')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    userType === 'seller'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      userType === 'seller' ? 'bg-blue-500/20' : 'bg-slate-600'
                    }`}>
                      <svg className={`w-5 h-5 ${userType === 'seller' ? 'text-blue-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${userType === 'seller' ? 'text-blue-400' : 'text-slate-400'}`}>
                      셀러 / 판매자
                    </span>
                    <span className="text-xs text-slate-500">직접 상품을 판매</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('agency')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    userType === 'agency'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      userType === 'agency' ? 'bg-purple-500/20' : 'bg-slate-600'
                    }`}>
                      <svg className={`w-5 h-5 ${userType === 'agency' ? 'text-purple-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${userType === 'agency' ? 'text-purple-400' : 'text-slate-400'}`}>
                      광고 대행사
                    </span>
                    <span className="text-xs text-slate-500">여러 셀러 관리</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 전화번호 인증 */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">
                전화번호
                {isPhoneVerified && (
                  <span className="ml-2 text-xs text-emerald-400">✓ 인증완료</span>
                )}
              </Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  disabled={isPhoneVerified}
                  required
                  className="flex-1 h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || isPhoneVerified || countdown > 0}
                  className="h-11 px-4 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {sendingCode ? '발송중...' : countdown > 0 ? `${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` : '인증요청'}
                </button>
              </div>
            </div>

            {/* 인증번호 입력 */}
            {codeSent && !isPhoneVerified && (
              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-300">인증번호</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="code"
                    type="text"
                    placeholder="6자리 숫자 입력"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    maxLength={6}
                    className="flex-1 h-11 bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 tracking-widest text-center font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={verifyingCode || verificationCode.length !== 6}
                    className="h-11 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                  >
                    {verifyingCode ? '확인중...' : '확인'}
                  </button>
                </div>
                {countdown > 0 && (
                  <p className="text-xs text-slate-500">
                    인증번호는 {Math.floor(countdown / 60)}분 {countdown % 60}초 후 만료됩니다
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="6자 이상 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호 다시 입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
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
              className="w-full bg-blue-600 hover:bg-blue-500 text-white"
              disabled={loading || !isPhoneVerified}
            >
              {loading ? '처리 중...' : '회원가입'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
