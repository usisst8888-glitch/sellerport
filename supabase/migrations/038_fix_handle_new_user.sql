-- ============================================
-- 036: handle_new_user 함수 수정
-- ============================================
-- 문제: 회원가입 시 "Database error saving new user" 에러 발생
-- 원인: 트리거 함수에서 테이블 INSERT 시 에러 발생 가능성
-- 해결: EXCEPTION 핸들링 추가 및 함수 권한 확인

-- 기존 함수 삭제 후 재생성
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 회원가입 시 자동으로 관련 데이터 생성하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- 프로필 생성 (중복 방지)
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- 잔액 초기화 (무료 슬롯 5개, 알림 10건 제공) - 중복 방지
  INSERT INTO public.user_balance (user_id, slot_balance, alert_balance)
  VALUES (NEW.id, 5, 10)
  ON CONFLICT (user_id) DO NOTHING;

  -- 알림 설정 초기화 - 중복 방지
  INSERT INTO public.alert_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 발생 시 로그만 남기고 계속 진행 (회원가입 차단 방지)
    RAISE WARNING 'handle_new_user error for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 함수 권한 설정 (SECURITY DEFINER로 실행되지만 명시적으로 권한 부여)
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

COMMENT ON FUNCTION public.handle_new_user() IS '회원가입 시 profiles, user_balance, alert_settings 자동 생성 (중복 방지 및 에러 핸들링 포함)';
