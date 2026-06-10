/** UI確認用スクリーンショット（iPhone 14 Pro相当ビューポート） */
import { chromium } from "playwright";

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

for (const [name, path] of pages) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(name === "map" ? 9000 : 600);
  await page.screenshot({ path: `/tmp/shots/${name}.png` });
  console.log(`captured ${name}`);
}

await browser.close();
