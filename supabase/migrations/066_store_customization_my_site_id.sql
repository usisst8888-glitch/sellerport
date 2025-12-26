-- ============================================
-- 066: store_customization 테이블 개선
-- ============================================
-- 쇼핑몰(my_sites)과 연결 + 인스타그램 채널 타입 추가

-- 1. my_site_id FK 컬럼 추가
ALTER TABLE store_customization
ADD COLUMN IF NOT EXISTS my_site_id UUID REFERENCES my_sites(id) ON DELETE SET NULL;

-- 2. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_store_customization_my_site_id ON store_customization(my_site_id);

-- 3. channel_type 제약 조건 수정 (instagram 추가)
-- 기존 CHECK 제약 조건 삭제
ALTER TABLE store_customization
DROP CONSTRAINT IF EXISTS store_customization_channel_type_check;

-- 새로운 CHECK 제약 조건 추가 (instagram 포함)
ALTER TABLE store_customization
ADD CONSTRAINT store_customization_channel_type_check
CHECK (channel_type IN ('youtube', 'tiktok', 'instagram', 'naver_blog', 'general'));

-- 4. 테이블 설명 업데이트
COMMENT ON TABLE store_customization IS '셀러트리 커스터마이징 설정 - 쇼핑몰별 링크 페이지';
COMMENT ON COLUMN store_customization.my_site_id IS '연결된 쇼핑몰 (my_sites FK)';
COMMENT ON COLUMN store_customization.channel_type IS '채널 타입: youtube, tiktok, instagram, naver_blog, general';
