-- 스토어 검색 페이지 커스터마이징 설정
CREATE TABLE IF NOT EXISTS store_customization (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  channel_type text NOT NULL CHECK (channel_type IN ('youtube', 'tiktok')),
  store_slug text NOT NULL,

  -- 배경 설정
  background_type text DEFAULT 'gradient' CHECK (background_type IN ('gradient', 'solid', 'image')),
  background_gradient text DEFAULT 'from-slate-900 via-slate-800 to-slate-900', -- Tailwind gradient classes
  background_color text, -- solid color hex
  background_image_url text, -- 배경 이미지 URL

  -- 상단 로고/이미지
  header_image_url text,
  header_image_size text DEFAULT 'medium' CHECK (header_image_size IN ('small', 'medium', 'large')),

  -- 텍스트 설정
  title_text text, -- 커스텀 타이틀 (없으면 기본값 사용)
  subtitle_text text, -- 커스텀 서브타이틀

  -- 버튼 색상
  button_gradient text DEFAULT 'from-red-500 to-orange-400', -- 유튜브 기본값

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id, channel_type, store_slug)
);

-- RLS 활성화
ALTER TABLE store_customization ENABLE ROW LEVEL SECURITY;

-- 정책: 본인 데이터만 CRUD
CREATE POLICY "Users can manage their own store customization"
  ON store_customization FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 공개 읽기 (검색 페이지에서 조회)
CREATE POLICY "Anyone can read store customization"
  ON store_customization FOR SELECT
  USING (true);

-- updated_at 자동 업데이트 (함수 없으면 생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_store_customization_updated_at
  BEFORE UPDATE ON store_customization
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
