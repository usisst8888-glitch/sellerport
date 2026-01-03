-- 091: 기존 DM 설정의 require_follow 값 확인 및 수정
-- 잘못 저장된 false 값을 true로 수정

-- 1. 현재 상태 확인 (로그용)
DO $$
DECLARE
  total_count INTEGER;
  false_count INTEGER;
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_count FROM instagram_dm_settings;
  SELECT COUNT(*) INTO false_count FROM instagram_dm_settings WHERE require_follow = false;
  SELECT COUNT(*) INTO null_count FROM instagram_dm_settings WHERE require_follow IS NULL;

  RAISE NOTICE 'Total DM settings: %', total_count;
  RAISE NOTICE 'Settings with require_follow=false: %', false_count;
  RAISE NOTICE 'Settings with require_follow=NULL: %', null_count;
END $$;

-- 2. NULL 값을 true로 업데이트
UPDATE instagram_dm_settings
SET require_follow = true
WHERE require_follow IS NULL;

-- 3. 안전 장치: 컬럼에 NOT NULL 제약 조건 추가
ALTER TABLE instagram_dm_settings
ALTER COLUMN require_follow SET NOT NULL;

-- 4. 기본값도 명시적으로 설정
ALTER TABLE instagram_dm_settings
ALTER COLUMN require_follow SET DEFAULT true;

COMMENT ON COLUMN instagram_dm_settings.require_follow IS '팔로워 체크 필요 여부 (false: 모두에게 발송, true: 팔로워만 발송) - DEFAULT true';
