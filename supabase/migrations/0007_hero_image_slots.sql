-- 各画面ヒーローの差し替え可能カバー画像スロット（オーナーが /menu/site で編集）
-- shape: {
--   home?: {image_path?:string, image_url?:string},
--   talk?: {image_path?:string, image_url?:string},
--   fieldDefault?: {image_path?:string, image_url?:string},
--   calendar?: { spring?:Slot, summer?:Slot, autumn?:Slot, winter?:Slot },
--   recordsCategory?: { "水管理"?:Slot, "作業"?:Slot, "異常"?:Slot, "音声"?:Slot }
-- }
-- 既存の hero_slides（ランディング用）とは独立したカラムとして追加する。
alter table public.group_site_content
  add column if not exists image_slots jsonb not null default '{}'::jsonb;
