-- =============================================================
-- 0011_record_media_exif.sql
-- 写真自体が持つ元EXIF（撮影時刻・GPS）を保存するカラムを record_media に追加する。
--
-- 背景（tasks/TASKS.md PR2 制約4・2026-07-25オーナー判断: 案A）:
--   record_media.captured_at / latitude / longitude は「記録操作を行った時刻・
--   その時点の端末GPS」であり、写真そのものの撮影時刻・撮影場所ではない
--   （PhotoRecordScreen.tsx が new Date().toISOString() と useRecordFields.ts の
--   端末GPSを設定している）。カメラで撮ってすぐ保存する通常フローでは近い値になるが、
--   capture="environment" が効かない環境（PC等）で既存写真を選んだ場合、
--   古い写真に現在の日時・場所が「撮影情報」として埋め込まれ、ZIPエクスポートの
--   EXIF書き戻し・外部AIツールへ誤ったデータを渡すことになる。
--
--   対応方針（案A）: 撮影/選択時に画像ファイル自体のEXIF（DateTimeOriginal・GPS）を
--   抽出できた場合、その値を専用カラムに保存する。抽出できなかった場合（EXIF無し・
--   スクリーンショット等）はnullのままとし、エクスポート側は
--   exif_captured_at ?? captured_at のように「有れば元EXIF、無ければ記録時刻」で
--   フォールバックする（記録時刻を使う場合は「記録した時刻・場所」である旨を
--   ZIP付随のJSONメタデータで明示する）。
--
-- 適用はユーザー承認後のみ（docs/NEGATIVE_ACTIONS.md）。
-- =============================================================

alter table public.record_media
  add column if not exists exif_captured_at timestamptz,
  add column if not exists exif_latitude numeric(9, 6),
  add column if not exists exif_longitude numeric(9, 6);

comment on column public.record_media.exif_captured_at is
  '写真ファイル自体のEXIF DateTimeOriginal（抽出できた場合のみ）。record_media.captured_at（記録操作時刻）とは別物。';
comment on column public.record_media.exif_latitude is
  '写真ファイル自体のEXIF GPS緯度（抽出できた場合のみ）。record_media.latitude（記録時の端末GPS）とは別物。';
comment on column public.record_media.exif_longitude is
  '写真ファイル自体のEXIF GPS経度（抽出できた場合のみ）。record_media.longitude（記録時の端末GPS）とは別物。';

-- 既存の media_write / media_select ポリシー（0001_init.sql）は record_media の
-- 全カラムを対象にしており、新カラム追加だけではRLSの変更は不要
