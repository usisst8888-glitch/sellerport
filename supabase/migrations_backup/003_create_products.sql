-- 상품 테이블 (플랫폼에서 동기화된 상품 정보)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE NOT NULL,

  -- 플랫폼 상품 정보
  external_product_id TEXT NOT NULL, -- 플랫폼 상품 ID (스마트스토어 상품번호 등)
  name TEXT NOT NULL,
  category TEXT,

  -- 가격 정보
  price INT NOT NULL DEFAULT 0, -- 판매가
  cost INT DEFAULT 0, -- 원가 (사용자 입력)

  -- 재고
  stock INT DEFAULT 0,

  -- 상태
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'deleted'

  -- 이미지
  thumbnail_url TEXT,

  -- 플랫폼별 추가 데이터
  metadata JSONB DEFAULT '{}',

  -- 마지막 동기화
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 같은 플랫폼 내 상품 ID 중복 방지
  UNIQUE(platform_id, external_product_id)
);

-- RLS 활성화
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own products"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products"
  ON products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products"
  ON products FOR DELETE
  USING (auth.uid() = user_id);

-- 트리거
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 인덱스
CREATE INDEX products_user_id_idx ON products(user_id);
CREATE INDEX products_platform_id_idx ON products(platform_id);
CREATE INDEX products_status_idx ON products(status);
