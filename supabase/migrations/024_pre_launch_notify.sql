-- ============================================
-- 024: profiles 테이블에 사전예약 알림 필드 추가
-- ============================================

-- 정식 오픈 알림 수신 동의 필드 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pre_launch_notify BOOLEAN DEFAULT false;

COMMENT ON COLUMN profiles.pre_launch_notify IS '정식 오픈 시 알림 수신 동의 여부';
