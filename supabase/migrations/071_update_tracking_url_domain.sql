-- 기존 tracking_links의 go_url을 새 도메인(sp-trk.link)으로 업데이트
-- 기존: https://sellerport.app/go/TL-XXXXXXXX 또는 http://localhost:3002/go/TL-XXXXXXXX
-- 변경: https://sp-trk.link/go/TL-XXXXXXXX

-- go_url 업데이트 (sellerport.app 도메인)
UPDATE tracking_links
SET go_url = REPLACE(go_url, 'https://sellerport.app/go/', 'https://sp-trk.link/go/')
WHERE go_url LIKE 'https://sellerport.app/go/%';

-- go_url 업데이트 (www.sellerport.app 도메인)
UPDATE tracking_links
SET go_url = REPLACE(go_url, 'https://www.sellerport.app/go/', 'https://sp-trk.link/go/')
WHERE go_url LIKE 'https://www.sellerport.app/go/%';

-- tracking_url도 go_url을 사용하는 경우 업데이트
UPDATE tracking_links
SET tracking_url = REPLACE(tracking_url, 'https://sellerport.app/go/', 'https://sp-trk.link/go/')
WHERE tracking_url LIKE 'https://sellerport.app/go/%';

UPDATE tracking_links
SET tracking_url = REPLACE(tracking_url, 'https://www.sellerport.app/go/', 'https://sp-trk.link/go/')
WHERE tracking_url LIKE 'https://www.sellerport.app/go/%';

-- 확인용 코멘트
COMMENT ON TABLE tracking_links IS '추적 링크 테이블 - go_url 도메인이 sp-trk.link로 변경됨 (2024-12)';
