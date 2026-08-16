import { defineConfig, devices } from "@playwright/test";
import os from "node:os";
import path from "node:path";

const screenshotDir =
  process.env.UI_SCREENSHOT_DIR || path.join(process.cwd(), ".test-output", "ui-redesign");

export default defineConfig({
  testDir: "./e2e",
  testMatch: /ui-redesign\.demo\.spec\.ts/,
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  timeout: 30_000,
  outputDir: path.join(os.tmpdir(), "rice-knowledge-map-playwright"),
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3011",
    viewport: { width: 390, height: 844 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx next dev -H 127.0.0.1 -p 3011",
    url: "http://127.0.0.1:3011",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    },
  },
  metadata: { screenshotDir },
});
