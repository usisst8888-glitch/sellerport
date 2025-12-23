-- Instagram DM 설정에 팔로우 요청 메시지 컬럼 추가
-- 댓글 작성자에게 보내는 첫 번째 Private Reply 메시지 (팔로우 요청)

-- 1. follow_request_message 컬럼 추가
ALTER TABLE instagram_dm_settings
ADD COLUMN IF NOT EXISTS follow_request_message TEXT;

-- 2. 기존 데이터에 기본값 설정
UPDATE instagram_dm_settings
SET follow_request_message = '안녕하세요! 댓글 감사합니다 🙏

링크를 받으시려면 팔로우 후 아래 버튼을 눌러주세요!'
WHERE follow_request_message IS NULL;

-- 3. 컬럼 설명 추가
COMMENT ON COLUMN instagram_dm_settings.follow_request_message IS '팔로우 요청 메시지 - 댓글 작성자에게 보내는 첫 번째 Private Reply';
COMMENT ON COLUMN instagram_dm_settings.dm_message IS '팔로워용 DM 메시지 - 팔로우 확인 후 발송. {{link}}는 추적 링크로 대체됨';

-- 4. instagram_dm_logs에 link_sent_at 컬럼 추가 (팔로우 확인 후 링크 발송 시간)
ALTER TABLE instagram_dm_logs
ADD COLUMN IF NOT EXISTS link_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN instagram_dm_logs.link_sent_at IS '팔로우 확인 후 링크가 발송된 시간';
