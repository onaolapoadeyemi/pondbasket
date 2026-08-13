const CACHE = "pondbasket-shell-v2";
const APP_SHELL = ["/", "/shop", "/legal", "/manifest.webmanifest"];
self.addEventListener("install", event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())));
self.addEventListener("activate", event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || event.request.url.includes("/api/")) return;
  const url = new URL(event.request.url);
  const acceptsHtml = event.request.headers.get("accept")?.includes("text/html");
  if (acceptsHtml || url.pathname.startsWith("/src/") || url.pathname.startsWith("/@")) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match("/"))));
});
