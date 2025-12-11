-- ============================================
-- 015: slots 테이블에 URL 컬럼 추가
-- ============================================

-- 픽셀샵 URL (광고용)
ALTER TABLE slots ADD COLUMN IF NOT EXISTS pixel_shop_url TEXT;

-- Go URL (유기적 채널용)
ALTER TABLE slots ADD COLUMN IF NOT EXISTS go_url TEXT;
