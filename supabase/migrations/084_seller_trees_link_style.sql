-- seller_trees 테이블에 link_style 컬럼 추가
ALTER TABLE seller_trees
ADD COLUMN IF NOT EXISTS link_style TEXT DEFAULT 'list';

-- 코멘트 추가
COMMENT ON COLUMN seller_trees.link_style IS '링크 스타일: list(리스트형), card(카드형)';
