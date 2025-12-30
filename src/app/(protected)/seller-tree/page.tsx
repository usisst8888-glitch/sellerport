'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

interface StoreCustomization {
  id: string
  channel_type: 'youtube' | 'tiktok'
  store_slug: string
  header_image_url?: string
  title_text?: string
  bg_color_hex?: string
  updated_at: string
}

interface TrackingLink {
  id: string
  channel_type: string
  store_slug?: string
}

export default function SellerTreePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [customizations, setCustomizations] = useState<StoreCustomization[]>([])
  const [availableStores, setAvailableStores] = useState<{ slug: string; channelType: 'youtube' | 'tiktok'; name: string }[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 새 셀러트리 만들기 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newChannelType, setNewChannelType] = useState<'youtube' | 'tiktok'>('youtube')
  const [newStoreSlug, setNewStoreSlug] = useState('')
  const [slugError, setSlugError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 기존 커스터마이징 데이터 가져오기
      const { data: customizationData } = await supabase
        .from('store_customization')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (customizationData) {
        setCustomizations(customizationData)
      }

      // 추적 링크에서 YouTube/TikTok 스토어 슬러그 가져오기
      const { data: trackingLinks } = await supabase
        .from('tracking_links')
        .select('id, channel_type, store_slug')
        .eq('user_id', user.id)
        .in('channel_type', ['youtube', 'tiktok'])
        .not('store_slug', 'is', null)

      if (trackingLinks) {
        // 유니크한 store_slug만 추출
        const uniqueStores = new Map<string, { slug: string; channelType: 'youtube' | 'tiktok'; name: string }>()
        trackingLinks.forEach((link: TrackingLink) => {
          if (link.store_slug) {
            const key = `${link.channel_type}-${link.store_slug}`
            if (!uniqueStores.has(key)) {
              uniqueStores.set(key, {
                slug: link.store_slug,
                channelType: link.channel_type as 'youtube' | 'tiktok',
                name: link.store_slug
              })
            }
          }
        })
        setAvailableStores(Array.from(uniqueStores.values()))
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getChannelLabel = (channelType: string) => {
    switch (channelType) {
      case 'youtube': return 'YouTube'
      case 'tiktok': return 'TikTok'
      default: return channelType
    }
  }

  const getChannelColor = (channelType: string) => {
    switch (channelType) {
      case 'youtube': return 'bg-red-500'
      case 'tiktok': return 'bg-pink-500'
      default: return 'bg-slate-500'
    }
  }

  const getPreviewUrl = (channelType: string, storeSlug: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_TRACKING_URL || 'https://sp-trk.link'
    return channelType === 'tiktok' ? `${baseUrl}/tt/${storeSlug}` : `${baseUrl}/v/${storeSlug}`
  }

  const handleDelete = async (id: string) => {
    setDeleteLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('store_customization')
        .delete()
        .eq('id', id)

      if (error) throw error

      setCustomizations(prev => prev.filter(c => c.id !== id))
      setDeletingId(null)
    } catch (error) {
      console.error('Failed to delete:', error)
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  // 새로 만들 수 있는 스토어 (아직 커스터마이징 안 된 것들)
  const availableForCreate = availableStores.filter(
    store => !customizations.some(c => c.channel_type === store.channelType && c.store_slug === store.slug)
  )

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">셀러트리</h1>
          <p className="text-slate-400 mt-1">SNS 영상번호 검색 페이지를 꾸미고 관리하세요</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 셀러트리 만들기
        </button>
      </div>

      {/* 안내 배너 */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">셀러트리란?</h3>
            <p className="text-xs text-slate-400 mt-1">
              YouTube 쇼츠, TikTok 영상에서 &quot;영상번호&quot;를 안내하면 고객이 검색 페이지에서 번호를 입력해 상품 페이지로 바로 이동합니다.
              검색 페이지의 디자인을 브랜드에 맞게 커스터마이징하세요.
            </p>
          </div>
        </div>
      </div>

      {/* 커스터마이징된 페이지 목록 */}
      {customizations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">내 셀러트리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customizations.map((custom) => (
              <div
                key={custom.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden hover:border-slate-600 transition-colors"
              >
                {/* 미리보기 이미지 */}
                <div
                  className="h-32 flex items-center justify-center"
                  style={{ backgroundColor: custom.bg_color_hex || '#FECACA' }}
                >
                  {custom.header_image_url ? (
                    <Image
                      src={custom.header_image_url}
                      alt="Header"
                      width={400}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-700">{custom.title_text || '영상번호 검색'}</p>
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full text-white ${getChannelColor(custom.channel_type)}`}>
                      {getChannelLabel(custom.channel_type)}
                    </span>
                    <span className="text-sm text-slate-300 font-medium">{custom.store_slug}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    마지막 수정: {new Date(custom.updated_at).toLocaleDateString('ko-KR')}
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href={`/conversions/customize/${custom.channel_type}/${custom.store_slug}`}
                      className="flex-1 py-2 text-center text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      수정하기
                    </Link>
                    <a
                      href={getPreviewUrl(custom.channel_type, custom.store_slug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <button
                      onClick={() => setDeletingId(custom.id)}
                      className="px-3 py-2 text-sm font-medium bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 새로 만들기 가능한 스토어 */}
      {availableStores.filter(store => !customizations.some(c => c.channel_type === store.channelType && c.store_slug === store.slug)).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-3">새 셀러트리 만들기</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableStores
              .filter(store => !customizations.some(c => c.channel_type === store.channelType && c.store_slug === store.slug))
              .map((store) => (
                <Link
                  key={`${store.channelType}-${store.slug}`}
                  href={`/conversions/customize/${store.channelType}/${store.slug}`}
                  className="bg-slate-800/30 border border-dashed border-slate-600 rounded-xl p-6 hover:border-blue-500 hover:bg-slate-800/50 transition-all group"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-700 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                      <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full text-white ${getChannelColor(store.channelType)}`}>
                        {getChannelLabel(store.channelType)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-300">{store.slug}</p>
                    <p className="text-xs text-slate-500 mt-1">클릭하여 꾸미기</p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* 추적 링크가 없는 경우 */}
      {availableStores.length === 0 && customizations.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">아직 셀러트리가 없어요</h3>
          <p className="text-slate-400 text-sm mb-4">
            먼저 광고 성과 관리에서 YouTube 또는 TikTok 추적 링크를 만들어주세요.
          </p>
          <Link
            href="/conversions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            추적 링크 만들러 가기
          </Link>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-white mb-2">셀러트리 삭제</h3>
            <p className="text-sm text-slate-400 mb-4">
              정말 이 셀러트리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                disabled={deleteLoading}
                className="flex-1 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deletingId)}
                disabled={deleteLoading}
                className="flex-1 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 새 셀러트리 만들기 모달 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-4">새 셀러트리 만들기</h3>

            {/* 채널 타입 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">채널 타입</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewChannelType('youtube')}
                  className={`flex-1 py-3 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    newChannelType === 'youtube'
                      ? 'border-red-500 bg-red-500/20 text-red-400'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  YouTube
                </button>
                <button
                  onClick={() => setNewChannelType('tiktok')}
                  className={`flex-1 py-3 px-4 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    newChannelType === 'tiktok'
                      ? 'border-pink-500 bg-pink-500/20 text-pink-400'
                      : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                  TikTok
                </button>
              </div>
            </div>

            {/* 스토어 슬러그 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">스토어 슬러그</label>
              <input
                type="text"
                value={newStoreSlug}
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  setNewStoreSlug(value)
                  setSlugError('')
                }}
                placeholder="예: my-store"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
              <p className="text-xs text-slate-500 mt-1">
                영문 소문자, 숫자, 하이픈만 사용 가능
              </p>
              {slugError && (
                <p className="text-xs text-red-400 mt-1">{slugError}</p>
              )}
            </div>

            {/* 미리보기 URL */}
            {newStoreSlug && (
              <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">셀러트리 URL</p>
                <p className="text-sm text-blue-400 font-mono">
                  {newChannelType === 'tiktok'
                    ? `${process.env.NEXT_PUBLIC_TRACKING_URL || 'https://sp-trk.link'}/tt/${newStoreSlug}`
                    : `${process.env.NEXT_PUBLIC_TRACKING_URL || 'https://sp-trk.link'}/v/${newStoreSlug}`}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewStoreSlug('')
                  setSlugError('')
                }}
                className="flex-1 py-2 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => {
                  if (!newStoreSlug) {
                    setSlugError('스토어 슬러그를 입력해주세요')
                    return
                  }
                  if (newStoreSlug.length < 2) {
                    setSlugError('2자 이상 입력해주세요')
                    return
                  }
                  // 이미 존재하는지 확인
                  const exists = customizations.some(
                    c => c.channel_type === newChannelType && c.store_slug === newStoreSlug
                  )
                  if (exists) {
                    setSlugError('이미 존재하는 셀러트리입니다')
                    return
                  }
                  router.push(`/conversions/customize/${newChannelType}/${newStoreSlug}`)
                }}
                className="flex-1 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
              >
                만들기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
