import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * ローカル専用のE2E構成（実Supabaseに接続。CI化はスコープ外・別途相談）。
 * 認証済みプロジェクトは e2e/global-setup.ts が生成する .auth/user.json を使う。
 * executablePathは既定でPlaywrightの標準解決に任せる。特定のサンドボックス等、
 * ブラウザのキャッシュ先を明示したい環境だけ環境変数 PW_CHROMIUM_PATH で上書きする。
 *
 * 既知の制限（2026-08-09確認）: Claude Codeのリモート/クラウド実行環境では、
 * ヘッドレスChromiumが起動するブラウザプロセス自体が外部HTTPS（Supabase等）へ
 * 到達できず、資格情報を用意しても net::ERR_CONNECTION_RESET で失敗する
 * （宛先を問わず再現。Node.js/curlの直接通信は同環境でも正常）。
 * ブラウザ側の非同期取得完了を待つテストのみ影響する（静的なUI確認は通る）。
 * この構成をクラウド実行環境で動かす前に、まずこの制限を疑うこと。
 * オーナーのローカル環境では問題なく動作する。
 *
 * 資格情報（.env.local / .env.e2e.local）が無い/失効している場合の再発行手順は
 * e2e/AGENT_BOOTSTRAP.md を参照。
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM_PATH || undefined,
    },
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
    env: {
      ...process.env,
      // E2Eでは本番用の秘密値を使わず、ローカルサーバー専用の値を渡す。
      CRON_SECRET: process.env.CRON_SECRET ?? "e2e-cron-secret",
    },
  },
  projects: [
    {
      name: "anon",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
      testMatch: /anon-.*\.spec\.ts/,
    },
    {
      name: "auth",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        storageState: path.join(__dirname, ".auth/user.json"),
      },
      testMatch: /auth-.*\.spec\.ts/,
    },
    {
      name: "mixed",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 } },
      testMatch: /(deep-link|home-consolidation)\.spec\.ts/,
    },
  ],
});
