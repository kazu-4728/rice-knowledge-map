import { test as base, type BrowserContext } from "@playwright/test";

/**
 * このヘルパーはClaude Codeのリモートサンドボックス環境でのみ必要な回避策で、
 * 実運用（オーナーのマシン・将来のCI）では不要かつ設定しない。
 * サンドボックスのエージェントプロキシがブラウザからの*.supabase.co直接アクセスを
 * 許可しないため、検証時だけ PW_SANDBOX_PROXY_RELAY=1 を指定してNode側の
 * プロキシ対応fetch（NODE_USE_ENV_PROXY=1と併用）経由でリレーする。
 */
export async function applySandboxProxyRelay(context: BrowserContext) {
  if (process.env.PW_SANDBOX_PROXY_RELAY !== "1") return;
  await context.route("**://*.supabase.co/**", async (route) => {
    const req = route.request();
    try {
      const postData = req.postDataBuffer();
      const res = await fetch(req.url(), {
        method: req.method(),
        headers: req.headers(),
        body: ["GET", "HEAD"].includes(req.method()) || !postData ? undefined : new Uint8Array(postData),
      });
      const body = Buffer.from(await res.arrayBuffer());
      const headers = Object.fromEntries(res.headers.entries());
      delete headers["content-encoding"];
      delete headers["content-length"];
      await route.fulfill({ status: res.status, headers, body });
    } catch {
      await route.abort();
    }
  });
}

export const test = base.extend({
  context: async ({ context }, runTest) => {
    await applySandboxProxyRelay(context);
    await runTest(context);
  },
});

export { expect } from "@playwright/test";
