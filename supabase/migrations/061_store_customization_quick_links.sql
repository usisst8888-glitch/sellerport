-- 빠른 링크 컬럼 추가 (JSON 배열)
ALTER TABLE store_customization
ADD COLUMN IF NOT EXISTS quick_links jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN store_customization.quick_links IS '검색 페이지에 표시되는 빠른 링크 목록 (상품 또는 커스텀 링크)';
