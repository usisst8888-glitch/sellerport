-- 유튜브 영상번호에 스토어 슬러그 추가
-- URL: /v/[store_slug] 형식으로 접근

-- store_slug 컬럼 추가 (회원별 고유 식별자)
ALTER TABLE youtube_video_codes
ADD COLUMN IF NOT EXISTS store_slug VARCHAR(50);

-- store_slug 인덱스 (검색용)
CREATE INDEX IF NOT EXISTS idx_youtube_video_codes_store_slug
ON youtube_video_codes(store_slug);

-- store_slug는 유저별로 유니크해야 함 (같은 유저가 여러 스토어를 가질 수 있음)
-- 단, NULL은 허용 (마이그레이션 호환)

COMMENT ON COLUMN youtube_video_codes.store_slug IS '스토어 고유 식별자 (URL용, 예: tripjoy)';
