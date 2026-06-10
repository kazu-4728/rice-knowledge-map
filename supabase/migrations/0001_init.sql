-- =============================================================
-- みらい稲作管理 初期MVPスキーマ (docs/DATA_MODEL.md 準拠)
-- 0001_init.sql
--
-- 注意:
-- - 適用はユーザー承認後のみ (tasks/TASKS.md T-032/T-033)
-- - 既存の fields / field_logs には触れない（新設計は farm_ プレフィックス）
-- =============================================================

-- ---------- 拡張 ----------
-- digest() 用（gen_random_uuid はPG13以降組み込み）
create extension if not exists pgcrypto with schema extensions;

-- ---------- ENUM ----------
create type member_role as enum ('owner', 'editor', 'viewer');
create type invite_role as enum ('editor', 'viewer');
create type point_type as enum
  ('inlet', 'outlet', 'canal', 'caution', 'weed', 'levee_damage', 'poor_drainage', 'other');
create type point_status as enum ('normal', 'needs_check', 'issue', 'resolved');
create type record_type as enum ('photo', 'voice', 'water', 'work', 'issue', 'check', 'other');
create type record_status as enum ('open', 'needs_check', 'resolved', 'monitoring');
create type location_source as enum ('photo_exif', 'gps', 'manual', 'unknown');
create type media_type as enum ('image', 'audio');

-- ---------- 共通: updated_at 自動更新 ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- auth.users 作成時に profiles を自動作成
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- farm_groups ----------
create table public.farm_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_farm_groups_updated_at
  before update on public.farm_groups
  for each row execute function public.set_updated_at();

-- ---------- farm_group_members ----------
create table public.farm_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.farm_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role member_role not null default 'viewer',
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index idx_members_user on public.farm_group_members (user_id);
create index idx_members_group on public.farm_group_members (group_id);

-- ---------- RLSヘルパー (security definer で members の再帰RLSを回避) ----------
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.farm_group_members m
    where m.group_id = p_group_id and m.user_id = auth.uid()
  );
$$;

create or replace function public.has_group_role(p_group_id uuid, p_roles member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.farm_group_members m
    where m.group_id = p_group_id
      and m.user_id = auth.uid()
      and m.role = any (p_roles)
  );
$$;

-- ---------- farm_group_invites ----------
create table public.farm_group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.farm_groups (id) on delete cascade,
  token_hash text not null unique,
  role invite_role not null default 'viewer',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index idx_invites_group on public.farm_group_invites (group_id);

-- 招待トークンの引き換え（トークン平文はDBに保存しない）
create or replace function public.redeem_group_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_invite public.farm_group_invites%rowtype;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select * into v_invite
  from public.farm_group_invites
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and used_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'invalid or expired invite';
  end if;

  insert into public.farm_group_members (group_id, user_id, role)
  values (v_invite.group_id, auth.uid(), v_invite.role::text::member_role)
  on conflict (group_id, user_id) do nothing;

  update public.farm_group_invites
  set used_at = now()
  where id = v_invite.id;

  return v_invite.group_id;
end;
$$;

