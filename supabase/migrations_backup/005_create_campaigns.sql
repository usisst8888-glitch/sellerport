-- 광고 캠페인 테이블
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,

  -- 캠페인 정보
  name TEXT NOT NULL, -- 캠페인명
  platform TEXT NOT NULL, -- '네이버', '메타', '구글', '쿠팡', '카카오'

  -- 캠페인 상태
  status TEXT DEFAULT 'running', -- 'running', 'paused', 'stopped'

  -- 예산
  daily_budget INT DEFAULT 0, -- 일일 예산

  -- 성과 지표 (일별 업데이트)
  spent INT DEFAULT 0, -- 광고비 소진
  impressions INT DEFAULT 0, -- 노출
  clicks INT DEFAULT 0, -- 클릭
  conversions INT DEFAULT 0, -- 전환 (구매)
  revenue INT DEFAULT 0, -- 매출
  roas INT DEFAULT 0, -- ROAS (%) = revenue / spent * 100

  -- 추적 링크
  tracking_url TEXT,

  -- 외부 캠페인 ID (광고 플랫폼 연동 시)
  external_campaign_id TEXT,

  -- 추가 데이터
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- 트리거
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 인덱스
CREATE INDEX campaigns_user_id_idx ON campaigns(user_id);
CREATE INDEX campaigns_product_id_idx ON campaigns(product_id);
CREATE INDEX campaigns_status_idx ON campaigns(status);
CREATE INDEX campaigns_platform_idx ON campaigns(platform);


-- 캠페인 일별 성과 기록 테이블
CREATE TABLE IF NOT EXISTS campaign_daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 날짜
  date DATE NOT NULL,

  -- 성과 지표
  spent INT DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue INT DEFAULT 0,
  roas INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 캠페인별 날짜 중복 방지
  UNIQUE(campaign_id, date)
);

-- RLS 활성화
ALTER TABLE campaign_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign stats"
  ON campaign_daily_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own campaign stats"
  ON campaign_daily_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 인덱스
CREATE INDEX campaign_daily_stats_campaign_id_idx ON campaign_daily_stats(campaign_id);
CREATE INDEX campaign_daily_stats_date_idx ON campaign_daily_stats(date DESC);
