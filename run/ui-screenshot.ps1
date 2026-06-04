$ErrorActionPreference = "Stop"

$script = @'
const fs = require("fs");
const path = require("path");
const { createRequire } = require("module");
const projectRequire = createRequire(path.join(process.cwd(), "package.json"));

async function main() {
  let chromium;
  try {
    chromium = projectRequire("playwright").chromium;
  } catch {
    console.error("Playwright is not installed. Run: npm install -D playwright");
    process.exit(1);
  }

  const baseUrl = process.env.UI_BASE_URL || "http://localhost:3000";
  const base = new URL(baseUrl);
  const routes = (process.env.UI_ROUTES || "/,/map,/records,/menu")
    .split(",")
    .map((route) => route.trim())
    .filter(Boolean)
    .map((route) => ({
      path: route,
      name: route === "/" ? "home" : route.replace(/^\//, "").replace(/[^a-z0-9-]/gi, "-"),
      url: new URL(route, base.origin).toString(),
    }));
  const outDir = path.join(process.cwd(), "tmp", "ui-screenshots");
  fs.mkdirSync(outDir, { recursive: true });

  const viewports = [
    { name: "mobile-390x844", width: 390, height: 844 },
    { name: "tablet-768x1024", width: 768, height: 1024 },
    { name: "desktop-1366x768", width: 1366, height: 768 },
  ];

  const candidates = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  const executablePath = candidates.find((candidate) => fs.existsSync(candidate));
  const launchOptions = executablePath ? { executablePath } : {};
  const browser = await chromium.launch(launchOptions);
  for (const route of routes) {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport });
      await page.goto(route.url, { waitUntil: "networkidle", timeout: 30000 });
      await page.screenshot({ path: path.join(outDir, `${route.name}-${viewport.name}.png`), fullPage: false });
      await page.close();
    }
  }
  await browser.close();
  console.log(`Saved screenshots to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
'@

$tmpScript = Join-Path $env:TEMP "rice-map-ui-screenshot.cjs"
Set-Content -LiteralPath $tmpScript -Value $script -Encoding UTF8
node $tmpScript
