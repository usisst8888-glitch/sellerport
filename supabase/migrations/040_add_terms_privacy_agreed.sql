-- ============================================
-- 040: profiles 테이블에 약관 동의 컬럼 추가
-- ============================================

-- 이용약관 동의 여부 및 시점
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMPTZ;

-- 개인정보 수집·이용 동의 여부 및 시점
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_agreed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_agreed_at TIMESTAMPTZ;

-- 마케팅 동의 시점 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS marketing_agreed_at TIMESTAMPTZ;

-- 코멘트
COMMENT ON COLUMN profiles.terms_agreed IS '이용약관 동의 여부';
COMMENT ON COLUMN profiles.terms_agreed_at IS '이용약관 동의 시점';
COMMENT ON COLUMN profiles.privacy_agreed IS '개인정보 수집·이용 동의 여부';
COMMENT ON COLUMN profiles.privacy_agreed_at IS '개인정보 수집·이용 동의 시점';
COMMENT ON COLUMN profiles.marketing_agreed_at IS '마케팅 정보 수신 동의 시점';
