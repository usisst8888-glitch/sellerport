-- campaigns 테이블 platform 컬럼을 ad_channel로 변경
-- '광고 플랫폼' → '광고 채널'로 용어 통일

-- 1. 컬럼명 변경
ALTER TABLE campaigns RENAME COLUMN platform TO ad_channel;

-- 2. 인덱스 재생성
DROP INDEX IF EXISTS campaigns_platform_idx;
CREATE INDEX IF NOT EXISTS campaigns_ad_channel_idx ON campaigns(ad_channel);

-- 3. 컬럼 설명 업데이트
COMMENT ON COLUMN campaigns.ad_channel IS '광고 채널 (네이버, 메타, 구글, 쿠팡, 카카오, 틱톡 등)';
