-- localhost URL도 새 도메인(sp-trk.link)으로 업데이트
-- 개발 환경에서 생성된 URL들 일괄 변경

-- go_url 업데이트 (localhost:3002)
UPDATE tracking_links
SET go_url = REPLACE(go_url, 'http://localhost:3002/go/', 'https://sp-trk.link/go/')
WHERE go_url LIKE 'http://localhost:3002/go/%';

-- go_url 업데이트 (localhost:3000)
UPDATE tracking_links
SET go_url = REPLACE(go_url, 'http://localhost:3000/go/', 'https://sp-trk.link/go/')
WHERE go_url LIKE 'http://localhost:3000/go/%';

-- tracking_url도 업데이트 (localhost:3002)
UPDATE tracking_links
SET tracking_url = REPLACE(tracking_url, 'http://localhost:3002/go/', 'https://sp-trk.link/go/')
WHERE tracking_url LIKE 'http://localhost:3002/go/%';

-- tracking_url도 업데이트 (localhost:3000)
UPDATE tracking_links
SET tracking_url = REPLACE(tracking_url, 'http://localhost:3000/go/', 'https://sp-trk.link/go/')
WHERE tracking_url LIKE 'http://localhost:3000/go/%';
