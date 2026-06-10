-- 자막 제거 작업에 Supabase Storage 기반 컬럼 추가
-- (코드가 local_file_path 대신 Storage 경로 + 24h 만료 사용)

alter table subtitle_erase_jobs
  add column if not exists input_storage_path text,         -- subtitle-inputs/{id}.{ext}
  add column if not exists output_storage_path text,        -- subtitle-outputs/{id}.{ext}
  add column if not exists output_storage_size_bytes bigint,
  add column if not exists output_expires_at timestamptz;

create index if not exists subtitle_erase_jobs_output_expires_idx
  on subtitle_erase_jobs (output_expires_at)
  where output_storage_path is not null;
