-- ============================================
-- 039: profiles 테이블에 marketing_agreed 컬럼 추가
-- ============================================

-- marketing_agreed 컬럼 추가 (마케팅 정보 수신 동의 여부)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_agreed BOOLEAN DEFAULT FALSE;

-- 코멘트
COMMENT ON COLUMN profiles.marketing_agreed IS '마케팅 정보 수신 동의 여부';
