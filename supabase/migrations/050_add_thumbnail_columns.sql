-- 광고 캠페인/추적 링크 썸네일 컬럼 추가

-- 1. ad_spend_daily에 thumbnail_url 컬럼 추가 (광고 소재 썸네일)
ALTER TABLE ad_spend_daily
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN ad_spend_daily.thumbnail_url IS '광고 소재 썸네일 URL';

-- 2. instagram_dm_settings에 thumbnail_url 컬럼 추가 (게시물 썸네일)
ALTER TABLE instagram_dm_settings
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN instagram_dm_settings.thumbnail_url IS 'Instagram 게시물 썸네일 URL';

-- 3. tracking_links에 thumbnail_url 컬럼 추가 (추적 링크 썸네일)
ALTER TABLE tracking_links
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN tracking_links.thumbnail_url IS '추적 링크 관련 썸네일 URL (게시물, 광고 소재 등)';
