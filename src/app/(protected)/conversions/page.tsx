'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { InstagramDmModal } from '@/components/modals/instagram-dm-modal'
import { YoutubeVideoCodeModal } from '@/components/modals/youtube-video-code-modal'

interface TrackingLink {
  id: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  target_url: string
  tracking_url: string
  bridge_shop_url: string | null
  go_url: string | null
  clicks: number
  conversions: number
  revenue: number
  ad_spend: number
  status: string
  created_at: string
  target_roas_green: number | null
  target_roas_yellow: number | null
  thumbnail_url: string | null
  channel_type: string | null
  video_code: string | null
  post_name: string | null
  store_slug: string | null
  products?: {
    id: string
    name: string
    image_url: string | null
    price: number
    cost: number
  } | null
}

interface Product {
  id: string
  name: string
  external_product_id: string
  price: number
  cost: number
  image_url: string | null
  site_type: string
  my_site_id: string
  my_sites?: {
    id: string
    site_type: string
    site_name: string
    store_id?: string | null
  } | null
}

// 채널 타입 한글 라벨 매핑
const channelTypeLabels: Record<string, string> = {
  instagram: '인스타그램',
  youtube: '유튜브',
  naver_blog: '네이버 블로그',
  meta: 'Meta 광고',
  google: 'Google Ads',
  google_ads: 'Google Ads',
  naver_search: '네이버 검색광고',
  naver_gfa: '네이버 GFA',
  kakao: '카카오모먼트',
  tiktok: 'TikTok',
  tiktok_ads: 'TikTok Ads',
  karrot: '당근 비즈니스',
  toss: '토스',
  dable: '데이블',
  influencer: '인플루언서',
  experience: '체험단',
  blog: '블로그',
  cafe: '카페/커뮤니티',
  email: '이메일/뉴스레터',
  sms: 'SMS/알림톡',
  offline: '오프라인 광고',
  etc: '기타',
}

const getChannelLabel = (channelType: string): string => {
  return channelTypeLabels[channelType] || channelType
}

interface MySite {
  id: string
  site_type: string
  site_name: string
  store_id?: string | null
  status: string
  last_sync_at?: string | null
}

interface AdChannel {
  id: string
  channel_type: string
  channel_name: string
  account_name: string | null
  status: string
  last_sync_at: string | null
  my_site_id: string | null // 연결된 사이트 ID
  metadata?: {
    instagram_user_id?: string
    instagram_username?: string
    dm_enabled?: boolean
    [key: string]: unknown
  } | null
}

interface AdSpendDaily {
  id: string
  ad_channel_id: string
  campaign_id: string
  campaign_name: string
  date: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  conversion_value: number
}

interface CampaignSummary {
  campaign_id: string
  campaign_name: string
  channel_type: string
  total_spend: number
  total_impressions: number
  total_clicks: number
  total_conversions: number
  total_conversion_value: number
  ctr: number
  cpc: number
  roas: number
}

