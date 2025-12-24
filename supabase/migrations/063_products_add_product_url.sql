-- products 테이블에 상품 URL 컬럼 추가
-- 스마트스토어, 카페24 등 실제 상품 페이지 URL 저장용

ALTER TABLE products ADD COLUMN IF NOT EXISTS product_url TEXT;

COMMENT ON COLUMN products.product_url IS '상품 페이지 URL (스마트스토어, 카페24 등)';
