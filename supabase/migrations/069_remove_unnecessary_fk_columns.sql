-- ============================================
-- 069: 불필요한 연동 FK 컬럼 삭제
-- ============================================
-- 각 테이블을 독립적으로 관리하도록 my_site_id 등 불필요한 FK 삭제

-- 1. instagram_dm_settings에서 deprecated된 ad_channel_id 컬럼 삭제
ALTER TABLE instagram_dm_settings
DROP COLUMN IF EXISTS ad_channel_id;

-- 2. ad_channels에서 my_site_id 컬럼 삭제
-- 광고 채널은 내 사이트와 독립적으로 관리됨
DROP INDEX IF EXISTS idx_ad_channels_my_site_id;

ALTER TABLE ad_channels
DROP COLUMN IF EXISTS my_site_id;

-- 3. store_customization에서 my_site_id 컬럼 삭제
-- 셀러트리는 내 사이트와 독립적으로 관리됨
DROP INDEX IF EXISTS idx_store_customization_my_site_id;

ALTER TABLE store_customization
DROP COLUMN IF EXISTS my_site_id;

-- 4. instagram_accounts에서 my_site_id 컬럼 삭제
-- 인스타그램 계정은 내 사이트와 독립적으로 관리됨
DROP INDEX IF EXISTS idx_instagram_accounts_my_site_id;

ALTER TABLE instagram_accounts
DROP COLUMN IF EXISTS my_site_id;

-- 5. 테이블 설명 업데이트
COMMENT ON TABLE ad_channels IS '광고 채널 관리 - Meta, 네이버 블로그, TikTok, YouTube 등 광고 집행 채널';
COMMENT ON TABLE store_customization IS '셀러트리 커스터마이징 - 영상번호 검색 링크 페이지 설정';
COMMENT ON TABLE instagram_accounts IS 'Instagram 계정 연동 - DM 자동화 기능용 계정 관리';
COMMENT ON TABLE instagram_dm_settings IS 'Instagram DM 자동발송 설정 - 댓글 키워드 감지 시 DM 발송';
