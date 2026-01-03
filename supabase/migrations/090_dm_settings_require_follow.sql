-- 090: instagram_dm_settings에 require_follow 컬럼 추가
-- 팔로워 체크 필요 여부 설정
-- false: 모든 댓글 작성자에게 바로 링크 발송 (Private Reply)
-- true: 팔로우 요청 메시지 먼저 발송 → 버튼 클릭 시 팔로워 체크 후 링크 발송

ALTER TABLE instagram_dm_settings
ADD COLUMN IF NOT EXISTS require_follow BOOLEAN DEFAULT false;

COMMENT ON COLUMN instagram_dm_settings.require_follow IS '팔로워 체크 필요 여부 (false: 모두에게 발송, true: 팔로워만 발송)';
