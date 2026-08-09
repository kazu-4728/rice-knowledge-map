-- =============================================================
-- ピン台帳への記録写真登録の重複防止（DB側での保証）
-- 0014_field_point_media_dedupe.sql
--
-- registerRecordPhotoToPoint()（src/lib/data/pointMedia.ts）は
-- 「同じピン×同じ元写真パス」の重複登録を防ぐため、captionに
-- record:{storage_path} という内部マーカーを残し、登録前にSELECTで
-- 確認している。しかしSELECT→INSERTの間に別リクエストが割り込む
-- 競合状態ではアプリ側のチェックだけでは防げない（PRレビュー指摘）。
-- 部分ユニークインデックスで、同じピン×同じマーカーの行を
-- DBレベルで1件に制限する。
-- =============================================================

create unique index if not exists idx_field_point_media_register_dedupe
  on public.field_point_media (point_id, caption)
  where caption like 'record:%';
