-- 사이트 방문자 로그 테이블
-- 랜딩페이지 방문자 (비회원 포함) 추적

CREATE TABLE IF NOT EXISTS site_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 방문 정보
  page_path TEXT NOT NULL DEFAULT '/',

  -- 유입 정보 (UTM 파라미터)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- 레퍼럴 정보
  referer TEXT,
  referer_domain TEXT,

  -- 기기 정보
  user_agent TEXT,
  device_type TEXT, -- mobile, tablet, desktop
  browser TEXT,
  os TEXT,

  -- 네트워크 정보
  ip_address TEXT,
  country TEXT,
  city TEXT,

  -- 세션 정보
  session_id TEXT,
  visitor_id TEXT, -- 쿠키 기반 고유 방문자 ID

  -- 사용자 정보 (로그인한 경우)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON site_visits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_page_path ON site_visits(page_path);
CREATE INDEX IF NOT EXISTS idx_site_visits_utm_source ON site_visits(utm_source);
CREATE INDEX IF NOT EXISTS idx_site_visits_referer_domain ON site_visits(referer_domain);
CREATE INDEX IF NOT EXISTS idx_site_visits_visitor_id ON site_visits(visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_session_id ON site_visits(session_id);

-- RLS 정책 (누구나 insert 가능, 조회는 admin만)
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;

-- 누구나 방문 로그 기록 가능 (비회원 포함)
CREATE POLICY "Anyone can insert site visits"
  ON site_visits FOR INSERT
  WITH CHECK (true);

-- Admin/Manager만 조회 가능
CREATE POLICY "Admin can view all site visits"
  ON site_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.user_type IN ('admin', 'manager')
    )
  );

-- 테이블 설명 추가
COMMENT ON TABLE site_visits IS '사이트 방문자 로그 - 랜딩페이지 방문자 추적 (비회원 포함)';
COMMENT ON COLUMN site_visits.page_path IS '방문한 페이지 경로';
COMMENT ON COLUMN site_visits.utm_source IS 'UTM 소스 (google, facebook, naver 등)';
COMMENT ON COLUMN site_visits.utm_medium IS 'UTM 매체 (cpc, banner, email 등)';
COMMENT ON COLUMN site_visits.utm_campaign IS 'UTM 캠페인명';
COMMENT ON COLUMN site_visits.referer IS '유입 URL 전체';
COMMENT ON COLUMN site_visits.referer_domain IS '유입 도메인 (예: google.com)';
COMMENT ON COLUMN site_visits.visitor_id IS '쿠키 기반 고유 방문자 ID';
COMMENT ON COLUMN site_visits.session_id IS '세션 ID';
