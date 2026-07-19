import { test, expect } from "./fixtures";

/**
 * ログイン済み状態でのナビゲーション一貫性を確認する（authプロジェクト:
 * playwright.config.ts の storageState で e2e/global-setup.ts が生成した
 * 認証済みセッションを使う）。
 */
test.describe("authenticated nav", () => {
  test("/ を開いても離脱せず、アカウントアイコンが出る（ログインボタンは出ない）", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "アカウント・設定" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ログイン" })).toHaveCount(0);
  });

  test("/login を直接開くとログイン済みのため / へ戻される", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL("/", { timeout: 5000 });
  });

  for (const path of ["/map", "/records", "/menu", "/guide"]) {
    test(`${path} からロゴタップで / に1タップで戻れる`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(500);
      const homeLink = page.getByRole("link", { name: "ホームへ戻る" }).first();
      await homeLink.click();
      await expect(page).toHaveURL("/");
    });
  }

  test("/talk は記録タイムライン（/records）へリダイレクトする（旧URL互換）", async ({ page }) => {
    await page.goto("/talk");
    await expect(page).toHaveURL("/records");
  });

  test("/fields は一覧タブを持たずマップ（/map）へリダイレクトする（旧URL互換）", async ({ page }) => {
    await page.goto("/fields");
    await expect(page).toHaveURL("/map");
  });

  test("記録詳細（独自ヘッダー）からもホームへ戻れる", async ({ page }) => {
    // Phase 1で作成したE2E検証専用グループの記録（本番オーナーの実データとはRLSで分離）
    await page.goto("/records/ede9f6b5-d5d1-477f-8cc5-397eede5b20b");
    await page.waitForTimeout(500);
    await page.getByRole("link", { name: "ホームへ戻る" }).first().click();
    await expect(page).toHaveURL("/");
  });
});
