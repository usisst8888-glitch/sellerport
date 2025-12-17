-- my_sites 테이블 status 컬럼 값 문서화 및 기본값 변경
-- status 값: 'pending_script' (연동중), 'connected' (연동됨), 'error' (오류), 'expired' (만료됨)

-- 1. 기본값을 pending_script로 변경 (새로 연동하면 "연동중" 상태로 시작)
ALTER TABLE my_sites ALTER COLUMN status SET DEFAULT 'pending_script';

-- 2. 기존 'pending' 상태를 'pending_script'로 업데이트
UPDATE my_sites SET status = 'pending_script' WHERE status = 'pending';

-- 3. 컬럼 설명 추가
COMMENT ON COLUMN my_sites.status IS 'pending_script(연동중), connected(연동됨), error(오류), expired(만료됨)';
