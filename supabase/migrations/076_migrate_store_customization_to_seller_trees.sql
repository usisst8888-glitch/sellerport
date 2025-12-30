-- 기존 store_customization 데이터를 seller_trees로 마이그레이션
-- 채널타입별로 분리되어 있던 데이터를 사용자별 하나의 셀러트리로 통합

-- 1. 기존 store_customization 데이터를 seller_trees로 이전
-- 사용자별로 가장 최근에 수정된 커스터마이징을 기준으로 마이그레이션
INSERT INTO seller_trees (
  user_id,
  slug,
  title,
  subtitle,
  profile_image_url,
  background_type,
  background_gradient,
  background_color,
  background_image_url,
  title_color,
  subtitle_color,
  button_color,
  button_text_color,
  button_text,
  created_at,
  updated_at
)
SELECT DISTINCT ON (sc.user_id)
  sc.user_id,
  sc.store_slug,
  sc.title_text,
  sc.subtitle_text,
  sc.header_image_url,
  sc.background_type,
  sc.background_gradient,
  sc.bg_color_hex,
  sc.background_image_url,
  COALESCE(sc.title_color_hex, '#FFFFFF'),
  COALESCE(sc.subtitle_color_hex, '#94A3B8'),
  COALESCE(sc.button_color_hex, '#3B82F6'),
  COALESCE(sc.button_text_color_hex, '#FFFFFF'),
  COALESCE(sc.button_text, '바로가기'),
  sc.created_at,
  sc.updated_at
FROM store_customization sc
WHERE sc.store_slug IS NOT NULL
ORDER BY sc.user_id, sc.updated_at DESC
ON CONFLICT (slug) DO NOTHING;

-- 2. 기존 quick_links를 seller_tree_links로 이전
-- store_customization의 quick_links JSONB 배열을 개별 레코드로 변환
INSERT INTO seller_tree_links (
  seller_tree_id,
  title,
  url,
  thumbnail_url,
  display_order,
  created_at
)
SELECT
  st.id,
  (link->>'title')::VARCHAR(100),
  (link->>'url')::TEXT,
  (link->>'thumbnailUrl')::TEXT,
  (link->>'order')::INTEGER,
  now()
FROM store_customization sc
CROSS JOIN LATERAL jsonb_array_elements(sc.quick_links) AS link
JOIN seller_trees st ON st.user_id = sc.user_id AND st.slug = sc.store_slug
WHERE sc.quick_links IS NOT NULL
  AND jsonb_array_length(sc.quick_links) > 0;

-- 3. 테이블 코멘트 업데이트
COMMENT ON TABLE store_customization IS '[DEPRECATED] 레거시 테이블 - seller_trees로 마이그레이션됨. 추후 삭제 예정';
