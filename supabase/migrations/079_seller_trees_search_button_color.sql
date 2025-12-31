-- 셀러트리 검색 스타일 컬럼 추가
ALTER TABLE seller_trees ADD COLUMN IF NOT EXISTS search_button_color VARCHAR(7) DEFAULT '#2563EB';
ALTER TABLE seller_trees ADD COLUMN IF NOT EXISTS search_input_border_color VARCHAR(7) DEFAULT '#2563EB';
ALTER TABLE seller_trees ADD COLUMN IF NOT EXISTS search_icon_color VARCHAR(7) DEFAULT '#FFFFFF';

COMMENT ON COLUMN seller_trees.search_button_color IS '영상번호 검색 버튼 배경 색상 (HEX)';
COMMENT ON COLUMN seller_trees.search_input_border_color IS '영상번호 검색 입력창 테두리 색상 (HEX)';
COMMENT ON COLUMN seller_trees.search_icon_color IS '영상번호 검색 돋보기 아이콘 색상 (HEX)';
