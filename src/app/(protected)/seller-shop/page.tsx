'use client'

import { useState, useEffect } from 'react'
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

export default function SellerShopPage() {
  const [loading, setLoading] = useState(true)
  const [customizations, setCustomizations] = useState<StoreCustomization[]>([])
  const [availableStores, setAvailableStores] = useState<{ slug: string; channelType: 'youtube' | 'tiktok'; name: string }[]>([])

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
    return channelType === 'tiktok' ? `/tt/${storeSlug}` : `/v/${storeSlug}`
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
      <div>
        <h1 className="text-2xl font-bold text-white">셀러샵</h1>
        <p className="text-slate-400 mt-1">SNS 영상번호 검색 페이지를 꾸미고 관리하세요</p>
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
            <h3 className="text-sm font-semibold text-white">셀러샵이란?</h3>
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
          <h2 className="text-lg font-semibold text-white mb-3">내 셀러샵</h2>
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
          <h2 className="text-lg font-semibold text-white mb-3">새 셀러샵 만들기</h2>
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
          <h3 className="text-lg font-semibold text-white mb-2">아직 셀러샵이 없어요</h3>
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
    </div>
  )
}
