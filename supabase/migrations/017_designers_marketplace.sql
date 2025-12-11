-- ============================================
-- 017: 디자이너 마켓플레이스 시스템
-- ============================================

-- 디자이너 프로필 테이블
CREATE TABLE IF NOT EXISTS designers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  specialty TEXT, -- 전문 분야
  bio TEXT, -- 자기소개
  profile_image_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0, -- 평점 (0-5)
  review_count INTEGER DEFAULT 0,
  completed_projects INTEGER DEFAULT 0,
  price_min INTEGER DEFAULT 0, -- 최소 가격 (만원 단위)
  price_max INTEGER, -- 최대 가격 (만원 단위)
  response_time TEXT DEFAULT '보통 2시간 내 응답', -- 평균 응답 시간
  is_online BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE, -- 셀러포트 인증 여부
  is_active BOOLEAN DEFAULT TRUE, -- 활동 가능 여부
  portfolio_categories TEXT[] DEFAULT '{}', -- 포트폴리오 카테고리
  service_types TEXT[] DEFAULT '{}', -- 제공 서비스 타입 (detail, thumbnail, banner, photo, branding)
  tags TEXT[] DEFAULT '{}', -- 태그
  bank_name TEXT, -- 정산용 은행명
  bank_account TEXT, -- 정산용 계좌번호
  bank_holder TEXT, -- 예금주
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 포트폴리오 테이블
CREATE TABLE IF NOT EXISTS designer_portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES designers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 건강식품, 뷰티, 패션 등
  service_type TEXT, -- detail, thumbnail, banner, photo, branding
  image_urls TEXT[] DEFAULT '{}',
  before_image_url TEXT, -- 비포 이미지 (있는 경우)
  after_image_url TEXT, -- 애프터 이미지
  client_name TEXT, -- 고객사명 (선택)
  is_featured BOOLEAN DEFAULT FALSE, -- 대표 포트폴리오 여부
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 디자인 의뢰 테이블
CREATE TABLE IF NOT EXISTS design_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- 의뢰자 (셀러)
  designer_id UUID REFERENCES designers(id) ON DELETE SET NULL, -- 디자이너
  status TEXT DEFAULT 'pending', -- pending, accepted, in_progress, revision, completed, cancelled
  service_type TEXT NOT NULL, -- detail, thumbnail, banner, photo, branding, other
  product_name TEXT, -- 상품명
  product_url TEXT, -- 상품 링크
  requirements TEXT, -- 요청 사항
  budget_range TEXT, -- 예산 범위 (10만원 미만, 10-30만원 등)
  reference_urls TEXT[] DEFAULT '{}', -- 참고 이미지/링크
  deadline TIMESTAMPTZ, -- 희망 마감일
  price INTEGER, -- 확정 가격 (만원 단위)
  delivery_files TEXT[] DEFAULT '{}', -- 납품 파일 URL
  revision_count INTEGER DEFAULT 0, -- 수정 횟수
  max_revisions INTEGER DEFAULT 2, -- 최대 수정 횟수
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 디자이너 리뷰 테이블
CREATE TABLE IF NOT EXISTS designer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  designer_id UUID REFERENCES designers(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id UUID REFERENCES design_requests(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 채팅 메시지 테이블 (의뢰 관련 대화)
CREATE TABLE IF NOT EXISTS design_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES design_requests(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_designers_user_id ON designers(user_id);
CREATE INDEX IF NOT EXISTS idx_designers_is_active ON designers(is_active);
CREATE INDEX IF NOT EXISTS idx_designers_service_types ON designers USING GIN(service_types);
CREATE INDEX IF NOT EXISTS idx_designer_portfolios_designer_id ON designer_portfolios(designer_id);
CREATE INDEX IF NOT EXISTS idx_design_requests_requester_id ON design_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_design_requests_designer_id ON design_requests(designer_id);
CREATE INDEX IF NOT EXISTS idx_design_requests_status ON design_requests(status);
CREATE INDEX IF NOT EXISTS idx_designer_reviews_designer_id ON designer_reviews(designer_id);
CREATE INDEX IF NOT EXISTS idx_design_messages_request_id ON design_messages(request_id);

-- RLS 정책
ALTER TABLE designers ENABLE ROW LEVEL SECURITY;
ALTER TABLE designer_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE designer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_messages ENABLE ROW LEVEL SECURITY;

-- designers 정책
CREATE POLICY "designers_select_public" ON designers
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "designers_insert_own" ON designers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "designers_update_own" ON designers
  FOR UPDATE USING (auth.uid() = user_id);

-- designer_portfolios 정책
CREATE POLICY "portfolios_select_public" ON designer_portfolios
  FOR SELECT USING (TRUE);

CREATE POLICY "portfolios_insert_own" ON designer_portfolios
  FOR INSERT WITH CHECK (
    designer_id IN (SELECT id FROM designers WHERE user_id = auth.uid())
  );

CREATE POLICY "portfolios_update_own" ON designer_portfolios
  FOR UPDATE USING (
    designer_id IN (SELECT id FROM designers WHERE user_id = auth.uid())
  );

CREATE POLICY "portfolios_delete_own" ON designer_portfolios
  FOR DELETE USING (
    designer_id IN (SELECT id FROM designers WHERE user_id = auth.uid())
  );

-- design_requests 정책
CREATE POLICY "requests_select_own" ON design_requests
  FOR SELECT USING (
    requester_id = auth.uid() OR
    designer_id IN (SELECT id FROM designers WHERE user_id = auth.uid())
  );

CREATE POLICY "requests_insert_own" ON design_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "requests_update_involved" ON design_requests
  FOR UPDATE USING (
    requester_id = auth.uid() OR
    designer_id IN (SELECT id FROM designers WHERE user_id = auth.uid())
  );

-- designer_reviews 정책
CREATE POLICY "reviews_select_public" ON designer_reviews
  FOR SELECT USING (TRUE);

CREATE POLICY "reviews_insert_own" ON designer_reviews
  FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- design_messages 정책
CREATE POLICY "messages_select_own" ON design_messages
  FOR SELECT USING (
    request_id IN (
      SELECT id FROM design_requests
      WHERE requester_id = auth.uid() OR
            designer_id IN (SELECT id FROM designers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert_own" ON design_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- 리뷰 작성 시 디자이너 평점 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_designer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE designers
  SET
    rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM designer_reviews
      WHERE designer_id = NEW.designer_id
    ),
    review_count = (
      SELECT COUNT(*)
      FROM designer_reviews
      WHERE designer_id = NEW.designer_id
    )
  WHERE id = NEW.designer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 리뷰 트리거
DROP TRIGGER IF EXISTS trigger_update_designer_rating ON designer_reviews;
CREATE TRIGGER trigger_update_designer_rating
  AFTER INSERT ON designer_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_designer_rating();

-- 의뢰 완료 시 디자이너 완료 프로젝트 수 업데이트 함수
CREATE OR REPLACE FUNCTION update_designer_completed_projects()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE designers
    SET completed_projects = completed_projects + 1
    WHERE id = NEW.designer_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 의뢰 완료 트리거
DROP TRIGGER IF EXISTS trigger_update_designer_completed ON design_requests;
CREATE TRIGGER trigger_update_designer_completed
  AFTER UPDATE ON design_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_designer_completed_projects();
