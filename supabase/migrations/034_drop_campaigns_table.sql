-- campaigns 테이블 삭제
-- 광고 채널 관리는 ad_channels 테이블에서 하므로 campaigns는 불필요

-- 1. campaign_daily_stats 테이블 삭제 (campaigns 참조)
DROP TABLE IF EXISTS campaign_daily_stats CASCADE;

-- 2. campaigns 테이블 삭제
DROP TABLE IF EXISTS campaigns CASCADE;

-- 3. 이전에 추가한 ad_channel 컬럼 관련 인덱스 삭제 (campaigns 테이블이 삭제되면 자동 삭제됨)
