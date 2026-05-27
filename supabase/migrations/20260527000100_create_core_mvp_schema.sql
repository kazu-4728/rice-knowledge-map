-- Core MVP schema for rice-knowledge-map.
-- Draft migration only: do not apply to Supabase without the approval required
-- by docs/NEGATIVE_ACTIONS.md and tasks/TASKS.md T-033/T-034.

create extension if not exists "pgcrypto" with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.farm_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint farm_groups_name_not_blank check (btrim(name) <> '')
);

create table public.farm_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.farm_groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  joined_at timestamptz not null default now(),
  constraint farm_group_members_role_check check (role in ('owner', 'editor', 'viewer')),
  constraint farm_group_members_group_user_unique unique (group_id, user_id)
);

create table public.farm_group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.farm_groups(id) on delete cascade,
  token_hash text not null,
  role text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint farm_group_invites_role_check check (role in ('editor', 'viewer')),
  constraint farm_group_invites_token_hash_not_blank check (btrim(token_hash) <> ''),
  constraint farm_group_invites_token_hash_unique unique (token_hash)
);

create table public.farm_fields (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.farm_groups(id) on delete cascade,
  name text not null,
  memo text,
  center_latitude numeric,
  center_longitude numeric,
  boundary_geojson jsonb,
  area_sqm numeric,
  display_order integer not null default 0,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint farm_fields_name_not_blank check (btrim(name) <> ''),
  constraint farm_fields_center_latitude_range check (center_latitude is null or center_latitude between -90 and 90),
  constraint farm_fields_center_longitude_range check (center_longitude is null or center_longitude between -180 and 180),
  constraint farm_fields_area_sqm_nonnegative check (area_sqm is null or area_sqm >= 0),
  constraint farm_fields_boundary_geojson_object check (boundary_geojson is null or jsonb_typeof(boundary_geojson) = 'object')
);

create table public.field_seasons (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.farm_fields(id) on delete cascade,
  year integer not null,
  crop_name text,
  variety text,
  started_at date,
  ended_at date,
  memo text,
  constraint field_seasons_year_range check (year between 2000 and 2100),
  constraint field_seasons_dates_order check (ended_at is null or started_at is null or ended_at >= started_at),
  constraint field_seasons_field_year_unique unique (field_id, year)
);

create table public.field_points (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.farm_groups(id) on delete cascade,
  field_id uuid references public.farm_fields(id) on delete set null,
  point_type text not null,
  name text,
  latitude numeric not null,
  longitude numeric not null,
  status text not null default 'normal',
  memo text,
  last_checked_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint field_points_point_type_check check (
    point_type in ('inlet', 'outlet', 'canal', 'caution', 'weed', 'levee_damage', 'poor_drainage', 'other')
  ),
  constraint field_points_status_check check (status in ('normal', 'needs_check', 'issue', 'resolved')),
  constraint field_points_latitude_range check (latitude between -90 and 90),
  constraint field_points_longitude_range check (longitude between -180 and 180)
);

create table public.records (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.farm_groups(id) on delete cascade,
  field_id uuid references public.farm_fields(id) on delete set null,
  season_id uuid references public.field_seasons(id) on delete set null,
  point_id uuid references public.field_points(id) on delete set null,
  record_type text not null,
  status text not null default 'open',
  latitude numeric,
  longitude numeric,
  location_source text not null default 'unknown',
  title text,
  note text,
  ai_summary text,
  ai_category text,
  next_action text,
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint records_record_type_check check (record_type in ('photo', 'voice', 'water', 'work', 'issue', 'check', 'other')),
  constraint records_status_check check (status in ('open', 'needs_check', 'resolved', 'monitoring')),
  constraint records_location_source_check check (location_source in ('photo_exif', 'gps', 'manual', 'unknown')),
  constraint records_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint records_longitude_range check (longitude is null or longitude between -180 and 180)
);

create table public.record_media (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records(id) on delete cascade,
  media_type text not null,
  storage_bucket text not null,
  storage_path text not null,
  latitude numeric,
  longitude numeric,
  captured_at timestamptz,
  created_at timestamptz not null default now(),
  constraint record_media_media_type_check check (media_type in ('image', 'audio')),
  constraint record_media_storage_bucket_not_blank check (btrim(storage_bucket) <> ''),
  constraint record_media_storage_path_not_blank check (btrim(storage_path) <> ''),
  constraint record_media_storage_path_unique unique (storage_bucket, storage_path),
  constraint record_media_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint record_media_longitude_range check (longitude is null or longitude between -180 and 180)
);

