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

  test("LINEで家族に共有するバナーは共有シートを開き、未ログイン向けのログイン導線を出す", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /LINEで家族に共有するを共有する/ }).click();
    await expect(page.getByText("ログインすると田んぼを共有できます")).toBeVisible({ timeout: 10_000 });
  });
});
