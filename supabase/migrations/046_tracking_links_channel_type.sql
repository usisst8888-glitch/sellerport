-- tracking_links 테이블에 channel_type, post_name 컬럼 추가
-- 채널별 게시물 단위로 전환 추적 가능하도록

-- 채널 타입 컬럼 추가
-- instagram, youtube, tiktok, naver_blog, influencer 등
ALTER TABLE tracking_links
ADD COLUMN IF NOT EXISTS channel_type TEXT;

-- 게시물 이름 컬럼 추가
-- 예: "12월 신상 리뷰 영상", "겨울 코디 릴스"
ALTER TABLE tracking_links
ADD COLUMN IF NOT EXISTS post_name TEXT;

-- 인덱스 추가 (채널별 성과 조회용)
CREATE INDEX IF NOT EXISTS idx_tracking_links_channel_type
ON tracking_links(channel_type);

-- 코멘트 추가
COMMENT ON COLUMN tracking_links.channel_type IS '채널 타입 (instagram, youtube, tiktok, naver_blog, influencer 등)';
COMMENT ON COLUMN tracking_links.post_name IS '게시물 이름 (예: 12월 신상 리뷰 영상)';
