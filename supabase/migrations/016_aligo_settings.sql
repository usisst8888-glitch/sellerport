-- ============================================
-- 016: 알리고 알림톡 설정 컬럼 추가
-- ============================================

-- user_settings에 알리고 설정 컬럼 추가
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS aligo_api_key TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS aligo_user_id TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS aligo_sender_key TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- alert_settings에 알리고 설정 컬럼 추가
ALTER TABLE alert_settings ADD COLUMN IF NOT EXISTS aligo_api_key TEXT;
ALTER TABLE alert_settings ADD COLUMN IF NOT EXISTS aligo_user_id TEXT;
ALTER TABLE alert_settings ADD COLUMN IF NOT EXISTS aligo_sender_key TEXT;

-- alert_settings에 주문 알림 설정 컬럼 추가
ALTER TABLE alert_settings ADD COLUMN IF NOT EXISTS order_alert_enabled BOOLEAN DEFAULT TRUE;
