-- video_code 컬럼 크기 확장 (한글 및 자유로운 형식 지원)
-- 기존: VARCHAR(4) -> 변경: VARCHAR(20)

ALTER TABLE tracking_links
ALTER COLUMN video_code TYPE VARCHAR(20);

-- 컬럼 설명 업데이트
COMMENT ON COLUMN tracking_links.video_code IS '영상번호 (한글, 영문, 숫자 자유 형식, 최대 20자)';
