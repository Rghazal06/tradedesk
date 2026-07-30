const CACHE_NAME = 'tradedesk-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/dashboard',
  '/quotes',
  '/invoices',
  '/jobs',
  '/offline',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail — pages may not be built yet
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip API routes and Supabase calls — always fresh
  const url = new URL(event.request.url);
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('stripe')
  ) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful page navigations
        if (event.request.mode === 'navigate' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline fallback: serve cached version if available
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Return a minimal offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return new Response(
              `<!DOCTYPE html><html><head><meta charset="utf-8"><title>TradeDesk — Offline</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>body{font-family:-apple-system,sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;}
              .card{background:white;border:1px solid #e5e7eb;border-radius:12px;padding:40px;text-align:center;max-width:360px;}
              h1{color:#111;font-size:20px;margin:0 0 8px;}p{color:#6b7280;font-size:14px;}
              .logo{width:48px;height:48px;background:#16a34a;border-radius:12px;display:flex;align-items:center;justify-content:center;color:white;font-weight:800;font-size:18px;margin:0 auto 20px;}</style>
              </head><body><div class="card"><div class="logo">TD</div>
              <h1>You're offline</h1><p>Connect to the internet to access TradeDesk.</p></div></body></html>`,
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});
