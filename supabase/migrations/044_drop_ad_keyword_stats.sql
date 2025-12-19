-- 키워드 통계 테이블 삭제 (ad_spend_daily로 통합)
DROP TABLE IF EXISTS ad_keyword_stats CASCADE;

-- ad_spend_daily 테이블에 키워드/광고소재 필드 추가
ALTER TABLE ad_spend_daily ADD COLUMN IF NOT EXISTS adgroup_id TEXT;
ALTER TABLE ad_spend_daily ADD COLUMN IF NOT EXISTS adgroup_name TEXT;
ALTER TABLE ad_spend_daily ADD COLUMN IF NOT EXISTS keyword_id TEXT;
ALTER TABLE ad_spend_daily ADD COLUMN IF NOT EXISTS keyword TEXT;
ALTER TABLE ad_spend_daily ADD COLUMN IF NOT EXISTS ad_id TEXT;
ALTER TABLE ad_spend_daily ADD COLUMN IF NOT EXISTS ad_name TEXT;
ALTER TABLE ad_spend_daily ADD COLUMN IF NOT EXISTS avg_position DECIMAL(5, 2);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_ad_spend_daily_keyword ON ad_spend_daily(keyword_id) WHERE keyword_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ad_spend_daily_ad ON ad_spend_daily(ad_id) WHERE ad_id IS NOT NULL;

-- 유니크 제약조건 수정 (키워드/광고 레벨까지 포함)
-- 기존 제약조건 삭제 후 새로 생성
ALTER TABLE ad_spend_daily DROP CONSTRAINT IF EXISTS ad_spend_daily_ad_channel_id_campaign_id_date_key;
ALTER TABLE ad_spend_daily ADD CONSTRAINT ad_spend_daily_unique
  UNIQUE NULLS NOT DISTINCT (ad_channel_id, campaign_id, adset_id, keyword_id, ad_id, date);

COMMENT ON COLUMN ad_spend_daily.adgroup_id IS '광고그룹 ID (검색광고)';
COMMENT ON COLUMN ad_spend_daily.keyword_id IS '키워드 ID (검색광고)';
COMMENT ON COLUMN ad_spend_daily.keyword IS '검색 키워드';
COMMENT ON COLUMN ad_spend_daily.ad_id IS '광고소재 ID (소셜광고)';
COMMENT ON COLUMN ad_spend_daily.ad_name IS '광고소재 이름';
COMMENT ON COLUMN ad_spend_daily.avg_position IS '평균 게재순위 (검색광고)';
