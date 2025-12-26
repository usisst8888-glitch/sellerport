-- ============================================
-- 065: Instagram 계정 연동 테이블
-- ============================================
-- ad_channels와 분리하여 인스타그램 계정을 독립적으로 관리

-- 1. Instagram 계정 연동 정보 테이블 생성
CREATE TABLE IF NOT EXISTS instagram_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  my_site_id UUID REFERENCES my_sites(id) ON DELETE SET NULL, -- 연결된 쇼핑몰

  -- Instagram 계정 정보
  instagram_user_id TEXT NOT NULL, -- Instagram 사용자 ID (숫자)
  instagram_username TEXT, -- Instagram 사용자명 (@username)
  instagram_name TEXT, -- Instagram 표시 이름
  profile_picture_url TEXT, -- 프로필 사진 URL

  -- Facebook 페이지 연결 정보 (Instagram Business Account는 FB 페이지 필요)
  facebook_page_id TEXT,
  facebook_page_name TEXT,

  -- OAuth 토큰
  access_token TEXT NOT NULL, -- Instagram Graph API 토큰
  token_expires_at TIMESTAMPTZ, -- 토큰 만료일 (장기 토큰은 60일)

  -- 계정 상태
  status TEXT DEFAULT 'connected', -- 'connected', 'disconnected', 'token_expired', 'error'
  error_message TEXT,
  last_sync_at TIMESTAMPTZ, -- 마지막 데이터 동기화

  -- 계정 통계 (캐시)
  followers_count INTEGER,
  media_count INTEGER,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 한 유저당 같은 Instagram 계정 중복 방지
  UNIQUE(user_id, instagram_user_id)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_user_id ON instagram_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_ig_user_id ON instagram_accounts(instagram_user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_my_site_id ON instagram_accounts(my_site_id);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_status ON instagram_accounts(status);

-- 3. RLS 활성화 및 정책
ALTER TABLE instagram_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own instagram accounts"
  ON instagram_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own instagram accounts"
  ON instagram_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own instagram accounts"
  ON instagram_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own instagram accounts"
  ON instagram_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Service role은 모든 작업 가능 (Webhook, 토큰 갱신 등)
CREATE POLICY "Service role can manage all instagram accounts"
  ON instagram_accounts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. instagram_dm_settings 테이블에 instagram_account_id FK 추가
ALTER TABLE instagram_dm_settings
ADD COLUMN IF NOT EXISTS instagram_account_id UUID REFERENCES instagram_accounts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_instagram_dm_settings_account_id ON instagram_dm_settings(instagram_account_id);

-- 5. 기존 ad_channels에서 인스타그램 데이터를 instagram_accounts로 마이그레이션
-- channel_type이 'instagram'인 데이터를 새 테이블로 이전
INSERT INTO instagram_accounts (
  user_id,
  my_site_id,
  instagram_user_id,
  instagram_username,
  instagram_name,
  access_token,
  token_expires_at,
  status,
  error_message,
  last_sync_at,
  created_at,
  updated_at
)
SELECT
  ac.user_id,
  ac.my_site_id,
  COALESCE(ac.account_id, gen_random_uuid()::text), -- instagram_user_id
  ac.account_name, -- instagram_username
  ac.channel_name, -- instagram_name
  COALESCE(ac.access_token, ''), -- access_token (NOT NULL이므로 빈 문자열)
  ac.token_expires_at,
  ac.status,
  ac.error_message,
  ac.last_sync_at,
  ac.created_at,
  ac.updated_at
FROM ad_channels ac
WHERE ac.channel_type = 'instagram'
ON CONFLICT (user_id, instagram_user_id) DO NOTHING;

-- 6. instagram_dm_settings의 ad_channel_id를 instagram_account_id로 마이그레이션
UPDATE instagram_dm_settings dms
SET instagram_account_id = ia.id
FROM ad_channels ac
JOIN instagram_accounts ia ON ia.user_id = ac.user_id
  AND ia.instagram_user_id = COALESCE(ac.account_id, '')
WHERE dms.ad_channel_id = ac.id
  AND ac.channel_type = 'instagram'
  AND dms.instagram_account_id IS NULL;

-- 7. instagram_dm_settings에서 ad_channel_id FK 제약 조건 제거
-- (기존 데이터 호환성을 위해 컬럼은 유지하되 FK만 제거)
ALTER TABLE instagram_dm_settings
DROP CONSTRAINT IF EXISTS instagram_dm_settings_ad_channel_id_fkey;

-- 8. ad_channels에서 instagram 타입 데이터 삭제
DELETE FROM ad_channels WHERE channel_type = 'instagram';

-- 9. 테이블 설명
COMMENT ON TABLE instagram_accounts IS 'Instagram 계정 연동 정보 - DM 자동화 등에 사용 (ad_channels에서 분리)';
COMMENT ON COLUMN instagram_accounts.instagram_user_id IS 'Instagram 사용자 ID (숫자 형태)';
COMMENT ON COLUMN instagram_accounts.instagram_username IS 'Instagram 사용자명 (@없이)';
COMMENT ON COLUMN instagram_accounts.facebook_page_id IS 'Instagram Business Account와 연결된 Facebook 페이지 ID';
COMMENT ON COLUMN instagram_accounts.access_token IS 'Instagram Graph API 액세스 토큰 (암호화 권장)';
COMMENT ON COLUMN instagram_accounts.status IS '계정 상태: connected, disconnected, token_expired, error';
COMMENT ON COLUMN instagram_dm_settings.ad_channel_id IS '[DEPRECATED] 기존 ad_channels FK - instagram_account_id 사용 권장';
COMMENT ON COLUMN instagram_dm_settings.instagram_account_id IS 'Instagram 계정 FK (신규)';

-- 10. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_instagram_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_instagram_accounts_updated_at ON instagram_accounts;
CREATE TRIGGER trigger_update_instagram_accounts_updated_at
  BEFORE UPDATE ON instagram_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_instagram_accounts_updated_at();
