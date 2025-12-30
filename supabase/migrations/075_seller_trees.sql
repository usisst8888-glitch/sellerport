-- 셀러트리 독립 테이블 구조
-- 기존 store_customization을 대체하는 단순화된 미니홈페이지 구조

-- 1. seller_trees 메인 테이블
CREATE TABLE IF NOT EXISTS seller_trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- URL 슬러그 (sp-trk.link/{slug})
  slug VARCHAR(50) NOT NULL UNIQUE,

  -- 기본 정보
  title VARCHAR(100),
  subtitle VARCHAR(200),
  profile_image_url TEXT,

  -- 배경 설정
  background_type VARCHAR(20) DEFAULT 'gradient', -- gradient, solid, image
  background_gradient VARCHAR(100) DEFAULT 'from-slate-900 via-slate-800 to-slate-900',
  background_color VARCHAR(7), -- hex 색상 (#FFFFFF)
  background_image_url TEXT,

  -- 텍스트 색상
  title_color VARCHAR(7) DEFAULT '#FFFFFF',
  subtitle_color VARCHAR(7) DEFAULT '#94A3B8',

  -- 버튼 스타일
  button_color VARCHAR(7) DEFAULT '#3B82F6',
  button_text_color VARCHAR(7) DEFAULT '#FFFFFF',
  button_text VARCHAR(50) DEFAULT '바로가기',

  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. seller_tree_links 링크 테이블
CREATE TABLE IF NOT EXISTS seller_tree_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_tree_id UUID NOT NULL REFERENCES seller_trees(id) ON DELETE CASCADE,

  -- 링크 정보
  title VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  description VARCHAR(200),
  thumbnail_url TEXT,
  icon VARCHAR(50), -- 아이콘 이름 또는 이모지

  -- 추적 링크 연동 (선택)
  tracking_link_id VARCHAR(20) REFERENCES tracking_links(id) ON DELETE SET NULL,

  -- 정렬 및 상태
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- 통계
  click_count INTEGER DEFAULT 0,

  -- 메타데이터
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_seller_trees_user_id ON seller_trees(user_id);
CREATE INDEX idx_seller_trees_slug ON seller_trees(slug);
CREATE INDEX idx_seller_tree_links_seller_tree_id ON seller_tree_links(seller_tree_id);
CREATE INDEX idx_seller_tree_links_tracking_link_id ON seller_tree_links(tracking_link_id);
CREATE INDEX idx_seller_tree_links_display_order ON seller_tree_links(seller_tree_id, display_order);

-- RLS 정책
ALTER TABLE seller_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_tree_links ENABLE ROW LEVEL SECURITY;

-- seller_trees RLS
CREATE POLICY "Users can manage own seller_trees"
  ON seller_trees FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active seller_trees"
  ON seller_trees FOR SELECT
  USING (is_active = true);

-- seller_tree_links RLS
CREATE POLICY "Users can manage own seller_tree_links"
  ON seller_tree_links FOR ALL
  USING (
    seller_tree_id IN (
      SELECT id FROM seller_trees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view active seller_tree_links"
  ON seller_tree_links FOR SELECT
  USING (
    is_active = true AND
    seller_tree_id IN (
      SELECT id FROM seller_trees WHERE is_active = true
    )
  );

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_seller_trees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_seller_trees_updated_at
  BEFORE UPDATE ON seller_trees
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_trees_updated_at();

CREATE TRIGGER trigger_seller_tree_links_updated_at
  BEFORE UPDATE ON seller_tree_links
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_trees_updated_at();

-- 테이블 설명
COMMENT ON TABLE seller_trees IS '셀러트리 미니홈페이지 메인 테이블';
COMMENT ON TABLE seller_tree_links IS '셀러트리에 표시되는 링크 목록';
COMMENT ON COLUMN seller_trees.slug IS 'URL 슬러그 (sp-trk.link/{slug})';
COMMENT ON COLUMN seller_tree_links.tracking_link_id IS '추적 링크 연동 시 사용 (선택)';
