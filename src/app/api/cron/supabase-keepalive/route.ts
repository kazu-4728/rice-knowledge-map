import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 10;

const PROBE_COUNT = 3;

function isAuthorized(authorization: string | null, secret: string | undefined): boolean {
  if (!authorization || !secret) return false;

  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authorization);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/**
 * Supabase Free Planの低アクティビティ停止を避けるための、Vercel Cron専用エンドポイント。
 *
 * - CRON_SECRETで認証されたリクエストだけを受け付ける
 * - 既存の公開用キーだけを使用し、service_roleは使用しない
 * - 専用RPCで定数評価だけを行い、利用者データ・件数を取得、返却、記録しない
 * - SECURITY INVOKERの関数だけを呼び、既存テーブルのRLSは変更しない
 * - 1回の日次Cronで固定3回の独立したプローブだけを同時に実行する
 * - 失敗時の再試行・自己呼び出し・書き込みは行わない
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!isAuthorized(request.headers.get("authorization"), cronSecret)) {
    return Response.json({ ok: false }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const supabase = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const probes = await Promise.all(
    Array.from({ length: PROBE_COUNT }, () => supabase.rpc("keepalive"))
  );

  if (probes.some(({ error }) => error)) {
    return Response.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  return Response.json(
    { ok: true, probes: PROBE_COUNT },
    { headers: { "Cache-Control": "no-store" } }
  );
}
