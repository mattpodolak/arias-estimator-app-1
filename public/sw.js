/* ARIAS Estimator service worker — manual, no build step. */
const VERSION = "arias-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const RUNTIME_CACHE = `${VERSION}-runtime`;

const SHELL_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API responses — always go to network.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Navigation requests: network-first, fall back to cached shell.
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const runtime = await caches.open(RUNTIME_CACHE);
          runtime.put(req, fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await caches.match(req);
          if (cached) return cached;
          const shell = await caches.match("/");
          if (shell) return shell;
          return new Response("Offline", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        }
      })(),
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icons/") ||
    /\.(?:js|css|png|svg|jpg|jpeg|webp|woff2?|ttf)$/.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(req);
        const networked = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              caches.open(RUNTIME_CACHE).then((c) => c.put(req, res.clone()));
            }
            return res;
          })
          .catch(() => undefined);
        return cached || (await networked) || new Response("", { status: 504 });
      })(),
    );
  }
});