create table public.record_comments (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  comment text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint record_comments_comment_not_blank check (btrim(comment) <> '')
);

create table public.record_status_events (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.records(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid not null references public.profiles(id) on delete restrict,
  comment text,
  created_at timestamptz not null default now(),
  constraint record_status_events_from_status_check check (
    from_status is null or from_status in ('open', 'needs_check', 'resolved', 'monitoring')
  ),
  constraint record_status_events_to_status_check check (to_status in ('open', 'needs_check', 'resolved', 'monitoring')),
  constraint record_status_events_status_changed check (from_status is null or from_status <> to_status)
);

create index farm_groups_owner_user_id_idx on public.farm_groups(owner_user_id);
create index farm_group_members_user_id_idx on public.farm_group_members(user_id);
create index farm_group_members_group_id_role_idx on public.farm_group_members(group_id, role);
create index farm_group_invites_group_id_idx on public.farm_group_invites(group_id);
create index farm_group_invites_created_by_idx on public.farm_group_invites(created_by);
create index farm_group_invites_active_token_idx on public.farm_group_invites(token_hash) where used_at is null;
create index farm_fields_group_id_display_order_idx on public.farm_fields(group_id, display_order, id);
create index field_seasons_field_id_year_idx on public.field_seasons(field_id, year);
create index field_points_group_id_status_idx on public.field_points(group_id, status);
create index field_points_field_id_idx on public.field_points(field_id);
create index field_points_point_type_idx on public.field_points(point_type);
create index records_group_id_recorded_at_idx on public.records(group_id, recorded_at desc);
create index records_field_id_idx on public.records(field_id);
create index records_point_id_idx on public.records(point_id);
create index records_status_idx on public.records(status);
create index record_media_record_id_idx on public.record_media(record_id);
create index record_comments_record_id_created_at_idx on public.record_comments(record_id, created_at);
create index record_status_events_record_id_created_at_idx on public.record_status_events(record_id, created_at);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger farm_groups_set_updated_at
before update on public.farm_groups
for each row execute function public.set_updated_at();

create or replace function public.prevent_farm_group_owner_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.owner_user_id <> old.owner_user_id then
    raise exception 'farm_groups.owner_user_id cannot be changed in the MVP schema';
  end if;

  return new;
end;
$$;

create trigger farm_groups_prevent_owner_change
before update of owner_user_id on public.farm_groups
for each row execute function public.prevent_farm_group_owner_change();

create trigger farm_fields_set_updated_at
before update on public.farm_fields
for each row execute function public.set_updated_at();

create trigger field_points_set_updated_at
before update on public.field_points
for each row execute function public.set_updated_at();

create trigger records_set_updated_at
before update on public.records
for each row execute function public.set_updated_at();

create trigger record_comments_set_updated_at
before update on public.record_comments
for each row execute function public.set_updated_at();

create or replace function public.validate_field_points_group()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  field_group_id uuid;
begin
  if new.field_id is null then
    return new;
  end if;

  select group_id
    into field_group_id
    from public.farm_fields
   where id = new.field_id;

  if field_group_id is null or field_group_id <> new.group_id then
    raise exception 'field_points.group_id must match farm_fields.group_id';
  end if;

  return new;
end;
$$;

create trigger field_points_validate_group
before insert or update of group_id, field_id on public.field_points
for each row execute function public.validate_field_points_group();

create or replace function public.validate_records_group()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  field_group_id uuid;
  point_group_id uuid;
  season_group_id uuid;
begin
  if new.field_id is not null then
    select group_id
      into field_group_id
      from public.farm_fields
     where id = new.field_id;

    if field_group_id is null or field_group_id <> new.group_id then
      raise exception 'records.group_id must match farm_fields.group_id';
    end if;
  end if;

  if new.point_id is not null then
    select group_id
      into point_group_id
      from public.field_points
     where id = new.point_id;

    if point_group_id is null or point_group_id <> new.group_id then
      raise exception 'records.group_id must match field_points.group_id';
    end if;
  end if;

  if new.season_id is not null then
    select ff.group_id
      into season_group_id
      from public.field_seasons fs
      join public.farm_fields ff on ff.id = fs.field_id
     where fs.id = new.season_id;

    if season_group_id is null or season_group_id <> new.group_id then
      raise exception 'records.group_id must match field_seasons farm_fields.group_id';
    end if;
  end if;

  return new;
end;
$$;

create trigger records_validate_group
before insert or update of group_id, field_id, season_id, point_id on public.records
for each row execute function public.validate_records_group();
