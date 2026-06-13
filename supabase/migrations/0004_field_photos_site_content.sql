-- 田んぼのカバー写真（Supabase Storageパス）
alter table public.farm_fields add column if not exists photo_path text;

-- グループ別ヒーロー/ランディング設定（管理者が編集可能）
-- slide shape: [{image_path?:string, image_url?:string, title:string, body:string}]
create table public.group_site_content (
  group_id    uuid primary key references public.farm_groups(id) on delete cascade,
  hero_slides jsonb not null default '[]'::jsonb,
  updated_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now()
);

alter table public.group_site_content enable row level security;

-- グループメンバー全員が読める
create policy "site_content_select" on public.group_site_content
  for select using (public.is_group_member(group_id));

-- owner のみ作成・更新・削除できる
create policy "site_content_insert" on public.group_site_content
  for insert with check (public.has_group_role(group_id, array['owner']::member_role[]));

create policy "site_content_update" on public.group_site_content
  for update using (public.has_group_role(group_id, array['owner']::member_role[]));

create policy "site_content_delete" on public.group_site_content
  for delete using (public.has_group_role(group_id, array['owner']::member_role[]));
