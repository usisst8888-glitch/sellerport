-- ============================================
-- 068: instagram_dm_settings에 instagram_thumbnail_url 컬럼 추가
-- ============================================
-- 게시물 썸네일 URL 저장용

ALTER TABLE instagram_dm_settings
ADD COLUMN IF NOT EXISTS instagram_thumbnail_url TEXT;

COMMENT ON COLUMN instagram_dm_settings.instagram_thumbnail_url IS '게시물 썸네일 URL';
