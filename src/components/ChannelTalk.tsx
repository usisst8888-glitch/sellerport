'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

declare global {
  interface Window {
    ChannelIO?: (command: string, options?: Record<string, unknown>) => void
    ChannelIOInitialized?: boolean
  }
}

const CHANNEL_PLUGIN_KEY = process.env.NEXT_PUBLIC_CHANNEL_PLUGIN_KEY

export default function ChannelTalk() {
  const supabase = createClient()

  useEffect(() => {
    // 채널톡 버튼 위치 조정 CSS 추가
    const style = document.createElement('style')
    style.textContent = `
      #ch-plugin-launcher {
        bottom: 24px !important;
        right: 24px !important;
      }
      #ch-plugin-launcher-wrapper {
        bottom: 24px !important;
        right: 24px !important;
      }
    `
    document.head.appendChild(style)

    // 환경변수가 없으면 채널톡 로드하지 않음
    if (!CHANNEL_PLUGIN_KEY) {
      console.warn('Channel.io plugin key not configured')
      return
    }

    // 채널톡 스크립트 로드
    const loadChannelIO = () => {
      if (window.ChannelIO) {
        console.error('ChannelIO script included twice.')
        return
      }

      const ch = function(...args: unknown[]) {
        (ch as { q: unknown[] }).q.push(args)
      } as { (command: string, options?: Record<string, unknown>): void; q: unknown[]; c: (args: unknown[]) => void }

      ch.q = []
      ch.c = function(args: unknown[]) {
        ch.q.push(args)
      }
      window.ChannelIO = ch as (command: string, options?: Record<string, unknown>) => void

      if (!window.ChannelIOInitialized) {
        window.ChannelIOInitialized = true
        const s = document.createElement('script')
        s.type = 'text/javascript'
        s.async = true
        s.src = 'https://cdn.channel.io/plugin/ch-plugin-web.js'
        const x = document.getElementsByTagName('script')[0]
        if (x.parentNode) {
          x.parentNode.insertBefore(s, x)
        }
      }
    }

    // 채널톡 부트
    const bootChannelIO = async () => {
      loadChannelIO()

      // 로그인된 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // 프로필 정보 가져오기
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, plan_type, user_type')
          .eq('id', user.id)
          .single()

        window.ChannelIO?.('boot', {
          pluginKey: CHANNEL_PLUGIN_KEY,
          memberId: user.id,
          profile: {
            name: profile?.full_name || user.email?.split('@')[0] || '사용자',
            email: user.email,
            mobileNumber: profile?.phone || '',
            planType: profile?.plan_type || 'free',
            userType: profile?.user_type || 'advertiser',
          }
        })
      } else {
        // 비로그인 사용자
        window.ChannelIO?.('boot', {
          pluginKey: CHANNEL_PLUGIN_KEY
        })
      }
    }

    if (document.readyState === 'complete') {
      bootChannelIO()
    } else {
      window.addEventListener('DOMContentLoaded', bootChannelIO)
      window.addEventListener('load', bootChannelIO)
    }

    // 클린업
    return () => {
      window.ChannelIO?.('shutdown')
    }
  }, [supabase])

  return null
}
