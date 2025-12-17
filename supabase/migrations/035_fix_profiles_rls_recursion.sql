-- ============================================
-- 035: profiles RLS 무한 재귀 문제 수정
-- ============================================
-- 문제: profiles 테이블의 RLS 정책에서 profiles 테이블을 다시 조회하면서 무한 재귀 발생
-- 해결: auth.users의 raw_user_meta_data를 사용하여 user_type 확인

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 새로운 SELECT 정책: auth.users 메타데이터 사용 (무한 재귀 방지)
CREATE POLICY "Users can view profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR
    (auth.jwt() ->> 'user_type') IN ('admin', 'manager')
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data ->> 'user_type' IN ('admin', 'manager')
      )
    )
  );

-- 새로운 UPDATE 정책
CREATE POLICY "Users can update profiles"
  ON profiles FOR UPDATE
  USING (
    auth.uid() = id
    OR
    (auth.jwt() ->> 'user_type') IN ('admin', 'manager')
    OR
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.raw_user_meta_data ->> 'user_type' IN ('admin', 'manager')
      )
    )
  );

-- INSERT 정책 (자기 자신만)
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "Users can view profiles" ON profiles IS 'Admin/Manager는 모든 프로필 조회 가능 (auth.users 메타데이터 사용으로 무한 재귀 방지)';
COMMENT ON POLICY "Users can update profiles" ON profiles IS 'Admin/Manager는 모든 프로필 수정 가능';
