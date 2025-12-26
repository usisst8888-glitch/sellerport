'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { InstagramDmModal } from '@/components/modals/instagram-dm-modal'

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
  ad_channels: {
    id: string
    channel_name: string
    account_name: string | null
    metadata: Record<string, unknown>
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
  account_name: string | null
  metadata: {
    username?: string
    instagram_user_id?: string
  }
}

export default function InstagramDmPage() {
  const [loading, setLoading] = useState(true)
  const [dmSettings, setDmSettings] = useState<DmSetting[]>([])
  const [instagramChannels, setInstagramChannels] = useState<InstagramChannel[]>([])
  const [showDmModal, setShowDmModal] = useState(false)
  const [editingSettingId, setEditingSettingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Instagram 채널 가져오기
      const { data: channels } = await supabase
        .from('ad_channels')
        .select('id, channel_name, account_name, metadata')
        .eq('user_id', user.id)
        .eq('channel_type', 'instagram')
        .eq('status', 'active')

      if (channels) {
        setInstagramChannels(channels)
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

  const handleToggleActive = async (settingId: string, currentActive: boolean) => {
    try {
      const response = await fetch(`/api/instagram/dm-settings/${settingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive })
      })

      if (response.ok) {
        setDmSettings(prev => prev.map(s =>
          s.id === settingId ? { ...s, is_active: !currentActive } : s
        ))
      }
    } catch (error) {
      console.error('Failed to toggle active:', error)
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

  const handleEdit = (setting: DmSetting) => {
    if (setting.tracking_link_id) {
      setEditingSettingId(setting.tracking_link_id)
      setShowDmModal(true)
    }
  }

  const handleModalClose = () => {
    setShowDmModal(false)
    setEditingSettingId(null)
    fetchData() // 목록 새로고침
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Instagram DM 자동발송</h1>
          <p className="text-slate-400 mt-1">게시물 댓글에 키워드가 감지되면 자동으로 DM을 발송합니다</p>
        </div>
        {instagramChannels.length > 0 && (
          <button
            onClick={() => setShowDmModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-medium rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            새 DM 자동발송 추가
          </button>
        )}
      </div>

      {/* Instagram 연결 안내 */}
      {instagramChannels.length === 0 && (
        <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-pink-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Instagram 계정을 연결해주세요</h3>
          <p className="text-slate-400 text-sm mb-4">
            DM 자동발송을 사용하려면 먼저 Instagram 비즈니스 계정을 연결해야 합니다.
          </p>
          <Link
            href="/quick-start"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg"
          >
            Instagram 연결하기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      )}

      {/* 안내 배너 */}
      {instagramChannels.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 rounded-xl p-4">
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

      {/* 연결된 Instagram 계정 */}
      {instagramChannels.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-slate-400 mb-2">연결된 Instagram 계정</h2>
          <div className="flex flex-wrap gap-2">
            {instagramChannels.map(channel => (
              <div
                key={channel.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073z" />
                  </svg>
                </div>
                <span className="text-sm text-white">@{channel.metadata?.username || channel.account_name || 'Instagram'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DM 설정 목록 */}
      {dmSettings.length > 0 ? (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">DM 자동발송 설정 ({dmSettings.length}개)</h2>
          <div className="space-y-3">
            {dmSettings.map(setting => (
              <div
                key={setting.id}
                className={`bg-slate-800/50 border rounded-xl p-4 transition-all ${
                  setting.is_active ? 'border-slate-700' : 'border-slate-700/50 opacity-60'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* 썸네일 */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                    {setting.instagram_thumbnail_url ? (
                      <img
                        src={setting.instagram_thumbnail_url}
                        alt="Post thumbnail"
                        className="w-full h-full object-cover"
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
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        setting.is_active ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-400'
                      }`}>
                        {setting.is_active ? '활성' : '비활성'}
                      </span>
                      <span className="text-xs text-slate-500">
                        {setting.instagram_media_type === 'VIDEO' ? '동영상' :
                         setting.instagram_media_type === 'CAROUSEL_ALBUM' ? '캐러셀' : '이미지'}
                      </span>
                    </div>

                    <p className="text-sm text-white font-medium truncate mb-1">
                      {setting.instagram_caption ? setting.instagram_caption.slice(0, 60) + (setting.instagram_caption.length > 60 ? '...' : '') : '(캡션 없음)'}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-2">
                      {setting.trigger_keywords.slice(0, 5).map((keyword, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 text-[10px] bg-pink-500/20 text-pink-400 rounded">
                          {keyword}
                        </span>
                      ))}
                      {setting.trigger_keywords.length > 5 && (
                        <span className="text-[10px] text-slate-500">+{setting.trigger_keywords.length - 5}개</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>발송: {setting.total_dms_sent}건</span>
                      {setting.tracking_links && (
                        <>
                          <span>클릭: {setting.tracking_links.clicks}</span>
                          <span>전환: {setting.tracking_links.conversions}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex items-center gap-2">
                    {/* 활성/비활성 토글 */}
                    <button
                      onClick={() => handleToggleActive(setting.id, setting.is_active)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        setting.is_active ? 'bg-green-500' : 'bg-slate-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          setting.is_active ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>

                    {/* 수정 */}
                    <button
                      onClick={() => handleEdit(setting)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>

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
        </div>
      ) : instagramChannels.length > 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">아직 DM 자동발송 설정이 없어요</h3>
          <p className="text-slate-400 text-sm mb-4">
            게시물에 댓글이 달리면 자동으로 DM을 보내보세요!
          </p>
          <button
            onClick={() => setShowDmModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            첫 DM 자동발송 설정하기
          </button>
        </div>
      ) : null}

      {/* DM 설정 모달 */}
      {showDmModal && instagramChannels.length > 0 && (
        <InstagramDmModal
          isOpen={showDmModal}
          onClose={handleModalClose}
          onSuccess={() => {
            handleModalClose()
            fetchData()
          }}
          channelId={instagramChannels[0].id}
          isConnected={true}
          editingTrackingLinkId={editingSettingId}
        />
      )}
    </div>
  )
}
