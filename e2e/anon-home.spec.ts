import { test, expect } from "./fixtures";

/** 未ログイン状態での / の見え方（ログイン導線が正しく出るか）を確認する */
test.describe("anon home", () => {
  test("ヘッダーにログインボタンが出て、無料ではじめるCTAが機能する", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "ログイン" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "アカウント・設定" })).toHaveCount(0);

    await page.getByRole("link", { name: "無料ではじめる" }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("LINEで共有するバナーは共有シートを開き、未ログイン向けのログイン導線を出す", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "共有をはじめる" }).click();
    await expect(page.getByText("ログインすると田んぼを共有できます")).toBeVisible({ timeout: 10_000 });
  });

  test("320px幅でも機能バナーの文字が縦割れしない", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto("/");
    // 最長のバナー名で確認する。縦割れ（1文字ずつ改行）すると高さが行数分（8行≒170px超）に膨らむ
    const title = page.getByRole("heading", { name: "今日の記録を残す", exact: true }).first();
    await title.scrollIntoViewIfNeeded();
    const box = await title.boundingBox();
    expect(box, "バナータイトルが見つかること").not.toBeNull();
    expect(box!.height, "タイトルが1行に収まること").toBeLessThan(40);
    expect(box!.width).toBeGreaterThan(100);
  });

  test("ホームのバナー名はナビタブの名称と一致する（名前の不一致を作らない）", async ({ page }) => {
    await page.goto("/");
    // ナビ（PC: SideNav）に存在する名称のうち、バナーにも対応するものはそのまま存在すること
    // （場所詳細は「入り口」ではなく「着地先」のため、タブに無いバナーもある）
    for (const label of ["マップ", "記録タイムライン"]) {
      await expect(page.getByRole("heading", { name: label, exact: true }).first()).toBeAttached();
    }
  });
});
