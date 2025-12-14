'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AdChannel {
  id: string
  channel_type: string
  channel_name: string
  account_id: string | null
  account_name: string | null
  status: string
  last_sync_at: string | null
  auto_control_enabled: boolean
  roas_threshold: number
  daily_budget_limit: number | null
  is_manual?: boolean
  metadata?: Record<string, unknown>
}

interface Campaign {
  id: string
  ad_channel_id: string
  campaign_id: string
  campaign_name: string
  status: 'active' | 'paused' | 'deleted'
  daily_budget: number
  spend_today: number
  impressions: number
  clicks: number
  conversions: number
  roas: number
}

// 수동 채널 타입
const manualChannelTypes = [
  { value: 'influencer', label: '인플루언서', icon: '👤', description: '유튜버, 인스타그래머 등' },
  { value: 'experience', label: '체험단', icon: '📝', description: '블로그 체험단, 리뷰어' },
  { value: 'blog', label: '블로그/카페', icon: '📰', description: '네이버 블로그, 카페 마케팅' },
  { value: 'sns', label: 'SNS 채널', icon: '📱', description: '인스타, 틱톡 자체 채널' },
  { value: 'email', label: '이메일/SMS', icon: '📧', description: '뉴스레터, 문자 마케팅' },
  { value: 'offline', label: '오프라인', icon: '🏪', description: '전단지, 매장 홍보' },
  { value: 'other', label: '기타', icon: '📌', description: '기타 마케팅 채널' },
]

// Mock 데이터 (실제 API 연동 전)
const mockCampaigns: Campaign[] = [
  {
    id: '1',
    ad_channel_id: 'meta-1',
    campaign_id: '123456789',
    campaign_name: '겨울 시즌 프로모션',
    status: 'active',
    daily_budget: 100000,
    spend_today: 45000,
    impressions: 12500,
    clicks: 320,
    conversions: 15,
    roas: 285,
  },
  {
    id: '2',
    ad_channel_id: 'meta-1',
    campaign_id: '123456790',
    campaign_name: '신규 고객 유치',
    status: 'active',
    daily_budget: 50000,
    spend_today: 32000,
    impressions: 8900,
    clicks: 180,
    conversions: 8,
    roas: 156,
  },
  {
    id: '3',
    ad_channel_id: 'meta-1',
    campaign_id: '123456791',
    campaign_name: '리타겟팅 - 장바구니 이탈',
    status: 'paused',
    daily_budget: 30000,
    spend_today: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    roas: 0,
  },
]

