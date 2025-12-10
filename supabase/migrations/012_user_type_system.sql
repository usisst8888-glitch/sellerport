-- 회원 유형 시스템 확장
-- user_type: 'seller' (일반 셀러), 'agency' (대행사), 'admin' (셀러포트 관리자), 'manager' (셀러포트 매니저)
-- approval_status: 'pending' (대기), 'approved' (승인), 'rejected' (거절)

-- user_type 업데이트 (기존 seller/agency에 admin, manager 추가)
-- 기존 컬럼 타입은 TEXT이므로 값만 추가하면 됨

-- 사업자등록증 URL 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_license_url TEXT;

-- 승인 상태 컬럼 추가 (대행사용)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'approved';

-- 승인/거절 일시
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- 승인/거절한 관리자 ID
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);

-- 거절 사유
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 기존 셀러는 자동 승인
UPDATE profiles SET approval_status = 'approved' WHERE user_type = 'seller' AND approval_status IS NULL;

-- 기존 대행사도 일단 승인 (이미 가입된 경우)
UPDATE profiles SET approval_status = 'approved' WHERE user_type = 'agency' AND approval_status IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_profiles_approval_status ON profiles(approval_status);

-- 코멘트 추가
COMMENT ON COLUMN profiles.user_type IS '사용자 유형: seller(일반 셀러), agency(대행사), admin(관리자), manager(매니저)';
COMMENT ON COLUMN profiles.business_license_url IS '사업자등록증 이미지 URL';
COMMENT ON COLUMN profiles.approval_status IS '승인 상태: pending(대기), approved(승인), rejected(거절)';
COMMENT ON COLUMN profiles.approved_at IS '승인/거절 일시';
COMMENT ON COLUMN profiles.approved_by IS '승인/거절한 관리자 ID';
COMMENT ON COLUMN profiles.rejection_reason IS '거절 사유';
