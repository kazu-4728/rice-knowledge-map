/**
 * E2E資格情報の生存確認（実値は一切出力しない）。
 * .env.local / .env.e2e.local が揃っていて、かつ実際にログインできるかだけを判定する。
 * Claude Codeセッションがまたぐたびに「本当にSecrets登録が必要か」を確認する用途
 * （e2e/AGENT_BOOTSTRAP.md参照）。
 *
 * 使い方: node scripts/e2e-check-auth.mjs
 * 終了コード: 0=ログイン成功（このまま `npx playwright test` を実行してよい）
 *            1=ファイル不足 or ログイン失敗（e2e/AGENT_BOOTSTRAP.mdの手順で再発行が必要）
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// e2e/env.ts（globalSetupが使う実際の読み込み処理）と同じ優先順位にする:
// 既にprocess.envに値がある場合はファイルの値で上書きしない。
// ここが食い違うと、このチェッカーが返す`OK`が実際にPlaywrightが使う資格情報と一致しなくなる。
function loadEnvFile(filePath, target) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (target[key] === undefined) target[key] = value;
  }
}

const env = { ...process.env };
loadEnvFile(path.join(root, ".env.local"), env);
loadEnvFile(path.join(root, ".env.e2e.local"), env);

const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, E2E_TEST_EMAIL, E2E_TEST_PASSWORD } = env;

const missing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "E2E_TEST_EMAIL", "E2E_TEST_PASSWORD"]
  .filter((k) => !env[k]);

if (missing.length > 0) {
  console.log(`MISSING: ${missing.join(", ")}`);
  process.exit(1);
}

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { error } = await supabase.auth.signInWithPassword({
  email: E2E_TEST_EMAIL,
  password: E2E_TEST_PASSWORD,
});

if (error) {
  console.log(`LOGIN_FAILED: ${error.message}`);
  process.exit(1);
}

// この確認はglobalSetupとは別セッションを都度発行するだけなので、
// 確認用に作った現在のセッションだけ終了させ、未使用セッションが溜まらないようにする
await supabase.auth.signOut({ scope: "local" });

console.log("OK");
process.exit(0);
