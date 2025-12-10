-- 주문 테이블 (플랫폼에서 동기화된 주문 정보)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- 플랫폼 주문 정보
  external_order_id TEXT NOT NULL, -- 플랫폼 주문번호
  external_product_id TEXT, -- 플랫폼 상품 ID

  -- 상품 정보 (스냅샷)
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,

  -- 금액
  price INT NOT NULL DEFAULT 0, -- 상품 판매가
  total_amount INT NOT NULL DEFAULT 0, -- 총 결제금액 (배송비 포함)
  shipping_fee INT DEFAULT 0, -- 배송비

  -- 원가 및 수익 계산
  cost INT DEFAULT 0, -- 원가
  platform_fee INT DEFAULT 0, -- 플랫폼 수수료
  ad_cost INT DEFAULT 0, -- 광고비 (캠페인에서 배분)
  profit INT DEFAULT 0, -- 순이익

  -- 주문 상태
  order_status TEXT DEFAULT 'paid', -- 'paid', 'preparing', 'shipping', 'delivered', 'cancelled', 'returned'

  -- UTM 추적 (전환 추적용)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  slot_id UUID, -- 추적 슬롯 ID (나중에 추가)

  -- 주문 시간
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 플랫폼별 추가 데이터
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 같은 플랫폼 내 주문 ID 중복 방지
  UNIQUE(platform_id, external_order_id)
);

-- RLS 활성화
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders"
  ON orders FOR DELETE
  USING (auth.uid() = user_id);

-- 트리거
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 인덱스
CREATE INDEX orders_user_id_idx ON orders(user_id);
CREATE INDEX orders_platform_id_idx ON orders(platform_id);
CREATE INDEX orders_product_id_idx ON orders(product_id);
CREATE INDEX orders_ordered_at_idx ON orders(ordered_at DESC);
CREATE INDEX orders_utm_source_idx ON orders(utm_source);
CREATE INDEX orders_utm_campaign_idx ON orders(utm_campaign);
CREATE INDEX orders_order_status_idx ON orders(order_status);
