-- User Meta (Facebook/Instagram) 설정 테이블
-- 사용자별 Meta Pixel ID, Access Token 등을 저장

CREATE TABLE IF NOT EXISTS user_meta_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Meta Pixel 설정
  pixel_id VARCHAR(50),                    -- Meta Pixel ID
  access_token TEXT,                        -- Conversions API Access Token

  -- Meta 비즈니스 설정
  business_id VARCHAR(50),                 -- Meta Business Manager ID
  ad_account_id VARCHAR(50),               -- Meta Ad Account ID

  -- 연동 상태
  status VARCHAR(20) DEFAULT 'pending',    -- pending, connected, error
  last_verified_at TIMESTAMPTZ,            -- 마지막 검증 시간

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_meta_settings_user_id ON user_meta_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_meta_settings_status ON user_meta_settings(status);

-- RLS 정책
ALTER TABLE user_meta_settings ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 Meta 설정만 조회/수정 가능
CREATE POLICY "Users can view own meta settings"
  ON user_meta_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meta settings"
  ON user_meta_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meta settings"
  ON user_meta_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meta settings"
  ON user_meta_settings FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_user_meta_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_meta_settings_updated_at
  BEFORE UPDATE ON user_meta_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_meta_settings_updated_at();

COMMENT ON TABLE user_meta_settings IS '사용자별 Meta (Facebook/Instagram) 광고 연동 설정';
COMMENT ON COLUMN user_meta_settings.pixel_id IS 'Meta Pixel ID (예: 2313945845720098)';
COMMENT ON COLUMN user_meta_settings.access_token IS 'Conversions API 액세스 토큰 (CAPI 전송용)';
COMMENT ON COLUMN user_meta_settings.business_id IS 'Meta 비즈니스 관리자 ID';
COMMENT ON COLUMN user_meta_settings.ad_account_id IS 'Meta 광고 계정 ID';
