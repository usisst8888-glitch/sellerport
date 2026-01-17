import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshMetaToken } from '@/lib/meta/refresh-token'

interface CreateCampaignRequest {
  channelId: string
  campaignName: string
  objective: 'conversions' | 'traffic' | 'awareness'
  dailyBudget: number
  adText: string
  creatives: {
    id: string
    imageUrl: string
    name: string
  }[]
  isABTest: boolean
}

// Meta 광고 목표 매핑
const objectiveMapping: Record<string, string> = {
  conversions: 'OUTCOME_SALES',
  traffic: 'OUTCOME_TRAFFIC',
  awareness: 'OUTCOME_AWARENESS',
}

// Meta 캠페인 생성 API
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateCampaignRequest = await request.json()
    const { channelId, campaignName, objective, dailyBudget, adText, creatives, isABTest } = body

    // 유효성 검사
    if (!channelId || !campaignName || !objective || !dailyBudget || creatives.length === 0) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }

    if (isABTest && creatives.length < 2) {
      return NextResponse.json({ error: 'A/B 테스트는 최소 2개의 소재가 필요합니다' }, { status: 400 })
    }

    // 채널 정보 가져오기
    const { data: channel, error: channelError } = await supabase
      .from('ad_channels')
      .select('*')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .eq('channel_type', 'meta')
      .single()

    if (channelError || !channel) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다' }, { status: 404 })
    }

    // 토큰 체크 및 갱신
    let accessToken = channel.access_token
    const tokenExpiresAt = channel.token_expires_at ? new Date(channel.token_expires_at) : null
    const now = new Date()

    if (tokenExpiresAt && tokenExpiresAt < now) {
      const refreshResult = await refreshMetaToken(channelId, accessToken, supabase)
      if (refreshResult.success && refreshResult.accessToken) {
        accessToken = refreshResult.accessToken
      } else {
        await supabase
          .from('ad_channels')
          .update({ status: 'token_expired' })
          .eq('id', channelId)

        return NextResponse.json({
          error: '토큰이 만료되었습니다. 다시 연동해주세요',
          needsReconnect: true
        }, { status: 401 })
      }
    }

    const adAccountId = channel.metadata?.ad_account_id || `act_${channel.account_id}`
    const metaObjective = objectiveMapping[objective]

    // 1. 캠페인 생성
    const campaignResponse = await fetch(
      `https://graph.facebook.com/v21.0/${adAccountId}/campaigns`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: isABTest ? `[A/B Test] ${campaignName}` : campaignName,
          objective: metaObjective,
          status: 'PAUSED', // 일단 일시정지 상태로 생성
          special_ad_categories: [],
          access_token: accessToken,
        }),
      }
    )

    if (!campaignResponse.ok) {
      const errorData = await campaignResponse.json()
      console.error('Campaign creation failed:', errorData)
      return NextResponse.json({
        error: '캠페인 생성에 실패했습니다',
        details: errorData.error?.message
      }, { status: 400 })
    }

    const campaignData = await campaignResponse.json()
    const campaignId = campaignData.id

    // 2. 광고 세트 생성 (일일 예산 설정)
    const adSetResponse = await fetch(
      `https://graph.facebook.com/v21.0/${adAccountId}/adsets`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: isABTest ? `${campaignName} - A/B Test AdSet` : `${campaignName} AdSet`,
          campaign_id: campaignId,
          daily_budget: dailyBudget * 100, // Meta는 센트 단위 (한국은 원 단위라 100 곱함)
          billing_event: 'IMPRESSIONS',
          optimization_goal: objective === 'conversions' ? 'OFFSITE_CONVERSIONS' :
                            objective === 'traffic' ? 'LINK_CLICKS' : 'REACH',
          targeting: {
            geo_locations: {
              countries: ['KR'], // 한국 타겟팅
            },
            age_min: 18,
            age_max: 65,
          },
          status: 'PAUSED',
          access_token: accessToken,
        }),
      }
    )

    if (!adSetResponse.ok) {
      const errorData = await adSetResponse.json()
      console.error('AdSet creation failed:', errorData)
      // 캠페인 삭제 (롤백)
      await fetch(`https://graph.facebook.com/v21.0/${campaignId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      })
      return NextResponse.json({
        error: '광고 세트 생성에 실패했습니다',
        details: errorData.error?.message
      }, { status: 400 })
    }

    const adSetData = await adSetResponse.json()
    const adSetId = adSetData.id

    // 3. 광고 크리에이티브 및 광고 생성
    const createdAds: { id: string; name: string; creativeId: string }[] = []

    for (let i = 0; i < creatives.length; i++) {
      const creative = creatives[i]
      const adName = isABTest
        ? `${campaignName} - 소재 ${String.fromCharCode(65 + i)}`
        : `${campaignName} Ad`

      // 광고 크리에이티브 생성
      const creativeResponse = await fetch(
        `https://graph.facebook.com/v21.0/${adAccountId}/adcreatives`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Creative - ${creative.name}`,
            object_story_spec: {
              page_id: channel.metadata?.page_id,
              link_data: {
                image_hash: creative.imageUrl, // 실제로는 이미지 해시 필요
                link: channel.metadata?.website_url || 'https://sellerport.co.kr',
                message: adText,
              },
            },
            access_token: accessToken,
          }),
        }
      )

      if (!creativeResponse.ok) {
        console.error(`Creative ${i + 1} creation failed`)
        continue
      }

      const creativeData = await creativeResponse.json()
      const creativeId = creativeData.id

      // 광고 생성
      const adResponse = await fetch(
        `https://graph.facebook.com/v21.0/${adAccountId}/ads`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: adName,
            adset_id: adSetId,
            creative: { creative_id: creativeId },
            status: 'PAUSED',
            access_token: accessToken,
          }),
        }
      )

      if (adResponse.ok) {
        const adData = await adResponse.json()
        createdAds.push({
          id: adData.id,
          name: adName,
          creativeId: creativeId,
        })
      }
    }

    // 4. DB에 캠페인 정보 저장
    const { error: insertError } = await supabase
      .from('meta_campaigns')
      .insert({
        user_id: user.id,
        ad_channel_id: channelId,
        campaign_id: campaignId,
        campaign_name: campaignName,
        objective: objective,
        daily_budget: dailyBudget,
        is_ab_test: isABTest,
        creative_count: creatives.length,
        ads: createdAds,
        status: 'paused',
        created_at: new Date().toISOString(),
      })

    if (insertError) {
      console.error('Failed to save campaign to DB:', insertError)
    }

    return NextResponse.json({
      success: true,
      campaignId,
      adSetId,
      ads: createdAds,
      isABTest,
      message: isABTest
        ? `A/B 테스트 캠페인이 생성되었습니다. ${createdAds.length}개 소재가 테스트됩니다.`
        : '캠페인이 성공적으로 생성되었습니다.',
    })

  } catch (error) {
    console.error('Campaign creation error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// 캠페인 상태 변경 (활성화/일시정지)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId, channelId, status } = await request.json()

    if (!campaignId || !channelId || !status) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 })
    }

    // 채널 정보 가져오기
    const { data: channel } = await supabase
      .from('ad_channels')
      .select('access_token')
      .eq('id', channelId)
      .eq('user_id', user.id)
      .single()

    if (!channel) {
      return NextResponse.json({ error: '채널을 찾을 수 없습니다' }, { status: 404 })
    }

    // Meta API로 캠페인 상태 변경
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${campaignId}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: status === 'active' ? 'ACTIVE' : 'PAUSED',
          access_token: channel.access_token,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({
        error: '상태 변경에 실패했습니다',
        details: errorData.error?.message
      }, { status: 400 })
    }

    // DB 업데이트
    await supabase
      .from('meta_campaigns')
      .update({ status })
      .eq('campaign_id', campaignId)

    return NextResponse.json({
      success: true,
      message: status === 'active' ? '캠페인이 활성화되었습니다' : '캠페인이 일시정지되었습니다',
    })

  } catch (error) {
    console.error('Campaign status update error:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}