-- ---------- farm_fields（既存 fields とは別テーブル） ----------
create table public.farm_fields (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.farm_groups (id) on delete cascade,
  name text not null,
  memo text,
  center_latitude numeric(9, 6),
  center_longitude numeric(9, 6),
  boundary_geojson jsonb,
  area_sqm numeric,
  display_order integer not null default 0,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_farm_fields_group on public.farm_fields (group_id);

create trigger trg_farm_fields_updated_at
  before update on public.farm_fields
  for each row execute function public.set_updated_at();

-- ---------- field_seasons ----------
create table public.field_seasons (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.farm_fields (id) on delete cascade,
  year integer not null,
  crop_name text not null,
  variety text,
  started_at date,
  ended_at date,
  memo text
);

create index idx_field_seasons_field on public.field_seasons (field_id);

-- ---------- field_points ----------
create table public.field_points (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.farm_groups (id) on delete cascade,
  field_id uuid references public.farm_fields (id) on delete set null,
  point_type point_type not null default 'other',
  name text not null,
  latitude numeric(9, 6) not null,
  longitude numeric(9, 6) not null,
  status point_status not null default 'normal',
  memo text,
  last_checked_at timestamptz,
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_field_points_group on public.field_points (group_id);
create index idx_field_points_field on public.field_points (field_id);

create trigger trg_field_points_updated_at
  before update on public.field_points
  for each row execute function public.set_updated_at();

-- field_points.field_id の group 整合性
create or replace function public.check_point_group_consistency()
returns trigger
language plpgsql
as $$
declare
  v_field_group uuid;
begin
  if new.field_id is not null then
    select group_id into v_field_group from public.farm_fields where id = new.field_id;
    if v_field_group is distinct from new.group_id then
      raise exception 'field_points.group_id must match farm_fields.group_id';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_field_points_group_check
  before insert or update on public.field_points
  for each row execute function public.check_point_group_consistency();

-- ---------- records ----------
create table public.records (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.farm_groups (id) on delete cascade,
  field_id uuid references public.farm_fields (id) on delete set null,
  season_id uuid references public.field_seasons (id) on delete set null,
  point_id uuid references public.field_points (id) on delete set null,
  record_type record_type not null default 'other',
  status record_status not null default 'open',
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  location_source location_source not null default 'unknown',
  title text not null default '',
  note text,
  ai_summary text,
  ai_category text,
  next_action text,
  recorded_by uuid not null references public.profiles (id),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_records_group_recorded on public.records (group_id, recorded_at desc);
create index idx_records_field on public.records (field_id);
create index idx_records_point on public.records (point_id);

create trigger trg_records_updated_at
  before update on public.records
  for each row execute function public.set_updated_at();

-- records の group_id 整合性 (docs/DATA_MODEL.md §3 group_id 整合性)
create or replace function public.check_record_group_consistency()
returns trigger
language plpgsql
as $$
declare
  v_group uuid;
begin
  if new.field_id is not null then
    select group_id into v_group from public.farm_fields where id = new.field_id;
    if v_group is distinct from new.group_id then
      raise exception 'records.group_id must match farm_fields.group_id';
    end if;
  end if;

  if new.point_id is not null then
    select group_id into v_group from public.field_points where id = new.point_id;
    if v_group is distinct from new.group_id then
      raise exception 'records.group_id must match field_points.group_id';
    end if;
  end if;

  if new.season_id is not null then
    select f.group_id into v_group
    from public.field_seasons s
    join public.farm_fields f on f.id = s.field_id
    where s.id = new.season_id;
    if v_group is distinct from new.group_id then
      raise exception 'records.group_id must match season''s farm_fields.group_id';
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_records_group_check
  before insert or update on public.records
  for each row execute function public.check_record_group_consistency();

-- ---------- record_media ----------
create table public.record_media (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records (id) on delete cascade,
  media_type media_type not null,
  storage_bucket text not null,
  storage_path text not null,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  captured_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_record_media_record on public.record_media (record_id);

-- ---------- record_comments ----------
create table public.record_comments (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  comment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_record_comments_record on public.record_comments (record_id);

create trigger trg_record_comments_updated_at
  before update on public.record_comments
  for each row execute function public.set_updated_at();

-- ---------- record_status_events ----------
create table public.record_status_events (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records (id) on delete cascade,
  from_status text not null,
  to_status text not null,
  changed_by uuid not null references public.profiles (id),
  comment text,
  created_at timestamptz not null default now()
);

create index idx_record_status_events_record on public.record_status_events (record_id);

-- =============================================================
-- RLS (docs/DATA_MODEL.md §4)
--   - 所属グループのデータのみ閲覧可
--   - owner/editor が作成・更新可、viewer は閲覧のみ
-- =============================================================

alter table public.profiles enable row level security;
alter table public.farm_groups enable row level security;
alter table public.farm_group_members enable row level security;
alter table public.farm_group_invites enable row level security;
alter table public.farm_fields enable row level security;
alter table public.field_seasons enable row level security;
alter table public.field_points enable row level security;
alter table public.records enable row level security;
alter table public.record_media enable row level security;
alter table public.record_comments enable row level security;
alter table public.record_status_events enable row level security;

-- profiles: 自分 + 同じグループのメンバーを閲覧可。更新は本人のみ
create policy profiles_select on public.profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.farm_group_members me
      join public.farm_group_members them on them.group_id = me.group_id
      where me.user_id = auth.uid() and them.user_id = profiles.id
    )
  );
create policy profiles_update on public.profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- farm_groups
create policy groups_select on public.farm_groups for select
  using (public.is_group_member(id));
create policy groups_insert on public.farm_groups for insert
  with check (owner_user_id = auth.uid());
create policy groups_update on public.farm_groups for update
  using (public.has_group_role(id, array['owner']::member_role[]));
create policy groups_delete on public.farm_groups for delete
  using (public.has_group_role(id, array['owner']::member_role[]));

-- farm_group_members: 同グループメンバーが閲覧、管理は owner（参加は redeem_group_invite 経由）
create policy members_select on public.farm_group_members for select
  using (public.is_group_member(group_id));
create policy members_insert on public.farm_group_members for insert
  with check (
    public.has_group_role(group_id, array['owner']::member_role[])
    -- グループ作成直後に自分を owner として登録するケース
    or (
      user_id = auth.uid()
      and role = 'owner'
      and exists (
        select 1 from public.farm_groups g
        where g.id = group_id and g.owner_user_id = auth.uid()
      )
    )
  );
create policy members_update on public.farm_group_members for update
  using (public.has_group_role(group_id, array['owner']::member_role[]));
create policy members_delete on public.farm_group_members for delete
  using (
    public.has_group_role(group_id, array['owner']::member_role[])
    or user_id = auth.uid() -- 自分で退出
  );

-- farm_group_invites: owner のみ
create policy invites_select on public.farm_group_invites for select
  using (public.has_group_role(group_id, array['owner']::member_role[]));
create policy invites_insert on public.farm_group_invites for insert
  with check (
    public.has_group_role(group_id, array['owner']::member_role[])
    and created_by = auth.uid()
  );
create policy invites_delete on public.farm_group_invites for delete
  using (public.has_group_role(group_id, array['owner']::member_role[]));

-- farm_fields
create policy fields_select on public.farm_fields for select
  using (public.is_group_member(group_id));
create policy fields_insert on public.farm_fields for insert
  with check (
    public.has_group_role(group_id, array['owner', 'editor']::member_role[])
    and created_by = auth.uid()
  );
create policy fields_update on public.farm_fields for update
  using (public.has_group_role(group_id, array['owner', 'editor']::member_role[]));
create policy fields_delete on public.farm_fields for delete
  using (public.has_group_role(group_id, array['owner', 'editor']::member_role[]));

-- field_seasons（親 farm_fields のグループで判定）
create policy seasons_select on public.field_seasons for select
  using (exists (
    select 1 from public.farm_fields f
    where f.id = field_id and public.is_group_member(f.group_id)
  ));
create policy seasons_write on public.field_seasons for all
  using (exists (
    select 1 from public.farm_fields f
    where f.id = field_id
      and public.has_group_role(f.group_id, array['owner', 'editor']::member_role[])
  ))
  with check (exists (
    select 1 from public.farm_fields f
    where f.id = field_id
      and public.has_group_role(f.group_id, array['owner', 'editor']::member_role[])
  ));

-- field_points
create policy points_select on public.field_points for select
  using (public.is_group_member(group_id));
create policy points_insert on public.field_points for insert
  with check (
    public.has_group_role(group_id, array['owner', 'editor']::member_role[])
    and created_by = auth.uid()
  );
create policy points_update on public.field_points for update
  using (public.has_group_role(group_id, array['owner', 'editor']::member_role[]));
create policy points_delete on public.field_points for delete
  using (public.has_group_role(group_id, array['owner', 'editor']::member_role[]));

-- records
create policy records_select on public.records for select
  using (public.is_group_member(group_id));
create policy records_insert on public.records for insert
  with check (
    public.has_group_role(group_id, array['owner', 'editor']::member_role[])
    and recorded_by = auth.uid()
  );
create policy records_update on public.records for update
  using (public.has_group_role(group_id, array['owner', 'editor']::member_role[]));
create policy records_delete on public.records for delete
  using (public.has_group_role(group_id, array['owner', 'editor']::member_role[]));

-- record_media（親 records のグループで判定）
create policy media_select on public.record_media for select
  using (exists (
    select 1 from public.records r
    where r.id = record_id and public.is_group_member(r.group_id)
  ));
create policy media_write on public.record_media for all
  using (exists (
    select 1 from public.records r
    where r.id = record_id
      and public.has_group_role(r.group_id, array['owner', 'editor']::member_role[])
  ))
  with check (exists (
    select 1 from public.records r
    where r.id = record_id
      and public.has_group_role(r.group_id, array['owner', 'editor']::member_role[])
  ));

-- record_comments: 閲覧は全メンバー、投稿は owner/editor、編集・削除は本人
create policy comments_select on public.record_comments for select
  using (exists (
    select 1 from public.records r
    where r.id = record_id and public.is_group_member(r.group_id)
  ));
create policy comments_insert on public.record_comments for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.records r
      where r.id = record_id
        and public.has_group_role(r.group_id, array['owner', 'editor']::member_role[])
    )
  );
create policy comments_update on public.record_comments for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy comments_delete on public.record_comments for delete
  using (user_id = auth.uid());

-- record_status_events: 閲覧は全メンバー、追加は owner/editor
create policy status_events_select on public.record_status_events for select
  using (exists (
    select 1 from public.records r
    where r.id = record_id and public.is_group_member(r.group_id)
  ));
create policy status_events_insert on public.record_status_events for insert
  with check (
    changed_by = auth.uid()
    and exists (
      select 1 from public.records r
      where r.id = record_id
        and public.has_group_role(r.group_id, array['owner', 'editor']::member_role[])
    )
  );

-- =============================================================
-- Storage (docs/DATA_MODEL.md §5)
--   バケットは非公開。パス: groups/{group_id}/records/{record_id}/...
-- =============================================================

insert into storage.buckets (id, name, public)
values ('images', 'images', false), ('audio', 'audio', false)
on conflict (id) do nothing;

-- パスの2階層目 (groups/{group_id}/...) からグループIDを取り出して判定する
create policy storage_select on storage.objects for select
  using (
    bucket_id in ('images', 'audio')
    and (storage.foldername(name))[1] = 'groups'
    and public.is_group_member(((storage.foldername(name))[2])::uuid)
  );

create policy storage_insert on storage.objects for insert
  with check (
    bucket_id in ('images', 'audio')
    and (storage.foldername(name))[1] = 'groups'
    and public.has_group_role(
      ((storage.foldername(name))[2])::uuid,
      array['owner', 'editor']::member_role[]
    )
  );

create policy storage_delete on storage.objects for delete
  using (
    bucket_id in ('images', 'audio')
    and (storage.foldername(name))[1] = 'groups'
    and public.has_group_role(
      ((storage.foldername(name))[2])::uuid,
      array['owner', 'editor']::member_role[]
    )
  );
