-- 플랫폼 연동 테이블
CREATE TABLE IF NOT EXISTS platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform_type TEXT NOT NULL, -- 'naver', 'cafe24', 'imweb' 등
  platform_name TEXT NOT NULL, -- 사용자가 지정한 이름 (예: "내 스마트스토어")

  -- 네이버 커머스 API 인증 정보
  application_id TEXT, -- 애플리케이션 ID
  application_secret TEXT, -- 애플리케이션 시크릿

  -- 일반 API Key 인증 (아임웹 등)
  api_key TEXT,
  api_secret TEXT,

  -- 상태 정보
  status TEXT DEFAULT 'pending', -- 'pending', 'connected', 'error', 'expired'
  last_sync_at TIMESTAMPTZ,
  error_message TEXT,

  -- 메타데이터
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 플랫폼만 볼 수 있음
CREATE POLICY "Users can view own platforms"
  ON platforms FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신의 플랫폼만 생성할 수 있음
CREATE POLICY "Users can create own platforms"
  ON platforms FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 플랫폼만 수정할 수 있음
CREATE POLICY "Users can update own platforms"
  ON platforms FOR UPDATE
  USING (auth.uid() = user_id);

-- 사용자는 자신의 플랫폼만 삭제할 수 있음
CREATE POLICY "Users can delete own platforms"
  ON platforms FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_platforms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platforms_updated_at
  BEFORE UPDATE ON platforms
  FOR EACH ROW
  EXECUTE FUNCTION update_platforms_updated_at();

-- 인덱스
CREATE INDEX platforms_user_id_idx ON platforms(user_id);
CREATE INDEX platforms_platform_type_idx ON platforms(platform_type);
CREATE INDEX platforms_status_idx ON platforms(status);
