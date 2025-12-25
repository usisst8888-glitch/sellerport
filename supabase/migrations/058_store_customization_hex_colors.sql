-- hex 색상 컬럼 추가
ALTER TABLE store_customization
ADD COLUMN IF NOT EXISTS bg_color_hex text,
ADD COLUMN IF NOT EXISTS button_color_hex text;

COMMENT ON COLUMN store_customization.bg_color_hex IS '배경색 hex 값 (예: #FECACA)';
COMMENT ON COLUMN store_customization.button_color_hex IS '버튼색 hex 값 (예: #F97316)';
