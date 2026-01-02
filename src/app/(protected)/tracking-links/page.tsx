'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface TrackingLink {
  id: string
  utm_campaign: string
  target_url: string
  go_url: string
  created_at: string
  channel_type?: string
  product_id?: string
  my_site_id?: string
  products?: {
    id: string
    name: string
    my_sites?: {
      id: string
      site_type: string
      site_name: string
    } | null
  } | null
}

const channelTypeMap: Record<string, { icon: string; label: string }> = {
  meta: { icon: '/channel_logo/meta.png', label: 'Meta (API 연동)' },
  meta_paid: { icon: '/channel_logo/meta.png', label: 'Meta 유료광고' },
  naver_blog: { icon: '/channel_logo/naver_blog.png', label: '네이버 블로그' },
  tiktok: { icon: '/channel_logo/tiktok.png', label: 'TikTok' },
  youtube: { icon: '/channel_logo/youtube.png', label: 'YouTube' },
  instagram: { icon: '/channel_logo/insta.png', label: 'Instagram' },
  thread: { icon: '/channel_logo/thread.png', label: 'Threads' },
  influencer: { icon: '/channel_logo/influencer.png', label: '인플루언서/체험단' },
}

const siteTypeMap: Record<string, { logo: string; label: string }> = {
  naver: { logo: '/site_logo/smartstore.png', label: '스마트스토어' },
  cafe24: { logo: '/site_logo/cafe24.png', label: '카페24' },
  imweb: { logo: '/site_logo/imweb.png', label: '아임웹' },
}

export default function TrackingLinksPage() {
  const supabase = createClient()
  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 추적링크 목록 불러오기
  const fetchTrackingLinks = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('tracking_links')
        .select(`
          id,
          utm_campaign,
          target_url,
          go_url,
          created_at,
          channel_type,
          product_id,
          products (
            id,
            name,
            my_sites (
              id,
              site_type,
              site_name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTrackingLinks(data || [])
    } catch (error) {
      console.error('Failed to fetch tracking links:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrackingLinks()
  }, [])

  // 추적링크 삭제
  const handleDelete = async (linkId: string) => {
    if (!confirm('정말 이 추적링크를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('tracking_links')
        .delete()
        .eq('id', linkId)

      if (error) throw error
      setMessage({ type: 'success', text: '추적링크가 삭제되었습니다' })
      fetchTrackingLinks()
    } catch (error) {
      console.error('Failed to delete tracking link:', error)
      setMessage({ type: 'error', text: '삭제에 실패했습니다' })
    }
  }

  // 클립보드 복사
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setMessage({ type: 'success', text: '링크가 복사되었습니다!' })
  }

  // 메시지 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">추적링크</h1>
          <p className="text-slate-400 text-sm mt-1">광고 성과를 추적하는 링크를 관리하세요</p>
        </div>
        <Link
          href="/tracking-links/create"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          추적링크 생성
        </Link>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`p-4 rounded-lg mb-4 ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {message.text}
        </div>
      )}

      {/* 추적링크 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : trackingLinks.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">추적링크가 없습니다</h3>
          <p className="text-slate-400 text-sm mb-4">광고에 사용할 추적링크를 생성해보세요</p>
          <Link
            href="/tracking-links/create"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium inline-block"
          >
            첫 추적링크 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {trackingLinks.map((link) => {
            const channelType = link.channel_type
            const channelInfo = channelType ? channelTypeMap[channelType] : null
            const siteType = link.products?.my_sites?.site_type
            const siteInfo = siteType ? siteTypeMap[siteType] : null
            const siteName = link.products?.my_sites?.site_name

            return (
              <div
                key={link.id}
                className="p-4 bg-slate-800/50 rounded-xl border border-slate-700"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* 사이트 - 광고채널 */}
                    <div className="flex items-center gap-2 mb-2 text-sm text-slate-400">
                      {siteInfo && (
                        <>
                          <img
                            src={siteInfo.logo}
                            alt={siteInfo.label}
                            className="w-4 h-4 rounded object-contain"
                          />
                          <span>{siteName || siteInfo.label}</span>
                        </>
                      )}
                      {siteInfo && channelInfo && <span>-</span>}
                      {channelInfo && (
                        <>
                          <img
                            src={channelInfo.icon}
                            alt={channelInfo.label}
                            className="w-4 h-4 rounded object-contain"
                          />
                          <span>{channelInfo.label}</span>
                        </>
                      )}
                    </div>

                    {/* 추적링크 (강조) */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white text-lg">{link.go_url}</span>
                      <button
                        onClick={() => copyToClipboard(link.go_url)}
                        className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                        title="링크 복사"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 우측: 상세 통계 보기 + 삭제 */}
                  <div className="flex items-center gap-2">
                    <Link
                      href="/conversions"
                      className="px-3 py-1.5 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      상세 통계 보기
                    </Link>
                    <button
                      onClick={() => handleDelete(link.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="삭제"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
