-- tracking_links에 video_code와 store_slug 컬럼 추가
-- youtube_video_codes 테이블을 사용하지 않고 tracking_links로 통합

-- 1. tracking_links에 video_code 컬럼 추가
ALTER TABLE tracking_links
ADD COLUMN IF NOT EXISTS video_code VARCHAR(4);

-- 2. tracking_links에 store_slug 컬럼 추가
ALTER TABLE tracking_links
ADD COLUMN IF NOT EXISTS store_slug VARCHAR(50);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tracking_links_video_code
ON tracking_links(video_code);

CREATE INDEX IF NOT EXISTS idx_tracking_links_store_slug
ON tracking_links(store_slug);

-- 4. 복합 인덱스 (스토어 슬러그 + 영상번호로 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_tracking_links_store_video
ON tracking_links(store_slug, video_code);

-- 5. youtube_video_codes 데이터를 tracking_links로 마이그레이션
UPDATE tracking_links tl
SET
  video_code = yvc.video_code,
  store_slug = yvc.store_slug
FROM youtube_video_codes yvc
WHERE tl.id = yvc.tracking_link_id;

-- 6. 컬럼 설명 추가
COMMENT ON COLUMN tracking_links.video_code IS '유튜브 쇼츠 영상번호 (A001~Z999 형식)';
COMMENT ON COLUMN tracking_links.store_slug IS '스토어 고유 식별자 (URL용, 예: tripjoy)';

-- 7. youtube_video_codes 테이블 삭제
DROP TABLE IF EXISTS youtube_video_codes;
