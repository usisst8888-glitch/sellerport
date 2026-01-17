-- Meta 캠페인 테이블 (A/B 테스트 지원)
CREATE TABLE IF NOT EXISTS meta_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_channel_id UUID NOT NULL REFERENCES ad_channels(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL, -- Meta 캠페인 ID
  campaign_name TEXT NOT NULL,
  objective TEXT NOT NULL CHECK (objective IN ('conversions', 'traffic', 'awareness')),
  daily_budget INTEGER NOT NULL,
  is_ab_test BOOLEAN DEFAULT false,
  creative_count INTEGER DEFAULT 1,
  ads JSONB DEFAULT '[]', -- 광고 ID 및 크리에이티브 정보
  status TEXT DEFAULT 'paused' CHECK (status IN ('active', 'paused', 'completed', 'deleted')),
  winner_ad_id TEXT, -- A/B 테스트 승자 광고 ID
  test_ended_at TIMESTAMPTZ, -- A/B 테스트 종료 시점
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_user_id ON meta_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_ad_channel_id ON meta_campaigns(ad_channel_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_campaign_id ON meta_campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_is_ab_test ON meta_campaigns(is_ab_test);

-- RLS 정책
ALTER TABLE meta_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own campaigns"
  ON meta_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns"
  ON meta_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON meta_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON meta_campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_meta_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meta_campaigns_updated_at
  BEFORE UPDATE ON meta_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_meta_campaigns_updated_at();

-- 테이블 설명
COMMENT ON TABLE meta_campaigns IS 'Meta 광고 캠페인 정보 (A/B 테스트 포함)';
COMMENT ON COLUMN meta_campaigns.campaign_id IS 'Meta API에서 생성된 캠페인 ID';
COMMENT ON COLUMN meta_campaigns.is_ab_test IS 'A/B 테스트 여부';
COMMENT ON COLUMN meta_campaigns.creative_count IS 'A/B 테스트 시 소재 개수';
COMMENT ON COLUMN meta_campaigns.ads IS '생성된 광고들의 ID 및 정보';
COMMENT ON COLUMN meta_campaigns.winner_ad_id IS 'A/B 테스트 승자 광고 ID';
