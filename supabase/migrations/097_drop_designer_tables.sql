-- ============================================
-- 095: 디자이너 마켓플레이스 테이블 삭제
-- 디자이너 기능 제거에 따른 테이블 정리
-- ============================================

-- 트리거 먼저 삭제
DROP TRIGGER IF EXISTS trigger_update_designer_rating ON designer_reviews;
DROP TRIGGER IF EXISTS trigger_update_designer_completed ON design_requests;

-- 함수 삭제
DROP FUNCTION IF EXISTS update_designer_rating();
DROP FUNCTION IF EXISTS update_designer_completed_projects();

-- 테이블 삭제 (의존성 순서대로)
DROP TABLE IF EXISTS design_messages CASCADE;
DROP TABLE IF EXISTS designer_reviews CASCADE;
DROP TABLE IF EXISTS design_requests CASCADE;
DROP TABLE IF EXISTS designer_portfolios CASCADE;
DROP TABLE IF EXISTS designers CASCADE;
