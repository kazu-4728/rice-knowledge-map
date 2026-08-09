-- =============================================================
-- Supabaseアドバイザー指摘の解消
-- 0012_advisor_fixes.sql
--
-- 対象（2026-08-09時点のSecurity/Performance Advisor）:
-- 1) 旧試作テーブル fields / field_logs の削除（両方0件・コード参照なし）
-- 2) RLSポリシー内の auth.uid() を (select auth.uid()) に置換
--    （auth_rls_initplan: 行ごとの再評価を防ぐ）
-- 3) FOR ALL ポリシーがSELECTにも重複適用される問題の解消
--    （multiple_permissive_policies: field_seasons / record_media）
-- 4) 外部キーの未インデックス解消（unindexed_foreign_keys）
-- 5) 変更系RPCの EXECUTE を anon から剥奪
--    （is_group_member / has_group_role はRLS評価で全ロールが呼ぶため維持）
--
-- 注意: authenticated が SECURITY DEFINER 関数を呼べる旨のWARNは
-- 仕様どおり（RLSヘルパーとアプリ用RPC）のため残る。
-- =============================================================

-- ---------- 1) 旧試作テーブル削除 ----------
drop table if exists public.field_logs;
drop table if exists public.fields;

-- ---------- 2) auth.uid() の initplan 化 ----------

drop policy "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (
    id = (select auth.uid())
    or exists (
      select 1
      from public.farm_group_members me
      join public.farm_group_members them on them.group_id = me.group_id
      where me.user_id = (select auth.uid()) and them.user_id = profiles.id
    )
  );

drop policy "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles
  for update using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy "groups_insert" on public.farm_groups;
create policy "groups_insert" on public.farm_groups
  for insert with check (owner_user_id = (select auth.uid()));

drop policy "members_insert" on public.farm_group_members;
create policy "members_insert" on public.farm_group_members
  for insert with check (
    public.has_group_role(group_id, array['owner']::member_role[])
    or (
      user_id = (select auth.uid())
      and role = 'owner'::member_role
      and exists (
        select 1 from public.farm_groups g
        where g.id = farm_group_members.group_id
          and g.owner_user_id = (select auth.uid())
      )
    )
  );

drop policy "members_delete" on public.farm_group_members;
create policy "members_delete" on public.farm_group_members
  for delete using (
    public.has_group_role(group_id, array['owner']::member_role[])
    or user_id = (select auth.uid())
  );

drop policy "invites_insert" on public.farm_group_invites;
create policy "invites_insert" on public.farm_group_invites
  for insert with check (
    public.has_group_role(group_id, array['owner']::member_role[])
    and created_by = (select auth.uid())
  );

drop policy "fields_insert" on public.farm_fields;
create policy "fields_insert" on public.farm_fields
  for insert with check (
    public.has_group_role(group_id, array['owner'::member_role, 'editor'::member_role])
    and created_by = (select auth.uid())
  );

drop policy "points_insert" on public.field_points;
create policy "points_insert" on public.field_points
  for insert with check (
    public.has_group_role(group_id, array['owner'::member_role, 'editor'::member_role])
    and created_by = (select auth.uid())
  );

drop policy "records_insert" on public.records;
create policy "records_insert" on public.records
  for insert with check (
    public.has_group_role(group_id, array['owner'::member_role, 'editor'::member_role])
    and recorded_by = (select auth.uid())
  );

drop policy "comments_insert" on public.record_comments;
create policy "comments_insert" on public.record_comments
  for insert with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.records r
      where r.id = record_comments.record_id
        and public.has_group_role(r.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  );

drop policy "comments_update" on public.record_comments;
create policy "comments_update" on public.record_comments
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy "comments_delete" on public.record_comments;
create policy "comments_delete" on public.record_comments
  for delete using (user_id = (select auth.uid()));

drop policy "status_events_insert" on public.record_status_events;
create policy "status_events_insert" on public.record_status_events
  for insert with check (
    changed_by = (select auth.uid())
    and exists (
      select 1 from public.records r
      where r.id = record_status_events.record_id
        and public.has_group_role(r.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  );

-- ---------- 3) FOR ALL ポリシーのSELECT重複解消 ----------

drop policy "seasons_write" on public.field_seasons;
create policy "seasons_insert" on public.field_seasons
  for insert with check (
    exists (
      select 1 from public.farm_fields f
      where f.id = field_seasons.field_id
        and public.has_group_role(f.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  );
create policy "seasons_update" on public.field_seasons
  for update using (
    exists (
      select 1 from public.farm_fields f
      where f.id = field_seasons.field_id
        and public.has_group_role(f.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  )
  with check (
    exists (
      select 1 from public.farm_fields f
      where f.id = field_seasons.field_id
        and public.has_group_role(f.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  );
create policy "seasons_delete" on public.field_seasons
  for delete using (
    exists (
      select 1 from public.farm_fields f
      where f.id = field_seasons.field_id
        and public.has_group_role(f.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  );

drop policy "media_write" on public.record_media;
create policy "media_insert" on public.record_media
  for insert with check (
    exists (
      select 1 from public.records r
      where r.id = record_media.record_id
        and public.has_group_role(r.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  );
create policy "media_update" on public.record_media
  for update using (
    exists (
      select 1 from public.records r
      where r.id = record_media.record_id
        and public.has_group_role(r.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  )
  with check (
    exists (
      select 1 from public.records r
      where r.id = record_media.record_id
        and public.has_group_role(r.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  );
create policy "media_delete" on public.record_media
  for delete using (
    exists (
      select 1 from public.records r
      where r.id = record_media.record_id
        and public.has_group_role(r.group_id, array['owner'::member_role, 'editor'::member_role])
    )
  );

-- ---------- 4) 外部キーのインデックス追加 ----------

create index if not exists idx_farm_fields_created_by on public.farm_fields (created_by);
create index if not exists idx_invites_created_by on public.farm_group_invites (created_by);
create index if not exists idx_farm_groups_owner on public.farm_groups (owner_user_id);
create index if not exists idx_farm_schedules_group on public.farm_schedules (group_id);
create index if not exists idx_farm_schedules_field on public.farm_schedules (field_id);
create index if not exists idx_farm_schedules_created_by on public.farm_schedules (created_by);
create index if not exists idx_farm_schedules_done_by on public.farm_schedules (done_by);
create index if not exists idx_field_points_created_by on public.field_points (created_by);
create index if not exists idx_site_content_updated_by on public.group_site_content (updated_by);
create index if not exists idx_record_comments_user on public.record_comments (user_id);
create index if not exists idx_status_events_changed_by on public.record_status_events (changed_by);
create index if not exists idx_records_recorded_by on public.records (recorded_by);
create index if not exists idx_records_season on public.records (season_id);

-- ---------- 5) 変更系RPCの anon 実行権剥奪 ----------
-- is_group_member / has_group_role はRLSポリシー評価時に anon 含む
-- 全ロールの権限で実行されるため、剥奪するとRLS付きテーブルの
-- SELECT自体がエラーになる。この2つは対象外。

revoke execute on function public.create_farm_group(text) from anon;
revoke execute on function public.redeem_group_invite(text) from anon;
revoke execute on function public.set_record_status(uuid, record_status, text) from anon;
revoke execute on function public.update_member_role(uuid, uuid, member_role) from anon;
grant execute on function public.create_farm_group(text) to authenticated, service_role;
grant execute on function public.redeem_group_invite(text) to authenticated, service_role;
grant execute on function public.set_record_status(uuid, record_status, text) to authenticated, service_role;
grant execute on function public.update_member_role(uuid, uuid, member_role) to authenticated, service_role;
