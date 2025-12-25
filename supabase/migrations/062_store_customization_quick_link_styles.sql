-- 빠른 링크 스타일 컬럼 추가
ALTER TABLE store_customization
ADD COLUMN IF NOT EXISTS quick_link_bg_color_hex text,
ADD COLUMN IF NOT EXISTS quick_link_text_color_hex text,
ADD COLUMN IF NOT EXISTS quick_link_layout text DEFAULT 'single';

COMMENT ON COLUMN store_customization.quick_link_bg_color_hex IS '빠른 링크 배경색 (HEX)';
COMMENT ON COLUMN store_customization.quick_link_text_color_hex IS '빠른 링크 텍스트색 (HEX)';
COMMENT ON COLUMN store_customization.quick_link_layout IS '빠른 링크 레이아웃 (single: 1열, double: 2열)';
