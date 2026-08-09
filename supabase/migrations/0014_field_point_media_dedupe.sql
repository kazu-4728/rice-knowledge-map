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
--
-- 既に重複行が存在する環境（このmigration適用前の競合状態で発生しうる）では
-- CREATE UNIQUE INDEX 自体が重複キーエラーで失敗するため、
-- インデックス作成前に重複を解消する（最も古い1件だけを残す。
-- レビュー指摘）。残りの重複行が参照していたStorage実体は、
-- このSQLだけでは削除できない孤児ファイルとして残る点に注意
-- （既存のorphan cleanupと同様、実害はStorage容量のみでDB整合性には影響しない）。
-- =============================================================

delete from public.field_point_media t
using public.field_point_media dup
where t.point_id = dup.point_id
  and t.caption = dup.caption
  and t.caption like 'record:%'
  and t.id <> dup.id
  and t.created_at > dup.created_at;

create unique index if not exists idx_field_point_media_register_dedupe
  on public.field_point_media (point_id, caption)
  where caption like 'record:%';
