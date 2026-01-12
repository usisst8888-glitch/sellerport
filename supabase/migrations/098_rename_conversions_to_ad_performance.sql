-- ============================================
-- 096: conversions 테이블을 ad_performance로 이름 변경
-- 광고 성과 관리 기능에 맞는 테이블명으로 변경
-- ============================================

-- 테이블 이름 변경
ALTER TABLE IF EXISTS conversions RENAME TO ad_performance;

-- 인덱스 이름 변경 (019에서 tracking_link_id로 변경됨)
ALTER INDEX IF EXISTS conversions_tracking_link_id_idx RENAME TO ad_performance_tracking_link_id_idx;
ALTER INDEX IF EXISTS conversions_user_id_idx RENAME TO ad_performance_user_id_idx;
ALTER INDEX IF EXISTS conversions_order_id_idx RENAME TO ad_performance_order_id_idx;
ALTER INDEX IF EXISTS conversions_click_id_idx RENAME TO ad_performance_click_id_idx;
ALTER INDEX IF EXISTS conversions_converted_at_idx RENAME TO ad_performance_converted_at_idx;

-- FK 제약조건 이름 변경
ALTER TABLE IF EXISTS ad_performance
  DROP CONSTRAINT IF EXISTS conversions_tracking_link_id_fkey;

ALTER TABLE IF EXISTS ad_performance
  ADD CONSTRAINT ad_performance_tracking_link_id_fkey
  FOREIGN KEY (tracking_link_id)
  REFERENCES tracking_links(id)
  ON DELETE SET NULL;

-- RLS 정책 이름 변경 (DROP 후 CREATE)
DROP POLICY IF EXISTS "Users can view own conversions" ON ad_performance;
DROP POLICY IF EXISTS "Anyone can insert conversions" ON ad_performance;
DROP POLICY IF EXISTS "Users can update own conversions" ON ad_performance;

CREATE POLICY "Users can view own ad_performance"
  ON ad_performance FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert ad_performance"
  ON ad_performance FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own ad_performance"
  ON ad_performance FOR UPDATE
  USING (auth.uid() = user_id);

-- 테이블 설명 업데이트
COMMENT ON TABLE ad_performance IS '광고 성과 - 광고 채널별 전환/매출 데이터';
