import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const EXEC = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const BASE = "http://localhost:3100";
const OUT = "/tmp/shots";
mkdirSync(OUT, { recursive: true });

const shots = [
  { name: "01-splash", path: "/", wait: 1500 },
  { name: "02-home", path: "/home", wait: 1200 },
  { name: "03-fields", path: "/fields", wait: 1200 },
  { name: "04-records", path: "/records", wait: 1200 },
  { name: "05-record-new-photo", path: "/records/new", wait: 1000 },
  { name: "06-record-new-audio", path: "/records/new?type=audio", wait: 1000 },
  { name: "07-calendar", path: "/calendar", wait: 1000 },
  { name: "08-export", path: "/export", wait: 1000 },
  { name: "09-menu", path: "/menu", wait: 800 },
];

const browser = await chromium.launch({ executablePath: EXEC, args: ["--no-sandbox"] });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
});
const page = await ctx.newPage();

for (const s of shots) {
  try {
    await page.goto(BASE + s.path, { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(s.wait);
    await page.screenshot({ path: `${OUT}/${s.name}.png` });
    console.log("shot:", s.name);
  } catch (e) {
    console.log("FAIL:", s.name, String(e).slice(0, 120));
  }
}

// 田んぼ詳細: /fields の最初のカードへ遷移して撮る
try {
  await page.goto(BASE + "/fields", { waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);
  const link = page.locator('a[href^="/fields/"]').first();
  if (await link.count()) {
    await link.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/10-field-detail.png` });
    console.log("shot: 10-field-detail", page.url());
  } else {
    console.log("田んぼ詳細リンクなし");
  }
} catch (e) {
  console.log("FAIL field-detail:", String(e).slice(0, 120));
}

await browser.close();
console.log("done");
