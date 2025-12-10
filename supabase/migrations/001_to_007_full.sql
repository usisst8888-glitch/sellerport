-- ============================================
-- 셀러포트 (SellerPort) 전체 마이그레이션
-- 001 ~ 007 통합 파일
-- Supabase SQL Editor에서 한번에 실행
-- ============================================


-- ============================================
-- 001: 프로필 테이블 + 기본 함수
-- ============================================

-- updated_at 자동 업데이트 함수 (모든 테이블에서 사용)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- profiles 테이블 생성
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  business_name TEXT,  -- 상호명
  business_number TEXT,  -- 사업자등록번호
  owner_name TEXT,  -- 대표자명
  phone TEXT,  -- 연락처
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  plan_started_at TIMESTAMPTZ,
  plan_expires_at TIMESTAMPTZ,
  subscriber_count INT DEFAULT 0,
  platform_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (Row Level Security) 활성화
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 트리거: profiles 수정 시 updated_at 자동 업데이트
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================
-- 002: 플랫폼 테이블
-- ============================================

-- 플랫폼 연동 테이블
CREATE TABLE IF NOT EXISTS platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform_type TEXT NOT NULL, -- 'naver', 'cafe24', 'imweb' 등
  platform_name TEXT NOT NULL, -- 사용자가 지정한 이름 (예: "내 스마트스토어")

  -- 네이버 커머스 API 인증 정보
  application_id TEXT, -- 애플리케이션 ID
  application_secret TEXT, -- 애플리케이션 시크릿

  -- 일반 API Key 인증 (아임웹 등)
  api_key TEXT,
  api_secret TEXT,

  -- 상태 정보
  status TEXT DEFAULT 'pending', -- 'pending', 'connected', 'error', 'expired'
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,

  -- 메타데이터
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own platforms"
  ON platforms FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own platforms"
  ON platforms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own platforms"
  ON platforms FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own platforms"
  ON platforms FOR DELETE
  USING (auth.uid() = user_id);

-- 트리거
CREATE TRIGGER platforms_updated_at
  BEFORE UPDATE ON platforms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 인덱스
CREATE INDEX platforms_user_id_idx ON platforms(user_id);
CREATE INDEX platforms_platform_type_idx ON platforms(platform_type);
CREATE INDEX platforms_status_idx ON platforms(status);


-- ============================================
-- 003: 상품 테이블
-- ============================================

-- 상품 테이블 (플랫폼에서 동기화된 상품 정보)
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE NOT NULL,
  platform_type TEXT, -- 'naver', 'cafe24' 등

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
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'deleted', 'unknown'

  -- 이미지
  thumbnail_url TEXT,
  image_url TEXT,

  -- 플랫폼별 추가 데이터
  metadata JSONB DEFAULT '{}',

  -- 마지막 동기화
  last_sync_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ, -- API 동기화 시 사용

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
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 인덱스
CREATE INDEX products_user_id_idx ON products(user_id);
CREATE INDEX products_platform_id_idx ON products(platform_id);
CREATE INDEX products_status_idx ON products(status);


-- ============================================
-- 004: 주문 테이블
-- ============================================

