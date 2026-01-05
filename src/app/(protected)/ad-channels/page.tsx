'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface AdChannel {
  id: string
  channel_type: string
  channel_name: string
  account_id?: string
  account_name?: string
  status: string
  created_at: string
}

const CHANNEL_TYPES = [
  { value: 'meta', label: 'Meta', icon: '/channel_logo/meta.png', isApi: true },
  { value: 'naver_blog', label: '네이버 블로그', icon: '/channel_logo/naver_blog.png', isApi: false },
  { value: 'tiktok', label: 'TikTok', icon: '/channel_logo/tiktok.png', isApi: false },
  { value: 'youtube', label: 'YouTube', icon: '/channel_logo/youtube.png', isApi: false },
  { value: 'instagram', label: 'Instagram', icon: '/channel_logo/insta.png', isApi: false },
  { value: 'thread', label: 'Threads', icon: '/channel_logo/thread.png', isApi: false },
  { value: 'influencer', label: '인플루언서/체험단', icon: '/channel_logo/influencer.png', isApi: false },
]

export default function AdChannelsPage() {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [channels, setChannels] = useState<AdChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    channel_type: 'meta',
    channel_name: '',
    account_id: ''
  })
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // URL 파라미터에서 성공/에러 메시지 처리
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success === 'meta_connected') {
      setMessage({ type: 'success', text: 'Meta 광고 계정이 연동되었습니다' })
      // URL에서 파라미터 제거
      window.history.replaceState({}, '', '/ad-channels')
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'no_ad_accounts': 'Meta 광고 계정을 찾을 수 없습니다',
        'token_exchange_failed': '인증에 실패했습니다. 다시 시도해주세요',
        'save_failed': '저장에 실패했습니다',
        'state_expired': '인증 시간이 만료되었습니다. 다시 시도해주세요',
        'configuration_error': '서버 설정 오류입니다',
      }
      setMessage({ type: 'error', text: errorMessages[error] || error })
      window.history.replaceState({}, '', '/ad-channels')
    }
  }, [searchParams])

  // Meta OAuth 연동 시작
  const handleMetaOAuth = () => {
    window.location.href = '/api/auth/meta'
  }

  // 모달 초기화
  const resetModal = () => {
    setAddForm({ channel_type: 'meta', channel_name: '', account_id: '' })
  }

  // 채널 목록 불러오기
  const fetchChannels = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('ad_channels')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setChannels(data || [])
    } catch (error) {
      console.error('Failed to fetch channels:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  // 채널 추가
  const handleAddChannel = async () => {
    if (!addForm.channel_name.trim()) {
      setMessage({ type: 'error', text: '채널 이름을 입력해주세요' })
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('ad_channels')
        .insert({
          user_id: user.id,
          channel_type: addForm.channel_type,
          channel_name: addForm.channel_name,
          account_id: addForm.account_id || null,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error

      setMessage({ type: 'success', text: '광고 채널이 추가되었습니다' })
      setShowAddModal(false)
      resetModal()
      fetchChannels()

      // 채널 생성 후 상세 페이지로 이동 (추적링크 추가하도록)
      if (data) {
        window.location.href = `/ad-channels/${data.id}`
      }
    } catch (error) {
      console.error('Failed to add channel:', error)
      setMessage({ type: 'error', text: '채널 추가에 실패했습니다' })
    } finally {
      setSaving(false)
    }
  }

  // 채널 삭제
  const handleDeleteChannel = async (channelId: string) => {
    if (!confirm('정말 이 광고 채널을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('ad_channels')
        .delete()
        .eq('id', channelId)

      if (error) throw error
      fetchChannels()
    } catch (error) {
      console.error('Failed to delete channel:', error)
      setMessage({ type: 'error', text: '삭제에 실패했습니다' })
    }
  }

  // Meta 토큰 갱신
  const handleRefreshToken = async (channelId: string) => {
    setRefreshing(channelId)
    setMessage(null)

    try {
      const response = await fetch('/api/ad-channels/meta/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage({
          type: 'success',
          text: '토큰이 갱신되었습니다. 이제 광고비 동기화를 사용할 수 있습니다.'
        })
        fetchChannels() // 채널 목록 새로고침
      } else if (result.needsReconnect) {
        setMessage({
          type: 'error',
          text: '토큰을 갱신할 수 없습니다. Meta 계정을 다시 연동해주세요.'
        })
      } else {
        setMessage({
          type: 'error',
          text: result.error || '토큰 갱신에 실패했습니다'
        })
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      setMessage({ type: 'error', text: '토큰 갱신 중 오류가 발생했습니다' })
    } finally {
      setRefreshing(null)
    }
  }

  // Meta 광고비 동기화
  const handleSyncMeta = async (channelId: string) => {
    setSyncing(channelId)
    setMessage(null)

    try {
      const response = await fetch('/api/ad-channels/meta/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setMessage({
          type: 'success',
          text: `광고 데이터 동기화 완료! (${result.synced}개 캠페인, ${result.campaigns}개 조회)`
        })
      } else {
        setMessage({
          type: 'error',
          text: result.error || '동기화에 실패했습니다'
        })
      }
    } catch (error) {
      console.error('Meta sync error:', error)
      setMessage({ type: 'error', text: '동기화 중 오류가 발생했습니다' })
    } finally {
      setSyncing(null)
    }
  }

  const getChannelTypeInfo = (type: string) => {
    return CHANNEL_TYPES.find(t => t.value === type) || { value: type, label: type, icon: '/channel_logo/custom.png' }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">광고 채널</h1>
          <p className="text-slate-400 text-sm mt-1">광고를 집행하는 채널을 추가하세요</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          채널 추가
        </button>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`p-4 rounded-lg mb-4 ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {message.text}
        </div>
      )}

      {/* 채널 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : channels.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">등록된 광고 채널이 없습니다</h3>
          <p className="text-slate-400 text-sm mb-4">광고를 집행하는 채널을 추가해보세요</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
          >
            첫 채널 추가하기
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {channels.map((channel) => {
            const typeInfo = getChannelTypeInfo(channel.channel_type)
            return (
              <div
                key={channel.id}
                className="p-4 bg-slate-800 rounded-xl border border-slate-700 flex items-center gap-4"
              >
                <img src={typeInfo.icon} alt={typeInfo.label} className="w-12 h-12 rounded-xl object-contain" />
                <div className="flex-1">
                  <h3 className="font-medium text-white">{channel.channel_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-slate-400">{typeInfo.label}</span>
                    {channel.account_id && (
                      <span className="text-xs text-slate-500">({channel.account_id})</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    channel.status === 'active' || channel.status === 'connected'
                      ? 'bg-green-500/20 text-green-400'
                      : channel.status === 'token_expired'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-slate-600 text-slate-400'
                  }`}>
                    {channel.status === 'active' || channel.status === 'connected'
                      ? '활성'
                      : channel.status === 'token_expired'
                      ? 'Token expired, please reconnect'
                      : channel.status}
                  </span>
                  {/* Meta 채널인 경우 */}
                  {channel.channel_type === 'meta' && (
                    <>
                      {/* 토큰 만료 시 갱신 버튼 */}
                      {channel.status === 'token_expired' ? (
                        <button
                          onClick={() => handleRefreshToken(channel.id)}
                          disabled={refreshing === channel.id}
                          className="px-3 py-1.5 text-xs font-medium bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {refreshing === channel.id ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              갱신 중...
                            </span>
                          ) : '토큰 갱신'}
                        </button>
                      ) : (
                        /* 정상 상태일 때 동기화 버튼 */
                        <button
                          onClick={() => handleSyncMeta(channel.id)}
                          disabled={syncing === channel.id}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {syncing === channel.id ? (
                            <span className="flex items-center gap-1.5">
                              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              동기화 중...
                            </span>
                          ) : '광고비 동기화'}
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteChannel(channel.id)}
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

      {/* 채널 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg bg-slate-800 border border-slate-700 rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* 헤더 */}
            <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold text-white">광고 채널 추가</h3>
              <button
                onClick={() => { setShowAddModal(false); resetModal(); }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 채널 선택 그리드 */}
                <div className="p-5 border-b border-slate-700">
                  <label className="block text-sm text-slate-400 mb-3">채널 선택</label>
                  <div className="grid grid-cols-4 gap-3">
                    {CHANNEL_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setAddForm({ ...addForm, channel_type: type.value, channel_name: '', account_id: '' })}
                        className={`relative p-4 rounded-lg border transition-colors ${
                          addForm.channel_type === type.value
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        {type.isApi && (
                          <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 text-[9px] font-medium bg-blue-500 text-white rounded">
                            API
                          </div>
                        )}
                        <div className="flex flex-col items-center gap-3">
                          <img src={type.icon} alt={type.label} className="w-10 h-10 object-contain rounded-lg" />
                          <span className="text-xs text-white text-center font-medium">{type.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 설정 영역 */}
                <div className="p-5">
                  {/* Meta 선택 시 */}
                  {addForm.channel_type === 'meta' && (
                    <div className="space-y-4">
                      <div className="text-xs text-slate-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        Facebook · Instagram 광고 자동 연동
                      </div>
                      <button
                        onClick={handleMetaOAuth}
                        className="w-full h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors"
                      >
                        Meta 계정 연동하기
                      </button>
                    </div>
                  )}

                  {/* 기타 채널 선택 시 */}
                  {addForm.channel_type !== 'meta' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1.5">채널 이름</label>
                        <input
                          type="text"
                          placeholder="예: 공식 블로그, 메인 계정"
                          value={addForm.channel_name}
                          onChange={(e) => setAddForm({ ...addForm, channel_name: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-slate-400 mb-1.5">
                          계정 ID <span className="text-slate-500">(선택)</span>
                        </label>
                        <input
                          type="text"
                          placeholder="예: @myaccount"
                          value={addForm.account_id}
                          onChange={(e) => setAddForm({ ...addForm, account_id: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg bg-slate-900 border border-slate-600 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 푸터 */}
                <div className="px-5 py-4 border-t border-slate-700 flex gap-3 flex-shrink-0">
                  <button
                    onClick={() => { setShowAddModal(false); resetModal(); }}
                    className="flex-1 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium transition-colors"
                  >
                    취소
                  </button>
                  {addForm.channel_type !== 'meta' && (
                    <button
                      onClick={handleAddChannel}
                      disabled={saving || !addForm.channel_name.trim()}
                      className="flex-1 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? '추가 중...' : '채널 추가'}
                    </button>
                  )}
                </div>

          </div>
        </div>
      )}
    </div>
  )
}
