-- ============================================
-- 004 ~ 007 마이그레이션 통합 파일
-- Supabase SQL Editor에서 한번에 실행
-- ============================================

-- ============================================
-- 004: 주문 테이블
-- ============================================

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


-- ============================================
-- 005: 캠페인 테이블
-- ============================================

-- 광고 캠페인 테이블
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,

  -- 캠페인 정보
  name TEXT NOT NULL, -- 캠페인명
  platform TEXT NOT NULL, -- '네이버', '메타', '구글', '쿠팡', '카카오'

  -- 캠페인 상태
  status TEXT DEFAULT 'running', -- 'running', 'paused', 'stopped'

  -- 예산
  daily_budget INT DEFAULT 0, -- 일일 예산

  -- 성과 지표 (일별 업데이트)
  spent INT DEFAULT 0, -- 광고비 소진
  impressions INT DEFAULT 0, -- 노출
  clicks INT DEFAULT 0, -- 클릭
  conversions INT DEFAULT 0, -- 전환 (구매)
  revenue INT DEFAULT 0, -- 매출
  roas INT DEFAULT 0, -- ROAS (%) = revenue / spent * 100

  -- 추적 링크
  tracking_url TEXT,

  -- 외부 캠페인 ID (광고 플랫폼 연동 시)
  external_campaign_id TEXT,

  -- 추가 데이터
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
  ON campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
  ON campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- 트리거
CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 인덱스
CREATE INDEX campaigns_user_id_idx ON campaigns(user_id);
CREATE INDEX campaigns_product_id_idx ON campaigns(product_id);
CREATE INDEX campaigns_status_idx ON campaigns(status);
CREATE INDEX campaigns_platform_idx ON campaigns(platform);


-- 캠페인 일별 성과 기록 테이블
CREATE TABLE IF NOT EXISTS campaign_daily_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 날짜
  date DATE NOT NULL,

  -- 성과 지표
  spent INT DEFAULT 0,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  revenue INT DEFAULT 0,
  roas INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- 캠페인별 날짜 중복 방지
  UNIQUE(campaign_id, date)
);

-- RLS 활성화
ALTER TABLE campaign_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign stats"
  ON campaign_daily_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own campaign stats"
  ON campaign_daily_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 인덱스
CREATE INDEX campaign_daily_stats_campaign_id_idx ON campaign_daily_stats(campaign_id);
CREATE INDEX campaign_daily_stats_date_idx ON campaign_daily_stats(date DESC);


-- ============================================
-- 006: 슬롯 및 결제 테이블
-- ============================================

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

-- INSERT 정책 추가
CREATE POLICY "Users can insert own balance"
  ON user_balance FOR INSERT
  WITH CHECK (auth.uid() = user_id);


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


-- ============================================
-- 007: 알림 테이블
-- ============================================

-- 알림 테이블
CREATE TABLE IF NOT EXISTS alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,

  -- 알림 유형
  alert_type TEXT NOT NULL, -- 'red_light', 'yellow_light', 'green_light', 'stock', 'order'

  -- 알림 내용
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- 관련 데이터
  related_data JSONB DEFAULT '{}', -- 상품명, ROAS 등 추가 정보

  -- 상태
  is_read BOOLEAN DEFAULT FALSE,
  is_sent BOOLEAN DEFAULT FALSE, -- 알림톡 발송 여부

  -- 발송 정보
  sent_at TIMESTAMPTZ,
  sent_channel TEXT, -- 'kakao', 'email', 'push'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts"
  ON alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
  ON alerts FOR DELETE
  USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX alerts_user_id_idx ON alerts(user_id);
CREATE INDEX alerts_alert_type_idx ON alerts(alert_type);
CREATE INDEX alerts_is_read_idx ON alerts(is_read);
CREATE INDEX alerts_created_at_idx ON alerts(created_at DESC);


-- 알림 설정 테이블
CREATE TABLE IF NOT EXISTS alert_settings (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,

  -- 알림 유형별 on/off
  red_light_enabled BOOLEAN DEFAULT TRUE,
  yellow_light_enabled BOOLEAN DEFAULT TRUE,
  green_light_enabled BOOLEAN DEFAULT FALSE,
  stock_enabled BOOLEAN DEFAULT TRUE,
  daily_report_enabled BOOLEAN DEFAULT FALSE,

  -- 알림 채널
  email_enabled BOOLEAN DEFAULT TRUE,
  kakao_enabled BOOLEAN DEFAULT FALSE,
  slack_enabled BOOLEAN DEFAULT FALSE,

  -- 카카오톡 연동 정보
  kakao_phone TEXT, -- 카카오톡 수신 번호

  -- 슬랙 연동 정보
  slack_webhook_url TEXT,

  -- 재고 알림 기준
  stock_threshold INT DEFAULT 10, -- 재고가 이 수량 이하면 알림

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alert settings"
  ON alert_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own alert settings"
  ON alert_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alert settings"
  ON alert_settings FOR UPDATE
  USING (auth.uid() = user_id);


-- ============================================
-- handle_new_user 함수 업데이트 (신규 회원가입 시)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.user_balance (user_id, slot_balance, alert_balance)
  VALUES (NEW.id, 5, 10); -- 무료 슬롯 5개, 알림 10건 제공

  INSERT INTO public.alert_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
