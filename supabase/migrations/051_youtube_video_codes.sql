-- 유튜브 쇼츠 영상번호 테이블
-- 쇼츠는 외부 링크 클릭이 막혀서 영상번호 시스템으로 전환 추적

CREATE TABLE IF NOT EXISTS youtube_video_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 영상번호 (A001~Z999)
  video_code VARCHAR(4) NOT NULL,

  -- 연결된 추적 링크
  tracking_link_id VARCHAR(20) REFERENCES tracking_links(id) ON DELETE SET NULL,

  -- 영상 정보
  video_title TEXT, -- 영상 제목 (구분용)
  video_url TEXT, -- 유튜브 쇼츠 URL (선택)
  thumbnail_url TEXT, -- 썸네일 URL (선택)

  -- 상품 정보
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  target_url TEXT NOT NULL, -- 목적지 URL

  -- 통계
  searches INTEGER DEFAULT 0, -- 검색 횟수
  clicks INTEGER DEFAULT 0, -- 클릭 횟수
  conversions INTEGER DEFAULT 0, -- 전환 수
  revenue DECIMAL(15, 2) DEFAULT 0, -- 매출

  -- 상태
  status VARCHAR(20) DEFAULT 'active', -- active, inactive

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 유저별 영상번호 유니크
  UNIQUE(user_id, video_code)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_youtube_video_codes_user_id ON youtube_video_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_video_codes_video_code ON youtube_video_codes(video_code);
CREATE INDEX IF NOT EXISTS idx_youtube_video_codes_tracking_link ON youtube_video_codes(tracking_link_id);

-- RLS 정책
ALTER TABLE youtube_video_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own video codes"
  ON youtube_video_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video codes"
  ON youtube_video_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video codes"
  ON youtube_video_codes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own video codes"
  ON youtube_video_codes FOR DELETE
  USING (auth.uid() = user_id);

-- 익명 사용자도 영상번호로 검색 가능 (검색 페이지용)
CREATE POLICY "Anyone can search video codes"
  ON youtube_video_codes FOR SELECT
  USING (status = 'active');

-- 테이블 설명
COMMENT ON TABLE youtube_video_codes IS '유튜브 쇼츠 영상번호 - 쇼츠 전환 추적용';
COMMENT ON COLUMN youtube_video_codes.video_code IS '영상번호 (A001~Z999 형식)';
COMMENT ON COLUMN youtube_video_codes.searches IS '영상번호 검색 횟수';