// ROAS 기준 신호등 색상 반환 (개별 기준 지원)
function getSignalLight(
  roas: number,
  greenThreshold: number = 300,
  yellowThreshold: number = 150
): { color: string; bg: string; text: string; label: string } {
  if (roas >= greenThreshold) return { color: 'emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '🟢 좋음' }
  if (roas >= yellowThreshold) return { color: 'amber', bg: 'bg-amber-500/20', text: 'text-amber-400', label: '🟡 보통' }
  return { color: 'red', bg: 'bg-red-500/20', text: 'text-red-400', label: '🔴 주의' }
}

export default function ConversionsPage() {
  const searchParams = useSearchParams()
  const fromQuickStart = searchParams.get('from') === 'quick-start'
  const openModal = searchParams.get('openModal') === 'true'

  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 추적 링크 생성 모달
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isInstagramConnected, setIsInstagramConnected] = useState(false)
  const [instagramChannelId, setInstagramChannelId] = useState<string | null>(null)
  // Instagram DM 수정 모드
  const [editingInstagramLinkId, setEditingInstagramLinkId] = useState<string | null>(null)

  // 광고비 수정 모달
  const [editingLink, setEditingLink] = useState<TrackingLink | null>(null)
  const [editAdSpend, setEditAdSpend] = useState(0)

  // 추적 링크 수정 모달
  const [editingLinkFull, setEditingLinkFull] = useState<TrackingLink | null>(null)
  const [editForm, setEditForm] = useState({ name: '', status: 'active' })
  const [updating, setUpdating] = useState(false)

  // 삭제 확인 모달
  const [deletingLink, setDeletingLink] = useState<TrackingLink | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ROAS 기준 설정 모달
  const [editingRoasLink, setEditingRoasLink] = useState<TrackingLink | null>(null)
  const [roasForm, setRoasForm] = useState({ greenThreshold: 300, yellowThreshold: 150 })
  const [updatingRoas, setUpdatingRoas] = useState(false)

  // 연결된 사이트와 광고 채널
  const [connectedSites, setConnectedSites] = useState<MySite[]>([])
  const [adChannels, setAdChannels] = useState<AdChannel[]>([])

  // 광고 채널 성과 데이터 (모든 채널)
  const [adStats, setAdStats] = useState<CampaignSummary[]>([])
  const [adStatsLoading, setAdStatsLoading] = useState(false)
  const [syncingChannel, setSyncingChannel] = useState<string | null>(null)

  // 채널 설정 드롭다운
  const [openChannelMenu, setOpenChannelMenu] = useState<string | null>(null)
  const [unlinkingChannel, setUnlinkingChannel] = useState<string | null>(null)

  // 성과 탭 (campaign: 캠페인 성과, tracking: 추적 링크)
  const [performanceTab, setPerformanceTab] = useState<'campaign' | 'tracking'>('campaign')

  // 스마트스토어 전환 동기화 상태
  const [smartstoreSyncStatus, setSmartstoreSyncStatus] = useState<{
    lastSync: string | null
    availableSources: string[]
    channelStatsCount: number
  } | null>(null)
  const [syncingSmartstore, setSyncingSmartstore] = useState(false)

  // 유튜브 영상번호 관련 상태
  const [showYoutubeVideoCodeModal, setShowYoutubeVideoCodeModal] = useState(false)
  const [videoCodes, setVideoCodes] = useState<{
    id: string
    video_code: string
    video_title: string | null
    target_url: string
    clicks: number
    conversions: number
    revenue: number
    status: string
  }[]>([])
  const [videoCodesStoreSlug, setVideoCodesStoreSlug] = useState<string | null>(null)

  // 플랫폼이 검색광고인지 확인
  const isSearchAdPlatform = (channelType: string) => {
    return ['naver_search', 'google', 'kakao'].includes(channelType)
  }

  // 플랫폼이 소셜광고인지 확인 (광고소재 기반)
  const isSocialAdPlatform = (channelType: string) => {
    return ['meta', 'tiktok', 'naver_gfa'].includes(channelType)
  }

  const fetchConnectedData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 연결된 사이트 조회
    const { data: sites } = await supabase
      .from('my_sites')
      .select('id, site_type, site_name, store_id, status, last_sync_at')
      .eq('user_id', user.id)
      .in('status', ['connected', 'active', 'pending_verification', 'pending_script'])
      .order('created_at', { ascending: false })

    if (sites) {
      setConnectedSites(sites)
    }

    // 연결된 광고 채널 조회 (사이트 연결 정보 포함)
    const { data: channels } = await supabase
      .from('ad_channels')
      .select('id, channel_type, channel_name, account_name, status, last_sync_at, my_site_id, metadata')
      .eq('user_id', user.id)
      .eq('status', 'connected')
      .order('created_at', { ascending: false })

    if (channels) {
      setAdChannels(channels)
      // Instagram 연결 상태 확인 (channel_type이 'instagram'이거나 metadata에 instagram_user_id가 있는 경우)
      const instagramChannel = channels.find(c =>
        c.channel_type === 'instagram' ||
        c.metadata?.instagram_user_id
      )
      setIsInstagramConnected(!!instagramChannel)
      if (instagramChannel) {
        setInstagramChannelId(instagramChannel.id)
      }
      // 광고 채널이 있으면 성과 데이터 조회
      if (channels.length > 0) {
        fetchAdStats(channels, user.id)
      }
    }
  }

  // 모든 광고 채널 성과 데이터 조회
  const fetchAdStats = async (channels: AdChannel[], userId: string) => {
    setAdStatsLoading(true)
    try {
      const supabase = createClient()

      // 최근 30일 날짜 범위
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const dateFrom = thirtyDaysAgo.toISOString().split('T')[0]
      const dateTo = today.toISOString().split('T')[0]

      // 모든 채널의 광고비 데이터 조회
      const channelIds = channels.map(c => c.id)
      const { data: spendData, error } = await supabase
        .from('ad_spend_daily')
        .select('*')
        .eq('user_id', userId)
        .in('ad_channel_id', channelIds)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date', { ascending: false })

      if (error) {
        console.error('Failed to fetch ad spend data:', error)
        return
      }

      if (!spendData || spendData.length === 0) {
        setAdStats([])
        return
      }

      // 캠페인별로 집계
      const campaignMap = new Map<string, CampaignSummary>()

      for (const record of spendData) {
        const key = `${record.ad_channel_id}-${record.campaign_id}`
        const channel = channels.find(c => c.id === record.ad_channel_id)

        if (!campaignMap.has(key)) {
          campaignMap.set(key, {
            campaign_id: record.campaign_id,
            campaign_name: record.campaign_name,
            channel_type: channel?.channel_type || 'unknown',
            total_spend: 0,
            total_impressions: 0,
            total_clicks: 0,
            total_conversions: 0,
            total_conversion_value: 0,
            ctr: 0,
            cpc: 0,
            roas: 0,
          })
        }

        const summary = campaignMap.get(key)!
        summary.total_spend += record.spend || 0
        summary.total_impressions += record.impressions || 0
        summary.total_clicks += record.clicks || 0
        summary.total_conversions += record.conversions || 0
        summary.total_conversion_value += record.conversion_value || 0
      }

      // CTR, CPC, ROAS 계산
      const summaries = Array.from(campaignMap.values()).map(s => ({
        ...s,
        ctr: s.total_impressions > 0 ? (s.total_clicks / s.total_impressions) * 100 : 0,
        cpc: s.total_clicks > 0 ? Math.round(s.total_spend / s.total_clicks) : 0,
        roas: s.total_spend > 0 ? Math.round((s.total_conversion_value / s.total_spend) * 100) : 0,
      }))

      // 광고비 높은 순으로 정렬
      summaries.sort((a, b) => b.total_spend - a.total_spend)
      setAdStats(summaries)
    } catch (error) {
      console.error('Failed to fetch ad stats:', error)
    } finally {
      setAdStatsLoading(false)
    }
  }

  // 스마트스토어 전환 동기화 상태 조회
  const fetchSmartstoreSyncStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch('/api/smartstore/sync', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setSmartstoreSyncStatus({
            lastSync: result.lastCollected,
            availableSources: result.availableSources || [],
            channelStatsCount: result.channelStats || 0
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch smartstore sync status:', error)
    }
  }

  // 유튜브 영상번호 목록 조회
  const fetchVideoCodes = async () => {
    try {
      const response = await fetch('/api/youtube/video-codes')
      const result = await response.json()
      if (result.success) {
        setVideoCodes(result.data || [])
        setVideoCodesStoreSlug(result.storeSlug || null)
      }
    } catch (error) {
      console.error('Failed to fetch video codes:', error)
    }
  }

  // 스마트스토어 전환 데이터 수동 동기화
  const handleSyncSmartstore = async () => {
    setSyncingSmartstore(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setMessage({ type: 'error', text: '로그인이 필요합니다' })
        return
      }

      const response = await fetch('/api/smartstore/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      if (result.success) {
        setMessage({
          type: 'success',
          text: result.synced > 0
            ? `${result.synced}개 추적 링크의 전환 데이터가 동기화되었습니다`
            : result.message || '동기화할 데이터가 없습니다'
        })
        // 추적 링크 데이터 새로고침
        fetchTrackingLinks()
        fetchSmartstoreSyncStatus()
      } else {
        setMessage({ type: 'error', text: result.error || '동기화에 실패했습니다' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '동기화 중 오류가 발생했습니다' })
    } finally {
      setSyncingSmartstore(false)
    }
  }

  // 광고 채널 동기화 엔드포인트 매핑
  const getSyncEndpoint = (channelType: string): string | null => {
    const endpoints: Record<string, string> = {
      'naver_search': '/api/ad-channels/naver-search/sync',
      'naver_gfa': '/api/ad-channels/naver-gfa/sync',
      'meta': '/api/ad-channels/meta/sync',
      'google': '/api/ad-channels/google/sync',
    }
    return endpoints[channelType] || null
  }

  // 광고 채널 동기화
  const handleSyncChannel = async (channel: AdChannel) => {
    const endpoint = getSyncEndpoint(channel.channel_type)
    if (!endpoint) {
      setMessage({ type: 'error', text: '이 채널은 아직 동기화를 지원하지 않습니다' })
      return
    }

    setSyncingChannel(channel.id)
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId: channel.id })
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: `${channel.channel_name} 동기화 완료 (${result.synced}건)` })
        // 데이터 새로고침
        fetchConnectedData()
      } else {
        setMessage({ type: 'error', text: result.error || '동기화에 실패했습니다' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '동기화 중 오류가 발생했습니다' })
    } finally {
      setSyncingChannel(null)
    }
  }

  // 광고 채널 연동 해제
  const handleUnlinkChannel = async (channel: AdChannel) => {
    if (!confirm(`"${channel.channel_name}" 연동을 해제하시겠습니까?\n\n연동 해제 시 해당 채널의 광고 성과 데이터도 함께 삭제됩니다.`)) {
      return
    }

    setUnlinkingChannel(channel.id)
    setOpenChannelMenu(null)

    try {
      const supabase = createClient()

      // 1. 관련 광고 성과 데이터 삭제
      await supabase
        .from('ad_spend_daily')
        .delete()
        .eq('ad_channel_id', channel.id)

      // 2. 관련 추적 링크의 채널 연결 해제
      await supabase
        .from('tracking_links')
        .update({ ad_channel_id: null })
        .eq('ad_channel_id', channel.id)

      // 3. Instagram DM 설정 삭제 (Instagram 채널인 경우)
      if (channel.channel_type === 'instagram') {
        await supabase
          .from('instagram_dm_settings')
          .delete()
          .eq('ad_channel_id', channel.id)
      }

      // 4. 광고 채널 삭제
      const { error } = await supabase
        .from('ad_channels')
        .delete()
        .eq('id', channel.id)

      if (error) throw error

      setMessage({ type: 'success', text: `${channel.channel_name} 연동이 해제되었습니다` })

      // 데이터 새로고침
      fetchConnectedData()
    } catch (error) {
      console.error('Failed to unlink channel:', error)
      setMessage({ type: 'error', text: '연동 해제에 실패했습니다' })
    } finally {
      setUnlinkingChannel(null)
    }
  }

  // 채널 타입별 배지 색상
  const getChannelBadgeStyle = (channelType: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      'naver_search': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'SA' },
      'naver_gfa': { bg: 'bg-green-500/20', text: 'text-green-400', label: 'GFA' },
      'meta': { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Meta' },
      'google': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Google' },
      'kakao': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Kakao' },
      'tiktok': { bg: 'bg-pink-500/20', text: 'text-pink-400', label: 'TikTok' },
      'instagram': { bg: 'bg-pink-500/20', text: 'text-pink-400', label: 'Instagram' },
      'youtube': { bg: 'bg-red-500/20', text: 'text-red-400', label: 'YouTube' },
      'naver_blog': { bg: 'bg-green-500/20', text: 'text-green-400', label: '블로그' },
    }
    return styles[channelType] || { bg: 'bg-slate-500/20', text: 'text-slate-400', label: channelType }
  }

  // 채널 타입별 로고 경로 (썸네일이 없을 때 기본 로고)
  const getChannelLogoPath = (channelType: string): string => {
    const logos: Record<string, string> = {
      'instagram': '/channel_logo/insta.png',
      'meta': '/channel_logo/meta.png',
      'google': '/channel_logo/google_ads.png',
      'google_ads': '/channel_logo/google_ads.png',
      'naver_search': '/channel_logo/naver_search.png',
      'naver_gfa': '/channel_logo/naver_gfa.png',
      'naver_blog': '/channel_logo/naver_blog.png',
      'youtube': '/channel_logo/youtube.png',
      'tiktok': '/channel_logo/tiktok.png',
      'toss': '/channel_logo/toss.png',
      'influencer': '/channel_logo/influencer.png',
      'experience': '/channel_logo/experience.png',
      'thread': '/channel_logo/thread.png',
    }
    return logos[channelType] || '/channel_logo/meta.png'
  }

  const fetchTrackingLinks = async () => {
    try {
      const response = await fetch('/api/tracking-links')
      const result = await response.json()
      if (result.success) {
        setTrackingLinks(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch tracking links:', error)
    } finally {
      setLoading(false)
    }
  }

  // 광고비 업데이트
  const handleUpdateAdSpend = async () => {
    if (!editingLink) return

    try {
      const response = await fetch(`/api/tracking-links/${editingLink.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adSpend: editAdSpend })
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: '광고비가 업데이트되었습니다' })
        setEditingLink(null)
        fetchTrackingLinks()
      } else {
        setMessage({ type: 'error', text: result.error || '업데이트에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '업데이트 중 오류가 발생했습니다' })
    }
  }

  // 추적 링크 수정
  const handleUpdateTrackingLink = async () => {
    if (!editingLinkFull) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/tracking-links/${editingLinkFull.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          utm_campaign: editForm.name,
          status: editForm.status
        })
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: '추적 링크가 수정되었습니다' })
        setEditingLinkFull(null)
        fetchTrackingLinks()
      } else {
        setMessage({ type: 'error', text: result.error || '수정에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '수정 중 오류가 발생했습니다' })
    } finally {
      setUpdating(false)
    }
  }

  // 추적 링크 삭제
  const handleDeleteTrackingLink = async () => {
    if (!deletingLink) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/tracking-links/${deletingLink.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: '추적 링크가 삭제되었습니다' })
        setDeletingLink(null)
        fetchTrackingLinks()
      } else {
        setMessage({ type: 'error', text: result.error || '삭제에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: '삭제 중 오류가 발생했습니다' })
    } finally {
      setDeleting(false)
    }
  }

  // ROAS 기준 업데이트
  const handleUpdateRoas = async () => {
    if (!editingRoasLink) return

    // 유효성 검사
    if (roasForm.greenThreshold <= roasForm.yellowThreshold) {
      setMessage({ type: 'error', text: '초록불 기준은 노란불 기준보다 높아야 합니다' })
      return
    }
    if (roasForm.yellowThreshold < 0 || roasForm.greenThreshold < 0) {
      setMessage({ type: 'error', text: 'ROAS 기준은 0 이상이어야 합니다' })
      return
    }

    setUpdatingRoas(true)
    try {
      const response = await fetch(`/api/tracking-links/${editingRoasLink.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRoasGreen: roasForm.greenThreshold,
          targetRoasYellow: roasForm.yellowThreshold
        })
      })

      const result = await response.json()
      if (result.success) {
        setMessage({ type: 'success', text: 'ROAS 기준이 저장되었습니다' })
        setEditingRoasLink(null)
        fetchTrackingLinks()
      } else {
        setMessage({ type: 'error', text: result.error || '저장에 실패했습니다' })
      }
    } catch {
      setMessage({ type: 'error', text: 'ROAS 기준 저장 중 오류가 발생했습니다' })
    } finally {
      setUpdatingRoas(false)
    }
  }

  // ROAS 설정 모달 열기
  const openRoasModal = (link: TrackingLink) => {
    setEditingRoasLink(link)
    setRoasForm({
      greenThreshold: link.target_roas_green ?? 300,
      yellowThreshold: link.target_roas_yellow ?? 150
    })
  }

  useEffect(() => {
    fetchTrackingLinks()
    fetchConnectedData()
    fetchSmartstoreSyncStatus()
    fetchVideoCodes()
  }, [])

  // URL 파라미터로 모달 열기
  useEffect(() => {
    if (openModal) {
      setShowCreateModal(true)
    }
  }, [openModal])

  // 메시지 3초 후 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // 모달 열릴 때 배경 스크롤 방지
  useEffect(() => {
    if (editingLink || editingLinkFull || deletingLink || editingRoasLink || showCreateModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [editingLink, editingLinkFull, deletingLink, editingRoasLink, showCreateModal])

  // 드롭다운 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = () => {
      if (openChannelMenu) {
        setOpenChannelMenu(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openChannelMenu])

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const totalClicks = trackingLinks.reduce((sum, s) => sum + (s.clicks || 0), 0)
  const totalConversions = trackingLinks.reduce((sum, s) => sum + (s.conversions || 0), 0)
  const totalRevenue = trackingLinks.reduce((sum, s) => sum + (s.revenue || 0), 0)
  const totalAdSpend = trackingLinks.reduce((sum, s) => sum + (s.ad_spend || 0), 0)
  const avgConversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00'
  const totalRoas = totalAdSpend > 0 ? Math.round((totalRevenue / totalAdSpend) * 100) : 0
  const activeLinks = trackingLinks.filter(s => s.status === 'active').length

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">광고 성과 관리</h1>
          <p className="text-slate-400 mt-1">광고 채널별 성과를 한눈에 확인하고 관리하세요</p>
        </div>
        {/* 스마트스토어 전환 동기화 버튼 */}
        <button
          onClick={handleSyncSmartstore}
          disabled={syncingSmartstore}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {syncingSmartstore ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              동기화 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              스마트스토어 전환 동기화
            </>
          )}
        </button>
      </div>

      {/* 스마트스토어 동기화 안내 */}
      {smartstoreSyncStatus && smartstoreSyncStatus.channelStatsCount > 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <img src="/site_logo/smartstore.png" alt="스마트스토어" className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-white">스마트스토어 전환 데이터 수집됨</p>
                <p className="text-sm text-slate-400">
                  {smartstoreSyncStatus.availableSources.length}개 채널 소스 ({smartstoreSyncStatus.channelStatsCount}건)
                  {smartstoreSyncStatus.lastSync && (
                    <span className="ml-2">
                      · 마지막 수집: {new Date(smartstoreSyncStatus.lastSync).toLocaleString('ko-KR')}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                소스: {smartstoreSyncStatus.availableSources.slice(0, 3).join(', ')}
                {smartstoreSyncStatus.availableSources.length > 3 && ` 외 ${smartstoreSyncStatus.availableSources.length - 3}개`}
              </span>
            </div>
          </div>
        </div>
      )}


      {/* 빠른 시작 안내 배너 */}
      {fromQuickStart && trackingLinks.length > 0 && (
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-white">추적 링크 생성 완료!</p>
                <p className="text-sm text-slate-300">다음 단계로 넘어가세요</p>
              </div>
            </div>
            <Link
              href="/quick-start"
              className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              빠른 시작으로 돌아가기
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      )}

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

      {/* 연결 상태 현황 - 사이트-채널 매핑별 카드 표시 */}
      {(connectedSites.length > 0 || adChannels.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* 각 광고 채널별로 연결된 사이트와 함께 카드 표시 */}
          {adChannels.map(channel => {
            // 해당 채널과 연결된 사이트 찾기
            const linkedSite = connectedSites.find(s => s.id === channel.my_site_id)
            const badge = getChannelBadgeStyle(channel.channel_type)
            // SNS 채널 (추적 링크로 전환 추적): instagram, youtube, tiktok, naver_blog 또는 brand_로 시작하는 채널
            const snsChannelTypes = ['instagram', 'youtube', 'tiktok', 'naver_blog', 'influencer']
            const isBrandChannel = channel.channel_type.startsWith('brand_') || snsChannelTypes.includes(channel.channel_type)

            // 채널 로고 결정
            const getChannelLogoUrl = (type: string) => {
              const logos: Record<string, string> = {
                'meta': '/channel_logo/meta.png',
                'google': '/channel_logo/google_ads.png',
                'naver_search': '/channel_logo/naver_search.png',
                'naver_gfa': '/channel_logo/naver_gfa.png',
                'tiktok': '/channel_logo/tiktok.png',
                'kakao': '/channel_logo/toss.png',
                'instagram': '/channel_logo/insta.png',
                'youtube': '/channel_logo/youtube.png',
                'naver_blog': '/channel_logo/naver_blog.png',
                'brand_blog': '/channel_logo/naver_blog.png',
                'brand_instagram': '/channel_logo/insta.png',
                'brand_youtube': '/channel_logo/youtube.png',
                'brand_tiktok': '/channel_logo/tiktok.png',
              }
              return logos[type] || '/channel_logo/meta.png'
            }

            return (
              <div key={channel.id} className="p-4 rounded-xl bg-slate-800/60 border border-white/5 hover:border-white/10 transition-colors">
                {/* 카드 헤더 - 상태 배지 */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2.5 py-1 text-xs rounded-full flex items-center gap-1.5 border ${
                    linkedSite
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {linkedSite ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        연동됨
                      </>
                    ) : '사이트 미연결'}
                  </span>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenChannelMenu(openChannelMenu === channel.id ? null : channel.id)
                      }}
                      className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    {openChannelMenu === channel.id && (
                      <div className="absolute right-0 top-8 w-36 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 py-1">
                        <button
                          onClick={() => handleUnlinkChannel(channel)}
                          disabled={unlinkingChannel === channel.id}
                          className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2 disabled:opacity-50"
                        >
                          {unlinkingChannel === channel.id ? (
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-red-400"></div>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                          연동 해제
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 가로 레이아웃: 쇼핑몰 - 화살표 - 광고채널 (3등분 가운데 정렬) */}
                <div className="grid grid-cols-3 items-center">
                  {/* 쇼핑몰 정보 - 1/3 */}
                  <div className="flex flex-col items-center text-center">
                    {linkedSite ? (
                      <>
                        <div className="w-10 h-10 rounded-lg overflow-hidden mb-2 bg-white/10">
                          <img
                            src={
                              linkedSite.site_type === 'naver' ? '/site_logo/smartstore.png' :
                              linkedSite.site_type === 'cafe24' ? '/site_logo/cafe24.png' :
                              linkedSite.site_type === 'imweb' ? '/site_logo/imweb.png' :
                              linkedSite.site_type === 'godomall' ? '/site_logo/godomall.png' :
                              linkedSite.site_type === 'makeshop' ? '/site_logo/makeshop.png' :
                              '/site_logo/own_site.png'
                            }
                            alt={linkedSite.site_name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <p className="text-sm font-medium text-white truncate w-full">{linkedSite.site_name}</p>
                        <p className={`text-xs ${
                          linkedSite.site_type === 'naver' ? 'text-green-400/70' :
                          linkedSite.site_type === 'cafe24' ? 'text-blue-400/70' :
                          linkedSite.site_type === 'imweb' ? 'text-purple-400/70' : 'text-slate-500'
                        }`}>
                          {linkedSite.site_type === 'naver' ? '스마트스토어' :
                           linkedSite.site_type === 'cafe24' ? '카페24' :
                           linkedSite.site_type === 'imweb' ? '아임웹' : '자체몰'}
                        </p>
                      </>
                    ) : (
                      <div className="flex flex-col items-center p-2">
                        <div className="w-8 h-8 rounded bg-slate-700/50 flex items-center justify-center mb-1">
                          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-xs text-slate-500">미연결</span>
                      </div>
                    )}
                  </div>

                  {/* 연결 화살표 - 1/3 */}
                  <div className="flex items-center justify-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                      linkedSite
                        ? 'bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-500/40 shadow-emerald-500/10'
                        : 'bg-slate-700/50 border border-slate-600'
                    }`}>
                      <svg className={`w-4 h-4 ${linkedSite ? 'text-emerald-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                  </div>

                  {/* 광고 채널 정보 - 1/3 */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-lg overflow-hidden mb-2 bg-white/10">
                      <img
                        src={getChannelLogoUrl(channel.channel_type)}
                        alt={channel.channel_name || ''}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-sm font-medium text-white truncate w-full">{channel.channel_name || getChannelLabel(channel.channel_type)}</p>
                    <p className={`text-xs ${badge.text}`}>
                      {isBrandChannel ? '추적링크' : getChannelLabel(channel.channel_type).split(' ')[0]}
                    </p>
                  </div>
                </div>

                {/* 동기화/관리 버튼 영역 */}
                <div className="mt-4 pt-3 border-t border-white/5">
                  {isBrandChannel ? (
                    channel.channel_type === 'youtube' ? (
                      <button
                        onClick={() => setShowYoutubeVideoCodeModal(true)}
                        className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        영상번호 추가
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        DM 자동발송 추가하기
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleSyncChannel(channel)}
                      disabled={syncingChannel === channel.id}
                      className={`w-full px-3 py-2 text-xs font-medium rounded-lg ${badge.bg} ${badge.text} hover:opacity-80 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5`}
                    >
                      {syncingChannel === channel.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                          <span>동기화 중...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>광고비 동기화</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}

          {/* 새 연동 추가 카드 */}
          <Link href="/quick-start" className="p-4 rounded-xl border border-dashed border-slate-600 hover:border-slate-500 hover:bg-slate-800/30 transition-colors flex items-center justify-center min-h-[140px]">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-lg bg-slate-700/50 flex items-center justify-center mb-2">
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-400">새 연동</span>
              <span className="text-xs text-slate-500">쇼핑몰 + 광고</span>
            </div>
          </Link>
        </div>
      )}

      {/* 광고 성과 통합 섹션 - 항상 표시 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900/20 to-slate-800/40 border border-violet-500/20">
          <div className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">광고 성과</h2>
                  <p className="text-sm text-slate-400">최근 30일 광고 성과 현황</p>
                </div>
              </div>

            </div>

          </div>

          <div className="p-6">
            {/* 통합 성과 뷰 - 광고 캠페인 + 추적 링크 통합 */}
            {(adStatsLoading || loading) ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
              </div>
            ) : (adStats.length > 0 || trackingLinks.length > 0) ? (
              <div className="space-y-6">
                {/* 전체 요약 - 광고 캠페인 + 추적 링크 합산 */}
                {(() => {
                  // 광고 캠페인 합계
                  const campaignSpend = adStats.reduce((sum, s) => sum + s.total_spend, 0)
                  const campaignClicks = adStats.reduce((sum, s) => sum + s.total_clicks, 0)
                  const campaignConversions = adStats.reduce((sum, s) => sum + s.total_conversions, 0)
                  const campaignRevenue = adStats.reduce((sum, s) => sum + s.total_conversion_value, 0)

                  // 추적 링크 합계
                  const linkSpend = trackingLinks.reduce((sum, l) => sum + (l.ad_spend || 0), 0)
                  const linkClicks = trackingLinks.reduce((sum, l) => sum + l.clicks, 0)
                  const linkConversions = trackingLinks.reduce((sum, l) => sum + l.conversions, 0)
                  const linkRevenue = trackingLinks.reduce((sum, l) => sum + l.revenue, 0)

                  // 통합 합계
                  const totalSpend = campaignSpend + linkSpend
                  const totalClicks = campaignClicks + linkClicks
                  const totalConversions = campaignConversions + linkConversions
                  const totalRevenue = campaignRevenue + linkRevenue
                  const overallRoas = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) : 0
                  const signal = getSignalLight(overallRoas)

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="p-3 rounded-xl bg-slate-800/50">
                        <p className="text-xs text-slate-500">총 광고비</p>
                        <p className="text-lg font-bold text-white">
                          {totalSpend.toLocaleString()}
                          <span className="text-sm font-normal text-slate-400">원</span>
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/50">
                        <p className="text-xs text-slate-500">총 클릭</p>
                        <p className="text-lg font-bold text-white">
                          {totalClicks.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/50">
                        <p className="text-xs text-slate-500">총 전환</p>
                        <p className="text-lg font-bold text-emerald-400">
                          {totalConversions.toLocaleString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-800/50">
                        <p className="text-xs text-slate-500">총 매출</p>
                        <p className="text-lg font-bold text-blue-400">
                          {totalRevenue.toLocaleString()}
                          <span className="text-sm font-normal text-slate-400">원</span>
                        </p>
                      </div>
                      <div className={`p-3 rounded-xl ${signal.bg} border ${overallRoas >= 300 ? 'border-emerald-500/30' : overallRoas >= 150 ? 'border-amber-500/30' : 'border-red-500/30'}`}>
                        <p className="text-xs text-slate-500">전체 ROAS</p>
                        <p className={`text-lg font-bold ${signal.text}`}>
                          {overallRoas}%
                          <span className="ml-1">{signal.label.split(' ')[0]}</span>
                        </p>
                      </div>
                    </div>
                  )
                })()}

                {/* 통합 테이블 - 광고 캠페인 + 추적 링크 */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-slate-400 border-b border-white/5">
                        <th className="pb-3 font-medium">캠페인/추적링크</th>
                        <th className="pb-3 font-medium text-center px-4">광고비</th>
                        <th className="pb-3 font-medium text-center px-4">클릭</th>
                        <th className="pb-3 font-medium text-center px-4">전환</th>
                        <th className="pb-3 font-medium text-center px-4">매출</th>
                        <th className="pb-3 font-medium text-center px-4">ROAS</th>
                        <th className="pb-3 font-medium text-center px-4">액션</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {/* 광고 캠페인 데이터 */}
                      {adStats.map((campaign) => {
                        const campaignRoas = campaign.total_spend > 0 ? Math.round((campaign.total_conversion_value / campaign.total_spend) * 100) : 0
                        const signal = getSignalLight(campaignRoas)
                        const badge = getChannelBadgeStyle(campaign.channel_type)
                        const campaignKey = `campaign-${campaign.channel_type}-${campaign.campaign_id}`

                        return (
                          <tr key={campaignKey} className="hover:bg-white/5">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                {/* 채널 로고 (광고 캠페인은 API 썸네일 없으므로 채널 로고 사용) */}
                                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                  <img
                                    src={getChannelLogoPath(campaign.channel_type)}
                                    alt=""
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 text-xs rounded ${badge.bg} ${badge.text}`}>
                                      {badge.label}
                                    </span>
                                    <span className="text-base text-white truncate max-w-[400px]" title={campaign.campaign_name}>
                                      {campaign.campaign_name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <span>노출 {campaign.total_impressions.toLocaleString()}</span>
                                    <span>·</span>
                                    <span>CTR {campaign.ctr.toFixed(2)}%</span>
                                    <span>·</span>
                                    <span>CPC {campaign.cpc.toLocaleString()}원</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-center text-base text-white px-4">{campaign.total_spend.toLocaleString()}원</td>
                            <td className="py-4 text-center text-base text-white px-4">{campaign.total_clicks.toLocaleString()}</td>
                            <td className="py-4 text-center text-base text-emerald-400 px-4">{campaign.total_conversions.toLocaleString()}</td>
                            <td className="py-4 text-center text-base text-blue-400 px-4">{campaign.total_conversion_value.toLocaleString()}원</td>
                            <td className="py-4 text-center px-4">
                              <span className={`px-2 py-1 text-sm rounded ${signal.bg} ${signal.text}`}>{campaignRoas}%</span>
                            </td>
                            <td className="py-4 text-center px-4">
                              <span className="text-xs text-slate-500">광고 플랫폼</span>
                            </td>
                          </tr>
                        )
                      })}

                      {/* 추적 링크 데이터 */}
                      {trackingLinks.map((link) => {
                        const conversionRate = link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(2) : '0.00'
                        const linkRoas = link.ad_spend > 0 ? Math.round((link.revenue / link.ad_spend) * 100) : 0
                        const greenThreshold = link.target_roas_green ?? 300
                        const yellowThreshold = link.target_roas_yellow ?? 150
                        const signal = getSignalLight(linkRoas, greenThreshold, yellowThreshold)
                        // channel_type을 우선 사용, 없으면 utm_source 사용
                        const effectiveChannelType = link.channel_type || link.utm_source
                        const channelBadge = getChannelBadgeStyle(effectiveChannelType)

                        // 유튜브 영상번호: video_code가 직접 있거나, channel_type이 youtube인 경우
                        const isYoutubeVideoCode = link.channel_type === 'youtube' || link.video_code
                        const matchedVideoCode = isYoutubeVideoCode
                          ? { video_code: link.video_code || '', video_title: link.post_name?.replace(/^쇼츠 [A-Z]\d{3} - /, '') || '' }
                          : null

                        return (
                          <tr key={`link-${link.id}`} className="hover:bg-white/5">
                            <td className="py-4">
                              <div className="flex items-center gap-3">
                                {/* 썸네일 이미지 (있으면 실제 썸네일, 없으면 채널 로고) */}
                                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                                  <img
                                    src={link.thumbnail_url || getChannelLogoPath(effectiveChannelType)}
                                    alt=""
                                    className={`w-full h-full ${link.thumbnail_url ? 'object-cover' : 'object-contain'}`}
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = getChannelLogoPath(effectiveChannelType)
                                    }}
                                  />
                                </div>
                                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2 py-0.5 text-xs rounded ${channelBadge.bg} ${channelBadge.text}`}>
                                      {effectiveChannelType === 'instagram' ? '인스타그램 DM 자동발송' : getChannelLabel(effectiveChannelType)}</span>
                                    <span className={`px-2 py-0.5 text-xs rounded ${
                                      link.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                                    }`}>
                                      {link.status === 'active' ? '활성' : '비활성'}
                                    </span>
                                  </div>
                                  {/* 유튜브 영상번호인 경우 코드 + 제목 표시 */}
                                  {isYoutubeVideoCode && matchedVideoCode ? (
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-lg font-bold text-red-400">{matchedVideoCode.video_code}</span>
                                      <span className="text-base text-white truncate max-w-[300px]" title={matchedVideoCode.video_title || ''}>
                                        {matchedVideoCode.video_title || ''}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-base text-white truncate max-w-[400px]" title={link.utm_campaign || link.post_name || ''}>
                                      {link.utm_campaign || link.post_name || ''}
                                    </span>
                                  )}
                                  {/* 유튜브 영상번호: 검색 페이지 URL + 상품 URL 표시 (가로) */}
                                  {isYoutubeVideoCode && (link.store_slug || videoCodesStoreSlug) && matchedVideoCode ? (
                                    <div className="flex items-center gap-6 flex-wrap">
                                      {/* 검색 페이지 URL */}
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-slate-500 px-1.5 py-0.5 rounded bg-slate-700/50 flex-shrink-0">검색</span>
                                        <span className="text-sm text-slate-400">
                                          {typeof window !== 'undefined' ? window.location.origin : ''}/v/{link.store_slug || videoCodesStoreSlug}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/v/${link.store_slug || videoCodesStoreSlug}`
                                            copyToClipboard(url, `${link.id}-search`)
                                          }}
                                          className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                                          title="검색 페이지 URL 복사"
                                        >
                                          {copiedId === `${link.id}-search` ? (
                                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          ) : (
                                            <svg className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                          )}
                                        </button>
                                      </div>
                                      {/* 상품 URL */}
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-slate-500 px-1.5 py-0.5 rounded bg-slate-700/50 flex-shrink-0">상품</span>
                                        <span className="text-sm text-slate-400">
                                          {typeof window !== 'undefined' ? window.location.origin : ''}/v/{link.store_slug || videoCodesStoreSlug}/{matchedVideoCode.video_code}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/v/${link.store_slug || videoCodesStoreSlug}/${matchedVideoCode.video_code}`
                                            copyToClipboard(url, `${link.id}-product`)
                                          }}
                                          className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                                          title="상품 URL 복사"
                                        >
                                          {copiedId === `${link.id}-product` ? (
                                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                          ) : (
                                            <svg className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (link.go_url || link.tracking_url) && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-slate-500 truncate max-w-[320px]" title={link.go_url || link.tracking_url}>
                                        {link.go_url || link.tracking_url}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          copyToClipboard(link.go_url || link.tracking_url, link.id)
                                        }}
                                        className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0"
                                        title="URL 복사"
                                      >
                                        {copiedId === link.id ? (
                                          <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                          </svg>
                                        ) : (
                                          <svg className="w-4 h-4 text-slate-500 hover:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                          </svg>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 text-center text-base px-4">
                              <button
                                onClick={() => {
                                  setEditingLink(link)
                                  setEditAdSpend(link.ad_spend || 0)
                                }}
                                className="text-white hover:text-blue-400 hover:underline cursor-pointer transition-colors"
                              >
                                {(link.ad_spend || 0).toLocaleString()}원
                              </button>
                            </td>
                            <td className="py-4 text-center text-base text-white px-4">{link.clicks.toLocaleString()}</td>
                            <td className="py-4 text-center px-4">
                              <div className="flex flex-col items-center">
                                <span className="text-base text-emerald-400">{link.conversions.toLocaleString()}</span>
                                <span className="text-xs text-slate-500">{conversionRate}%</span>
                              </div>
                            </td>
                            <td className="py-4 text-center text-base text-blue-400 px-4">{link.revenue.toLocaleString()}원</td>
                            <td className="py-4 text-center px-4">
                              <button
                                onClick={() => {
                                  setEditingRoasLink(link)
                                  setRoasForm({
                                    greenThreshold: link.target_roas_green ?? 300,
                                    yellowThreshold: link.target_roas_yellow ?? 150
                                  })
                                }}
                                className={`px-2 py-1 text-sm rounded ${signal.bg} ${signal.text} hover:opacity-80 transition-opacity`}
                              >
                                {linkRoas}%
                                <svg className="w-3 h-3 inline-block ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center justify-center gap-1">
                                {/* 수정 버튼 */}
                                <button
                                  onClick={() => {
                                    if (effectiveChannelType === 'instagram') {
                                      setEditingInstagramLinkId(link.id)
                                      setShowCreateModal(true)
                                    } else {
                                      setEditingLinkFull(link)
                                      setEditForm({ name: link.utm_campaign, status: link.status })
                                    }
                                  }}
                                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                  title="수정"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                {/* 삭제 버튼 */}
                                <button
                                  onClick={() => setDeletingLink(link)}
                                  className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                  title="삭제"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-slate-400 mb-2">아직 성과 데이터가 없습니다</p>
                <p className="text-sm text-slate-500">광고 채널을 연동하거나 추적 링크를 생성하세요</p>
              </div>
            )}
          </div>
        </div>

      {/* 연결 필요 안내 (아무것도 연결 안된 경우) */}
      {connectedSites.length === 0 && adChannels.length === 0 && !loading && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-white">쇼핑몰 연동이 필요합니다</p>
              <p className="text-sm text-slate-300">전환 추적을 시작하려면 먼저 쇼핑몰을 연동해주세요</p>
            </div>
            <Link
              href="/quick-start"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              빠른 시작하기
            </Link>
          </div>
        </div>
      )}


      {/* 광고비 수정 모달 */}
      {editingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">광고비 수정</h3>
              <p className="text-sm text-slate-400 mt-1">{editingLink.utm_campaign}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">광고비</label>
                <div className="relative">
                  <input
                    type="number"
                    value={editAdSpend}
                    onChange={(e) => setEditAdSpend(Number(e.target.value))}
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">원</span>
                </div>
              </div>

              {/* 예상 ROAS 표시 */}
              {editAdSpend > 0 && (
                <div className="p-3 rounded-xl bg-slate-900/50">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">예상 ROAS</span>
                    <span className={`font-medium ${
                      Math.round((editingLink.revenue / editAdSpend) * 100) >= 300 ? 'text-emerald-400' :
                      Math.round((editingLink.revenue / editAdSpend) * 100) >= 150 ? 'text-amber-400' :
                      'text-red-400'
                    }`}>
                      {Math.round((editingLink.revenue / editAdSpend) * 100)}%
                      {Math.round((editingLink.revenue / editAdSpend) * 100) >= 300 ? ' 🟢' :
                       Math.round((editingLink.revenue / editAdSpend) * 100) >= 150 ? ' 🟡' : ' 🔴'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => setEditingLink(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateAdSpend}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 추적 링크 수정 모달 */}
      {editingLinkFull && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">추적 링크 수정</h3>
              <p className="text-sm text-slate-400 mt-1">추적 링크 정보를 수정합니다</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">추적 링크 이름</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">상태</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/50">
                <p className="text-xs text-slate-500 mb-2">추적 링크 정보</p>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-400">ID: <span className="text-white font-mono">{editingLinkFull.id}</span></p>
                  <p className="text-slate-400">출처: <span className="text-white">{editingLinkFull.utm_source}</span></p>
                  <p className="text-slate-400">매체: <span className="text-white">{editingLinkFull.utm_medium}</span></p>
                  <p className="text-slate-400">UTM: <span className="text-white">{editingLinkFull.utm_campaign}</span></p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => setEditingLinkFull(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateTrackingLink}
                disabled={updating}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
              >
                {updating ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deletingLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-semibold text-white">추적 링크 삭제</h3>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">{deletingLink.utm_campaign}</p>
                  <p className="text-sm text-slate-400">이 추적 링크를 삭제하시겠습니까?</p>
                </div>
              </div>
              <p className="text-sm text-slate-500">
                삭제하면 이 추적 링크의 모든 추적 데이터가 함께 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>

            <div className="p-6 border-t border-white/5 flex gap-3 justify-end">
              <button
                onClick={() => setDeletingLink(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteTrackingLink}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium transition-colors disabled:opacity-50"
              >
                {deleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROAS 기준 설정 모달 */}
      {editingRoasLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">ROAS 기준 설정</h3>
                <p className="text-sm text-slate-400 mt-1">{editingRoasLink.utm_campaign}</p>
              </div>
              <button
                onClick={() => setEditingRoasLink(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* 미리보기 */}
              <div className="p-4 rounded-xl bg-slate-700/50">
                <p className="text-xs text-slate-400 mb-3">현재 ROAS에 따른 신호등</p>
                <div className="flex items-center gap-3">
                  {(() => {
                    const currentRoas = editingRoasLink.ad_spend > 0
                      ? Math.round((editingRoasLink.revenue / editingRoasLink.ad_spend) * 100)
                      : 0
                    const signal = getSignalLight(currentRoas, roasForm.greenThreshold, roasForm.yellowThreshold)
                    return (
                      <>
                        <span className={`px-3 py-1 text-sm rounded-lg ${signal.bg} ${signal.text}`}>
                          {signal.label}
                        </span>
                        <span className="text-white font-bold">{currentRoas}%</span>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* 초록불 기준 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  🟢 초록불 기준 (효율 좋음)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={roasForm.greenThreshold}
                    onChange={(e) => setRoasForm({ ...roasForm, greenThreshold: parseInt(e.target.value) || 0 })}
                    className="flex-1 h-11 px-4 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
                    min="0"
                  />
                  <span className="text-slate-400">% 이상</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">이 ROAS 이상이면 초록불로 표시됩니다</p>
              </div>

              {/* 노란불 기준 */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  🟡 노란불 기준 (주의 필요)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={roasForm.yellowThreshold}
                    onChange={(e) => setRoasForm({ ...roasForm, yellowThreshold: parseInt(e.target.value) || 0 })}
                    className="flex-1 h-11 px-4 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder:text-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20"
                    min="0"
                  />
                  <span className="text-slate-400">% 이상</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">이 ROAS 이상이면 노란불, 미만이면 빨간불로 표시됩니다</p>
              </div>

              {/* 기준 설명 */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">신호등 기준</p>
                <div className="space-y-1.5 text-sm">
                  <p className="text-emerald-400">🟢 ROAS {roasForm.greenThreshold}% 이상 → 효율 좋음</p>
                  <p className="text-amber-400">🟡 ROAS {roasForm.yellowThreshold}% ~ {roasForm.greenThreshold - 1}% → 주의 필요</p>
                  <p className="text-red-400">🔴 ROAS {roasForm.yellowThreshold}% 미만 → 개선 필요</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingRoasLink(null)}
                className="flex-1 h-11 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateRoas}
                disabled={updatingRoas}
                className="flex-1 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
              >
                {updatingRoas ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instagram DM 자동발송 모달 */}
      <InstagramDmModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          setEditingInstagramLinkId(null)
        }}
        onSuccess={() => {
          fetchTrackingLinks()
          setEditingInstagramLinkId(null)
        }}
        channelId={instagramChannelId}
        isConnected={isInstagramConnected}
        editingTrackingLinkId={editingInstagramLinkId}
      />

      {/* 유튜브 영상번호 모달 */}
      <YoutubeVideoCodeModal
        isOpen={showYoutubeVideoCodeModal}
        onClose={() => setShowYoutubeVideoCodeModal(false)}
        onSuccess={() => {
          setShowYoutubeVideoCodeModal(false)
          fetchTrackingLinks()
          fetchVideoCodes()
        }}
      />
    </div>
  )
}
