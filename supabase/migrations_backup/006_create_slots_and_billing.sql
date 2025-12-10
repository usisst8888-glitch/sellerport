-- 추적 슬롯 테이블 (UTM 추적 링크)
CREATE TABLE IF NOT EXISTS slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,

  -- 슬롯 정보
  name TEXT NOT NULL, -- 슬롯 이름 (예: "단백질 쉐이크 - 메타 광고")

  -- UTM 파라미터
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,

  -- 추적 URL
  tracking_url TEXT, -- 전체 추적 URL
  destination_url TEXT, -- 최종 도착 URL (스마트스토어 상품 페이지)

  -- 성과
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue INT DEFAULT 0,

  -- 상태
  status TEXT DEFAULT 'active', -- 'active', 'inactive'

  -- 메타 픽셀용
  fbp_cookie TEXT, -- _fbp 쿠키 값

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own slots"
  ON slots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own slots"
  ON slots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own slots"
  ON slots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own slots"
  ON slots FOR DELETE
  USING (auth.uid() = user_id);

-- 트리거
CREATE TRIGGER slots_updated_at
  BEFORE UPDATE ON slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 인덱스
CREATE INDEX slots_user_id_idx ON slots(user_id);
CREATE INDEX slots_product_id_idx ON slots(product_id);
CREATE INDEX slots_utm_campaign_idx ON slots(utm_campaign);


-- 사용자 잔액 테이블
CREATE TABLE IF NOT EXISTS user_balance (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- 슬롯 잔여 개수
  slot_balance INT DEFAULT 0,

  -- 알림 잔여 건수
  alert_balance INT DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE user_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own balance"
  ON user_balance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own balance"
  ON user_balance FOR UPDATE
  USING (auth.uid() = user_id);

-- 회원가입 시 잔액 자동 생성 (profiles 트리거에 추가)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.user_balance (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 결제 내역 테이블
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 결제 유형
  payment_type TEXT NOT NULL, -- 'slot', 'alert'

  -- 수량 및 금액
  quantity INT NOT NULL, -- 슬롯 개수 또는 알림 건수
  amount INT NOT NULL, -- 결제 금액

  -- 결제 상태
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled'

  -- 결제 수단
  payment_method TEXT, -- 'card', 'kakaopay', 'naverpay'

  -- 토스페이먼츠 정보
  payment_key TEXT,
  order_id TEXT UNIQUE, -- 토스페이먼츠 주문 ID

  -- 추가 데이터
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 트리거
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 인덱스
CREATE INDEX payments_user_id_idx ON payments(user_id);
CREATE INDEX payments_status_idx ON payments(status);
CREATE INDEX payments_created_at_idx ON payments(created_at DESC);
