const CACHE_PREFIX = "aster-hrt-converter-";
const CACHE_NAME = `${CACHE_PREFIX}v2.0.0`;
const APP_SHELL = [
  "./", "./index.html", "./guide.html", "./assets/styles.css", "./assets/app.js",
  "./assets/worksheet.js", "./assets/guide.js", "./assets/lucide.min.js",
  "./assets/icon.svg", "./assets/icon-192.png", "./assets/icon-512.png",
  "./src/converter.js", "./src/worksheet.js", "./src/female-ranges.js",
  "./src/hrt-targets.js", "./manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME)
    .then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;
  if (!requestUrl.href.startsWith(self.registration.scope)) return;
  const canonicalUrl = new URL(requestUrl.pathname, self.location.origin).href;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(event.request);
        if (response.ok) await cache.put(canonicalUrl, response.clone());
        return response;
      } catch {
        // Match the actual page so guide navigation cannot overwrite the app shell.
        return (await cache.match(canonicalUrl)) || (await cache.match("./index.html")) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch { return Response.error(); }
  })());
});
