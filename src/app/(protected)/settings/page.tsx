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
  createdAt?: string
}

interface Balance {
  slotBalance: number
  alertBalance: number
}

interface AlertSettings {
  orderAlert: boolean
  redLightAlert: boolean
  dailySummary: boolean
  yellowLightAlert: boolean
  kakaoEnabled: boolean
  kakaoPhone: string
}


export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [balance, setBalance] = useState<Balance>({ slotBalance: 0, alertBalance: 0 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingAlerts, setSavingAlerts] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState({
    businessName: '',
    businessNumber: '',
    ownerName: '',
    phone: '',
  })

  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    orderAlert: true,
    redLightAlert: true,
    dailySummary: true,
    yellowLightAlert: false,
    kakaoEnabled: false,
    kakaoPhone: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

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
        if (profileData.data.alertSettings) {
          setAlertSettings({
            ...alertSettings,
            ...profileData.data.alertSettings
          })
        }
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

  const handleSaveAlertSettings = async () => {
    try {
      setSavingAlerts(true)
      setMessage(null)

      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertSettings })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: '알림 설정이 저장되었습니다' })
        setTimeout(() => setMessage(null), 3000)
      } else {
        setMessage({ type: 'error', text: data.error || '저장에 실패했습니다' })
      }
    } catch (error) {
      console.error('Failed to save alert settings:', error)
      setMessage({ type: 'error', text: '저장에 실패했습니다' })
    } finally {
      setSavingAlerts(false)
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
        <div className="bg-gradient-to-br from-blue-900/30 to-slate-800/40 border border-blue-500/20 rounded-xl p-5">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            현재 플랜
          </h2>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center justify-between py-7 px-5 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-lg text-slate-300">구독 플랜</p>
                <p className="text-sm text-slate-500 mt-1">추적 링크 3개</p>
              </div>
              <p className="text-2xl font-bold text-white">무료</p>
            </div>
            <div className="flex items-center justify-between py-7 px-5 bg-slate-800/50 rounded-lg">
              <div>
                <p className="text-lg text-slate-300">알림톡 잔여</p>
                <p className="text-sm text-slate-500 mt-1">추가 15원/건</p>
              </div>
              <p className="text-4xl font-bold text-white">{balance.alertBalance}<span className="text-xl font-normal text-slate-400 ml-1">건</span></p>
            </div>
          </div>

          <Link href="/billing">
            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm">
              플랜 업그레이드
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

      {/* 중단 2열: 사업자 정보 + 카카오 알림톡 설정 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* 카카오 알림톡 설정 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              카카오 알림톡 설정
            </h2>
            <p className="text-xs text-slate-500">15원/건</p>
          </div>

          {/* 알림톡 활성화 및 전화번호 */}
          <div className="mb-4 p-3 bg-slate-700/50 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">알림톡 발송</p>
                <p className="text-xs text-slate-500">카카오 알림톡으로 알림 받기</p>
              </div>
              <button
                type="button"
                onClick={() => setAlertSettings({ ...alertSettings, kakaoEnabled: !alertSettings.kakaoEnabled })}
                className={`relative w-11 h-6 rounded-full transition-colors ${alertSettings.kakaoEnabled ? 'bg-blue-600' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${alertSettings.kakaoEnabled ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
            {alertSettings.kakaoEnabled && (
              <div className="space-y-1.5">
                <Label htmlFor="kakao_phone" className="text-xs text-slate-400">수신 전화번호</Label>
                <Input
                  id="kakao_phone"
                  placeholder="01012345678"
                  value={alertSettings.kakaoPhone}
                  onChange={(e) => setAlertSettings({ ...alertSettings, kakaoPhone: e.target.value })}
                  className="h-9 text-sm bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">주문 알림</p>
                <p className="text-xs text-slate-500">새 주문 발생 시</p>
              </div>
              <button
                type="button"
                onClick={() => setAlertSettings({ ...alertSettings, orderAlert: !alertSettings.orderAlert })}
                className={`relative w-11 h-6 rounded-full transition-colors ${alertSettings.orderAlert ? 'bg-blue-600' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${alertSettings.orderAlert ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-red-500/20">
              <div>
                <p className="text-sm font-medium text-white flex items-center gap-1">
                  🔴 빨간불
                  <span className="px-1 py-0.5 text-[10px] bg-red-500/20 text-red-400 rounded">중요</span>
                </p>
                <p className="text-xs text-slate-500">ROAS 150% 미만</p>
              </div>
              <button
                type="button"
                onClick={() => setAlertSettings({ ...alertSettings, redLightAlert: !alertSettings.redLightAlert })}
                className={`relative w-11 h-6 rounded-full transition-colors ${alertSettings.redLightAlert ? 'bg-red-600' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${alertSettings.redLightAlert ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">🟡 노란불</p>
                <p className="text-xs text-slate-500">ROAS 150-300%</p>
              </div>
              <button
                type="button"
                onClick={() => setAlertSettings({ ...alertSettings, yellowLightAlert: !alertSettings.yellowLightAlert })}
                className={`relative w-11 h-6 rounded-full transition-colors ${alertSettings.yellowLightAlert ? 'bg-amber-600' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${alertSettings.yellowLightAlert ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-white">일일 요약</p>
                <p className="text-xs text-slate-500">매일 밤 성과 요약</p>
              </div>
              <button
                type="button"
                onClick={() => setAlertSettings({ ...alertSettings, dailySummary: !alertSettings.dailySummary })}
                className={`relative w-11 h-6 rounded-full transition-colors ${alertSettings.dailySummary ? 'bg-blue-600' : 'bg-slate-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${alertSettings.dailySummary ? 'left-6' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
            <p className="text-xs text-slate-500">알림 설정 저장</p>
            <Button
              onClick={handleSaveAlertSettings}
              disabled={savingAlerts}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
            >
              {savingAlerts ? '저장 중...' : '설정 저장'}
            </Button>
          </div>
        </div>
      </div>

      {/* 연동된 사이트 - 전체 너비 */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            연동된 사이트
          </h2>
          <Link href="/my-sites" className="text-xs text-blue-400 hover:text-blue-300">
            전체 관리 →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* 네이버 스마트스토어 */}
          <Link href="/my-sites" className="flex flex-col items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-2xl mb-2">🛒</div>
            <p className="text-sm font-medium text-white text-center">네이버</p>
            <p className="text-xs text-slate-500">스마트스토어</p>
          </Link>

          {/* 쿠팡 */}
          <div className="flex flex-col items-center p-4 bg-slate-700/30 rounded-lg border border-dashed border-slate-600 opacity-60">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-2xl mb-2">🚀</div>
            <p className="text-sm font-medium text-slate-400 text-center">쿠팡</p>
            <p className="text-xs text-slate-600">준비중</p>
          </div>

          {/* 카페24 */}
          <div className="flex flex-col items-center p-4 bg-slate-700/30 rounded-lg border border-dashed border-slate-600 opacity-60">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-2xl mb-2">☕</div>
            <p className="text-sm font-medium text-slate-400 text-center">카페24</p>
            <p className="text-xs text-slate-600">준비중</p>
          </div>

          {/* 고도몰 */}
          <div className="flex flex-col items-center p-4 bg-slate-700/30 rounded-lg border border-dashed border-slate-600 opacity-60">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-2xl mb-2">🏪</div>
            <p className="text-sm font-medium text-slate-400 text-center">고도몰</p>
            <p className="text-xs text-slate-600">준비중</p>
          </div>

          {/* 11번가 */}
          <div className="flex flex-col items-center p-4 bg-slate-700/30 rounded-lg border border-dashed border-slate-600 opacity-60">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-2xl mb-2">🔶</div>
            <p className="text-sm font-medium text-slate-400 text-center">11번가</p>
            <p className="text-xs text-slate-600">준비중</p>
          </div>

          {/* 옥션/G마켓 */}
          <div className="flex flex-col items-center p-4 bg-slate-700/30 rounded-lg border border-dashed border-slate-600 opacity-60">
            <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-2xl mb-2">🔨</div>
            <p className="text-sm font-medium text-slate-400 text-center">옥션/G마켓</p>
            <p className="text-xs text-slate-600">준비중</p>
          </div>

          {/* 위메프 */}
          <div className="flex flex-col items-center p-4 bg-slate-700/30 rounded-lg border border-dashed border-slate-600 opacity-60">
            <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center text-2xl mb-2">💜</div>
            <p className="text-sm font-medium text-slate-400 text-center">위메프</p>
            <p className="text-xs text-slate-600">준비중</p>
          </div>

          {/* 티몬 */}
          <div className="flex flex-col items-center p-4 bg-slate-700/30 rounded-lg border border-dashed border-slate-600 opacity-60">
            <div className="w-12 h-12 bg-cyan-500/10 rounded-xl flex items-center justify-center text-2xl mb-2">⏰</div>
            <p className="text-sm font-medium text-slate-400 text-center">티몬</p>
            <p className="text-xs text-slate-600">준비중</p>
          </div>
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
