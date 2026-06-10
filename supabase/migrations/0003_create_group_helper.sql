-- =============================================================
-- 0003_create_group_helper.sql
-- グループ作成のブートストラップ用RPC。
-- farm_groups の select ポリシーは「メンバーであること」のため、
-- クライアントからの INSERT ... RETURNING はメンバー登録前に失敗する。
-- グループ作成とowner登録を1トランザクションで行う関数で解決する。
-- =============================================================

create or replace function public.create_farm_group(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  insert into public.farm_groups (name, owner_user_id)
  values (coalesce(nullif(trim(p_name), ''), 'わが家の田んぼ'), auth.uid())
  returning id into v_id;

  insert into public.farm_group_members (group_id, user_id, role)
  values (v_id, auth.uid(), 'owner');

  return v_id;
end;
$$;

revoke execute on function public.create_farm_group(text) from public, anon, authenticated;
grant execute on function public.create_farm_group(text) to authenticated;
