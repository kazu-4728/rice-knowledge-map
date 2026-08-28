import { test, expect } from "./fixtures";

const endpoint = "/api/cron/supabase-keepalive";
const cronSecret = process.env.CRON_SECRET ?? "e2e-cron-secret";

test.describe("Supabase稼働維持Cron", () => {
  test("認証なしではDBに接続せず拒否する", async ({ request }) => {
    const response = await request.get(endpoint);

    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({ ok: false });
  });

  test("認証済みではデータを取得しないRPCを実行する", async ({ request }) => {
    const response = await request.get(endpoint, {
      headers: { authorization: `Bearer ${cronSecret}` },
    });

    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, probes: 3 });
  });
});
