-- 알림톡/카카오 알림 관련 테이블 및 컬럼 제거
-- MVP 단순화를 위해 알림톡 기능 전체 제거

-- alerts 테이블 삭제
DROP TABLE IF EXISTS alerts CASCADE;

-- alert_settings 테이블 삭제
DROP TABLE IF EXISTS alert_settings CASCADE;

-- aligo_settings 테이블 삭제
DROP TABLE IF EXISTS aligo_settings CASCADE;

-- profiles 테이블에서 알림톡 관련 컬럼 제거 (있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'profiles' AND column_name = 'kakao_phone') THEN
    ALTER TABLE profiles DROP COLUMN kakao_phone;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'profiles' AND column_name = 'kakao_enabled') THEN
    ALTER TABLE profiles DROP COLUMN kakao_enabled;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'profiles' AND column_name = 'alert_balance') THEN
    ALTER TABLE profiles DROP COLUMN alert_balance;
  END IF;
END $$;

-- billing 테이블에서 알림톡 관련 컬럼 제거 (있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'billing' AND column_name = 'alert_credits') THEN
    ALTER TABLE billing DROP COLUMN alert_credits;
  END IF;
END $$;

-- user_balance 테이블에서 alert_balance 컬럼 제거 (있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'user_balance' AND column_name = 'alert_balance') THEN
    ALTER TABLE user_balance DROP COLUMN alert_balance;
  END IF;
END $$;
