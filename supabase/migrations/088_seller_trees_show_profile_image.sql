-- seller_trees에 프로필 이미지 노출 여부 컬럼 추가

ALTER TABLE seller_trees
ADD COLUMN IF NOT EXISTS show_profile_image BOOLEAN DEFAULT true;

-- 컬럼 설명 추가
COMMENT ON COLUMN seller_trees.show_profile_image IS '프로필 이미지 노출 여부 (true: 노출, false: 숨김)';
