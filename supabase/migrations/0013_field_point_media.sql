-- =============================================================
-- ピン（設備ポイント）の台帳写真
-- 0013_field_point_media.sql
--
-- 入水口・出水口・機械の出入口などの「変わらない情報」をピン自体に
-- 写真として持たせる（記録=タイムラインとは別系統。2026-08-09オーナー要望）。
-- 写真は既存の images バケット（groups/{group_id}/points/{point_id}/…）に
-- 置くため、Storage側のポリシー変更は不要
-- （storage_insert等は groups/{group_id} プレフィックスだけで判定している）。
-- =============================================================

create table public.field_point_media (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.field_points (id) on delete cascade,
  media_type media_type not null default 'image',
  storage_bucket text not null,
  storage_path text not null,
  caption text,
  display_order integer not null default 0,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index idx_field_point_media_point on public.field_point_media (point_id);
create index idx_field_point_media_created_by on public.field_point_media (created_by);

alter table public.field_point_media enable row level security;

-- 参照はグループメンバー全員
create policy "point_media_select" on public.field_point_media
  for select using (
    exists (
      select 1 from public.field_points p
      where p.id = field_point_media.point_id
        and public.is_group_member(p.group_id)
    )
  );

-- 追加・変更・削除は owner/editor のみ
-- （FOR ALLはSELECT重複警告を生むため、コマンド別に分割する）
create policy "point_media_insert" on public.field_point_media
  for insert with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.field_points p
      where p.id = field_point_media.point_id
        and public.has_group_role(p.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  );

create policy "point_media_update" on public.field_point_media
  for update using (
    exists (
      select 1 from public.field_points p
      where p.id = field_point_media.point_id
        and public.has_group_role(p.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  )
  with check (
    exists (
      select 1 from public.field_points p
      where p.id = field_point_media.point_id
        and public.has_group_role(p.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  );

create policy "point_media_delete" on public.field_point_media
  for delete using (
    exists (
      select 1 from public.field_points p
      where p.id = field_point_media.point_id
        and public.has_group_role(p.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  );
