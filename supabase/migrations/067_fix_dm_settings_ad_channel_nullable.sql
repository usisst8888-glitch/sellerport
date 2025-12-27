-- ============================================
-- 067: instagram_dm_settings의 ad_channel_id NOT NULL 제약 제거
-- ============================================
-- instagram_account_id로 대체되었으므로 ad_channel_id는 nullable로 변경

ALTER TABLE instagram_dm_settings
ALTER COLUMN ad_channel_id DROP NOT NULL;

COMMENT ON COLUMN instagram_dm_settings.ad_channel_id IS '[DEPRECATED] 기존 FK - instagram_account_id 사용. nullable로 변경됨';