export default function AdManagementPage() {
  const [channels, setChannels] = useState<AdChannel[]>([])
  const [manualChannels, setManualChannels] = useState<AdChannel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [loading, setLoading] = useState(true)
  const [togglingCampaign, setTogglingCampaign] = useState<string | null>(null)

  // 수동 채널 추가 모달
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualForm, setManualForm] = useState({
    channelType: '',
    channelName: '',
    contactName: '',
    contactInfo: '',
    channelUrl: '',
    memo: '',
  })
  const [creatingManual, setCreatingManual] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 수동 채널 수정/삭제
  const [editingManual, setEditingManual] = useState<AdChannel | null>(null)
  const [deletingManual, setDeletingManual] = useState<AdChannel | null>(null)

  // 채널 필터 (1차: 전체/API/수동)
  const [channelFilter, setChannelFilter] = useState<'all' | 'api' | 'manual'>('all')
  // 세부 채널 타입 필터 (2차: 특정 채널 타입)
  const [subChannelFilter, setSubChannelFilter] = useState<string | null>(null)

  useEffect(() => {
    fetchChannels()
    fetchManualChannels()
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

  const fetchChannels = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('ad_channels')
        .select('*')
        .eq('status', 'connected')
        .eq('is_manual', false)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch ad channels:', error)
        return
      }
      setChannels(data || [])
      if (data && data.length > 0) {
        setSelectedChannel(data[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch ad channels:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchManualChannels = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('ad_channels')
        .select('*')
        .eq('is_manual', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch manual channels:', error)
        return
      }
      setManualChannels(data || [])
    } catch (error) {
      console.error('Failed to fetch manual channels:', error)
    }
  }

  const handleCreateManualChannel = async () => {
    if (!manualForm.channelType || !manualForm.channelName.trim()) {
      setMessage({ type: 'error', text: '채널 유형과 이름을 입력해주세요' })
      return
    }

    setCreatingManual(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setMessage({ type: 'error', text: '로그인이 필요합니다' })
        setCreatingManual(false)
        return
      }

      const { error } = await supabase
        .from('ad_channels')
        .insert({
          user_id: user.id,
          channel_type: manualForm.channelType,
          channel_name: manualForm.channelName.trim(),
          account_name: manualForm.contactName.trim() || null,
          account_id: manualForm.contactInfo.trim() || null,
          metadata: {
            memo: manualForm.memo.trim(),
            channelUrl: manualForm.channelUrl.trim() || null,
          },
          status: 'connected',
          is_manual: true,
        })

      if (error) {
        console.error('Failed to create manual channel:', error)
        setMessage({ type: 'error', text: '채널 추가에 실패했습니다' })
        return
      }

      setMessage({ type: 'success', text: '수동 채널이 추가되었습니다' })
      setShowManualModal(false)
      setManualForm({
        channelType: '',
        channelName: '',
        contactName: '',
        contactInfo: '',
        channelUrl: '',
        memo: '',
      })
      fetchManualChannels()
    } catch (error) {
      console.error('Failed to create manual channel:', error)
      setMessage({ type: 'error', text: '채널 추가 중 오류가 발생했습니다' })
    } finally {
      setCreatingManual(false)
    }
  }

  const handleDeleteManualChannel = async () => {
    if (!deletingManual) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('ad_channels')
        .delete()
        .eq('id', deletingManual.id)

      if (error) {
        console.error('Failed to delete manual channel:', error)
        setMessage({ type: 'error', text: '삭제에 실패했습니다' })
        return
      }

      setMessage({ type: 'success', text: '채널이 삭제되었습니다' })
      setDeletingManual(null)
      fetchManualChannels()
    } catch (error) {
      console.error('Failed to delete manual channel:', error)
      setMessage({ type: 'error', text: '삭제 중 오류가 발생했습니다' })
    }
  }

  const handleToggleCampaign = async (campaignId: string, currentStatus: string) => {
    setTogglingCampaign(campaignId)

    // Mock: 실제로는 API 호출
    await new Promise(resolve => setTimeout(resolve, 1000))

    setCampaigns(prev => prev.map(c =>
      c.id === campaignId
        ? { ...c, status: currentStatus === 'active' ? 'paused' : 'active' }
        : c
    ))

    setTogglingCampaign(null)
  }

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'meta':
        return (
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">M</span>
          </div>
        )
      case 'google':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#4285F4] flex items-center justify-center">
            <span className="text-white font-bold text-xs">G</span>
          </div>
        )
      case 'naver_search':
      case 'naver_gfa':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#03C75A] flex items-center justify-center">
            <span className="text-white font-bold text-xs">N</span>
          </div>
        )
      case 'kakao':
        return (
          <div className="w-8 h-8 rounded-lg bg-[#FEE500] flex items-center justify-center">
            <span className="text-black font-bold text-xs">K</span>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">?</span>
          </div>
        )
    }
  }

  const getChannelName = (type: string) => {
    switch (type) {
      case 'meta': return 'Meta'
      case 'google': return 'Google Ads'
      case 'naver_search': return '네이버 검색광고'
      case 'naver_gfa': return '네이버 GFA'
      case 'kakao': return '카카오모먼트'
      case 'karrot': return '당근 비즈니스'
      case 'toss': return '토스'
      case 'tiktok': return 'TikTok'
      case 'dable': return '데이블'
      // 수동 채널
      case 'influencer': return '인플루언서'
      case 'experience': return '체험단'
      case 'blog': return '블로그/카페'
      case 'sns': return 'SNS 채널'
      case 'email': return '이메일/SMS'
      case 'offline': return '오프라인'
      case 'other': return '기타'
      default: return type
    }
  }

  const getManualChannelIcon = (type: string) => {
    const channel = manualChannelTypes.find(c => c.value === type)
    return channel?.icon || '📌'
  }

  const getRoasColor = (roas: number) => {
    if (roas >= 200) return 'text-emerald-400'
    if (roas >= 150) return 'text-amber-400'
    return 'text-red-400'
  }

  const getRoasStatusIcon = (roas: number) => {
    if (roas >= 200) return '🟢'
    if (roas >= 150) return '🟡'
    return '🔴'
  }

  // 통계 계산
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend_today, 0)
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length

  // API 채널 + 수동 채널 합쳐서 전체 채널 목록
  const allChannels = [...channels, ...manualChannels]

  // 1차 필터 적용 (전체/API/수동)
  const firstFilteredChannels = allChannels.filter(channel => {
    if (channelFilter === 'all') return true
    if (channelFilter === 'api') return !channel.is_manual
    if (channelFilter === 'manual') return channel.is_manual
    return true
  })

  // 2차 필터 적용 (세부 채널 타입)
  const filteredChannels = firstFilteredChannels.filter(channel => {
    if (!subChannelFilter) return true
    return channel.channel_type === subChannelFilter
  })

  // 현재 1차 필터에서 사용 가능한 채널 타입 목록
  const availableChannelTypes = Array.from(new Set(firstFilteredChannels.map(c => c.channel_type)))

  // API 채널 타입 목록
  const apiChannelTypes = [
    { value: 'meta', label: 'Meta (FB/Insta)', icon: 'M' },
    { value: 'google', label: 'Google Ads', icon: 'G' },
    { value: 'naver_search', label: '네이버 검색광고', icon: 'N' },
    { value: 'naver_gfa', label: '네이버 GFA', icon: 'N' },
    { value: 'kakao', label: '카카오모먼트', icon: 'K' },
    { value: 'karrot', label: '당근 비즈니스', icon: '🥕' },
    { value: 'toss', label: '토스', icon: 'T' },
    { value: 'tiktok', label: 'TikTok', icon: '♪' },
    { value: 'dable', label: '데이블', icon: 'D' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">광고 채널 관리</h1>
          <p className="mt-1 text-sm text-slate-400">
            연동된 광고 채널별로 캠페인을 관리하고 성과를 확인하세요
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.href = '/ad-channels?tab=manual'}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            수동 채널 추가
          </button>
          <button
            onClick={() => window.location.href = '/ad-channels'}
            className="px-4 py-2 rounded-xl bg-slate-800/50 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 transition-all text-sm"
          >
            API 채널 연동
          </button>
        </div>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="text-sm">{message.text}</span>
          </div>
        </div>
      )}

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
          <p className="text-sm text-slate-400">전체 채널</p>
          <p className="text-2xl font-bold text-white mt-1">{allChannels.length}개</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
          <p className="text-sm text-slate-400">API 연동</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">{channels.length}개</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
          <p className="text-sm text-slate-400">수동 채널</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{manualChannels.length}개</p>
        </div>
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
          <p className="text-sm text-slate-400">오늘 광고비</p>
          <p className="text-2xl font-bold text-white mt-1">{totalSpend.toLocaleString()}원</p>
        </div>
      </div>

      {/* 광고 채널 목록 - API + 수동 통합 */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">광고 채널 목록</h3>
              <p className="text-xs text-slate-500 mt-0.5">API 연동 채널 및 수동 마케팅 채널 (인플루언서, 체험단 등)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.href = '/ad-channels?tab=manual'}
                className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 text-sm transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                수동 채널
              </button>
              <button
                onClick={() => window.location.href = '/ad-channels'}
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 text-sm transition-colors flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                API 연동
              </button>
            </div>
          </div>

          {/* 1차 필터: 전체/API/수동 */}
          {allChannels.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => { setChannelFilter('all'); setSubChannelFilter(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    channelFilter === 'all'
                      ? 'bg-white/10 text-white border border-white/20'
                      : 'bg-slate-900/50 text-slate-400 border border-white/5 hover:border-white/10 hover:text-slate-300'
                  }`}
                >
                  전체 ({allChannels.length})
                </button>
                <button
                  onClick={() => { setChannelFilter('api'); setSubChannelFilter(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    channelFilter === 'api'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-slate-900/50 text-slate-400 border border-white/5 hover:border-white/10 hover:text-slate-300'
                  }`}
                >
                  API 연동 ({channels.length})
                </button>
                <button
                  onClick={() => { setChannelFilter('manual'); setSubChannelFilter(null); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    channelFilter === 'manual'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      : 'bg-slate-900/50 text-slate-400 border border-white/5 hover:border-white/10 hover:text-slate-300'
                  }`}
                >
                  수동 채널 ({manualChannels.length})
                </button>
              </div>

              {/* 2차 필터: 세부 채널 타입 (연동된 것만 표시) */}
              {(() => {
                // 연동된 API 채널 타입들
                const connectedApiTypes = apiChannelTypes.filter(type =>
                  channels.some(c => c.channel_type === type.value)
                )
                // 연동된 수동 채널 타입들
                const connectedManualTypes = manualChannelTypes.filter(type =>
                  manualChannels.some(c => c.channel_type === type.value)
                )

                // 현재 필터에서 표시할 타입들
                const showApiTypes = (channelFilter === 'api' || channelFilter === 'all') && connectedApiTypes.length > 0
                const showManualTypes = (channelFilter === 'manual' || channelFilter === 'all') && connectedManualTypes.length > 0

                // 표시할 세부 필터가 없으면 렌더링 안 함
                if (!showApiTypes && !showManualTypes) return null

                return (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => setSubChannelFilter(null)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        subChannelFilter === null
                          ? 'bg-slate-700 text-white'
                          : 'bg-slate-900/50 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      전체
                    </button>

                    {/* API 채널 타입들 (연동된 것만) */}
                    {showApiTypes && connectedApiTypes.map(type => {
                      const count = channels.filter(c => c.channel_type === type.value).length
                      return (
                        <button
                          key={type.value}
                          onClick={() => setSubChannelFilter(type.value)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                            subChannelFilter === type.value
                              ? 'bg-blue-500/30 text-blue-200 border border-blue-500/40'
                              : 'bg-slate-900/50 text-slate-400 hover:text-slate-300 border border-transparent'
                          }`}
                        >
                          {type.label} <span className="text-[10px] opacity-70">({count})</span>
                        </button>
                      )
                    })}

                    {/* 수동 채널 타입들 (연동된 것만) */}
                    {showManualTypes && connectedManualTypes.map(type => {
                      const count = manualChannels.filter(c => c.channel_type === type.value).length
                      return (
                        <button
                          key={type.value}
                          onClick={() => setSubChannelFilter(type.value)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                            subChannelFilter === type.value
                              ? 'bg-purple-500/30 text-purple-200 border border-purple-500/40'
                              : 'bg-slate-900/50 text-slate-400 hover:text-slate-300 border border-transparent'
                          }`}
                        >
                          <span>{type.icon}</span>
                          {type.label} <span className="text-[10px] opacity-70">({count})</span>
                        </button>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}
        </div>

        {allChannels.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-white mb-2">등록된 광고 채널이 없습니다</h4>
            <p className="text-slate-400 text-sm mb-6">
              API 채널을 연동하거나, 인플루언서/체험단 등 수동 채널을 추가하세요
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => window.location.href = '/ad-channels?tab=manual'}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
              >
                수동 채널 추가
              </button>
              <button
                onClick={() => window.location.href = '/ad-channels'}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                API 채널 연동
              </button>
            </div>
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400">선택한 필터에 해당하는 채널이 없습니다</p>
            <button
              onClick={() => setChannelFilter('all')}
              className="mt-3 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm transition-colors"
            >
              전체 보기
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {/* 필터된 채널 목록 */}
            {filteredChannels.filter(c => !c.is_manual).map((channel) => (
              <div key={channel.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getChannelIcon(channel.channel_type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">{channel.channel_name || getChannelName(channel.channel_type)}</h4>
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/20 text-blue-300">API</span>
                      </div>
                      <p className="text-xs text-slate-500">{getChannelName(channel.channel_type)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                      {channel.last_sync_at ? `동기화: ${new Date(channel.last_sync_at).toLocaleDateString()}` : '대기 중'}
                    </span>
                    <button
                      onClick={() => setSelectedChannel(channel.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
                    >
                      캠페인 보기
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* 수동 채널 */}
            {filteredChannels.filter(c => c.is_manual).map((channel) => (
              <div key={channel.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <span className="text-sm">{getManualChannelIcon(channel.channel_type)}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-white font-medium">{channel.channel_name}</h4>
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-500/20 text-purple-300">수동</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{getChannelName(channel.channel_type)}</span>
                        {channel.account_name && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="text-xs text-slate-400">{channel.account_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`/conversions?channel=${channel.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white text-xs transition-colors"
                    >
                      추적 링크
                    </a>
                    <button
                      onClick={() => setDeletingManual(channel)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {channel.metadata && (
                  <div className="mt-2 ml-11 space-y-1">
                    {(channel.metadata as { channelUrl?: string }).channelUrl && (
                      <p className="text-xs">
                        <span className="text-slate-500">주소: </span>
                        <a
                          href={(channel.metadata as { channelUrl?: string }).channelUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 hover:underline"
                        >
                          {(channel.metadata as { channelUrl?: string }).channelUrl}
                        </a>
                      </p>
                    )}
                    {(channel.metadata as { memo?: string }).memo && (
                      <p className="text-xs text-slate-500">
                        메모: {(channel.metadata as { memo?: string }).memo}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {channels.length > 0 && (
        <>
          {/* 채널 선택 탭 (API 채널이 있을 때만) */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-4">
            <h3 className="text-sm font-medium text-slate-400 mb-3">API 채널별 캠페인</h3>
            <div className="flex flex-wrap gap-2">
              {channels.map((channel) => (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                    selectedChannel === channel.id
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {getChannelIcon(channel.channel_type)}
                  <span>{channel.channel_name || getChannelName(channel.channel_type)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 캠페인 목록 */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-white font-semibold">캠페인 목록</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">마지막 동기화: 방금 전</span>
                <button className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 연동된 채널은 있지만 실제 연동이 안 된 경우 (Mock) */}
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-white font-medium mb-2">캠페인 데이터 준비 중</h4>
              <p className="text-slate-400 text-sm mb-4">
                광고 채널 연동이 완료되면 캠페인 데이터가 자동으로 동기화됩니다.
              </p>
              <p className="text-xs text-slate-500">
                Meta, Google 등 광고 채널 연동은 현재 준비 중입니다.
              </p>
            </div>

            {/* 실제 캠페인이 있을 때 표시될 UI (주석 처리) */}
            {/*
            <div className="divide-y divide-white/5">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="p-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
                        <span className="text-lg">{getRoasStatusIcon(campaign.roas)}</span>
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{campaign.campaign_name}</h4>
                        <p className="text-xs text-slate-500">ID: {campaign.campaign_id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">광고비</p>
                        <p className="text-sm text-white font-medium">{campaign.spend_today.toLocaleString()}원</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">노출</p>
                        <p className="text-sm text-white font-medium">{campaign.impressions.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">클릭</p>
                        <p className="text-sm text-white font-medium">{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">전환</p>
                        <p className="text-sm text-white font-medium">{campaign.conversions}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">ROAS</p>
                        <p className={`text-sm font-bold ${getRoasColor(campaign.roas)}`}>
                          {campaign.roas}%
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleCampaign(campaign.id, campaign.status)}
                        disabled={togglingCampaign === campaign.id}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          campaign.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                        } ${togglingCampaign === campaign.id ? 'opacity-50' : ''}`}
                      >
                        {togglingCampaign === campaign.id ? (
                          <span className="flex items-center gap-2">
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            처리 중
                          </span>
                        ) : campaign.status === 'active' ? (
                          '켜짐'
                        ) : (
                          '꺼짐'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            */}
          </div>

          {/* 자동 제어 설정 */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold">자동 광고 제어</h3>
                <p className="text-sm text-slate-400 mt-1">
                  ROAS가 설정한 기준 미달 시 자동으로 광고를 일시중지합니다
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">준비 중</span>
                <div className="w-12 h-6 rounded-full bg-slate-700 cursor-not-allowed" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                <p className="text-sm text-slate-400 mb-2">ROAS 기준</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    disabled
                    value={150}
                    className="w-24 px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm"
                  />
                  <span className="text-slate-400">% 미만 시 중지</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/10">
                <p className="text-sm text-slate-400 mb-2">일일 광고비 한도</p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    disabled
                    value={100000}
                    className="w-32 px-3 py-2 rounded-lg bg-slate-800/50 border border-white/10 text-white text-sm"
                  />
                  <span className="text-slate-400">원</span>
                </div>
              </div>
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-blue-300 font-medium">광고 관리 기능 안내</p>
                <p className="text-sm text-blue-200/70 mt-1">
                  광고 채널 연동이 완료되면 캠페인별 성과 확인, on/off 제어, 자동 광고 제어 기능을 사용할 수 있습니다.
                  현재 Meta, Google Ads 연동 기능을 준비 중입니다.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 수동 채널 추가 모달 */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">수동 마케팅 채널 추가</h3>
              <p className="text-sm text-slate-400 mt-1">인플루언서, 체험단 등 API 연동이 불가능한 채널을 추가하세요</p>
            </div>

            <div className="p-6 space-y-4">
              {/* 채널 유형 선택 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">채널 유형 *</label>
                <div className="grid grid-cols-2 gap-2">
                  {manualChannelTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setManualForm({ ...manualForm, channelType: type.value })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        manualForm.channelType === type.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-white/10 bg-slate-900/50 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{type.icon}</span>
                        <div>
                          <p className={`text-sm font-medium ${manualForm.channelType === type.value ? 'text-white' : 'text-slate-300'}`}>
                            {type.label}
                          </p>
                          <p className="text-xs text-slate-500">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 채널 이름 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">채널 이름 *</label>
                <input
                  type="text"
                  placeholder="예: 김OO 인플루언서, 네이버 체험단 12월"
                  value={manualForm.channelName}
                  onChange={(e) => setManualForm({ ...manualForm, channelName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              {/* 담당자/연락처 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">담당자명 (선택)</label>
                  <input
                    type="text"
                    placeholder="예: 홍길동"
                    value={manualForm.contactName}
                    onChange={(e) => setManualForm({ ...manualForm, contactName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">연락처/ID (선택)</label>
                  <input
                    type="text"
                    placeholder="예: @instagram_id"
                    value={manualForm.contactInfo}
                    onChange={(e) => setManualForm({ ...manualForm, contactInfo: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* 채널 주소 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">채널 주소 (선택)</label>
                <input
                  type="url"
                  placeholder="예: https://instagram.com/username"
                  value={manualForm.channelUrl}
                  onChange={(e) => setManualForm({ ...manualForm, channelUrl: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">인플루언서 프로필, 블로그 주소 등</p>
              </div>

              {/* 메모 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">메모 (선택)</label>
                <textarea
                  placeholder="예: 팔로워 10만, 뷰티 카테고리, 12월 협찬 예정"
                  value={manualForm.memo}
                  onChange={(e) => setManualForm({ ...manualForm, memo: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                />
              </div>

              {/* 안내 */}
              <div className="p-3 rounded-xl bg-slate-900/50 border border-white/10">
                <p className="text-xs text-slate-400">
                  수동 채널을 추가하면 <strong className="text-slate-300">전환 추적</strong> 페이지에서 이 채널용 추적 링크를 발급할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowManualModal(false)
                  setManualForm({
                    channelType: '',
                    channelName: '',
                    contactName: '',
                    contactInfo: '',
                    channelUrl: '',
                    memo: '',
                  })
                }}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleCreateManualChannel}
                disabled={creatingManual || !manualForm.channelType || !manualForm.channelName.trim()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingManual ? '추가 중...' : '채널 추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deletingManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">{deletingManual.channel_name}</p>
                  <p className="text-sm text-slate-400">이 채널을 삭제하시겠습니까?</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                채널은 삭제되지만, 이미 발급된 추적 링크는 유지됩니다.
              </p>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => setDeletingManual(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteManualChannel}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
