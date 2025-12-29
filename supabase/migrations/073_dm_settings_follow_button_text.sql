-- 073: instagram_dm_settings에 follow_button_text 컬럼 추가
-- 팔로우 확인 버튼 텍스트를 사용자가 선택할 수 있도록

ALTER TABLE instagram_dm_settings
ADD COLUMN IF NOT EXISTS follow_button_text TEXT DEFAULT '팔로우 했어요!';

COMMENT ON COLUMN instagram_dm_settings.follow_button_text IS '팔로우 확인 버튼 텍스트 (기본값: 팔로우 했어요!)';
