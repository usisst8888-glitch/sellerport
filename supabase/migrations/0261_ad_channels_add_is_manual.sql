-- ============================================
-- 026-b: ad_channels 테이블에 is_manual 컬럼 추가
-- ============================================

-- is_manual 컬럼 추가 (이미 존재하면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ad_channels' AND column_name = 'is_manual'
  ) THEN
    ALTER TABLE ad_channels ADD COLUMN is_manual BOOLEAN DEFAULT false;
  END IF;
END $$;

-- 인덱스 추가 (이미 존재하면 무시)
CREATE INDEX IF NOT EXISTS idx_ad_channels_is_manual ON ad_channels(is_manual);

-- 컬럼 설명 추가
COMMENT ON COLUMN ad_channels.is_manual IS '수동 채널 여부 (인플루언서, 체험단 등 API 연동 불가 채널)';
