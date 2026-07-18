import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { loadE2EEnv } from "./env";

/**
 * E2Eテスト用の認証済みstorageStateを生成する（Playwright globalSetup）。
 * テストアカウントは既存のE2E検証用グループ（本番オーナーの実データとはRLSで分離）を再利用する。
 * 資格情報は .env.e2e.local（gitignore対象・リポジトリに含めない）から読む。
 */
export default async function globalSetup() {
  loadE2EEnv();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!url || !anonKey || !email || !password) {
    throw new Error(
      "E2Eテストにはローカルの.env.localとE2E_TEST_EMAIL/E2E_TEST_PASSWORDを含む.env.e2e.localが必要です（ともにgitignore対象）。"
    );
  }

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`E2Eテストアカウントのログインに失敗しました: ${error?.message}`);
  }

  // ref.supabase.co -> ref
  const ref = new URL(url).hostname.split(".")[0];
  const storageKey = `sb-${ref}-auth-token`;

  const storageState = {
    cookies: [],
    origins: [
      {
        origin: "http://localhost:3000",
        localStorage: [{ name: storageKey, value: JSON.stringify(data.session) }],
      },
    ],
  };

  const authDir = path.resolve(__dirname, "..", ".auth");
  fs.mkdirSync(authDir, { recursive: true });
  fs.writeFileSync(path.join(authDir, "user.json"), JSON.stringify(storageState, null, 2));
}
