-- 플랫폼 → 내 사이트 리네이밍
-- platforms 테이블을 my_sites로 변경

-- 1. 테이블명 변경
ALTER TABLE IF EXISTS platforms RENAME TO my_sites;

-- 2. 컬럼명 변경 (platform_type → site_type, platform_name → site_name)
ALTER TABLE my_sites RENAME COLUMN platform_type TO site_type;
ALTER TABLE my_sites RENAME COLUMN platform_name TO site_name;

-- 3. products 테이블의 외래키 컬럼명 변경
ALTER TABLE products RENAME COLUMN platform_id TO my_site_id;
ALTER TABLE products RENAME COLUMN platform_type TO site_type;

-- 4. orders 테이블의 외래키 컬럼명 변경
ALTER TABLE orders RENAME COLUMN platform_id TO my_site_id;
ALTER TABLE orders RENAME COLUMN platform_type TO site_type;

-- 5. 인덱스 재생성 (기존 인덱스 삭제 후 새로 생성)
DROP INDEX IF EXISTS platforms_user_id_idx;
DROP INDEX IF EXISTS platforms_status_idx;
DROP INDEX IF EXISTS products_platform_id_idx;
DROP INDEX IF EXISTS orders_platform_id_idx;
CREATE INDEX IF NOT EXISTS my_sites_user_id_idx ON my_sites(user_id);
CREATE INDEX IF NOT EXISTS my_sites_status_idx ON my_sites(status);
CREATE INDEX IF NOT EXISTS products_my_site_id_idx ON products(my_site_id);
CREATE INDEX IF NOT EXISTS orders_my_site_id_idx ON orders(my_site_id);

-- 6. RLS 정책 업데이트 (기존 정책 삭제 후 새로 생성)
DROP POLICY IF EXISTS "Users can view their own platforms" ON my_sites;
DROP POLICY IF EXISTS "Users can insert their own platforms" ON my_sites;
DROP POLICY IF EXISTS "Users can update their own platforms" ON my_sites;
DROP POLICY IF EXISTS "Users can delete their own platforms" ON my_sites;

CREATE POLICY "Users can view their own my_sites" ON my_sites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own my_sites" ON my_sites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own my_sites" ON my_sites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own my_sites" ON my_sites
  FOR DELETE USING (auth.uid() = user_id);

-- 7. 테이블 설명 업데이트
COMMENT ON TABLE my_sites IS '내 사이트 연동 - 스마트스토어, 자체몰 등 전환이 발생하는 사이트';
COMMENT ON COLUMN my_sites.site_type IS '사이트 유형 (naver, coupang, cafe24, custom 등)';
COMMENT ON COLUMN my_sites.site_name IS '사이트 이름 (사용자 지정)';
