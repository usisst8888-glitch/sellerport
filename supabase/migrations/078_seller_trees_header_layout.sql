-- 셀러트리에 상단 이미지 및 링크 레이아웃 추가

-- 상단 이미지 관련 필드 추가
ALTER TABLE seller_trees
ADD COLUMN IF NOT EXISTS header_image_url TEXT,
ADD COLUMN IF NOT EXISTS header_image_size VARCHAR(20) DEFAULT 'medium';

-- 링크 레이아웃 (1열/2열) 추가
ALTER TABLE seller_trees
ADD COLUMN IF NOT EXISTS link_layout VARCHAR(20) DEFAULT 'single';

COMMENT ON COLUMN seller_trees.header_image_url IS '상단 배너 이미지 URL';
COMMENT ON COLUMN seller_trees.header_image_size IS '상단 이미지 높이 (small, medium, large)';
COMMENT ON COLUMN seller_trees.link_layout IS '링크 레이아웃 (single: 1열, double: 2열)';
