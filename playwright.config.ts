import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * ローカル専用のE2E構成（実Supabaseに接続。CI化はスコープ外・別途相談）。
 * 認証済みプロジェクトは e2e/global-setup.ts が生成する .auth/user.json を使う。
 * executablePathは既定でPlaywrightの標準解決に任せる。特定のサンドボックス等、
 * ブラウザのキャッシュ先を明示したい環境だけ環境変数 PW_CHROMIUM_PATH で上書きする。
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
