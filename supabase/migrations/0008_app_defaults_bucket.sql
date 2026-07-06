-- システム既定画像（オーナー提供の生成画像）配信用の公開バケット。
-- 読み取りは公開URL（/storage/v1/object/public/app-defaults/...）で行い、
-- 書き込み用のRLSポリシーは作らない（service role経由でのみ格納する）。
-- 2026-07-06 オーナー承認のもとリモート適用済み。ファイル実体は
-- sunrise-paddies.webp / farmer-check.webp / seedling-water.webp /
-- planting-machine.webp / harvest-gold.webp の5枚（app-defaults直下）。
insert into storage.buckets (id, name, public)
values ('app-defaults', 'app-defaults', true)
on conflict (id) do update set public = true;
