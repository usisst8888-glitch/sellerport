-- ============================================
-- 026: 광고 채널 연동 테이블
-- ============================================

-- 광고 채널 연동 정보 테이블
CREATE TABLE IF NOT EXISTS ad_channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 채널 정보
  channel_type TEXT NOT NULL, -- 'meta', 'google', 'naver_search', 'naver_gfa', 'kakao', 'karrot', 'toss', 'tiktok', 'dable'
  channel_name TEXT NOT NULL, -- 사용자가 지정한 이름 (예: "메인 메타 계정")

  -- OAuth 토큰 (암호화 저장 권장)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- 광고 계정 정보
  account_id TEXT, -- 광고 계정 ID (Meta Ad Account ID, Google Customer ID 등)
  account_name TEXT, -- 광고 계정 이름

  -- 상태 정보
  status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected', 'error', 'token_expired'
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,

  -- 추가 설정
  metadata JSONB DEFAULT '{}', -- 채널별 추가 설정 (픽셀 ID, 측정 ID 등)
  auto_control_enabled BOOLEAN DEFAULT false, -- 광고 자동 제어 활성화 여부
  roas_threshold INTEGER DEFAULT 150, -- 자동 중지 ROAS 기준 (%)
  daily_budget_limit INTEGER, -- 일일 광고비 한도 (원)

  -- 수동 채널 여부
  is_manual BOOLEAN DEFAULT false, -- true면 수동 입력 채널 (인플루언서, 체험단 등)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일별 광고비 테이블
CREATE TABLE IF NOT EXISTS ad_spend_daily (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_channel_id UUID REFERENCES ad_channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 캠페인 정보
  campaign_id TEXT, -- 광고 플랫폼의 캠페인 ID
  campaign_name TEXT,
  adset_id TEXT, -- 광고 세트 ID (Meta)
  adset_name TEXT,

  -- 날짜
  date DATE NOT NULL,

  -- 성과 지표
  spend INTEGER DEFAULT 0, -- 광고비 (원)
  impressions INTEGER DEFAULT 0, -- 노출수
  clicks INTEGER DEFAULT 0, -- 클릭수
  conversions INTEGER DEFAULT 0, -- 전환수
  conversion_value INTEGER DEFAULT 0, -- 전환 가치 (원)

  -- 메타데이터
  raw_data JSONB DEFAULT '{}', -- API 원본 데이터
  synced_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 방지
  UNIQUE(ad_channel_id, campaign_id, date)
);

-- RLS 활성화
ALTER TABLE ad_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_spend_daily ENABLE ROW LEVEL SECURITY;

-- ad_channels RLS 정책
CREATE POLICY "Users can view own ad channels"
  ON ad_channels FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ad channels"
  ON ad_channels FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ad channels"
  ON ad_channels FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ad channels"
  ON ad_channels FOR DELETE
  USING (auth.uid() = user_id);

-- ad_spend_daily RLS 정책
CREATE POLICY "Users can view own ad spend"
  ON ad_spend_daily FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own ad spend"
  ON ad_spend_daily FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ad spend"
  ON ad_spend_daily FOR UPDATE
  USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ad_channels_user_id ON ad_channels(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_channels_channel_type ON ad_channels(channel_type);
CREATE INDEX IF NOT EXISTS idx_ad_channels_is_manual ON ad_channels(is_manual);
CREATE INDEX IF NOT EXISTS idx_ad_spend_daily_channel_date ON ad_spend_daily(ad_channel_id, date);
CREATE INDEX IF NOT EXISTS idx_ad_spend_daily_user_date ON ad_spend_daily(user_id, date);

-- 테이블 설명
COMMENT ON TABLE ad_channels IS '광고 채널 연동 정보 - Meta, Google, 네이버, 카카오 등 광고 플랫폼 연동';
COMMENT ON TABLE ad_spend_daily IS '일별 광고비 - 각 광고 채널에서 동기화된 일별 광고비 및 성과 데이터';

COMMENT ON COLUMN ad_channels.channel_type IS '광고 채널 타입 (meta, google, naver_search, naver_gfa, kakao, karrot, toss, tiktok, dable, influencer, experience, blog, sns, email, offline, other)';
COMMENT ON COLUMN ad_channels.auto_control_enabled IS '광고 자동 제어 활성화 여부 (ROAS 미달 시 자동 중지 등)';
COMMENT ON COLUMN ad_channels.roas_threshold IS '광고 자동 중지 ROAS 기준 (%, 기본값 150)';
COMMENT ON COLUMN ad_channels.is_manual IS '수동 채널 여부 (인플루언서, 체험단 등 API 연동 불가 채널)';
COMMENT ON COLUMN ad_spend_daily.spend IS '광고비 (원 단위)';
