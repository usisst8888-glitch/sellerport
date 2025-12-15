-- tracking_link_clicks 테이블에 is_unique 컬럼 추가
-- 유효 클릭(Unique Click) 구분을 위한 플래그
-- 같은 IP + User Agent가 1시간 내 재클릭 시 is_unique = false

-- is_unique 컬럼 추가
ALTER TABLE tracking_link_clicks
ADD COLUMN IF NOT EXISTS is_unique BOOLEAN DEFAULT true;

-- 기존 데이터는 모두 유효 클릭으로 처리
UPDATE tracking_link_clicks
SET is_unique = true
WHERE is_unique IS NULL;

-- 인덱스 추가 (중복 체크 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_tracking_clicks_unique_check
ON tracking_link_clicks (tracking_link_id, ip_address, user_agent, clicked_at);

-- 유효 클릭만 조회하는 인덱스
CREATE INDEX IF NOT EXISTS idx_tracking_clicks_unique
ON tracking_link_clicks (tracking_link_id, is_unique)
WHERE is_unique = true;

-- 테이블 설명 추가
COMMENT ON COLUMN tracking_link_clicks.is_unique IS '유효 클릭 여부 (같은 IP+UA가 1시간 내 재클릭 시 false)';