-- 주문 테이블 (플랫폼에서 동기화된 주문 정보)
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform_id UUID REFERENCES platforms(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  platform_type TEXT, -- 'naver', 'cafe24' 등

  -- 플랫폼 주문 정보
  external_order_id TEXT NOT NULL, -- 플랫폼 주문번호
  product_order_id TEXT, -- 상품 주문 ID (네이버)
  external_product_id TEXT, -- 플랫폼 상품 ID

  -- 상품 정보 (스냅샷)
  product_name TEXT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,

  -- 금액
  price INT NOT NULL DEFAULT 0, -- 상품 판매가
  product_price INT DEFAULT 0, -- 상품 단가
  total_amount INT NOT NULL DEFAULT 0, -- 총 결제금액 (배송비 포함)
  shipping_fee INT DEFAULT 0, -- 배송비

  -- 원가 및 수익 계산
  cost INT DEFAULT 0, -- 원가
  platform_fee INT DEFAULT 0, -- 플랫폼 수수료
  ad_cost INT DEFAULT 0, -- 광고비 (캠페인에서 배분)
  profit INT DEFAULT 0, -- 순이익

  -- 주문 상태
  order_status TEXT DEFAULT 'paid', -- 'paid', 'preparing', 'shipping', 'delivered', 'cancelled', 'returned'
  status TEXT, -- 네이버 API 원본 상태

  -- UTM 추적 (전환 추적용)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  slot_id TEXT, -- 추적 슬롯 ID
  inflow_path TEXT, -- 유입 경로 (네이버 API)

  -- 주문 시간
  ordered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  order_date TIMESTAMPTZ, -- 원본 주문 날짜

  -- 플랫폼별 추가 데이터
  metadata JSONB DEFAULT '{}',

  -- 동기화 시간
  synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 같은 플랫폼 내 주문 ID 중복 방지
  UNIQUE(platform_id, external_order_id, product_order_id)
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
CREATE INDEX orders_slot_id_idx ON orders(slot_id);


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
  id TEXT PRIMARY KEY, -- nanoid 기반 ID (예: SL-ABCD1234)
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
  tracking_url TEXT, -- 전체 추적 URL (예: https://셀러포트/t/SL-ABCD1234)
  target_url TEXT, -- 최종 도착 URL (스마트스토어 상품 페이지)
  destination_url TEXT, -- target_url 별칭

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

-- 공개 읽기 정책 (추적 리다이렉트용)
CREATE POLICY "Public can view slots for tracking"
  ON slots FOR SELECT
  USING (true);

-- 트리거
CREATE TRIGGER slots_updated_at
  BEFORE UPDATE ON slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 인덱스
CREATE INDEX slots_user_id_idx ON slots(user_id);
CREATE INDEX slots_product_id_idx ON slots(product_id);
CREATE INDEX slots_utm_campaign_idx ON slots(utm_campaign);


-- 슬롯 클릭 로그 테이블
CREATE TABLE IF NOT EXISTS slot_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id TEXT REFERENCES slots(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 클릭 정보
  ip_address TEXT,
  user_agent TEXT,
  referer TEXT,

  -- UTM 파라미터 (클릭 시점 스냅샷)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,

  -- 메타 픽셀
  fbp TEXT, -- _fbp 쿠키
  fbc TEXT, -- _fbc 쿠키

  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE slot_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own slot clicks"
  ON slot_clicks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert slot clicks"
  ON slot_clicks FOR INSERT
  WITH CHECK (true);

-- 인덱스
CREATE INDEX slot_clicks_slot_id_idx ON slot_clicks(slot_id);
CREATE INDEX slot_clicks_clicked_at_idx ON slot_clicks(clicked_at DESC);


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

CREATE POLICY "Users can insert own balance"
  ON user_balance FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- 결제 내역 테이블
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 결제 유형
  payment_type TEXT NOT NULL, -- 'slot', 'alert'
  product_type TEXT, -- payment_type 별칭

  -- 수량 및 금액
  quantity INT NOT NULL, -- 슬롯 개수 또는 알림 건수
  amount INT NOT NULL, -- 결제 금액

  -- 결제 상태
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed', 'cancelled', 'partial_cancelled'

  -- 결제 수단
  payment_method TEXT, -- 'card', 'kakaopay', 'naverpay'
  method TEXT, -- payment_method 별칭

  -- 토스페이먼츠 정보
  payment_key TEXT,
  order_id TEXT UNIQUE, -- 토스페이먼츠 주문 ID
  approved_at TIMESTAMPTZ, -- 승인 시간
  receipt_url TEXT, -- 영수증 URL

  -- 취소 정보
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,

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

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  USING (auth.uid() = user_id);

-- 트리거
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 인덱스
CREATE INDEX payments_user_id_idx ON payments(user_id);
CREATE INDEX payments_status_idx ON payments(status);
CREATE INDEX payments_created_at_idx ON payments(created_at DESC);
CREATE INDEX payments_payment_key_idx ON payments(payment_key);


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
-- handle_new_user 함수 (신규 회원가입 시)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 프로필 생성
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  -- 잔액 초기화 (무료 슬롯 5개, 알림 10건 제공)
  INSERT INTO public.user_balance (user_id, slot_balance, alert_balance)
  VALUES (NEW.id, 5, 10);

  -- 알림 설정 초기화
  INSERT INTO public.alert_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거: auth.users에 새 사용자 생성 시 자동 실행
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================
-- 완료!
-- ============================================
-- 테이블 목록:
-- 1. profiles - 사용자 프로필
-- 2. platforms - 플랫폼 연동 (네이버, 카페24 등)
-- 3. products - 상품 정보
-- 4. orders - 주문 정보
-- 5. campaigns - 광고 캠페인
-- 6. campaign_daily_stats - 캠페인 일별 성과
-- 7. slots - UTM 추적 슬롯
-- 8. slot_clicks - 슬롯 클릭 로그
-- 9. user_balance - 사용자 잔액
-- 10. payments - 결제 내역
-- 11. alerts - 알림
-- 12. alert_settings - 알림 설정
-- ============================================
