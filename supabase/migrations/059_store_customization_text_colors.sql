-- 텍스트 색상 컬럼 추가
ALTER TABLE store_customization
ADD COLUMN IF NOT EXISTS title_color_hex text,
ADD COLUMN IF NOT EXISTS subtitle_color_hex text,
ADD COLUMN IF NOT EXISTS button_text_color_hex text;

COMMENT ON COLUMN store_customization.title_color_hex IS '타이틀 텍스트 색상 hex 값 (예: #1E293B)';
COMMENT ON COLUMN store_customization.subtitle_color_hex IS '서브타이틀 텍스트 색상 hex 값 (예: #475569)';
COMMENT ON COLUMN store_customization.button_text_color_hex IS '버튼 텍스트 색상 hex 값 (예: #FFFFFF)';
