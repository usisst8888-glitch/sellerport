-- 에이블리 셀러 정보 테이블
-- 크롬 확장에서 수집한 에이블리 판매자 정보 저장

CREATE TABLE IF NOT EXISTS ably_sellers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 셀러 정보
  company_name TEXT NOT NULL,              -- 상호
  representative TEXT,                      -- 대표자
  address TEXT,                             -- 주소
  business_number TEXT,                     -- 사업자등록번호
  ecommerce_number TEXT,                    -- 통신판매업신고번호
  email TEXT,                               -- 이메일
  phone TEXT,                               -- 전화번호

  -- 수집 정보
  source_url TEXT,                          -- 수집한 상품 페이지 URL
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 중복 방지 (같은 사용자가 같은 셀러 저장 방지)
  UNIQUE(user_id, company_name, business_number)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ably_sellers_user_id ON ably_sellers(user_id);
CREATE INDEX IF NOT EXISTS idx_ably_sellers_company ON ably_sellers(user_id, company_name);

-- RLS 활성화
ALTER TABLE ably_sellers ENABLE ROW LEVEL SECURITY;

-- RLS 정책
CREATE POLICY "Users can view own ably sellers" ON ably_sellers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ably sellers" ON ably_sellers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ably sellers" ON ably_sellers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ably sellers" ON ably_sellers FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Service role full access on ably sellers" ON ably_sellers FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 테이블 설명
COMMENT ON TABLE ably_sellers IS '에이블리 셀러 정보 (크롬 확장에서 수집)';
