-- ============================================
-- 011: slots 테이블에 ad_spend(광고비) 컬럼 추가
-- 슬롯별 광고비를 추적하여 ROAS 계산에 사용
-- ============================================

-- slots 테이블에 ad_spend 컬럼 추가
ALTER TABLE slots ADD COLUMN IF NOT EXISTS ad_spend INT DEFAULT 0;

-- slots 테이블에 platform_type 컬럼 추가 (플랫폼 수수료 계산용)
ALTER TABLE slots ADD COLUMN IF NOT EXISTS platform_type TEXT;

-- slots 테이블에 channel 컬럼 추가 (채널별 수수료)
ALTER TABLE slots ADD COLUMN IF NOT EXISTS channel TEXT;

-- slots 테이블에 category 컬럼 추가 (카테고리별 수수료)
ALTER TABLE slots ADD COLUMN IF NOT EXISTS category TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS slots_platform_type_idx ON slots(platform_type);

-- 코멘트 추가
COMMENT ON COLUMN slots.ad_spend IS '슬롯에 투입된 총 광고비 (원)';
COMMENT ON COLUMN slots.platform_type IS '판매 플랫폼 (naver, coupang, cafe24 등)';
COMMENT ON COLUMN slots.channel IS '판매 채널 (smartstore, brandstore 등)';
COMMENT ON COLUMN slots.category IS '상품 카테고리 (수수료 계산용)';
