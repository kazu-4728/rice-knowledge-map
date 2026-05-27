-- RLS and explicit Data API grants for the core MVP tables.
-- Supabase Data API exposure is opt-in for new projects from 2026-05-30:
-- keep anon table access closed, and expose authenticated access through RLS.

create or replace function public.is_group_member(target_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    exists (
      select 1
        from public.farm_group_members m
       where m.group_id = target_group_id
         and m.user_id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.has_group_role(target_group_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    exists (
      select 1
        from public.farm_group_members m
       where m.group_id = target_group_id
         and m.user_id = auth.uid()
         and m.role = any(allowed_roles)
    ),
    false
  );
$$;

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

create policy "profiles are readable by signed-in users"
on public.profiles for select
to authenticated
using (true);

create policy "users create their own profile"
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

create policy "users update their own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy "group members can read groups"
on public.farm_groups for select
to authenticated
using (public.is_group_member(id));

create policy "users can create owned groups"
on public.farm_groups for insert
to authenticated
with check (owner_user_id = (select auth.uid()));

create policy "group owners can update groups"
on public.farm_groups for update
to authenticated
using (public.has_group_role(id, array['owner']))
with check (public.has_group_role(id, array['owner']));

create policy "group members can read memberships"
on public.farm_group_members for select
to authenticated
using (public.is_group_member(group_id));

create policy "group owners can manage memberships"
on public.farm_group_members for all
to authenticated
using (public.has_group_role(group_id, array['owner']))
with check (public.has_group_role(group_id, array['owner']));

create policy "users can create their initial owner membership"
on public.farm_group_members for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'owner'
  and exists (
    select 1
      from public.farm_groups g
     where g.id = group_id
       and g.owner_user_id = (select auth.uid())
  )
);

create policy "group owners can read invites"
on public.farm_group_invites for select
to authenticated
using (public.has_group_role(group_id, array['owner']));

create policy "group owners can create invites"
on public.farm_group_invites for insert
to authenticated
with check (
  public.has_group_role(group_id, array['owner'])
  and created_by = (select auth.uid())
);

create policy "group owners can update invites"
on public.farm_group_invites for update
to authenticated
using (public.has_group_role(group_id, array['owner']))
with check (public.has_group_role(group_id, array['owner']));

create policy "group owners can delete invites"
on public.farm_group_invites for delete
to authenticated
using (public.has_group_role(group_id, array['owner']));

create policy "group members can read fields"
on public.farm_fields for select
to authenticated
using (public.is_group_member(group_id));

create policy "group editors can create fields"
on public.farm_fields for insert
to authenticated
with check (
  public.has_group_role(group_id, array['owner', 'editor'])
  and created_by = (select auth.uid())
);

create policy "group editors can update fields"
on public.farm_fields for update
to authenticated
using (public.has_group_role(group_id, array['owner', 'editor']))
with check (public.has_group_role(group_id, array['owner', 'editor']));

create policy "group owners can delete fields"
on public.farm_fields for delete
to authenticated
using (public.has_group_role(group_id, array['owner']));

create policy "group members can read seasons"
on public.field_seasons for select
to authenticated
using (
  exists (
    select 1
      from public.farm_fields f
     where f.id = field_id
       and public.is_group_member(f.group_id)
  )
);

create policy "group editors can create seasons"
on public.field_seasons for insert
to authenticated
with check (
  exists (
    select 1
      from public.farm_fields f
     where f.id = field_id
       and public.has_group_role(f.group_id, array['owner', 'editor'])
  )
);

create policy "group editors can update seasons"
on public.field_seasons for update
to authenticated
using (
  exists (
    select 1
      from public.farm_fields f
     where f.id = field_id
       and public.has_group_role(f.group_id, array['owner', 'editor'])
  )
)
with check (
  exists (
    select 1
      from public.farm_fields f
     where f.id = field_id
       and public.has_group_role(f.group_id, array['owner', 'editor'])
  )
);

create policy "group owners can delete seasons"
on public.field_seasons for delete
to authenticated
using (
  exists (
    select 1
      from public.farm_fields f
     where f.id = field_id
       and public.has_group_role(f.group_id, array['owner'])
  )
);

create policy "group members can read points"
on public.field_points for select
to authenticated
using (public.is_group_member(group_id));

create policy "group editors can create points"
on public.field_points for insert
to authenticated
with check (
  public.has_group_role(group_id, array['owner', 'editor'])
  and created_by = (select auth.uid())
);

create policy "group editors can update points"
on public.field_points for update
to authenticated
using (public.has_group_role(group_id, array['owner', 'editor']))
with check (public.has_group_role(group_id, array['owner', 'editor']));

create policy "group owners can delete points"
on public.field_points for delete
to authenticated
using (public.has_group_role(group_id, array['owner']));

create policy "group members can read records"
on public.records for select
to authenticated
using (public.is_group_member(group_id));

create policy "group editors can create records"
on public.records for insert
to authenticated
with check (
  public.has_group_role(group_id, array['owner', 'editor'])
  and recorded_by = (select auth.uid())
);

create policy "group editors can update records"
on public.records for update
to authenticated
using (public.has_group_role(group_id, array['owner', 'editor']))
with check (public.has_group_role(group_id, array['owner', 'editor']));

create policy "group owners can delete records"
on public.records for delete
to authenticated
using (public.has_group_role(group_id, array['owner']));

create policy "group members can read record media"
on public.record_media for select
to authenticated
using (
  exists (
    select 1
      from public.records r
     where r.id = record_id
       and public.is_group_member(r.group_id)
  )
);

create policy "group editors can create record media"
on public.record_media for insert
to authenticated
with check (
  exists (
    select 1
      from public.records r
     where r.id = record_id
       and public.has_group_role(r.group_id, array['owner', 'editor'])
  )
);

create policy "group editors can update record media"
on public.record_media for update
to authenticated
using (
  exists (
    select 1
      from public.records r
     where r.id = record_id
       and public.has_group_role(r.group_id, array['owner', 'editor'])
  )
)
with check (
  exists (
    select 1
      from public.records r
     where r.id = record_id
       and public.has_group_role(r.group_id, array['owner', 'editor'])
  )
);

create policy "group owners can delete record media"
on public.record_media for delete
to authenticated
using (
  exists (
    select 1
      from public.records r
     where r.id = record_id
       and public.has_group_role(r.group_id, array['owner'])
  )
);

create policy "group members can read comments"
on public.record_comments for select
to authenticated
using (
  exists (
    select 1
      from public.records r
     where r.id = record_id
       and public.is_group_member(r.group_id)
  )
);

create policy "group members can create comments"
on public.record_comments for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
      from public.records r
     where r.id = record_id
       and public.is_group_member(r.group_id)
  )
);

