-- 089: tracking_links에 ad_channel_id 컬럼 추가
-- 광고 채널과 추적 링크를 연결

ALTER TABLE tracking_links
ADD COLUMN IF NOT EXISTS ad_channel_id UUID REFERENCES ad_channels(id) ON DELETE SET NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tracking_links_ad_channel_id ON tracking_links(ad_channel_id);

COMMENT ON COLUMN tracking_links.ad_channel_id IS '연결된 광고 채널 ID';
