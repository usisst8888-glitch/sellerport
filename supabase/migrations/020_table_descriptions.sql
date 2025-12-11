-- ============================================
-- 020: 테이블 설명(Description) 추가
-- ============================================

-- 알림 관련
COMMENT ON TABLE alert_settings IS '사용자별 알림 설정 - 카카오 알림톡, 일일 리포트 등';
COMMENT ON TABLE alerts IS '사용자 알림 내역 - AI 분석, 주문 알림, 일일 리포트 등';

-- 캠페인 관련
COMMENT ON TABLE campaigns IS '광고 캠페인 - Meta/네이버 광고 캠페인 관리';
COMMENT ON TABLE campaign_daily_stats IS '캠페인 일별 통계 - 클릭, 전환, ROAS 등 일별 기록';

-- 전환 추적
COMMENT ON TABLE conversions IS '전환 기록 - 추적 링크를 통한 구매 전환 내역';
COMMENT ON TABLE tracking_links IS '추적 링크 - 광고 전환 추적을 위한 UTM 링크';
COMMENT ON TABLE tracking_link_clicks IS '추적 링크 클릭 로그 - 클릭 시점의 상세 정보 기록';

-- 디자인 마켓플레이스
COMMENT ON TABLE designers IS '디자이너 프로필 - 상세페이지 제작 디자이너 정보';
COMMENT ON TABLE designer_portfolios IS '디자이너 포트폴리오 - 작업 샘플 및 이미지';
COMMENT ON TABLE designer_reviews IS '디자이너 리뷰 - 고객 평점 및 후기';
COMMENT ON TABLE design_requests IS '디자인 의뢰 - 상세페이지 제작 요청 내역';
COMMENT ON TABLE design_messages IS '디자인 의뢰 메시지 - 의뢰자와 디자이너 간 채팅';

-- 주문/결제
COMMENT ON TABLE orders IS '주문 내역 - 네이버/쿠팡 등 플랫폼 주문 동기화';
COMMENT ON TABLE payments IS '결제 내역 - 셀러포트 서비스 결제 기록';

-- 사용자/인증
COMMENT ON TABLE profiles IS '사용자 프로필 - 회원 정보 및 요금제';
COMMENT ON TABLE user_settings IS '사용자 설정 - Meta 픽셀, API 키 등 연동 설정';
COMMENT ON TABLE user_balance IS '사용자 잔액 - 충전금 및 포인트 관리';
COMMENT ON TABLE phone_verifications IS '전화번호 SMS 인증 - 회원가입 시 본인 인증';

-- 플랫폼/상품
COMMENT ON TABLE platforms IS '연동 플랫폼 - 네이버 스마트스토어 등 판매 채널 연동';
COMMENT ON TABLE products IS '상품 목록 - 연동된 플랫폼의 상품 정보';
