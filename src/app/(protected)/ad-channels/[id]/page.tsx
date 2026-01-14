'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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

const CHANNEL_TYPES: Record<string, { label: string; icon: string }> = {
  meta: { label: 'Meta (API 연동)', icon: '/channel_logo/meta.png' },
  meta_paid: { label: 'Meta 유료광고', icon: '/channel_logo/meta.png' },
  naver_blog: { label: '네이버 블로그', icon: '/channel_logo/naver_blog.png' },
  instagram: { label: 'Instagram', icon: '/channel_logo/insta.png' },
  thread: { label: 'Threads', icon: '/channel_logo/thread.png' },
  influencer: { label: '인플루언서/체험단', icon: '/channel_logo/influencer.png' },
}

export default function AdChannelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const supabase = createClient()

  const [channelId, setChannelId] = useState<string>('')
  const [channel, setChannel] = useState<AdChannel | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // params 처리
  useEffect(() => {
    params.then(p => setChannelId(p.id))
  }, [params])

  // 채널 정보 불러오기
  const fetchChannel = async () => {
    if (!channelId) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ad_channels')
        .select('*')
        .eq('id', channelId)
        .single()

      if (error) throw error
      setChannel(data)
    } catch (error) {
      console.error('Failed to fetch channel:', error)
      setMessage({ type: 'error', text: '채널 정보를 불러올 수 없습니다' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (channelId) {
      fetchChannel()
    }
  }, [channelId])

  // 메시지 자동 제거
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-slate-400">채널을 찾을 수 없습니다</p>
          <Link href="/ad-channels" className="text-blue-400 hover:underline mt-2 inline-block">
            채널 목록으로 돌아가기
          </Link>
        </div>
      </div>
    )
  }

  const channelInfo = CHANNEL_TYPES[channel.channel_type] || { label: channel.channel_type, icon: '/channel_logo/custom.png' }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.push('/ad-channels')}
          className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <img src={channelInfo.icon} alt={channelInfo.label} className="w-10 h-10 rounded-lg object-contain" />
          <div>
            <h1 className="text-xl font-bold text-white">{channel.channel_name}</h1>
            <p className="text-sm text-slate-400">{channelInfo.label}</p>
          </div>
        </div>
      </div>

      {/* 메시지 */}
      {message && (
        <div className={`p-4 rounded-lg mb-4 ${message.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
          {message.text}
        </div>
      )}

      {/* 채널 정보 */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">채널 정보</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">채널 유형</span>
            <span className="text-white">{channelInfo.label}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">채널 이름</span>
            <span className="text-white">{channel.channel_name}</span>
          </div>
          {channel.account_name && (
            <div className="flex items-center justify-between py-2 border-b border-slate-700">
              <span className="text-slate-400">계정</span>
              <span className="text-white">{channel.account_name}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-2 border-b border-slate-700">
            <span className="text-slate-400">상태</span>
            <span className={`px-2 py-1 rounded text-sm ${
              channel.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-slate-600 text-slate-300'
            }`}>
              {channel.status === 'active' ? '활성' : '비활성'}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-slate-400">등록일</span>
            <span className="text-white">{new Date(channel.created_at).toLocaleDateString('ko-KR')}</span>
          </div>
        </div>
      </div>

    </div>
  )
}
