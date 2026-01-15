-- my_sites 테이블을 my_shoppingmall로 이름 변경
-- 관련 컬럼명도 함께 변경

-- 1. 테이블 이름 변경
ALTER TABLE IF EXISTS my_sites RENAME TO my_shoppingmall;

-- 2. 외래키가 있는 테이블들의 컬럼명 변경 (my_site_id -> my_shoppingmall_id)

-- tracking_links 테이블
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'tracking_links' AND column_name = 'my_site_id') THEN
    ALTER TABLE tracking_links RENAME COLUMN my_site_id TO my_shoppingmall_id;
  END IF;
END $$;

-- ad_channels 테이블
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'ad_channels' AND column_name = 'my_site_id') THEN
    ALTER TABLE ad_channels RENAME COLUMN my_site_id TO my_shoppingmall_id;
  END IF;
END $$;

-- products 테이블
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'products' AND column_name = 'my_site_id') THEN
    ALTER TABLE products RENAME COLUMN my_site_id TO my_shoppingmall_id;
  END IF;
END $$;

-- orders 테이블
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'orders' AND column_name = 'my_site_id') THEN
    ALTER TABLE orders RENAME COLUMN my_site_id TO my_shoppingmall_id;
  END IF;
END $$;

-- seller_trees 테이블
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'seller_trees' AND column_name = 'my_site_id') THEN
    ALTER TABLE seller_trees RENAME COLUMN my_site_id TO my_shoppingmall_id;
  END IF;
END $$;

-- instagram_dm_settings 테이블
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'instagram_dm_settings' AND column_name = 'my_site_id') THEN
    ALTER TABLE instagram_dm_settings RENAME COLUMN my_site_id TO my_shoppingmall_id;
  END IF;
END $$;

-- 3. 인덱스 이름 변경 (존재하는 경우)
DO $$
BEGIN
  -- 기존 인덱스가 있다면 새 이름으로 변경
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'my_sites_user_id_idx') THEN
    ALTER INDEX my_sites_user_id_idx RENAME TO my_shoppingmall_user_id_idx;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'my_sites_platform_idx') THEN
    ALTER INDEX my_sites_platform_idx RENAME TO my_shoppingmall_platform_idx;
  END IF;
END $$;

-- 4. RLS 정책 업데이트 (테이블명 변경으로 인해 자동으로 적용됨)
-- 정책 이름에 my_sites가 포함된 경우 수동으로 변경
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- my_shoppingmall 테이블의 정책 확인 및 재생성 필요시 처리
  -- (기존 정책은 테이블 이름 변경 시 자동으로 유지됨)
  NULL;
END $$;
