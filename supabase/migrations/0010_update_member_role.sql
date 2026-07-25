-- =============================================================
-- 0010_update_member_role.sql
-- メンバーの権限変更（人数確認+更新）を単一トランザクションで行うRPC。
--
-- 背景（Codexレビュー指摘・PR #80）:
--   updateMemberRole()（members.ts）はこれまで「owner人数のSELECT」→「role のUPDATE」を
--   別リクエストで行っていた。異なる端末の2人のownerがほぼ同時に互いを降格すると、
--   両方の事前SELECTが「ownerは2人いる」を観測してから、更新対象は別行なので
--   両方のUPDATEが成功してしまい、owner不在になり得る（レースコンディション）。
--   このグループは以後、権限変更・招待発行・グループ更新がすべて出来ず自己回復不能になる
--   （制約3の受入条件「最後のownerは降格できない」を満たさない）。
--   set_record_status（0009）と同じ「行ロック付きRPCで直列化する」パターンで解決する。
--
-- 適用はユーザー承認後のみ（docs/NEGATIVE_ACTIONS.md）。
-- =============================================================

create or replace function public.update_member_role(
  p_group_id uuid,
  p_target_user_id uuid,
  p_next_role public.member_role
)
returns public.farm_group_members
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.farm_group_members%rowtype;
  v_owner_count integer;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  -- members_update と同じ判定（owner のみ）を関数内で明示的に行う（security definer のためRLSは効かない）
  if not public.has_group_role(p_group_id, array['owner']::member_role[]) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  -- グループの全メンバー行をロックしてから人数確認と更新を行う。
  -- ロックせずに「owner人数」を確認すると、複数のownerがほぼ同時に互いを降格した場合に
  -- 両方が「まだ2人いる」を観測して両方成功し、owner不在になり得るため
  perform 1 from public.farm_group_members where group_id = p_group_id for update;

  select * into v_target
  from public.farm_group_members
  where group_id = p_group_id and user_id = p_target_user_id;

  if not found then
    raise exception 'member not found' using errcode = 'P0002';
  end if;

  -- 同じロールへの変更は何もしない（呼び出し側の冪等性のため）
  if v_target.role = p_next_role then
    return v_target;
  end if;

  if v_target.role = 'owner' and p_next_role <> 'owner' then
    select count(*) into v_owner_count
    from public.farm_group_members
    where group_id = p_group_id and role = 'owner';
    if v_owner_count <= 1 then
      raise exception 'last owner cannot be demoted' using errcode = 'LSTOW';
    end if;
  end if;

  update public.farm_group_members
  set role = p_next_role
  where group_id = p_group_id and user_id = p_target_user_id
  returning * into v_target;

  return v_target;
end;
$$;

-- 実行はログイン済みユーザーのみ（0002 の方針に合わせる）
revoke execute on function public.update_member_role(uuid, uuid, public.member_role)
  from public, anon, authenticated;
grant execute on function public.update_member_role(uuid, uuid, public.member_role)
  to authenticated;
