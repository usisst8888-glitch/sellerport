-- ============================================
-- 023: Admin/Manager가 모든 프로필 조회 가능하도록 RLS 정책 추가
-- ============================================

-- 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 새로운 SELECT 정책: 자신의 프로필 또는 admin/manager인 경우 모든 프로필 조회 가능
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'manager')
    )
  );

-- Admin/Manager가 다른 사용자의 프로필을 업데이트할 수 있도록 정책 추가
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can update profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND user_type IN ('admin', 'manager')
    )
  );

COMMENT ON POLICY "Users can view profiles" ON profiles IS 'Admin/Manager는 모든 프로필 조회 가능, 일반 사용자는 자신만 조회 가능';
COMMENT ON POLICY "Users can update profiles" ON profiles IS 'Admin/Manager는 모든 프로필 수정 가능, 일반 사용자는 자신만 수정 가능';
