-- 기존 YouTube 영상번호 데이터에 utm_source 설정
-- channel_type이 'youtube'인데 utm_source가 없는 레코드 업데이트

UPDATE tracking_links
SET
  utm_source = 'youtube',
  utm_medium = COALESCE(utm_medium, 'shorts'),
  utm_campaign = COALESCE(utm_campaign, 'video_' || LOWER(video_code))
WHERE channel_type = 'youtube'
  AND video_code IS NOT NULL
  AND (utm_source IS NULL OR utm_source = '');
