-- Instagram DM 자동발송 설정 테이블
-- 게시물별로 DM 자동발송 설정을 저장

-- 1. instagram_dm_settings 테이블 생성
CREATE TABLE IF NOT EXISTS instagram_dm_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad_channel_id UUID NOT NULL REFERENCES ad_channels(id) ON DELETE CASCADE,
  tracking_link_id TEXT REFERENCES tracking_links(id) ON DELETE SET NULL,

  -- Instagram 미디어(게시물) 정보
  instagram_media_id TEXT NOT NULL, -- Instagram 게시물 ID
  instagram_media_url TEXT, -- 게시물 URL
  instagram_media_type TEXT, -- IMAGE, VIDEO, CAROUSEL_ALBUM
  instagram_caption TEXT, -- 게시물 캡션

  -- DM 설정
  trigger_keywords TEXT[] DEFAULT ARRAY['링크', '구매', '정보', '가격'], -- DM 발송 트리거 키워드
  dm_message TEXT NOT NULL, -- DM 메시지 ({{link}} 플레이스홀더 사용)
  include_follow_cta BOOLEAN DEFAULT false, -- 팔로우 유도 메시지 포함 여부
  follow_cta_message TEXT, -- 팔로우 유도 메시지

  -- 상태
  is_active BOOLEAN DEFAULT true,

  -- 통계
  total_dms_sent INTEGER DEFAULT 0,
  last_dm_sent_at TIMESTAMPTZ,

  -- 타임스탬프
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. instagram_dm_logs 테이블 생성 (DM 발송 로그)
CREATE TABLE IF NOT EXISTS instagram_dm_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dm_setting_id UUID NOT NULL REFERENCES instagram_dm_settings(id) ON DELETE CASCADE,
  tracking_link_id TEXT REFERENCES tracking_links(id) ON DELETE SET NULL,

  -- 수신자 정보
  recipient_ig_user_id TEXT NOT NULL, -- Instagram 사용자 ID
  recipient_username TEXT, -- Instagram 사용자명

  -- 댓글 정보 (트리거)
  comment_id TEXT,
  comment_text TEXT,

  -- DM 정보
  dm_message TEXT NOT NULL,
  dm_message_id TEXT, -- Instagram에서 반환한 메시지 ID

  -- 상태
  status TEXT DEFAULT 'sent', -- sent, failed, blocked
  error_message TEXT,

  -- 타임스탬프
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- 전환 추적
  is_converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  order_id TEXT
);

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_instagram_dm_settings_user_id ON instagram_dm_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_dm_settings_media_id ON instagram_dm_settings(instagram_media_id);
CREATE INDEX IF NOT EXISTS idx_instagram_dm_settings_tracking_link ON instagram_dm_settings(tracking_link_id);
CREATE INDEX IF NOT EXISTS idx_instagram_dm_logs_setting_id ON instagram_dm_logs(dm_setting_id);
CREATE INDEX IF NOT EXISTS idx_instagram_dm_logs_recipient ON instagram_dm_logs(recipient_ig_user_id);

-- 4. RLS 정책
ALTER TABLE instagram_dm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_dm_logs ENABLE ROW LEVEL SECURITY;

-- instagram_dm_settings 정책
CREATE POLICY "Users can view own dm settings" ON instagram_dm_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dm settings" ON instagram_dm_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own dm settings" ON instagram_dm_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own dm settings" ON instagram_dm_settings
  FOR DELETE USING (auth.uid() = user_id);

-- instagram_dm_logs 정책 (dm_settings를 통해 user_id 확인)
CREATE POLICY "Users can view own dm logs" ON instagram_dm_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM instagram_dm_settings
      WHERE instagram_dm_settings.id = instagram_dm_logs.dm_setting_id
      AND instagram_dm_settings.user_id = auth.uid()
    )
  );

-- Service role은 모든 작업 가능 (Webhook용)
CREATE POLICY "Service role can manage all dm settings" ON instagram_dm_settings
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can manage all dm logs" ON instagram_dm_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. 코멘트
COMMENT ON TABLE instagram_dm_settings IS 'Instagram DM 자동발송 설정 - 게시물별로 키워드 댓글 시 DM 발송';
COMMENT ON TABLE instagram_dm_logs IS 'Instagram DM 발송 로그 - 중복 방지 및 전환 추적용';
COMMENT ON COLUMN instagram_dm_settings.trigger_keywords IS '댓글에 포함되면 DM을 발송할 키워드 목록';
COMMENT ON COLUMN instagram_dm_settings.dm_message IS 'DM 메시지 템플릿. {{link}}는 추적 링크로 대체됨';
