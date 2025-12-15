-- site_visits 테이블에 추적 링크 정보 추가
-- 추적 링크를 통해 유입된 방문자 구분을 위함

-- 추적 링크 관련 컬럼 추가
ALTER TABLE site_visits
ADD COLUMN IF NOT EXISTS sp_click TEXT,
ADD COLUMN IF NOT EXISTS tracking_link_id TEXT;

-- 추적 링크로 유입된 방문자 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_site_visits_tracking_link_id ON site_visits(tracking_link_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_sp_click ON site_visits(sp_click);

-- 컬럼 설명 추가
COMMENT ON COLUMN site_visits.sp_click IS '셀러포트 클릭 ID (URL의 sp_click 파라미터)';
COMMENT ON COLUMN site_visits.tracking_link_id IS '추적 링크 ID (쿠키에서 가져온 sp_tracking_link)';
