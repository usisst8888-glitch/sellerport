-- ============================================
-- 025: platforms 테이블에 store_id 필드 추가
-- ============================================

-- 네이버 스마트스토어 URL에 사용되는 스토어 ID 필드 추가
-- 예: smartstore.naver.com/tripsim/products/xxx 에서 'tripsim'
ALTER TABLE platforms ADD COLUMN IF NOT EXISTS store_id TEXT;

COMMENT ON COLUMN platforms.store_id IS '네이버 스마트스토어 ID (URL에 사용되는 ID, 예: tripsim)';
