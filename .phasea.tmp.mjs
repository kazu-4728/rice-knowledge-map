import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 393, height: 852 } });
const pause = (ms) => page.waitForTimeout(ms);

await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
await pause(1500);
console.log("login demo card:", await page.getByText("デモモードで動作中です").count());
await page.screenshot({ path: "/tmp/a-login.png" });

await page.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
await pause(1500);
console.log("weather removed:", await page.getByText("24°C").count() === 0, "schedule removed:", await page.getByText("今日の予定").count() === 0);
await page.screenshot({ path: "/tmp/a-home.png" });

await page.goto("http://localhost:3000/menu", { waitUntil: "domcontentloaded" });
await pause(1500);
console.log("menu coming-soon badges:", await page.getByText("準備中").count(), "sync removed:", await page.getByText("同期ステータス").count() === 0);
await page.screenshot({ path: "/tmp/a-menu.png" });

await page.goto("http://localhost:3000/records", { waitUntil: "domcontentloaded" });
await pause(1500);
const before = await page.locator('a[href^="/records/"]').count();
await page.getByText("音声", { exact: true }).click();
await pause(800);
const after = await page.locator('a[href^="/records/"]').count();
console.log("filter works:", before, "->", after);
await page.locator('input[type="search"]').fill("中田");
await pause(800);
console.log("search results:", await page.locator('a[href^="/records/"]').count());
await page.screenshot({ path: "/tmp/a-records.png" });

await page.goto("http://localhost:3000/map", { waitUntil: "domcontentloaded" });
await pause(3500);
console.log("map chips removed:", await page.getByText("圃場", { exact: true }).count() === 0);
console.log("detail disabled:", await page.getByText("詳細（準備中）").count());
await page.screenshot({ path: "/tmp/a-map.png" });

await browser.close();
console.log("done");
