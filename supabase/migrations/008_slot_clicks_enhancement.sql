-- ============================================
-- 008: slot_clicks 테이블 확장
-- 전환 추적을 위한 컬럼 추가
-- ============================================

-- click_id 컬럼 추가 (주문 매칭용)
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS click_id TEXT;

-- campaign_id 컬럼 추가
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

-- 전환 여부
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS is_converted BOOLEAN DEFAULT FALSE;

-- 전환 시 연결된 주문
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS converted_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- 전환 시간
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;

-- created_at 컬럼 (clicked_at 대신 또는 추가로)
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- slots 테이블에 last_click_at 추가
ALTER TABLE slots ADD COLUMN IF NOT EXISTS last_click_at TIMESTAMPTZ;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS slot_clicks_click_id_idx ON slot_clicks(click_id);
CREATE INDEX IF NOT EXISTS slot_clicks_campaign_id_idx ON slot_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS slot_clicks_is_converted_idx ON slot_clicks(is_converted);
CREATE INDEX IF NOT EXISTS slot_clicks_created_at_idx ON slot_clicks(created_at DESC);

-- orders 테이블에 click_id 추가 (클릭 매칭용)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS click_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_click_id_idx ON orders(click_id);
CREATE INDEX IF NOT EXISTS orders_campaign_id_idx ON orders(campaign_id);
