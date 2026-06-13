const CACHE = 'agroclub-v1';
const SHELL = ['./', './index.html', './login.html', './manifest.json',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) =>
    Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // No cachear datos en vivo (Firebase, Stripe, Google APIs, fuentes externas dinámicas)
  if (!url.origin.includes(location.origin)) return;
  // Navegación (HTML): network-first para no servir versiones viejas
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => {
      const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return r;
    }).catch(() => caches.match(req).then((m) => m || caches.match('./index.html'))));
    return;
  }
  // Resto (íconos, css, etc.): cache-first
  e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => {
    const copy = r.clone();
    if (r.ok) caches.open(CACHE).then((c) => c.put(req, copy));
    return r;
  })));
});
