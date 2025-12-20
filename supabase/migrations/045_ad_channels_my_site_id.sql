-- ============================================
-- 045: 광고 채널에 사이트 연결 정보 추가
-- ============================================

-- ad_channels 테이블에 my_site_id 컬럼 추가 (어떤 쇼핑몰과 연결되는지)
ALTER TABLE ad_channels
ADD COLUMN IF NOT EXISTS my_site_id UUID REFERENCES my_sites(id) ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_ad_channels_my_site_id ON ad_channels(my_site_id);

-- 컬럼 설명
COMMENT ON COLUMN ad_channels.my_site_id IS '연결된 쇼핑몰 ID (my_sites 테이블 참조)';
