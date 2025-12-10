-- 사용자 유형 추가 (대행사/셀러 구분)
-- user_type: 'seller' (셀러/판매자), 'agency' (대행사)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'seller';

-- 기존 사용자는 셀러로 설정
UPDATE profiles SET user_type = 'seller' WHERE user_type IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- 코멘트 추가
COMMENT ON COLUMN profiles.user_type IS '사용자 유형: seller(셀러), agency(대행사)';
