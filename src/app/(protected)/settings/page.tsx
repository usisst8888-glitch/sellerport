'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Profile {
  id: string
  email: string
  businessName: string | null
  businessNumber: string | null
  ownerName: string | null
  phone: string | null
  createdAt?: string
}

interface SubscriptionInfo {
  status: 'trial' | 'active' | 'expired' | 'none'
  trialDaysLeft?: number
  planName: string
}

interface Balance {
  slotBalance: number
  alertBalance: number
}


export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [balance, setBalance] = useState<Balance>({ slotBalance: 0, alertBalance: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    status: 'none',
    planName: '무료 체험'
  })

  const [formData, setFormData] = useState({
    businessName: '',
    businessNumber: '',
    ownerName: '',
    phone: '',
  })

  useEffect(() => {
    fetchData()
    fetchSubscription()
  }, [])

  // 구독 정보 가져오기
  const fetchSubscription = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 구독 정보 확인
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle()

      if (sub) {
        setSubscription({
          status: 'active',
          planName: '프리미엄'
        })
      } else {
        // 무료 체험 기간 계산
        const { data: profileData } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', user.id)
          .maybeSingle()

        if (profileData) {
          const createdAt = new Date(profileData.created_at)
          const now = new Date()
          const diffTime = now.getTime() - createdAt.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          const trialDaysLeft = Math.max(0, 7 - diffDays)

          if (trialDaysLeft > 0) {
            setSubscription({
              status: 'trial',
              trialDaysLeft,
              planName: '무료 체험'
            })
          } else {
            setSubscription({
              status: 'expired',
              planName: '체험 만료'
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    }
  }

  // 메시지 3초 후 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [profileRes, balanceRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/balance')
      ])

      const profileData = await profileRes.json()
      const balanceData = await balanceRes.json()

      if (profileData.success) {
        setProfile(profileData.data)
        setFormData({
          businessName: profileData.data.businessName || '',
          businessNumber: profileData.data.businessNumber || '',
          ownerName: profileData.data.ownerName || '',
          phone: profileData.data.phone || '',
        })
      }

      if (balanceData.success) {
        setBalance({
          slotBalance: balanceData.data.slotBalance || 0,
          alertBalance: balanceData.data.alertBalance || 0
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        setProfile(data.data)
        setMessage({ type: 'success', text: '저장되었습니다' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error || '저장에 실패했습니다' })
      }
    } catch (error) {
      console.error('Failed to save profile:', error)
      setMessage({ type: 'error', text: '저장에 실패했습니다' })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = profile && (
    formData.businessName !== (profile.businessName || '') ||
    formData.businessNumber !== (profile.businessNumber || '') ||
    formData.ownerName !== (profile.ownerName || '') ||
    formData.phone !== (profile.phone || '')
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">설정을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-white">설정</h1>
        <p className="text-slate-400 mt-1">계정 및 알림 설정을 관리합니다</p>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* 상단 2열: 잔액 + 계정 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 현재 플랜 */}
        <div className={`bg-gradient-to-br ${
          subscription.status === 'active' ? 'from-green-900/30 to-slate-800/40 border-green-500/20' :
          subscription.status === 'trial' ? 'from-blue-900/30 to-slate-800/40 border-blue-500/20' :
          'from-red-900/30 to-slate-800/40 border-red-500/20'
        } border rounded-xl p-5`}>
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <svg className={`w-5 h-5 ${
              subscription.status === 'active' ? 'text-green-400' :
              subscription.status === 'trial' ? 'text-blue-400' : 'text-red-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            현재 플랜
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center justify-between py-7 px-5 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-lg text-slate-300">구독 상태</p>
                <p className="text-sm text-slate-500 mt-1">
                  {subscription.status === 'active' ? '월 12,900원' :
                   subscription.status === 'trial' ? '7일 무료 체험' : '체험 기간 종료'}
                </p>
              </div>
              <p className={`text-2xl font-bold ${
                subscription.status === 'active' ? 'text-green-400' :
                subscription.status === 'trial' ? 'text-blue-400' : 'text-red-400'
              }`}>
                {subscription.status === 'active' ? '프리미엄' :
                 subscription.status === 'trial' ? '무료 체험' : '만료'}
              </p>
            </div>
            <div className="flex items-center justify-between py-7 px-5 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-lg text-slate-300">남은 기간</p>
                <p className="text-sm text-slate-500 mt-1">
                  {subscription.status === 'active' ? '무제한 이용' : '무료 체험 기간'}
                </p>
              </div>
              {subscription.status === 'active' ? (
                <p className="text-2xl font-bold text-green-400">무제한</p>
              ) : (
                <p className={`text-4xl font-bold ${subscription.status === 'trial' ? 'text-white' : 'text-red-400'}`}>
                  {subscription.status === 'trial' ? subscription.trialDaysLeft : 0}
                  <span className="text-xl font-normal text-slate-400 ml-1">일</span>
                </p>
              )}
            </div>
          </div>

          <Link href="/billing">
            <Button size="sm" className={`w-full text-white text-sm ${
              subscription.status === 'active' ? 'bg-slate-600 hover:bg-slate-500' :
              'bg-blue-600 hover:bg-blue-500'
            }`}>
              {subscription.status === 'active' ? '구독 관리' :
               subscription.status === 'trial' ? '프리미엄 구독하기' : '구독 시작하기'}
            </Button>
          </Link>
        </div>

        {/* 계정 정보 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4">계정 정보</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-400">이메일</span>
              <span className="text-sm text-white">{profile?.email || '-'}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <span className="text-sm text-slate-400">가입일</span>
              <span className="text-sm text-white">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ko-KR') : '-'}</span>
            </div>
            <Link href="/change-password" className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group">
              <span className="text-sm text-slate-400">비밀번호</span>
              <div className="flex items-center gap-2 text-sm text-slate-300 group-hover:text-white">
                <span>변경하기</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 사업자 정보 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white mb-4">사업자 정보</h2>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="business_name" className="text-xs text-slate-400">상호명</Label>
              <Input
                id="business_name"
                placeholder="상호명"
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="business_number" className="text-xs text-slate-400">사업자등록번호</Label>
              <Input
                id="business_number"
                placeholder="000-00-00000"
                value={formData.businessNumber}
                onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="owner_name" className="text-xs text-slate-400">대표자명</Label>
              <Input
                id="owner_name"
                placeholder="대표자명"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs text-slate-400">연락처</Label>
              <Input
                id="phone"
                placeholder="010-0000-0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="h-9 text-sm bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </div>

      {/* 위험 구역 */}
      <div className="bg-slate-800/50 border border-red-500/20 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-red-400">위험 구역</h2>
            <p className="text-xs text-slate-500">되돌릴 수 없는 작업입니다</p>
          </div>
          <Button variant="destructive" size="sm" className="bg-red-600/80 hover:bg-red-600" disabled>
            계정 삭제
          </Button>
        </div>
      </div>
    </div>
  )
}
