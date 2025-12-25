-- 입력 필드 스타일 컬럼 추가
ALTER TABLE store_customization
ADD COLUMN IF NOT EXISTS input_bg_color_hex text,
ADD COLUMN IF NOT EXISTS input_text_color_hex text,
ADD COLUMN IF NOT EXISTS input_border_color_hex text,
ADD COLUMN IF NOT EXISTS input_show_border boolean DEFAULT true;

COMMENT ON COLUMN store_customization.input_bg_color_hex IS '입력 필드 배경색 hex 값';
COMMENT ON COLUMN store_customization.input_text_color_hex IS '입력 필드 텍스트 색상 hex 값';
COMMENT ON COLUMN store_customization.input_border_color_hex IS '입력 필드 테두리 색상 hex 값';
COMMENT ON COLUMN store_customization.input_show_border IS '입력 필드 테두리 표시 여부';
