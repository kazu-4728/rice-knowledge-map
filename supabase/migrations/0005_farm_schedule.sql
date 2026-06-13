-- 家族共有の作業カレンダー
create table public.farm_schedules (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.farm_groups(id) on delete cascade,
  field_id uuid references public.farm_fields(id) on delete set null,
  title text not null,
  scheduled_date date not null,
  category text not null default 'other',
  -- category: 'water_in' | 'water_out' | 'fertilize' | 'pesticide' | 'weed' | 'harvest' | 'other'
  memo text,
  done boolean not null default false,
  done_at timestamptz,
  done_by uuid references auth.users(id),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.farm_schedules enable row level security;

create policy "schedules_select" on public.farm_schedules
  for select using (public.is_group_member(group_id));

create policy "schedules_insert" on public.farm_schedules
  for insert with check (public.is_group_member(group_id));

create policy "schedules_update" on public.farm_schedules
  for update using (public.is_group_member(group_id));

create policy "schedules_delete" on public.farm_schedules
  for delete using (public.is_group_member(group_id));

-- updated_at 自動更新
create trigger set_farm_schedules_updated_at
  before update on public.farm_schedules
  for each row execute function public.set_updated_at();
