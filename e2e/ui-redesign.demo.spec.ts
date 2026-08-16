import { expect, test } from "@playwright/test";
import path from "node:path";

const screenshotDir =
  process.env.UI_SCREENSHOT_DIR || path.join(process.cwd(), ".test-output", "ui-redesign");

async function waitForImages(page: import("@playwright/test").Page) {
  await page.waitForFunction(() =>
    [...document.images].every((image) => image.complete && image.naturalWidth > 0)
  );
  // RemotePhoto の0.6秒クロスフェードが終わった状態を見た目の証拠として残す。
  await page.waitForTimeout(700);
}

test("ホームは画像から田んぼと知識を探せる", async ({ page }) => {
  await page.goto("/?app=demo");

  await expect(page.getByRole("heading", { name: /見ればわかる/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: "田んぼから探す" })).toBeVisible();
  await expect(page.getByRole("link", { name: /A田.*場所の知識 2件/ })).toBeVisible();
  await expect(page.getByText("今日の田んぼ", { exact: true })).toHaveCount(0);
  await waitForImages(page);

  await page.screenshot({ path: path.join(screenshotDir, "01-home.png") });
});

test("写真と地図ピンが同じ画面で連動し、固定知識を開ける", async ({ page }) => {
  await page.goto("/fields/field-a");

  await expect(page.getByRole("button", { name: "地図で探す" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("ピンと写真は連動します", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "引き継ぐ知識" })).toBeVisible();
  await expect(page.getByText("今年のやり方", { exact: true })).toHaveCount(0);
  await waitForImages(page);

  await page.screenshot({ path: path.join(screenshotDir, "02-field-map-linked.png") });

  await page.getByRole("button", { name: "北側 水路", exact: true }).click();
  await expect(page.getByText("北側 水路", { exact: true }).last()).toBeVisible();

  await page.getByRole("button", { name: "写真で探す", exact: true }).click();
  await expect(page.getByRole("button", { name: "写真で探す" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "東側 入水口", exact: true }).click();
  await waitForImages(page);
  await page.screenshot({ path: path.join(screenshotDir, "03-field-photo-linked.png") });

  await page.getByRole("button", { name: "手順と写真を見る", exact: true }).click();
  const manual = page.getByRole("dialog", { name: /東側 入水口の詳しい手順/ });
  await expect(manual).toBeVisible();
  await expect(manual.getByText("水源は用水路", { exact: true })).toBeVisible();
  await expect(manual.getByText("ゲートが重いので二人で開ける", { exact: true }).first()).toBeVisible();
  await waitForImages(page);
  await page.screenshot({ path: path.join(screenshotDir, "04-manual.png") });
});

test("現場の記録は固定知識を変更せず確認して保存できる", async ({ page }) => {
  await page.goto("/records/new?field=field-a");
  await page.locator('input[type="file"]').setInputFiles(
    path.join(process.cwd(), "public", "assets", "knowledge", "inlet.webp")
  );
  await expect(page.getByAltText("撮影した写真")).toBeVisible();
  await page.getByRole("button", { name: "入水口", exact: true }).click();
  await page.getByRole("textbox").fill("取水口に草が絡んでいたため取り除いた");
  await page.getByRole("button", { name: /次へ/ }).click();

  await expect(page.getByRole("heading", { name: "記録内容の確認" })).toBeVisible();
  await expect(page.getByText("今年の記録として保存", { exact: true })).toBeVisible();
  await expect(page.getByText(/引き継ぐ固定の知識や手順は変更しません/)).toBeVisible();
  await page.screenshot({ path: path.join(screenshotDir, "05-record-confirm.png") });
});
