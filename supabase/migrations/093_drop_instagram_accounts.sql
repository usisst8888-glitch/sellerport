-- ============================================
-- 093: instagram_accounts 테이블 삭제
-- ============================================
-- Instagram 계정 정보를 ad_channels 테이블로 통합하면서
-- 더 이상 필요없는 instagram_accounts 테이블 삭제

-- 1. instagram_dm_settings에서 instagram_account_id 컬럼 삭제
ALTER TABLE instagram_dm_settings
DROP COLUMN IF EXISTS instagram_account_id;

-- 2. 트리거 삭제
DROP TRIGGER IF EXISTS trigger_update_instagram_accounts_updated_at ON instagram_accounts;

-- 3. 함수 삭제
DROP FUNCTION IF EXISTS update_instagram_accounts_updated_at();

-- 4. 인덱스 삭제 (테이블 삭제 시 자동으로 삭제되지만 명시적으로)
DROP INDEX IF EXISTS idx_instagram_accounts_user_id;
DROP INDEX IF EXISTS idx_instagram_accounts_ig_user_id;
DROP INDEX IF EXISTS idx_instagram_accounts_my_site_id;
DROP INDEX IF EXISTS idx_instagram_accounts_status;
DROP INDEX IF EXISTS idx_instagram_dm_settings_account_id;

-- 5. RLS 정책 삭제 (테이블 삭제 시 자동으로 삭제되지만 명시적으로)
DROP POLICY IF EXISTS "Users can view own instagram accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Users can create own instagram accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Users can update own instagram accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Users can delete own instagram accounts" ON instagram_accounts;
DROP POLICY IF EXISTS "Service role can manage all instagram accounts" ON instagram_accounts;

-- 6. instagram_accounts 테이블 삭제
DROP TABLE IF EXISTS instagram_accounts CASCADE;

-- 7. instagram_dm_settings 테이블의 ad_channel_id 컬럼이 있으면 코멘트 업데이트
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instagram_dm_settings' AND column_name = 'ad_channel_id'
  ) THEN
    COMMENT ON COLUMN instagram_dm_settings.ad_channel_id IS 'Instagram 채널 FK (ad_channels 테이블)';
  END IF;
END $$;
