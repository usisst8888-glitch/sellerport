-- ============================================
-- 015: slots 테이블에 URL 컬럼 추가
-- ============================================

-- 브릿지샵 URL (광고용) - pixel_shop_url에서 bridge_shop_url로 변경
ALTER TABLE slots ADD COLUMN IF NOT EXISTS bridge_shop_url TEXT;

-- Go URL (유기적 채널용)
ALTER TABLE slots ADD COLUMN IF NOT EXISTS go_url TEXT;
