-- ============================================
-- 018: 정산 금액 관련 컬럼 추가
-- 네이버/쿠팡 등 API 연동 플랫폼의 실제 정산 금액 저장
-- ============================================

-- orders 테이블에 정산 관련 컬럼 추가
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS settlement_amount INT DEFAULT NULL,  -- 실제 정산 금액 (수수료 차감 후)
ADD COLUMN IF NOT EXISTS settlement_commission INT DEFAULT NULL,  -- 플랫폼 수수료 (API에서 조회한 실제 값)
ADD COLUMN IF NOT EXISTS settlement_commission_rate DECIMAL(5,2) DEFAULT NULL,  -- 실제 수수료율 (%)
ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT NULL,  -- 정산 상태 (SCHEDULED, COMPLETED, DEFERRED)
ADD COLUMN IF NOT EXISTS settlement_expect_date DATE DEFAULT NULL,  -- 정산 예정일
ADD COLUMN IF NOT EXISTS settlement_synced_at TIMESTAMPTZ DEFAULT NULL;  -- 정산 정보 동기화 시간

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS orders_settlement_status_idx ON orders(settlement_status);
CREATE INDEX IF NOT EXISTS orders_settlement_expect_date_idx ON orders(settlement_expect_date);

-- 코멘트 추가
COMMENT ON COLUMN orders.settlement_amount IS '실제 정산 금액 (수수료 차감 후 셀러가 받는 금액)';
COMMENT ON COLUMN orders.settlement_commission IS '플랫폼 수수료 (정산 API에서 조회한 실제 값)';
COMMENT ON COLUMN orders.settlement_commission_rate IS '실제 수수료율 (%)';
COMMENT ON COLUMN orders.settlement_status IS '정산 상태 (SCHEDULED: 정산예정, COMPLETED: 정산완료, DEFERRED: 정산보류)';
COMMENT ON COLUMN orders.settlement_expect_date IS '정산 예정일';
COMMENT ON COLUMN orders.settlement_synced_at IS '정산 정보 마지막 동기화 시간';

-- ============================================
-- 완료!
-- orders 테이블에 추가된 컬럼:
-- - settlement_amount: 실제 정산 금액
-- - settlement_commission: 플랫폼 수수료
-- - settlement_commission_rate: 수수료율
-- - settlement_status: 정산 상태
-- - settlement_expect_date: 정산 예정일
-- - settlement_synced_at: 동기화 시간
-- ============================================