create policy "comment authors can update comments"
on public.record_comments for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "comment authors or group owners can delete comments"
on public.record_comments for delete
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
      from public.records r
     where r.id = record_id
       and public.has_group_role(r.group_id, array['owner'])
  )
);

create policy "group members can read status events"
on public.record_status_events for select
to authenticated
using (
  exists (
    select 1
      from public.records r
     where r.id = record_id
       and public.is_group_member(r.group_id)
  )
);

create policy "group editors can create status events"
on public.record_status_events for insert
to authenticated
with check (
  changed_by = (select auth.uid())
  and exists (
    select 1
      from public.records r
     where r.id = record_id
       and public.has_group_role(r.group_id, array['owner', 'editor'])
  )
);

revoke all on function public.set_updated_at() from public;
revoke all on function public.prevent_farm_group_owner_change() from public;
revoke all on function public.validate_field_points_group() from public;
revoke all on function public.validate_records_group() from public;
revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.has_group_role(uuid, text[]) from public;

grant execute on function public.is_group_member(uuid) to authenticated, service_role;
grant execute on function public.has_group_role(uuid, text[]) to authenticated, service_role;

grant usage on schema public to anon, authenticated, service_role;

revoke all on table
  public.profiles,
  public.farm_groups,
  public.farm_group_members,
  public.farm_group_invites,
  public.farm_fields,
  public.field_seasons,
  public.field_points,
  public.records,
  public.record_media,
  public.record_comments,
  public.record_status_events
from anon;

grant select, insert, update, delete on table
  public.profiles,
  public.farm_groups,
  public.farm_group_members,
  public.farm_group_invites,
  public.farm_fields,
  public.field_seasons,
  public.field_points,
  public.records,
  public.record_media,
  public.record_comments,
  public.record_status_events
to authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.farm_groups,
  public.farm_group_members,
  public.farm_group_invites,
  public.farm_fields,
  public.field_seasons,
  public.field_points,
  public.records,
  public.record_media,
  public.record_comments,
  public.record_status_events
to service_role;

notify pgrst, 'reload schema';
