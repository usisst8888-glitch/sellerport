'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

interface Profile {
  id: string
  email: string
  businessName: string | null
  businessNumber: string | null
  ownerName: string | null
  phone: string | null
  plan: string
  planStartedAt: string | null
  planExpiresAt: string | null
  subscriberCount: number
  platformCount: number
  createdAt?: string
  isNewUser?: boolean
}

const PLAN_DETAILS: Record<string, { name: string; subscribers: number; platforms: number }> = {
  free: { name: 'Free', subscribers: 10, platforms: 1 },
  basic: { name: 'Basic', subscribers: 100, platforms: 3 },
  pro: { name: 'Pro', subscribers: 500, platforms: 10 },
  enterprise: { name: 'Enterprise', subscribers: 10000, platforms: 100 },
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 폼 상태
  const [formData, setFormData] = useState({
    businessName: '',
    businessNumber: '',
    ownerName: '',
    phone: '',
  })

  // 프로필 로드
  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile')
      const data = await response.json()

      if (data.success) {
        setProfile(data.data)
        setFormData({
          businessName: data.data.businessName || '',
          businessNumber: data.data.businessNumber || '',
          ownerName: data.data.ownerName || '',
          phone: data.data.phone || '',
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  // 프로필 저장
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

  // 변경사항 확인
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

  const currentPlan = PLAN_DETAILS[profile?.plan || 'free']

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">설정</h1>
        <p className="text-slate-400 mt-1">계정 및 사업자 정보를 관리합니다</p>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* 계정 정보 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">계정 정보</h2>
          <p className="text-sm text-slate-400 mb-5">로그인 계정 정보입니다</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">이메일</Label>
              <Input
                value={profile?.email || ''}
                className="bg-slate-700 border-slate-600 text-white"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">가입일</Label>
              <Input
                value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('ko-KR') : '-'}
                className="bg-slate-700 border-slate-600 text-white"
                disabled
              />
            </div>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">사업자 정보</h2>
          <p className="text-sm text-slate-400 mb-5">정기구독 서비스를 운영하는 사업자 정보입니다</p>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="business_name" className="text-slate-300">상호명</Label>
                <Input
                  id="business_name"
                  placeholder="상호명을 입력하세요"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="business_number" className="text-slate-300">사업자등록번호</Label>
                <Input
                  id="business_number"
                  placeholder="000-00-00000"
                  value={formData.businessNumber}
                  onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner_name" className="text-slate-300">대표자명</Label>
                <Input
                  id="owner_name"
                  placeholder="대표자명을 입력하세요"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">연락처</Label>
                <Input
                  id="phone"
                  placeholder="010-0000-0000"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  저장 중...
                </span>
              ) : '저장하기'}
            </Button>
          </div>
        </div>

        {/* 플랜 정보 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">플랜 정보</h2>
          <p className="text-sm text-slate-400 mb-5">현재 이용 중인 플랜입니다</p>

          <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
            <div>
              <p className="font-semibold text-lg text-white">{currentPlan.name} 플랜</p>
              <p className="text-sm text-slate-400">
                구독자 {currentPlan.subscribers}명, 플랫폼 {currentPlan.platforms}개
              </p>
              {profile?.planExpiresAt && (
                <p className="text-xs text-slate-500 mt-1">
                  만료일: {new Date(profile.planExpiresAt).toLocaleDateString('ko-KR')}
                </p>
              )}
            </div>
            <Link href="/payment">
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                플랜 업그레이드
              </Button>
            </Link>
          </div>

          {/* 사용량 */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-500">연결된 플랫폼</p>
              <p className="text-lg font-semibold text-white">
                {profile?.platformCount || 0} / {currentPlan.platforms}
              </p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-500">구독자 수</p>
              <p className="text-lg font-semibold text-white">
                {profile?.subscriberCount || 0} / {currentPlan.subscribers}
              </p>
            </div>
          </div>
        </div>

        {/* 카카오톡 채널 설정 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">카카오톡 채널</h2>
          <p className="text-sm text-slate-400 mb-5">알림톡 발송에 사용할 카카오톡 채널을 등록합니다</p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kakao_channel" className="text-slate-300">카카오톡 채널 ID</Label>
              <Input
                id="kakao_channel"
                placeholder="@채널아이디"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
              />
              <p className="text-xs text-slate-500">카카오톡 채널 관리자센터에서 확인할 수 있습니다</p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                셀러포트에서 알림톡 발송 API를 제공합니다. 별도의 알리고 계약이 필요 없습니다.
              </p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white" disabled>채널 등록</Button>
          </div>
        </div>

        {/* 위험 구역 */}
        <div className="bg-slate-800 border border-red-500/30 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-400 mb-1">위험 구역</h2>
          <p className="text-sm text-slate-400 mb-5">되돌릴 수 없는 작업입니다</p>

          <Button variant="destructive" className="bg-red-600 hover:bg-red-500" disabled>계정 삭제</Button>
        </div>
      </div>
    </div>
  )
}
