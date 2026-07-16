import fs from "node:fs";
import path from "node:path";

/** .env形式(KEY=VALUE)を最小限だけ読み、未設定のprocess.envにだけ反映する（既存値は上書きしない） */
function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

/** .env.local（Supabase接続情報）と.env.e2e.local（テストアカウントの認証情報、gitignore対象）を読み込む */
export function loadE2EEnv() {
  const root = path.resolve(__dirname, "..");
  loadEnvFile(path.join(root, ".env.local"));
  loadEnvFile(path.join(root, ".env.e2e.local"));
}
