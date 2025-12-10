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

-- 회원가입 시 알림 설정 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO public.user_balance (user_id)
  VALUES (NEW.id);

  INSERT INTO public.alert_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
