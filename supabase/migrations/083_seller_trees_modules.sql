-- seller_trees에 모듈 배열 컬럼 추가 (여러 개 추가 가능, 순서 지정 가능)
-- 모듈 형식: { id, type: 'divider'|'text', content?, color?, size?, position }
ALTER TABLE seller_trees ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN seller_trees.modules IS '모듈 목록 (구분선, 텍스트) - position으로 위치 지정';
