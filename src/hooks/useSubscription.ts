'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface SubscriptionState {
  status: 'loading' | 'trial' | 'active' | 'expired'
  trialDaysLeft: number
  isLoading: boolean
  hasAccess: boolean
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    status: 'loading',
    trialDaysLeft: 0,
    isLoading: true,
    hasAccess: false,
  })

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setState({ status: 'expired', trialDaysLeft: 0, isLoading: false, hasAccess: false })
          return
        }

        // 구독 정보 확인
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle()

        if (sub) {
          setState({ status: 'active', trialDaysLeft: 0, isLoading: false, hasAccess: true })
          return
        }

        // 무료 체험 기간 계산
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          const createdAt = new Date(profile.created_at)
          const now = new Date()
          const diffTime = now.getTime() - createdAt.getTime()
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
          const daysLeft = Math.max(0, 7 - diffDays)

          if (daysLeft > 0) {
            setState({ status: 'trial', trialDaysLeft: daysLeft, isLoading: false, hasAccess: true })
          } else {
            setState({ status: 'expired', trialDaysLeft: 0, isLoading: false, hasAccess: false })
          }
        } else {
          setState({ status: 'expired', trialDaysLeft: 0, isLoading: false, hasAccess: false })
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error)
        setState({ status: 'expired', trialDaysLeft: 0, isLoading: false, hasAccess: false })
      }
    }

    fetchSubscription()
  }, [])

  return state
}
