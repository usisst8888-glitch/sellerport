-- ============================================
-- 014: user_settings 테이블 생성
-- ============================================

-- user_settings 테이블 생성 (없는 경우)
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  meta_pixel_id TEXT,
  meta_access_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_settings RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can view own settings'
  ) THEN
    CREATE POLICY "Users can view own settings"
      ON user_settings FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can insert own settings'
  ) THEN
    CREATE POLICY "Users can insert own settings"
      ON user_settings FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can update own settings'
  ) THEN
    CREATE POLICY "Users can update own settings"
      ON user_settings FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;
