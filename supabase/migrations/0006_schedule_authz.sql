-- 予定表(farm_schedules)の権限・整合性ハードニング
-- レビュー指摘対応:
--  (P1) 書き込みは owner/editor のみに制限（0005 では is_group_member で viewer も書き込めた）
--  (P2) field_id は同一グループの farm_fields のみ参照できるよう整合性トリガーを追加
--       （field_points / records と同じ仕組みに揃える）

-- ---------- 書き込みを owner/editor に限定 ----------
drop policy if exists "schedules_insert" on public.farm_schedules;
drop policy if exists "schedules_update" on public.farm_schedules;
drop policy if exists "schedules_delete" on public.farm_schedules;

create policy "schedules_insert" on public.farm_schedules
  for insert with check (public.has_group_role(group_id, array['owner', 'editor']::member_role[]));

create policy "schedules_update" on public.farm_schedules
  for update using (public.has_group_role(group_id, array['owner', 'editor']::member_role[]));

create policy "schedules_delete" on public.farm_schedules
  for delete using (public.has_group_role(group_id, array['owner', 'editor']::member_role[]));

-- select は引き続き全メンバー閲覧（schedules_select は 0005 のまま）

-- ---------- field_id の group 整合性 ----------
create or replace function public.check_schedule_group_consistency()
returns trigger
language plpgsql
as $$
declare
  v_field_group uuid;
begin
  if new.field_id is not null then
    select group_id into v_field_group from public.farm_fields where id = new.field_id;
    if v_field_group is distinct from new.group_id then
      raise exception 'farm_schedules.group_id must match farm_fields.group_id';
    end if;
  end if;
  return new;
end;
$$;

-- search_path 固定（0002 のハードニング方針に合わせる, lint 0011）
alter function public.check_schedule_group_consistency() set search_path = public;

create trigger trg_farm_schedules_group_check
  before insert or update on public.farm_schedules
  for each row execute function public.check_schedule_group_consistency();
