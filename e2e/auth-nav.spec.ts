import { test, expect } from "./fixtures";

/**
 * ログイン済み状態でのナビゲーション一貫性を確認する（authプロジェクト:
 * playwright.config.ts の storageState で e2e/global-setup.ts が生成した
 * 認証済みセッションを使う）。
 */
test.describe("authenticated nav", () => {
  test("/ は今日のダッシュボードになり、アカウントアイコンが出る（ログインボタンは出ない）", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: "アカウント" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "今日の田んぼ" })).toBeVisible();
    await expect(page.getByRole("link", { name: "ログイン" })).toHaveCount(0);
  });

  test("ホームのボトムタブからマップへ1タップで移動できる", async ({ page }) => {
    await page.goto("/");
    const tabBar = page.getByRole("navigation", { name: "メインタブ" });
    await expect(tabBar).toBeVisible({ timeout: 10_000 });
    // dev環境ではハイドレーション完了前のクリックが稀に取りこぼされるため一拍待つ
    await page.waitForLoadState("networkidle").catch(() => {});
    await tabBar.getByRole("link", { name: "マップ" }).click();
    await expect(page).toHaveURL("/map", { timeout: 10_000 });
  });

  test("/login を直接開くとログイン済みのため / へ戻される", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL("/", { timeout: 5000 });
  });

  for (const path of ["/map", "/records", "/menu", "/guide"]) {
    test(`${path} のボトムタブにホームがあり1タップで戻れる`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(500);
      const tabBar = page.getByRole("navigation", { name: "メインタブ" });
      await tabBar.getByRole("link", { name: "ホーム" }).click();
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

  test("場所詳細はこの田んぼだけの詳細になり、台帳セクションからマップへ移動できる", async ({ page }) => {
    // Phase 1で作成したE2E検証専用グループの田んぼ。
    // 2026-08-09オーナー指摘: 場所詳細に他の田んぼへの切替チップがあると
    // 「この田んぼだけの詳細」になっておらず分かりにくいため廃止した。
    // 2026-08-11オーナー指摘（UIUXブラッシュアップ）: 台帳は縦長の見出し付きカードから
    // 名前・面積・状態が分かる1行のヘッダーに変わったため、常設の「設備ポイント」見出しで
    // 台帳セクションの表示を確認する。
    await page.goto("/fields/264a9c76-5908-4001-a313-5d20447354d6");
    await expect(page.getByRole("heading", { name: "設備ポイント" })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('a[aria-current="page"][href^="/fields/"]')).toHaveCount(0);
    await page.getByRole("link", { name: "マップで開く" }).first().click();
    await expect(page).toHaveURL(/\/map/);
  });

  test("記録詳細から親（場所詳細 or タイムライン）へ戻れる", async ({ page }) => {
    // Phase 1で作成したE2E検証専用グループの記録（本番オーナーの実データとはRLSで分離）
    await page.goto("/records/ede9f6b5-d5d1-477f-8cc5-397eede5b20b");
    await page.getByRole("button", { name: "戻る" }).waitFor({ timeout: 10_000 });
    // 親導線: 場所詳細へのリンク（field付き記録）または「記録タイムラインに戻る」が常設されている
    const parentLink = page.locator('a[href^="/fields/"], a[href="/records"]').first();
    await expect(parentLink).toBeVisible();
  });
});
