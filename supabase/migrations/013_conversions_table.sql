-- ============================================
-- 013: 전환 추적 테이블
-- ============================================

-- 전환 기록 테이블
CREATE TABLE IF NOT EXISTS conversions (
  id TEXT PRIMARY KEY,
  slot_id TEXT REFERENCES slots(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  click_id TEXT, -- 클릭 ID (slot_clicks.click_id)

  -- 주문 정보
  order_id TEXT NOT NULL, -- 플랫폼 주문 번호
  order_amount INT NOT NULL DEFAULT 0, -- 주문 금액

  -- 상품 정보
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  quantity INT DEFAULT 1,

  -- 플랫폼 정보
  platform_type TEXT, -- 'naver', 'coupang', 'cafe24' 등

  -- 메타 픽셀 정보
  fbp TEXT, -- _fbp 쿠키
  fbc TEXT, -- _fbc 쿠키

  -- 전환 시간
  converted_at TIMESTAMPTZ DEFAULT NOW(),

  -- Meta CAPI 전송 정보
  meta_sent BOOLEAN DEFAULT FALSE,
  meta_sent_at TIMESTAMPTZ,
  meta_event_id TEXT,

  -- 추가 데이터
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversions"
  ON conversions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert conversions"
  ON conversions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own conversions"
  ON conversions FOR UPDATE
  USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX conversions_slot_id_idx ON conversions(slot_id);
CREATE INDEX conversions_user_id_idx ON conversions(user_id);
CREATE INDEX conversions_order_id_idx ON conversions(order_id);
CREATE INDEX conversions_click_id_idx ON conversions(click_id);
CREATE INDEX conversions_converted_at_idx ON conversions(converted_at DESC);

-- slot_clicks 테이블에 전환 관련 컬럼 추가 (이미 없는 경우)
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS click_id TEXT;
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS is_converted BOOLEAN DEFAULT FALSE;
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS converted_at TIMESTAMPTZ;
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS order_id TEXT;
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS order_amount INT;
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;
ALTER TABLE slot_clicks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- slots 테이블에 last_click_at 컬럼 추가 (이미 없는 경우)
ALTER TABLE slots ADD COLUMN IF NOT EXISTS last_click_at TIMESTAMPTZ;

-- slots 테이블에 Meta 설정 컬럼 추가
ALTER TABLE slots ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;
ALTER TABLE slots ADD COLUMN IF NOT EXISTS meta_access_token TEXT;

-- user_settings는 014에서 생성

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS slot_clicks_click_id_idx ON slot_clicks(click_id);
CREATE INDEX IF NOT EXISTS slot_clicks_is_converted_idx ON slot_clicks(is_converted);
