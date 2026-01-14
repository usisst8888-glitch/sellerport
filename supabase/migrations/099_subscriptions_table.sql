-- ============================================
-- 099: 구독 시스템 마이그레이션
-- 기존 plan 필드 기반에서 subscriptions 테이블 기반으로 전환
-- ============================================

-- 1. subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- 구독 정보
  plan_type TEXT DEFAULT 'premium' CHECK (plan_type IN ('premium')), -- 단일 플랜
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),

  -- 금액 정보
  amount INT DEFAULT 22900, -- 월 22,900원
  currency TEXT DEFAULT 'KRW',

  -- 기간 정보
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- NULL이면 무기한 (자동 갱신)
  cancelled_at TIMESTAMPTZ,

  -- 결제 정보
  payment_method TEXT, -- 'card', 'kakaopay' 등
  payment_key TEXT, -- 결제 시스템 키 (포트원 등)

  -- 메타데이터
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX subscriptions_status_idx ON subscriptions(status);
CREATE INDEX subscriptions_expires_at_idx ON subscriptions(expires_at);

-- 트리거
CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. 기존 유료 사용자 마이그레이션 (plan이 basic, pro, enterprise인 사용자)
-- 기존 유료 사용자들을 subscriptions 테이블로 이전
INSERT INTO subscriptions (user_id, plan_type, status, started_at, expires_at)
SELECT
  id as user_id,
  'premium' as plan_type,
  'active' as status,
  COALESCE(plan_started_at, created_at) as started_at,
  plan_expires_at as expires_at
FROM profiles
WHERE plan IN ('basic', 'pro', 'enterprise')
  AND NOT EXISTS (
    SELECT 1 FROM subscriptions s WHERE s.user_id = profiles.id
  );

-- 3. profiles 테이블의 plan 필드 제약 조건 업데이트 (선택적)
-- 기존 CHECK 제약 조건 삭제하고 새로운 것으로 교체
-- 주의: 기존 데이터와 호환성을 위해 plan 컬럼은 유지하되, 새로운 시스템에서는 사용하지 않음

-- 테이블 코멘트 추가
COMMENT ON TABLE subscriptions IS '사용자 구독 정보 (월 22,900원 프리미엄 플랜)';
COMMENT ON COLUMN subscriptions.plan_type IS '플랜 유형 (현재 premium만 존재)';
COMMENT ON COLUMN subscriptions.status IS '구독 상태: active(활성), cancelled(취소됨), expired(만료), pending(대기중)';
COMMENT ON COLUMN subscriptions.amount IS '구독 금액 (원)';
COMMENT ON COLUMN subscriptions.expires_at IS '만료일 (NULL이면 자동 갱신)';

-- profiles 테이블의 plan 컬럼에 대한 설명 추가
COMMENT ON COLUMN profiles.plan IS '[DEPRECATED] 기존 플랜 필드. 새로운 시스템에서는 subscriptions 테이블 + created_at 기반 7일 무료 체험 사용';
