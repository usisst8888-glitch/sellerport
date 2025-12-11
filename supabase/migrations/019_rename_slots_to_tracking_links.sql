-- 슬롯 테이블을 추적 링크로 이름 변경
-- slots → tracking_links
-- slot_clicks → tracking_link_clicks

-- 1. slots 테이블 이름 변경
ALTER TABLE IF EXISTS slots RENAME TO tracking_links;

-- 2. slot_clicks 테이블 이름 변경
ALTER TABLE IF EXISTS slot_clicks RENAME TO tracking_link_clicks;

-- 3. tracking_link_clicks 테이블의 slot_id 컬럼을 tracking_link_id로 변경
ALTER TABLE IF EXISTS tracking_link_clicks
  RENAME COLUMN slot_id TO tracking_link_id;

-- 4. 인덱스 이름 변경 (존재하는 경우)
ALTER INDEX IF EXISTS slots_pkey RENAME TO tracking_links_pkey;
ALTER INDEX IF EXISTS slots_user_id_idx RENAME TO tracking_links_user_id_idx;
ALTER INDEX IF EXISTS slot_clicks_pkey RENAME TO tracking_link_clicks_pkey;
ALTER INDEX IF EXISTS slot_clicks_slot_id_idx RENAME TO tracking_link_clicks_tracking_link_id_idx;

-- 5. 외래 키 제약 조건 재설정 (필요한 경우)
-- 기존 제약 조건 삭제 후 새로 생성
ALTER TABLE IF EXISTS tracking_link_clicks
  DROP CONSTRAINT IF EXISTS slot_clicks_slot_id_fkey;

ALTER TABLE IF EXISTS tracking_link_clicks
  ADD CONSTRAINT tracking_link_clicks_tracking_link_id_fkey
  FOREIGN KEY (tracking_link_id)
  REFERENCES tracking_links(id)
  ON DELETE CASCADE;

-- 6. RLS 정책 재설정 (tracking_links)
DROP POLICY IF EXISTS "Users can view own slots" ON tracking_links;
DROP POLICY IF EXISTS "Users can insert own slots" ON tracking_links;
DROP POLICY IF EXISTS "Users can update own slots" ON tracking_links;
DROP POLICY IF EXISTS "Users can delete own slots" ON tracking_links;

CREATE POLICY "Users can view own tracking_links" ON tracking_links
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracking_links" ON tracking_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracking_links" ON tracking_links
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracking_links" ON tracking_links
  FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS 정책 재설정 (tracking_link_clicks)
DROP POLICY IF EXISTS "Users can view own slot_clicks" ON tracking_link_clicks;
DROP POLICY IF EXISTS "Users can insert slot_clicks" ON tracking_link_clicks;

CREATE POLICY "Users can view own tracking_link_clicks" ON tracking_link_clicks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert tracking_link_clicks" ON tracking_link_clicks
  FOR INSERT WITH CHECK (true);

-- 8. conversions 테이블의 slot_id 컬럼을 tracking_link_id로 변경
ALTER TABLE IF EXISTS conversions
  RENAME COLUMN slot_id TO tracking_link_id;

-- 9. conversions 테이블의 인덱스 이름 변경
ALTER INDEX IF EXISTS conversions_slot_id_idx RENAME TO conversions_tracking_link_id_idx;

-- 10. conversions 테이블의 외래 키 재설정
ALTER TABLE IF EXISTS conversions
  DROP CONSTRAINT IF EXISTS conversions_slot_id_fkey;

ALTER TABLE IF EXISTS conversions
  ADD CONSTRAINT conversions_tracking_link_id_fkey
  FOREIGN KEY (tracking_link_id)
  REFERENCES tracking_links(id)
  ON DELETE SET NULL;

-- 11. 코멘트 업데이트
COMMENT ON TABLE tracking_links IS '추적 링크 - 광고 전환 추적을 위한 링크';
COMMENT ON TABLE tracking_link_clicks IS '추적 링크 클릭 로그';
