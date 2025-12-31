-- seller_trees에 검색 텍스트 색상 컬럼 추가
ALTER TABLE seller_trees ADD COLUMN IF NOT EXISTS search_title_color VARCHAR(9) DEFAULT '#FFFFFF';
ALTER TABLE seller_trees ADD COLUMN IF NOT EXISTS search_placeholder_color VARCHAR(9) DEFAULT '#94A3B8';

COMMENT ON COLUMN seller_trees.search_title_color IS '검색 섹션 제목 색상';
COMMENT ON COLUMN seller_trees.search_placeholder_color IS '검색 입력창 안내문구 색상';
