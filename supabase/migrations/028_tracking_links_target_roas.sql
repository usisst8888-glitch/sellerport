-- 추적 링크별 목표 ROAS 설정 컬럼 추가
-- 각 추적 링크마다 개별적인 ROAS 기준을 설정할 수 있음

-- 초록불 기준 ROAS (기본값 300%)
ALTER TABLE tracking_links ADD COLUMN IF NOT EXISTS target_roas_green INTEGER DEFAULT 300;

-- 노란불 기준 ROAS (기본값 150%)
ALTER TABLE tracking_links ADD COLUMN IF NOT EXISTS target_roas_yellow INTEGER DEFAULT 150;

-- 컬럼 설명 추가
COMMENT ON COLUMN tracking_links.target_roas_green IS '초록불(효율 좋음) 기준 ROAS (%), 이 값 이상이면 초록불';
COMMENT ON COLUMN tracking_links.target_roas_yellow IS '노란불(주의 필요) 기준 ROAS (%), 이 값 이상이면 노란불, 미만이면 빨간불';
