import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

/**
 * ブラウザ用Supabaseクライアント（シングルトン）。
 * 環境変数が未設定の場合は null を返し、アプリはダミーデータのデモモードで動く。
 */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}

export function isSupabaseConfigured(): boolean {
  return getSupabase() !== null;
}
