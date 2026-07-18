import { test, expect } from "./fixtures";
import { HOME_BANNERS } from "../src/features/home/homeBanners";

/**
 * /home 統合の構造そのものを確認する（ログイン状態を問わない）。
 * HOME_BANNERSは唯一の説明ソースのため、リンク先が実在するルートに解決することを
 * ここで機械的に確認し、ルート変更時の説明文とのズレ（宙に浮いたリンク）を検知する。
 */
test.describe("home consolidation", () => {
  test("/home は / へリダイレクトする", async ({ page }) => {
    await page.goto("/home");
    await expect(page).toHaveURL("/");
  });

  test("PWA manifest の start_url が / である", async ({ request }) => {
    const res = await request.get("/manifest.webmanifest");
    expect(res.ok()).toBeTruthy();
    const manifest = await res.json();
    expect(manifest.start_url).toBe("/");
  });

  test("HOME_BANNERS の遷移先はすべて実在するルートに解決する", async ({ request }) => {
    const linkHrefs = HOME_BANNERS.filter((b) => b.action.type === "link").map(
      (b) => (b.action as { type: "link"; href: string }).href.split("?")[0]
    );
    for (const href of linkHrefs) {
      const res = await request.get(href);
      expect(res.status(), `${href} が200を返すこと`).toBeLessThan(400);
    }
  });
});
