-- =============================================================
-- 0009_set_record_status.sql
-- 記録の状態変更（records.status の更新 + record_status_events への履歴追加）を
-- 単一トランザクションで行うRPC。
--
-- 背景（tasks/TASKS.md 現在タスク PR1 制約2・2026-07-24 案Bで決定）:
--   これまで resolveRecord() は「records の UPDATE」と「record_status_events の INSERT」を
--   別リクエストで実行しており、後者だけが失敗すると状態は進むのに履歴が欠けた。
--   履歴を画面に表示する以上、この欠落・矛盾は表示にそのまま現れる。
--   また同時更新時に、同じ from_status を持つ矛盾した履歴が並ぶ可能性もあった。
--   redeem_group_invite と同じ「1つのSQL関数でまとめて行う」パターンで解決する。
--
-- 適用はユーザー承認後のみ（docs/NEGATIVE_ACTIONS.md）。
-- =============================================================

create or replace function public.set_record_status(
  p_record_id uuid,
  p_to_status public.record_status,
  p_comment text default null
)
returns public.record_status_events
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record public.records%rowtype;
  v_event public.record_status_events;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '28000';
  end if;

  -- 行ロックを取ってから現在値を読む。同時に2人が変更しても
  -- from_status が実際の直前値と食い違う履歴は生まれない
  select * into v_record
  from public.records
  where id = p_record_id
  for update;

  if not found then
    raise exception 'record not found' using errcode = 'P0002';
  end if;

  -- security definer のため RLS は適用されない。
  -- records_update / status_events_insert と同じ owner/editor 判定を関数内で明示的に行う
  if not public.has_group_role(v_record.group_id, array['owner', 'editor']::member_role[]) then
    raise exception 'permission denied' using errcode = '42501';
  end if;

  -- 同じ状態への変更は履歴を増やさない（二度押し・再送の吸収）
  if v_record.status = p_to_status then
    return null;
  end if;

  update public.records
  set status = p_to_status
  where id = p_record_id;

  insert into public.record_status_events (record_id, from_status, to_status, changed_by, comment)
  values (
    p_record_id,
    v_record.status::text,
    p_to_status::text,
    auth.uid(),
    nullif(btrim(coalesce(p_comment, '')), '')
  )
  returning * into v_event;

  return v_event;
end;
$$;

-- 実行はログイン済みユーザーのみ（0002 の方針に合わせる）
revoke execute on function public.set_record_status(uuid, public.record_status, text)
  from public, anon, authenticated;
grant execute on function public.set_record_status(uuid, public.record_status, text)
  to authenticated;
