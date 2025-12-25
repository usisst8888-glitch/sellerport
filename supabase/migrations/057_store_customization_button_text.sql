-- 버튼 텍스트 컬럼 추가
ALTER TABLE store_customization
ADD COLUMN IF NOT EXISTS button_text text;

COMMENT ON COLUMN store_customization.button_text IS '커스텀 버튼 텍스트 (기본값: 상품 보러가기)';
