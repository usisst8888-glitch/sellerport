-- 092: instagram_dm_settings에 캐러셀 관련 컬럼 추가
-- send_mode: 발송 모드 (single: 단일 상품, carousel: 캐러셀)
-- carousel_product_ids: 캐러셀용 상품 ID 배열
-- selected_product_id: 단일 상품 선택 시 상품 ID

ALTER TABLE instagram_dm_settings
ADD COLUMN IF NOT EXISTS send_mode TEXT DEFAULT 'single';

ALTER TABLE instagram_dm_settings
ADD COLUMN IF NOT EXISTS carousel_product_ids TEXT[];

ALTER TABLE instagram_dm_settings
ADD COLUMN IF NOT EXISTS selected_product_id TEXT;

-- 기존 데이터는 단일 모드로 설정
UPDATE instagram_dm_settings
SET send_mode = 'single'
WHERE send_mode IS NULL;

COMMENT ON COLUMN instagram_dm_settings.send_mode IS '발송 모드 (single: 단일 상품, carousel: 캐러셀)';
COMMENT ON COLUMN instagram_dm_settings.carousel_product_ids IS '캐러셀용 상품 ID 배열';
COMMENT ON COLUMN instagram_dm_settings.selected_product_id IS '단일 상품 선택 시 상품 ID';
