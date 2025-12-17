-- ============================================
-- 036: profiles RLS - SECURITY DEFINER 함수 사용
-- ============================================
-- auth.users 메타데이터가 없을 수 있으므로 SECURITY DEFINER 함수로 user_type 확인

-- 사용자가 admin/manager인지 확인하는 함수 (RLS 우회)
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN AS $$
DECLARE
  user_type_val TEXT;
BEGIN
  SELECT user_type INTO user_type_val
  FROM profiles
  WHERE id = auth.uid();

  RETURN user_type_val IN ('admin', 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;

-- 새로운 SELECT 정책: SECURITY DEFINER 함수 사용
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR
    is_admin_or_manager()
  );

-- 새로운 UPDATE 정책
CREATE POLICY "Users can update profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR
    is_admin_or_manager()
  );

COMMENT ON FUNCTION is_admin_or_manager() IS 'RLS 정책에서 사용 - 현재 사용자가 admin 또는 manager인지 확인 (무한 재귀 방지)';
