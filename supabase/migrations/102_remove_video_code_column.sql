-- ============================================
-- 102: tracking_links 테이블에서 video_code 관련 컬럼 제거
-- 유튜브/틱톡 기능 삭제에 따른 정리
-- ============================================

-- 1. video_code 인덱스 삭제
DROP INDEX IF EXISTS idx_tracking_links_video_code;
DROP INDEX IF EXISTS idx_tracking_links_store_video;

-- 2. video_code 컬럼 삭제
ALTER TABLE tracking_links DROP COLUMN IF EXISTS video_code;

-- 3. youtube/tiktok 타입의 store_customization 데이터 먼저 삭제
DELETE FROM store_customization WHERE channel_type IN ('youtube', 'tiktok');

-- 4. store_customization 테이블에서 youtube/tiktok 제약 조건 업데이트
-- 기존 CHECK 제약 조건 삭제 후 새로운 제약 조건 추가
ALTER TABLE store_customization DROP CONSTRAINT IF EXISTS store_customization_channel_type_check;
ALTER TABLE store_customization
ADD CONSTRAINT store_customization_channel_type_check
CHECK (channel_type IN ('instagram', 'naver_blog', 'general'));

-- 5. 코멘트 업데이트
COMMENT ON COLUMN store_customization.channel_type IS '채널 타입: instagram, naver_blog, general';
