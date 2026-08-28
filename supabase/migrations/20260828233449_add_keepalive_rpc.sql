-- Supabase無料枠の稼働維持専用RPC
-- 利用者データやテーブルには一切アクセスしない。
create function public.keepalive()
returns void
language sql
security invoker
set search_path = pg_catalog
as $$
  select 1;
$$;

-- 新規関数に付与される既定のPUBLIC実行権を明示的に剥奪し、
-- Cronが使用する匿名キーと通常ログイン利用者だけに限定する。
revoke all on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated;
