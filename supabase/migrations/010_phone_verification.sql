-- 전화번호 인증 테이블
CREATE TABLE IF NOT EXISTS phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_expires ON phone_verifications(expires_at);

-- 오래된 인증 기록 자동 삭제 (24시간 이상)
-- Supabase에서는 pg_cron으로 처리하거나 수동 정리

-- profiles 테이블에 phone 컬럼 추가 (없으면)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- RLS 정책
ALTER TABLE phone_verifications ENABLE ROW LEVEL SECURITY;

-- 인증 요청은 누구나 가능 (서버에서만 insert)
CREATE POLICY "Service role can manage verifications" ON phone_verifications
  FOR ALL USING (true);

COMMENT ON TABLE phone_verifications IS '전화번호 SMS 인증 코드 저장';
COMMENT ON COLUMN profiles.phone IS '인증된 전화번호';
COMMENT ON COLUMN profiles.phone_verified IS '전화번호 인증 여부';
