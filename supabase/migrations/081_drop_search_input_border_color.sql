-- 셀러트리 검색 입력창 테두리 색상 컬럼 삭제 (버튼과 인풋 높이 불일치 문제)
ALTER TABLE seller_trees DROP COLUMN IF EXISTS search_input_border_color;
