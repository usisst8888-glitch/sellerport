-- ============================================
-- 100: profiles 테이블에서 plan 관련 컬럼 제거
-- subscriptions 테이블로 이전 완료 후 정리
-- ============================================

-- 1. plan 관련 컬럼 삭제
ALTER TABLE profiles DROP COLUMN IF EXISTS plan;
ALTER TABLE profiles DROP COLUMN IF EXISTS plan_started_at;
ALTER TABLE profiles DROP COLUMN IF EXISTS plan_expires_at;

-- 테이블 코멘트 업데이트
COMMENT ON TABLE profiles IS '사용자 프로필 정보. 구독 정보는 subscriptions 테이블 참조';
