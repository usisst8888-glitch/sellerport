'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useSubscription } from '@/hooks/useSubscription'

interface MySite {
  id: string
  site_type: string
  site_name: string
  store_id?: string
  status: string
  last_sync_at?: string
  created_at: string
}

const SITE_TYPES = [
  { value: 'naver', label: '네이버 스마트스토어', icon: '/site_logo/smartstore.png', isApi: true, needsMallId: false },
  { value: 'cafe24', label: '카페24', icon: '/site_logo/cafe24.png', isApi: true, needsMallId: true },
  { value: 'imweb', label: '아임웹', icon: '/site_logo/imweb.png', isApi: true, needsMallId: false },
]

export default function MySitesPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const { status: subscriptionStatus, trialDaysLeft, isLoading: subscriptionLoading, hasAccess } = useSubscription()
  const [sites, setSites] = useState<MySite[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    site_type: 'naver',
    site_name: '',
    store_id: '',
    application_id: '',
    application_secret: ''
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // URL 파라미터에서 성공/에러 메시지 처리
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'cafe24_connected') {
      setMessage({ type: 'success', text: '카페24 쇼핑몰이 연동되었습니다' })
      window.history.replaceState({}, '', '/my-sites')
      fetchSites()
    } else if (success === 'imweb_connected') {
      setMessage({ type: 'success', text: '아임웹 쇼핑몰이 연동되었습니다' })
      window.history.replaceState({}, '', '/my-sites')
      fetchSites()
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'token_exchange_failed': '인증에 실패했습니다. 다시 시도해주세요',
        'save_failed': '저장에 실패했습니다',
        'state_expired': '인증 시간이 만료되었습니다. 다시 시도해주세요',
        'configuration_error': '서버 설정 오류입니다',
      }
      setMessage({ type: 'error', text: errorMessages[error] || error })
      window.history.replaceState({}, '', '/my-sites')
    }
  }, [searchParams])

  // OAuth 연동 시작
  const handleOAuth = (siteType: string, mallId?: string) => {
    if (siteType === 'cafe24' && mallId) {
      window.location.href = `/api/auth/cafe24?mall_id=${mallId}`
    } else if (siteType === 'imweb') {
      window.location.href = '/api/auth/imweb'
    }
  }

  // 사이트 목록 불러오기
  const fetchSites = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('my_sites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSites(data || [])
    } catch (error) {
      console.error('Failed to fetch sites:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSites()
  }, [])

  // 네이버 API 연동
  const handleNaverConnect = async () => {
    if (!addForm.site_name.trim()) {
      setMessage({ type: 'error', text: '사이트 이름을 입력해주세요' })
      return
    }
    if (!addForm.application_id.trim() || !addForm.application_secret.trim()) {
      setMessage({ type: 'error', text: 'API 인증 정보를 입력해주세요' })
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // 먼저 사이트 등록
      const { data: siteData, error: insertError } = await supabase
        .from('my_sites')
        .insert({
          user_id: user.id,
          site_type: 'naver',
          site_name: addForm.site_name,
          store_id: addForm.store_id || null,
          application_id: addForm.application_id,
          application_secret: addForm.application_secret,
          status: 'pending'
        })
        .select()
        .single()

      if (insertError) throw insertError

      // API 검증
      const verifyRes = await fetch('/api/naver/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_id: siteData.id,
          application_id: addForm.application_id,
          application_secret: addForm.application_secret
        })
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok || !verifyData.success) {
        // 검증 실패 시 삭제
        await supabase.from('my_sites').delete().eq('id', siteData.id)
        throw new Error(verifyData.error || 'API 인증에 실패했습니다')
      }

      setMessage({ type: 'success', text: '네이버 스마트스토어가 연동되었습니다' })
      setShowAddModal(false)
      setAddForm({ site_type: 'naver', site_name: '', store_id: '', application_id: '', application_secret: '' })
      fetchSites()
    } catch (error) {
      console.error('Failed to connect naver:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : '연동에 실패했습니다' })
    } finally {
      setSaving(false)
    }
  }

  // 사이트 삭제
  const handleDeleteSite = async (siteId: string) => {
    if (!confirm('정말 이 사이트를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('my_sites')
        .delete()
        .eq('id', siteId)

      if (error) throw error
      fetchSites()
    } catch (error) {
      console.error('Failed to delete site:', error)
      setMessage({ type: 'error', text: '삭제에 실패했습니다' })
    }
  }

  const getSiteTypeInfo = (type: string) => {
    return SITE_TYPES.find(t => t.value === type) || { value: type, label: type, icon: '/channel_logo/custom.png' }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 구독 상태 배너 */}
      {!subscriptionLoading && subscriptionStatus === 'expired' && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-400">무료 체험이 만료되었습니다</h3>
                <p className="text-xs text-slate-400 mt-0.5">서비스를 계속 이용하려면 구독을 시작해주세요</p>
              </div>
            </div>
            <Link
              href="/billing"
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              구독하기
            </Link>
          </div>
        </div>
      )}

      {!subscriptionLoading && subscriptionStatus === 'trial' && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-blue-400">무료 체험 중</h3>
              <p className="text-xs text-slate-400 mt-0.5">무료 체험 기간이 {trialDaysLeft}일 남았습니다</p>
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">내 사이트</h1>
          <p className="text-slate-400 text-sm mt-1">판매 중인 쇼핑몰을 등록하세요</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={!hasAccess}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          사이트 등록
        </button>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`p-4 rounded-lg mb-4 ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {message.text}
        </div>
      )}

      {/* 사이트 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : sites.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">등록된 사이트가 없습니다</h3>
          <p className="text-slate-400 text-sm mb-4">판매 중인 쇼핑몰을 등록해보세요</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
          >
            첫 사이트 등록하기
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {sites.map((site) => {
            const typeInfo = getSiteTypeInfo(site.site_type)
            return (
              <div
                key={site.id}
                className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex items-center gap-4"
              >
                <img src={typeInfo.icon} alt={typeInfo.label} className="w-12 h-12 rounded-xl object-contain" />
                <div className="flex-1">
                  <h3 className="font-medium text-white">{site.site_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-400">{typeInfo.label}</span>
                    {site.store_id && (
                      <span className="text-xs text-slate-500">({site.store_id})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    site.status === 'active' || site.status === 'connected'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-600 text-slate-400'
                  }`}>
                    {site.status === 'active' || site.status === 'connected' ? '활성' : site.status}
                  </span>
                  <button
                    onClick={() => handleDeleteSite(site.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 사이트 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            {/* 헤더 */}
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">쇼핑몰 연동</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 플랫폼 선택 */}
            <div className="p-5 border-b border-slate-700">
              <label className="block text-sm text-slate-400 mb-3">플랫폼 선택</label>
              <div className="grid grid-cols-3 gap-3">
                {SITE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setAddForm({ ...addForm, site_type: type.value, site_name: '', store_id: '', application_id: '', application_secret: '' })}
                    className={`p-4 rounded-lg border transition-colors ${
                      addForm.site_type === type.value
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <img src={type.icon} alt={type.label} className="w-12 h-12 object-contain rounded-lg" />
                      <span className="text-sm text-white text-center font-medium">{type.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 연동 설정 영역 */}
            <div className="p-5">
              {/* 네이버 스마트스토어 */}
              {addForm.site_type === 'naver' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    네이버 커머스 API 연동
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">사이트 이름</label>
                    <input
                      type="text"
                      placeholder="예: 내 스마트스토어"
                      value={addForm.site_name}
                      onChange={(e) => setAddForm({ ...addForm, site_name: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">
                      스토어 ID <span className="text-slate-500">(선택)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="smartstore.naver.com/스토어ID"
                      value={addForm.store_id}
                      onChange={(e) => setAddForm({ ...addForm, store_id: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Application ID</label>
                    <input
                      type="text"
                      placeholder="네이버 커머스 API Application ID"
                      value={addForm.application_id}
                      onChange={(e) => setAddForm({ ...addForm, application_id: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">Application Secret</label>
                    <input
                      type="password"
                      placeholder="네이버 커머스 API Application Secret"
                      value={addForm.application_secret}
                      onChange={(e) => setAddForm({ ...addForm, application_secret: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleNaverConnect}
                    disabled={saving || !addForm.site_name.trim() || !addForm.application_id.trim() || !addForm.application_secret.trim()}
                    className="w-full h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? '연동 중...' : '연동하기'}
                  </button>
                </div>
              )}

              {/* 카페24 */}
              {addForm.site_type === 'cafe24' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    OAuth 자동 연동
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5">쇼핑몰 ID</label>
                    <input
                      type="text"
                      placeholder="myshop.cafe24.com → myshop"
                      value={addForm.store_id}
                      onChange={(e) => setAddForm({ ...addForm, store_id: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => handleOAuth('cafe24', addForm.store_id)}
                    disabled={!addForm.store_id.trim()}
                    className="w-full h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    카페24 연동하기
                  </button>
                </div>
              )}

              {/* 아임웹 */}
              {addForm.site_type === 'imweb' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    OAuth 자동 연동
                  </div>
                  <button
                    onClick={() => handleOAuth('imweb')}
                    className="w-full h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                  >
                    아임웹 연동하기
                  </button>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="px-5 py-4 border-t border-slate-700">
              <button
                onClick={() => setShowAddModal(false)}
                className="w-full h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
