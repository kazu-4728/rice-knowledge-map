/* みらい稲作管理 Service Worker
 * ハッシュ付き静的アセットとアイコンのみキャッシュする保守的な構成。
 * HTMLや地図タイルはキャッシュしない（常に最新を取得）。
 */
const CACHE_NAME = "rkm-static-v2";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  const isImmutableAsset =
    url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
  if (!isImmutableAsset) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
  );
});
