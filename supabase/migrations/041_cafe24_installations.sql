-- 카페24 앱스토어 설치 정보 테이블
-- 앱스토어에서 앱 설치 시 토큰 정보를 저장 (회원가입 전)

CREATE TABLE IF NOT EXISTS cafe24_installations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 카페24 쇼핑몰 정보
  mall_id TEXT NOT NULL UNIQUE, -- 쇼핑몰 ID (예: myshop)
  shop_no TEXT DEFAULT '1', -- 샵 번호
  store_name TEXT, -- 쇼핑몰 이름

  -- OAuth 토큰
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  refresh_token_expires_at TIMESTAMPTZ,
  scopes TEXT[], -- 권한 범위

  -- 연결된 셀러포트 사용자 (회원가입 후 연결)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- 상태
  status TEXT DEFAULT 'installed' CHECK (status IN ('installed', 'connected', 'uninstalled')),
  -- installed: 앱 설치됨 (회원 미연결)
  -- connected: 셀러포트 회원과 연결됨
  -- uninstalled: 앱 삭제됨

  -- 타임스탬프
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  connected_at TIMESTAMPTZ, -- 회원 연결 시점
  uninstalled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_cafe24_installations_mall_id ON cafe24_installations(mall_id);
CREATE INDEX IF NOT EXISTS idx_cafe24_installations_user_id ON cafe24_installations(user_id);
CREATE INDEX IF NOT EXISTS idx_cafe24_installations_status ON cafe24_installations(status);

-- RLS 정책
ALTER TABLE cafe24_installations ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신과 연결된 설치 정보만 조회 가능
CREATE POLICY "Users can view their connected installations"
  ON cafe24_installations FOR SELECT
  USING (auth.uid() = user_id);

-- 사용자는 자신과 연결된 설치 정보만 수정 가능
CREATE POLICY "Users can update their connected installations"
  ON cafe24_installations FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role은 모든 작업 가능 (API에서 사용)
-- Note: Service role은 RLS를 우회하므로 별도 정책 불필요

-- 테이블 설명
COMMENT ON TABLE cafe24_installations IS '카페24 앱스토어 설치 정보 (회원가입 전 토큰 저장용)';
COMMENT ON COLUMN cafe24_installations.mall_id IS '카페24 쇼핑몰 ID';
COMMENT ON COLUMN cafe24_installations.shop_no IS '카페24 샵 번호 (멀티쇼핑몰)';
COMMENT ON COLUMN cafe24_installations.store_name IS '쇼핑몰 이름';
COMMENT ON COLUMN cafe24_installations.user_id IS '연결된 셀러포트 사용자 ID';
COMMENT ON COLUMN cafe24_installations.status IS '설치 상태: installed(설치됨), connected(회원연결), uninstalled(삭제됨)';
