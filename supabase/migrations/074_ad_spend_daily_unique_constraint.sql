-- ============================================
-- 074: ad_spend_daily 테이블에 unique constraint 추가
-- Meta 광고비 동기화 upsert를 위한 제약조건
-- ============================================

-- 기존 중복 데이터가 있을 수 있으므로 먼저 정리
DELETE FROM ad_spend_daily a
USING ad_spend_daily b
WHERE a.id > b.id
  AND a.ad_channel_id = b.ad_channel_id
  AND a.campaign_id = b.campaign_id
  AND a.date = b.date;

-- unique constraint 추가 (없는 경우에만)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ad_spend_daily_channel_campaign_date_unique'
  ) THEN
    ALTER TABLE ad_spend_daily
    ADD CONSTRAINT ad_spend_daily_channel_campaign_date_unique
    UNIQUE (ad_channel_id, campaign_id, date);
  END IF;
END $$;

-- 인덱스도 확인 (있으면 생략)
CREATE INDEX IF NOT EXISTS idx_ad_spend_daily_upsert ON ad_spend_daily(ad_channel_id, campaign_id, date);
