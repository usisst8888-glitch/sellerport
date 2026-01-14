-- ============================================
-- 101: subscriptions 테이블 기본 금액 변경
-- 22,900원 -> 12,900원
-- ============================================

-- 기본값 변경
ALTER TABLE subscriptions ALTER COLUMN amount SET DEFAULT 12900;

-- 코멘트 업데이트
COMMENT ON COLUMN subscriptions.amount IS '월 구독료 (기본 12,900원)';
