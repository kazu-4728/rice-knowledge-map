-- =============================================================
-- 0002_harden_functions.sql
-- Supabaseセキュリティアドバイザリ対応
-- - trigger関数の search_path を固定 (lint 0011)
-- - SECURITY DEFINER 関数の実行権限を最小化 (lint 0028/0029)
-- =============================================================

-- search_path 固定
alter function public.set_updated_at() set search_path = public;
alter function public.check_point_group_consistency() set search_path = public;
alter function public.check_record_group_consistency() set search_path = public;

-- handle_new_user は auth.users のトリガー専用。API経由の実行を禁止
revoke execute on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

-- RLSヘルパーは authenticated のみ（ポリシー評価で必要）
revoke execute on function public.is_group_member(uuid) from public, anon, authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;

revoke execute on function public.has_group_role(uuid, member_role[]) from public, anon, authenticated;
grant execute on function public.has_group_role(uuid, member_role[]) to authenticated;

-- 招待引き換えはログイン済みユーザーのみ
revoke execute on function public.redeem_group_invite(text) from public, anon, authenticated;
grant execute on function public.redeem_group_invite(text) to authenticated;
