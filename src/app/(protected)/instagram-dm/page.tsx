'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useSubscription } from '@/hooks/useSubscription'

interface DmSetting {
  id: string
  instagram_media_id: string
  instagram_media_url: string | null
  instagram_media_type: string | null
  instagram_caption: string | null
  instagram_thumbnail_url: string | null
  trigger_keywords: string[]
  dm_message: string
  follow_request_message: string | null
  is_active: boolean
  total_dms_sent: number
  created_at: string
  updated_at: string
  tracking_link_id: string | null
  ad_channel_id: string | null
  ad_channels: {
    id: string
    channel_name: string
    account_id: string | null
    account_name: string | null
  } | null
  tracking_links: {
    id: string
    utm_campaign: string
    target_url: string
    go_url: string | null
    post_name: string | null
    clicks: number
    conversions: number
  } | null
}

interface InstagramChannel {
  id: string
  channel_name: string
  account_id: string | null
  account_name: string | null
  status: string
}

export default function InstagramDmPage() {
  const { status: subscriptionStatus, trialDaysLeft, isLoading: subscriptionLoading, hasAccess } = useSubscription()
  const [loading, setLoading] = useState(true)
  const [dmSettings, setDmSettings] = useState<DmSetting[]>([])
  const [instagramChannels, setInstagramChannels] = useState<InstagramChannel[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)
  const [accountsExpanded, setAccountsExpanded] = useState(false)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Instagram 채널 가져오기 (ad_channels 테이블에서)
      const { data: channels } = await supabase
        .from('ad_channels')
        .select('id, channel_name, account_id, account_name, status')
        .eq('user_id', user.id)
        .eq('channel_type', 'instagram')
        .eq('status', 'connected')

      if (channels && channels.length > 0) {
        setInstagramChannels(channels)
        // 첫 번째 채널을 기본 선택
        setSelectedChannelId(channels[0].id)
      }

      // DM 설정 가져오기
      const response = await fetch('/api/instagram/dm-settings')
      const result = await response.json()
      if (result.success && result.data) {
        setDmSettings(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (settingId: string) => {
    if (!confirm('이 DM 자동발송 설정을 삭제하시겠습니까?')) return

    setDeletingId(settingId)
    try {
      const response = await fetch(`/api/instagram/dm-settings/${settingId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDmSettings(prev => prev.filter(s => s.id !== settingId))
      }
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleDisconnect = async (channelId: string, channelName: string) => {
    if (!confirm(`@${channelName} 계정의 연결을 해제하시겠습니까?\n\n연결 해제 시 해당 계정의 모든 DM 자동발송 설정도 함께 삭제됩니다.`)) return

    setDisconnectingId(channelId)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('ad_channels')
        .delete()
        .eq('id', channelId)

      if (!error) {
        // 채널 목록에서 제거
        setInstagramChannels(prev => prev.filter(c => c.id !== channelId))
        // 관련 DM 설정도 제거
        setDmSettings(prev => prev.filter(s => s.ad_channel_id !== channelId))
        // 선택된 채널이면 다른 채널 선택
        if (selectedChannelId === channelId) {
          const remaining = instagramChannels.filter(c => c.id !== channelId)
          setSelectedChannelId(remaining.length > 0 ? remaining[0].id : null)
        }
        setAccountsExpanded(false)
      } else {
        alert('연결 해제에 실패했습니다')
      }
    } catch (error) {
      console.error('Failed to disconnect:', error)
      alert('연결 해제 중 오류가 발생했습니다')
    } finally {
      setDisconnectingId(null)
    }
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* 구독 상태 배너 */}
      {!subscriptionLoading && subscriptionStatus === 'expired' && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
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
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
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
      <div>
        <h1 className="text-2xl font-bold text-white">인스타그램 자동 DM</h1>
        <p className="text-slate-400 mt-1">게시물 댓글에 키워드가 감지되면 자동으로 DM을 발송합니다</p>
      </div>

      {/* 서비스 이용 가이드 */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">처음 이용하시나요?</h3>
              <p className="text-xs text-slate-400 mt-0.5">인스타그램 자동 DM 설정 방법을 확인해보세요</p>
            </div>
          </div>
          <Link
            href="/guide?tab=instagram-dm"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium rounded-lg transition-colors"
          >
            서비스 이용 가이드
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Instagram 연결 상태 */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        {/* 헤더 (클릭하면 확장/축소) */}
        <button
          onClick={() => setAccountsExpanded(!accountsExpanded)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">연결된 Instagram 계정</span>
            {instagramChannels.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-2 py-1 bg-slate-700/50 rounded-md">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-white">
                    @{instagramChannels.find(c => c.id === selectedChannelId)?.channel_name || instagramChannels[0].channel_name || 'Instagram'}
                  </span>
                </div>
                {instagramChannels.length > 1 && (
                  <span className="text-xs text-slate-500">외 {instagramChannels.length - 1}개</span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform ${accountsExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* 확장된 계정 목록 */}
        {accountsExpanded && (
          <div className="border-t border-slate-700">
            {instagramChannels.map(channel => (
              <div
                key={channel.id}
                className={`flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 last:border-b-0 ${
                  selectedChannelId === channel.id ? 'bg-slate-700/50' : ''
                }`}
              >
                <button
                  onClick={() => {
                    setSelectedChannelId(channel.id)
                    setAccountsExpanded(false)
                  }}
                  className="flex items-center gap-3 flex-1 hover:bg-slate-700/30 -ml-4 -my-3 pl-4 py-3 transition-colors"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${channel.status === 'connected' ? 'bg-green-500' : 'bg-slate-500'}`} />
                  <div className="flex-1 text-left">
                    <span className="text-sm text-white">@{channel.channel_name || 'Instagram'}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      {channel.status === 'connected' ? '연결됨' : '연결 해제'}
                    </span>
                  </div>
                  {selectedChannelId === channel.id && (
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                {/* 연결 해제 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDisconnect(channel.id, channel.channel_name || 'Instagram')
                  }}
                  disabled={disconnectingId === channel.id}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="연결 해제"
                >
                  {disconnectingId === channel.id ? (
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  )}
                </button>
              </div>
            ))}

            {/* 추가 연결 버튼 */}
            <a
              href="/api/auth/instagram?from=instagram-dm"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-blue-400 hover:bg-slate-700/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              계정 추가 연결
            </a>
          </div>
        )}

        {/* 계정 없을 때 연결 버튼 */}
        {instagramChannels.length === 0 && !accountsExpanded && (
          <div className="px-4 pb-4">
            <a
              href="/api/auth/instagram?from=instagram-dm"
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors w-full"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Instagram 연결하기
            </a>
          </div>
        )}
      </div>

      {/* 안내 배너 */}
      {instagramChannels.length > 0 && dmSettings.length === 0 && (
        <div className="bg-gradient-to-r from-pink-500/10 to-blue-500/10 border border-pink-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">DM 자동발송 작동 방식</h3>
              <p className="text-xs text-slate-400 mt-1">
                1. 게시물을 선택하고 트리거 키워드를 설정하세요 (예: &quot;링크&quot;, &quot;가격&quot;)<br />
                2. 팔로워가 해당 키워드가 포함된 댓글을 달면 자동으로 DM이 발송됩니다<br />
                3. 팔로우 요청 메시지 → 팔로우 확인 후 상품 링크 발송
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DM 설정 목록 */}
      {instagramChannels.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">
              DM 자동발송 설정
              {dmSettings.filter(s => s.ad_channel_id === selectedChannelId).length > 0 &&
                ` (${dmSettings.filter(s => s.ad_channel_id === selectedChannelId).length}개)`
              }
            </h2>
            {hasAccess ? (
              <Link
                href={`/instagram-dm/add${selectedChannelId ? `?channel=${selectedChannelId}` : ''}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                추가
              </Link>
            ) : (
              <button
                disabled
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg opacity-50 cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                추가
              </button>
            )}
          </div>
          {dmSettings.filter(s => s.ad_channel_id === selectedChannelId).length > 0 ? (
            <div className="space-y-3">
              {dmSettings.filter(s => s.ad_channel_id === selectedChannelId).map(setting => (
                <div
                  key={setting.id}
                  className="bg-slate-700/30 border border-slate-600 rounded-xl p-4"
                >
                  <div className="flex items-stretch gap-4">
                    {/* 썸네일 */}
                    <div className="w-24 min-h-[96px] rounded-lg overflow-hidden bg-slate-700 flex-shrink-0 self-stretch">
                      {(setting.instagram_thumbnail_url || setting.instagram_media_url) ? (
                        <img
                          src={setting.instagram_thumbnail_url || setting.instagram_media_url || ''}
                          alt="Post thumbnail"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-slate-500">
                          {setting.instagram_media_type === 'VIDEO' ? '동영상' :
                           setting.instagram_media_type === 'CAROUSEL_ALBUM' ? '캐러셀' : '이미지'}
                        </span>
                      </div>

                      <p className="text-sm text-white font-medium truncate mb-1">
                        {setting.instagram_caption ? setting.instagram_caption.slice(0, 60) + (setting.instagram_caption.length > 60 ? '...' : '') : '(캡션 없음)'}
                      </p>

                      {/* 트래킹 URL */}
                      {setting.tracking_links?.go_url && (
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-3.5 h-3.5 text-pink-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span className="text-xs text-slate-500 truncate flex-1">{setting.tracking_links.go_url}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(setting.tracking_links!.go_url!)
                              const btn = e.currentTarget
                              btn.innerHTML = `<svg class="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`
                              setTimeout(() => {
                                btn.innerHTML = `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>`
                              }, 1500)
                            }}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors flex-shrink-0"
                            title="URL 복사"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <a
                            href={setting.tracking_links.go_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors flex-shrink-0"
                            title="페이지 이동"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>발송: {setting.total_dms_sent}건</span>
                        {setting.tracking_links && (
                          <span>클릭: {setting.tracking_links.clicks}</span>
                        )}
                        <Link
                          href={`/ad-performance?tracking_link=${setting.tracking_link_id}`}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          자세히 보기
                        </Link>
                      </div>
                    </div>

                    {/* 액션 버튼 */}
                    <div className="flex items-center gap-2">
                      {/* 수정 */}
                      <Link
                        href={`/instagram-dm/add?edit=${setting.tracking_link_id}`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>

                      {/* 삭제 */}
                      <button
                        onClick={() => handleDelete(setting.id)}
                        disabled={deletingId === setting.id}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === setting.id ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>

                      {/* 게시물 링크 */}
                      {setting.instagram_media_url && (
                        <a
                          href={setting.instagram_media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm text-slate-400 mb-1">아직 DM 자동발송 설정이 없어요</p>
              <p className="text-xs text-slate-500">위의 &apos;추가&apos; 버튼을 눌러 첫 설정을 해보세요!</p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
