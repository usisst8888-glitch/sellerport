-- tracking_links에 NT 파라미터 컬럼 추가 (스마트스토어용)

ALTER TABLE tracking_links
ADD COLUMN IF NOT EXISTS nt_source VARCHAR(100);

ALTER TABLE tracking_links
ADD COLUMN IF NOT EXISTS nt_medium VARCHAR(100);

ALTER TABLE tracking_links
ADD COLUMN IF NOT EXISTS nt_detail VARCHAR(100);

ALTER TABLE tracking_links
ADD COLUMN IF NOT EXISTS nt_keyword VARCHAR(255);

COMMENT ON COLUMN tracking_links.nt_source IS '네이버 스마트스토어 NT 파라미터 - source';
COMMENT ON COLUMN tracking_links.nt_medium IS '네이버 스마트스토어 NT 파라미터 - medium';
COMMENT ON COLUMN tracking_links.nt_detail IS '네이버 스마트스토어 NT 파라미터 - detail';
COMMENT ON COLUMN tracking_links.nt_keyword IS '네이버 스마트스토어 NT 파라미터 - keyword';
