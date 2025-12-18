-- ============================================
-- 042: tracking_links 테이블에서 name 컬럼 제거
-- utm_campaign을 이름으로 사용하도록 통합
-- ============================================

-- 1. 기존 name 값이 없는 경우 utm_campaign 값으로 채우기 (안전장치)
UPDATE tracking_links
SET name = utm_campaign
WHERE name IS NULL OR name = '';

-- 2. utm_campaign이 비어있는 경우 name 값으로 채우기 (데이터 보존)
UPDATE tracking_links
SET utm_campaign = name
WHERE utm_campaign IS NULL OR utm_campaign = '';

-- 3. name 컬럼 삭제
ALTER TABLE tracking_links DROP COLUMN IF EXISTS name;

-- 4. 코멘트 업데이트
COMMENT ON COLUMN tracking_links.utm_campaign IS '추적 링크 이름 (UTM Campaign 파라미터로도 사용)';
