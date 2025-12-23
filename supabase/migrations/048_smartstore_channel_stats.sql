-- 스마트스토어 사용자정의채널 통계 테이블
-- 크롬 확장에서 수집한 네이버 스마트스토어 사용자정의채널 데이터 저장

CREATE TABLE IF NOT EXISTS smartstore_channel_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 채널 정보
  device_type TEXT NOT NULL DEFAULT 'all',  -- PC, 모바일, all
  nt_source TEXT NOT NULL,                   -- meta, facebook, google 등
  nt_medium TEXT DEFAULT '',                 -- paid, cpc, organic 등
  nt_detail TEXT DEFAULT '',                 -- 상세 분류

  -- 성과 지표 (마지막클릭 기준)
  visitors INTEGER DEFAULT 0,                -- 고객수
  visits INTEGER DEFAULT 0,                  -- 유입수
  orders INTEGER DEFAULT 0,                  -- 결제수
  revenue DECIMAL(15, 2) DEFAULT 0,          -- 결제금액

  -- 성과 지표 (기여도추정 기준)
  orders_estimated INTEGER DEFAULT 0,        -- 결제수 (기여도추정)
  revenue_estimated DECIMAL(15, 2) DEFAULT 0,-- 결제금액 (기여도추정)

  conversion_rate DECIMAL(5, 2) DEFAULT 0,   -- 유입당 결제율

  -- 날짜 범위
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- 메타데이터
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT DEFAULT 'chrome-extension',    -- 수집 출처
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_smartstore_channel_stats_user_id
  ON smartstore_channel_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_smartstore_channel_stats_dates
  ON smartstore_channel_stats(user_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_smartstore_channel_stats_source
  ON smartstore_channel_stats(user_id, nt_source, nt_medium);

-- RLS 정책
ALTER TABLE smartstore_channel_stats ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회/수정 가능
CREATE POLICY "Users can view own smartstore stats"
  ON smartstore_channel_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own smartstore stats"
  ON smartstore_channel_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own smartstore stats"
  ON smartstore_channel_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own smartstore stats"
  ON smartstore_channel_stats FOR DELETE
  USING (auth.uid() = user_id);

-- Service role은 모든 작업 가능 (API에서 사용)
CREATE POLICY "Service role can do anything on smartstore stats"
  ON smartstore_channel_stats FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 테이블 설명
COMMENT ON TABLE smartstore_channel_stats IS '네이버 스마트스토어 사용자정의채널 통계 (크롬 확장에서 수집)';
COMMENT ON COLUMN smartstore_channel_stats.device_type IS '디바이스 유형 (PC, 모바일)';
COMMENT ON COLUMN smartstore_channel_stats.nt_source IS 'NT 파라미터 source (meta, facebook 등)';
COMMENT ON COLUMN smartstore_channel_stats.nt_medium IS 'NT 파라미터 medium (paid, cpc 등)';
COMMENT ON COLUMN smartstore_channel_stats.orders IS '결제수 (마지막클릭 기준)';
COMMENT ON COLUMN smartstore_channel_stats.orders_estimated IS '결제수 (14일 기여도추정)';
