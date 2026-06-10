/** UI確認用スクリーンショット（iPhone 14 Pro相当ビューポート） */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const OUT_DIR = process.env.SHOT_DIR ?? "/tmp/shots";

const pages = [
  ["map", "/map"],
  ["home", "/"],
  ["records", "/records"],
  ["record-detail", "/records/record-1"],
  ["menu", "/menu"],
  ["fields", "/fields"],
  ["record-new", "/records/new"],
  ["record-confirm", "/records/new/confirm"],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 393, height: 852 },
  deviceScaleFactor: 2,
  ignoreHTTPSErrors: true,
});
const page = await ctx.newPage();

await mkdir(OUT_DIR, { recursive: true });

for (const [name, path] of pages) {
  // タイル取得が続く /map で networkidle 待ちがハングしないよう domcontentloaded + 固定待機にする
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(name === "map" ? 9000 : 1200);
  await page.screenshot({ path: `${OUT_DIR}/${name}.png` });
  console.log(`captured ${name}`);
}

await browser.close();
