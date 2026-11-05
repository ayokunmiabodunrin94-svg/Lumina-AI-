/* Lumina AI service worker
 * - Always registered so the app is installable (PWA).
 * - Offline caching is ENABLED ONLY for Opus Ultra accounts (the app tells us via postMessage).
 * - AI APIs (generativelanguage.googleapis.com) are NEVER intercepted or cached.
 */
const SCOPE = self.registration.scope;
const SHELL_CACHE = 'lumina-shell-v1';
const FLAG_CACHE = 'lumina-flag';
const FLAG_URL = SCOPE + '__lumina_offline_flag';
const NEVER_CACHE_HOSTS = ['generativelanguage.googleapis.com'];
const ALLOWED_CROSS_ORIGIN = ['fonts.googleapis.com', 'fonts.gstatic.com'];

const isNever = (url) => NEVER_CACHE_HOSTS.includes(new URL(url).hostname);
const isCacheable = (url) => {
  const u = new URL(url);
  if (isNever(url)) return false;
  return u.origin === self.location.origin || ALLOWED_CROSS_ORIGIN.includes(u.hostname);
};

async function offlineEnabled() {
  const c = await caches.open(FLAG_CACHE);
  return !!(await c.match(FLAG_URL));
}

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = [SHELL_CACHE, FLAG_CACHE];
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !keep.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type !== 'LUMINA_OFFLINE') return;
  event.waitUntil(
    (async () => {
      const flag = await caches.open(FLAG_CACHE);
      if (data.enabled) {
        await flag.put(FLAG_URL, new Response('1'));
        const shell = await caches.open(SHELL_CACHE);
        const urls = [SCOPE, ...(data.urls || [])].filter((u) => {
          try { return isCacheable(u); } catch { return false; }
        });
        await Promise.all(
          urls.map(async (u) => {
            try {
              const res = await fetch(u, { cache: 'reload' });
              if (res && (res.ok || res.type === 'opaque')) await shell.put(u, res);
            } catch { /* ignore */ }
          })
        );
      } else {
        await flag.delete(FLAG_URL);
        await caches.delete(SHELL_CACHE);
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  let url;
  try { url = new URL(req.url); } catch { return; }

  // Never touch AI API traffic (text, image, video polling and video file download).
  if (isNever(req.url)) return;
  if (!isCacheable(req.url)) return;

  event.respondWith(
    (async () => {
      if (!(await offlineEnabled())) return fetch(req);

      const cache = await caches.open(SHELL_CACHE);
      const isNav = req.mode === 'navigate';

      if (isNav) {
        try {
          const res = await fetch(req);
          if (res.ok) cache.put(SCOPE, res.clone());
          return res;
        } catch {
          return (await cache.match(SCOPE)) || (await cache.match(req)) || Response.error();
        }
      }

      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      return cached || (await network) || Response.error();
    })()
  );
});
