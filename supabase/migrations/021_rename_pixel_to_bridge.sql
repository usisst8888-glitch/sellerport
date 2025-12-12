-- ============================================
-- 021: pixel_shop_url → bridge_shop_url 컬럼명 변경
-- ============================================

-- tracking_links 테이블의 pixel_shop_url 컬럼을 bridge_shop_url로 변경
-- 기존 데이터가 있을 수 있으므로 안전하게 처리

-- 1. bridge_shop_url 컬럼 추가 (이미 있으면 무시)
ALTER TABLE tracking_links ADD COLUMN IF NOT EXISTS bridge_shop_url TEXT;

-- 2. 기존 pixel_shop_url 데이터를 bridge_shop_url로 복사
UPDATE tracking_links
SET bridge_shop_url = pixel_shop_url
WHERE pixel_shop_url IS NOT NULL AND bridge_shop_url IS NULL;

-- 3. URL 내용도 /pixel/ → /bridge/ 로 변경
UPDATE tracking_links
SET bridge_shop_url = REPLACE(bridge_shop_url, '/pixel/', '/bridge/')
WHERE bridge_shop_url LIKE '%/pixel/%';

UPDATE tracking_links
SET tracking_url = REPLACE(tracking_url, '/pixel/', '/bridge/')
WHERE tracking_url LIKE '%/pixel/%';

-- 4. pixel_shop_url 컬럼 삭제 (선택적 - 필요시 주석 해제)
-- ALTER TABLE tracking_links DROP COLUMN IF EXISTS pixel_shop_url;

-- 테이블 코멘트 업데이트
COMMENT ON COLUMN tracking_links.bridge_shop_url IS '브릿지샵 URL (메타/구글/틱톡 광고용 중간 페이지)';
