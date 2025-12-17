-- ============================================
-- 037: orders 테이블에 tracking_link_id 추가
-- ============================================
-- 주문이 어느 추적 링크에서 유입되었는지 연결하기 위한 컬럼

-- tracking_link_id 컬럼 추가
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_link_id TEXT;

-- 인덱스 추가 (추적 링크별 주문 조회용)
CREATE INDEX IF NOT EXISTS idx_orders_tracking_link_id ON orders(tracking_link_id);

-- 외래 키 제약 조건 (선택적 - tracking_links 테이블과 연결)
-- tracking_link가 삭제되어도 주문 기록은 유지 (SET NULL)
ALTER TABLE orders
  ADD CONSTRAINT orders_tracking_link_id_fkey
  FOREIGN KEY (tracking_link_id)
  REFERENCES tracking_links(id)
  ON DELETE SET NULL;

-- 컬럼 설명 추가
COMMENT ON COLUMN orders.tracking_link_id IS '유입된 추적 링크 ID - 이 주문이 어느 광고/채널에서 왔는지 추적';
