-- ============================================
-- 022: profiles 테이블에 display_name 컬럼 추가
-- ============================================

-- display_name 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 코멘트 추가
COMMENT ON COLUMN profiles.display_name IS '사용자 표시 이름 (닉네임)';
