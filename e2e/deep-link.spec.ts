import { test, expect, applySandboxProxyRelay } from "./fixtures";
import path from "node:path";

/**
 * LINE共有等のディープリンクは / を経由せず直接着地することを確認する
 * (Issue #69/#70の「ゲートなしで即座に見える」方針の維持を検証する)。
 * このファイルはmixedプロジェクトで実行され、storageStateは既定でアタッチされないため、
 * 認証済みコンテキストはテスト内で明示的に作成する。
 */
const AUTH_STATE = path.join(__dirname, "..", ".auth", "user.json");
// Phase 1で作成したE2E検証専用グループの田んぼ（本番オーナーの実データとはRLSで分離）
const TEST_FIELD_ID = "264a9c76-5908-4001-a313-5d20447354d6";

test("未ログインで田んぼの共有リンクを直接開くと、/ を経由せず直接着地し、ログイン導線が出る", async ({ page }) => {
  await page.goto(`/fields/${TEST_FIELD_ID}`);
  await expect(page).toHaveURL(`/fields/${TEST_FIELD_ID}`);
  await expect(page.getByText("ログインしていないため表示できない可能性があります")).toBeVisible();
  await expect(page.getByRole("link", { name: "ログインする" })).toBeVisible();
});

test("ログイン済みで田んぼの共有リンクを直接開くと、/ を経由せず詳細が表示される", async ({ browser }) => {
  const context = await browser.newContext({ storageState: AUTH_STATE });
  await applySandboxProxyRelay(context);
  const page = await context.newPage();
  await page.goto(`/fields/${TEST_FIELD_ID}`);
  await expect(page).toHaveURL(`/fields/${TEST_FIELD_ID}`);
  await expect(page.getByText("田んぼが見つかりません")).toHaveCount(0);
  await context.close();
});
