'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TermsContent, PrivacyContent, MarketingContent } from '@/components/legal/legal-contents'

type UserType = 'seller' | 'agency' | 'designer' | 'influencer'
type ModalType = 'terms' | 'privacy' | 'marketing' | null

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
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

  // 약관 동의 상태
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [agreePrivacy, setAgreePrivacy] = useState(false)
  const [agreeMarketing, setAgreeMarketing] = useState(false)

  // 약관 모달 상태
  const [modalOpen, setModalOpen] = useState<ModalType>(null)

  // 카운트다운 타이머
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // 메시지 3초 후 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

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

    // 필수 약관 동의 확인
    if (!agreeTerms || !agreePrivacy) {
      setMessage({ type: 'error', text: '필수 약관에 동의해주세요' })
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
        data: {
          display_name: displayName,
          user_type: userType,
          phone: phone.replace(/[^0-9]/g, ''),
          phone_verified: true,
          marketing_agreed: agreeMarketing
        }
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
      return
    }

    // 프로필에 추가 정보 저장 (트리거로 기본 프로필 생성 후 업데이트)
    if (data.user) {
      // 잠시 대기 후 업데이트 (트리거가 프로필 생성할 시간 확보)
      await new Promise(resolve => setTimeout(resolve, 1000))

      const now = new Date().toISOString()
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          user_type: userType,
          phone: phone.replace(/[^0-9]/g, ''),
          phone_verified: true,
          terms_agreed: agreeTerms,
          terms_agreed_at: agreeTerms ? now : null,
          privacy_agreed: agreePrivacy,
          privacy_agreed_at: agreePrivacy ? now : null,
          marketing_agreed: agreeMarketing,
          marketing_agreed_at: agreeMarketing ? now : null
        })
        .eq('id', data.user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
        // 프로필 업데이트 실패해도 회원가입은 성공으로 처리 (트리거가 기본 프로필 생성)
      }
    }

    // 전환 추적 (셀러포트 자체 추적 시스템)
    try {
      const trackingLinkId = document.cookie
        .split('; ')
        .find(row => row.startsWith('sp_tracking_link='))
        ?.split('=')[1]

      if (trackingLinkId) {
        await fetch('/api/conversions/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackingLinkId,
            orderId: `SIGNUP-${data.user?.id || Date.now()}`,
            orderAmount: 0, // 회원가입은 금액 0
            productName: '회원가입',
            metadata: {
              event_type: 'signup',
              user_type: userType,
              email: email
            }
          })
        })
      }
    } catch (conversionError) {
      console.error('Conversion tracking error:', conversionError)
      // 전환 추적 실패해도 회원가입은 성공으로 처리
    }

    // 메타 픽셀 전환 이벤트 발동
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'CompleteRegistration', {
        content_name: '셀러포트 회원가입',
        status: 'success',
        user_type: userType
      })
    }

    // 회원가입 성공 시 바로 대시보드로 이동
    setMessage({
      type: 'success',
      text: '회원가입이 완료되었습니다. 잠시 후 대시보드로 이동합니다.'
    })

    // 잠시 후 대시보드로 리다이렉트
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
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
          {/* 무료 체험 안내 배너 */}
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🎉</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">30일 무료 체험</p>
                <p className="text-xs text-slate-400">가입 즉시 모든 기능을 무료로 이용하세요</p>
              </div>
            </div>
          </div>
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
                  className={`p-3 rounded-xl border-2 transition-all ${
                    userType === 'seller'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      userType === 'seller' ? 'bg-blue-500/20' : 'bg-slate-600'
                    }`}>
                      <svg className={`w-4 h-4 ${userType === 'seller' ? 'text-blue-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  className={`p-3 rounded-xl border-2 transition-all ${
                    userType === 'agency'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      userType === 'agency' ? 'bg-purple-500/20' : 'bg-slate-600'
                    }`}>
                      <svg className={`w-4 h-4 ${userType === 'agency' ? 'text-purple-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${userType === 'agency' ? 'text-purple-400' : 'text-slate-400'}`}>
                      광고 대행사
                    </span>
                    <span className="text-xs text-slate-500">여러 셀러 관리</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('designer')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    userType === 'designer'
                      ? 'border-pink-500 bg-pink-500/10'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      userType === 'designer' ? 'bg-pink-500/20' : 'bg-slate-600'
                    }`}>
                      <svg className={`w-4 h-4 ${userType === 'designer' ? 'text-pink-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${userType === 'designer' ? 'text-pink-400' : 'text-slate-400'}`}>
                      디자이너
                    </span>
                    <span className="text-xs text-slate-500">상세페이지/광고 제작</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('influencer')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    userType === 'influencer'
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                  }`}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      userType === 'influencer' ? 'bg-amber-500/20' : 'bg-slate-600'
                    }`}>
                      <svg className={`w-4 h-4 ${userType === 'influencer' ? 'text-amber-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${userType === 'influencer' ? 'text-amber-400' : 'text-slate-400'}`}>
                      인플루언서
                    </span>
                    <span className="text-xs text-slate-500">SNS 콘텐츠 제작</span>
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
              <Label htmlFor="displayName" className="text-slate-300">이름 (닉네임)</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="표시될 이름을 입력하세요"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>

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

            {/* 약관 동의 */}
            <div className="space-y-3 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-300">약관 동의</p>
                <button
                  type="button"
                  onClick={() => {
                    const allChecked = agreeTerms && agreePrivacy && agreeMarketing
                    setAgreeTerms(!allChecked)
                    setAgreePrivacy(!allChecked)
                    setAgreeMarketing(!allChecked)
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {agreeTerms && agreePrivacy && agreeMarketing ? '전체 해제' : '전체 동의'}
                </button>
              </div>

              {/* 이용약관 동의 (필수) */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setAgreeTerms(!agreeTerms)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                    agreeTerms
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-slate-500 hover:border-slate-400'
                  }`}
                >
                  {agreeTerms && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-slate-300">
                  <span className="text-red-400">[필수]</span>{' '}
                  <button
                    type="button"
                    onClick={() => setModalOpen('terms')}
                    className="text-blue-400 hover:underline"
                  >
                    이용약관
                  </button>에 동의합니다
                </span>
              </div>

              {/* 개인정보 수집·이용 동의 (필수) */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setAgreePrivacy(!agreePrivacy)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                    agreePrivacy
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-slate-500 hover:border-slate-400'
                  }`}
                >
                  {agreePrivacy && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-slate-300">
                  <span className="text-red-400">[필수]</span>{' '}
                  <button
                    type="button"
                    onClick={() => setModalOpen('privacy')}
                    className="text-blue-400 hover:underline"
                  >
                    개인정보 수집·이용
                  </button>에 동의합니다
                </span>
              </div>

              {/* 마케팅 정보 수신 동의 (선택) */}
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setAgreeMarketing(!agreeMarketing)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${
                    agreeMarketing
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-slate-500 hover:border-slate-400'
                  }`}
                >
                  {agreeMarketing && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-slate-300">
                  <span className="text-slate-500">[선택]</span>{' '}
                  <button
                    type="button"
                    onClick={() => setModalOpen('marketing')}
                    className="text-blue-400 hover:underline"
                  >
                    마케팅 정보 수신
                  </button>에 동의합니다
                </span>
              </div>
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
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3"
              disabled={loading || !isPhoneVerified || !agreeTerms || !agreePrivacy}
            >
              {loading ? '처리 중...' : '30일 무료 체험 시작'}
            </Button>
            <p className="text-center text-xs text-slate-500 mt-2">
              체험 기간 종료 후 월 22,900원으로 계속 이용하세요
            </p>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-blue-400 hover:text-blue-300">
              로그인
            </Link>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              홈으로 돌아가기
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 약관 모달 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setModalOpen(null)}
          />

          {/* 모달 컨텐츠 */}
          <div className="relative w-full max-w-3xl max-h-[85vh] bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            {/* 모달 헤더 */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">
                {modalOpen === 'terms' && '이용약관'}
                {modalOpen === 'privacy' && '개인정보 수집·이용 동의'}
                {modalOpen === 'marketing' && '마케팅 정보 수신 동의'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
              {modalOpen === 'terms' && <TermsContent />}
              {modalOpen === 'privacy' && <PrivacyContent />}
              {modalOpen === 'marketing' && <MarketingContent />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
