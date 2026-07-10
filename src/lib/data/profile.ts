import { getSupabase } from "../supabase/client";

/**
 * 自分のプロフィール（profiles）のデータ層。
 * display_name はサインアップ時にメールアドレスの@前が自動設定されるため、
 * 「今日の流れ」等で誰の投稿か分かるよう、本人が名前に変更できるようにする。
 */

/** 自分の表示名を取得する。未ログイン・デモ環境は null */
export async function loadMyDisplayName(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: sessionData } = await sb.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;
  const { data } = await sb
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  return data?.display_name ?? null;
}

/**
 * 自分の表示名を更新する。RLS（profiles_update）により本人の行のみ更新できる。
 * 家族の一覧・タイムラインで折り返さない長さに制限する。
 */
export async function updateMyDisplayName(name: string): Promise<{ error: string | null }> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "表示名を入力してください" };
  if (trimmed.length > 20) return { error: "表示名は20文字以内にしてください" };

  const sb = getSupabase();
  if (!sb) return { error: "デモ環境では変更できません" };
  const { data: sessionData } = await sb.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return { error: "ログインが必要です" };

  const { error } = await sb
    .from("profiles")
    .update({ display_name: trimmed })
    .eq("id", user.id);
  return { error: error?.message ?? null };
}
