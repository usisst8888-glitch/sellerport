-- 셀러트리에 영상번호 검색 기능 추가
-- 유튜브/틱톡 통합 검색

-- 영상번호 검색 활성화 여부 및 관련 설정 추가
ALTER TABLE seller_trees
ADD COLUMN IF NOT EXISTS video_search_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS video_search_title VARCHAR(100) DEFAULT '영상번호 검색',
ADD COLUMN IF NOT EXISTS video_search_placeholder VARCHAR(100) DEFAULT '영상번호를 입력하세요',
ADD COLUMN IF NOT EXISTS video_search_button_text VARCHAR(50) DEFAULT '검색';

COMMENT ON COLUMN seller_trees.video_search_enabled IS '영상번호 검색 기능 활성화 여부';
COMMENT ON COLUMN seller_trees.video_search_title IS '영상번호 검색 섹션 제목';
