-- ============================================
-- 094: instagram_dm_settings에 ad_channel_id FK 추가
-- ============================================
-- ad_channels와의 관계를 위한 Foreign Key 추가

-- 1. ad_channel_id 컬럼이 없으면 추가
ALTER TABLE instagram_dm_settings
ADD COLUMN IF NOT EXISTS ad_channel_id UUID;

-- 2. Foreign Key 추가
ALTER TABLE instagram_dm_settings
ADD CONSTRAINT instagram_dm_settings_ad_channel_id_fkey
FOREIGN KEY (ad_channel_id) REFERENCES ad_channels(id) ON DELETE CASCADE;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_instagram_dm_settings_ad_channel_id
ON instagram_dm_settings(ad_channel_id);

-- 4. 컬럼 코멘트
COMMENT ON COLUMN instagram_dm_settings.ad_channel_id IS 'Instagram 채널 FK (ad_channels 테이블)';
