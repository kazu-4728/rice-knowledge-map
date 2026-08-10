/**
 * .env.local / .env.e2e.local を書き出す（実値はこのファイルに一切含まない）。
 * 値は環境変数経由でのみ受け取る。呼び出し元（Claude Codeセッション）が
 * Supabase MCP接続で取得・生成した値をその場で渡すことを想定している
 * （e2e/AGENT_BOOTSTRAP.md参照）。書き出し先はともに.gitignore対象。
 *
 * 使い方:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... E2E_EMAIL=... E2E_PASSWORD=... \
 *     node scripts/e2e-write-env.mjs
 */
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const { SUPABASE_URL, SUPABASE_ANON_KEY, E2E_EMAIL, E2E_PASSWORD } = process.env;

const REQUIRED_KEYS = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "E2E_EMAIL", "E2E_PASSWORD"];

const missing = REQUIRED_KEYS.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`MISSING ENV: ${missing.join(", ")}`);
  process.exit(1);
}

// 値に改行が含まれると.envファイルへの行注入（別キーの意図しない追加・上書き）になるため拒否する
const invalid = REQUIRED_KEYS.filter((k) => /[\r\n]/.test(process.env[k]));
if (invalid.length > 0) {
  console.error(`INVALID ENV (改行を含む): ${invalid.join(", ")}`);
  process.exit(1);
}

// 既存の.env.localに他のキー（将来追加され得る設定）があれば壊さないよう、
// Supabase関連の2行だけを置き換える形でマージする
function mergeEnvFile(filePath, updates) {
  const lines = existsSync(filePath) ? readFileSync(filePath, "utf8").split("\n") : [];
  const keys = Object.keys(updates);
  const seen = new Set();
  const merged = lines
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const eq = line.indexOf("=");
      const key = eq === -1 ? null : line.slice(0, eq).trim();
      if (key && keys.includes(key)) {
        seen.add(key);
        return `${key}=${updates[key]}`;
      }
      return line;
    });
  for (const key of keys) {
    if (!seen.has(key)) merged.push(`${key}=${updates[key]}`);
  }
  writeFileSync(filePath, merged.join("\n") + "\n");
}

mergeEnvFile(path.join(root, ".env.local"), {
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
});
mergeEnvFile(path.join(root, ".env.e2e.local"), {
  E2E_TEST_EMAIL: E2E_EMAIL,
  E2E_TEST_PASSWORD: E2E_PASSWORD,
});

console.log("WROTE .env.local, .env.e2e.local");
