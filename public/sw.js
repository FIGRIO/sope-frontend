// Versioned caches so the app can invalidate and refresh cached assets safely.
const CACHE_VERSION = "sope-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const CATALOG_CACHE = `${CACHE_VERSION}-catalog`;

const STATIC_ASSET_PATTERNS = [
    /\.(?:css|js|png|jpg|jpeg|svg|ico|webp|gif|avif)$/i,
];

const PUBLIC_CATALOG_PREFIXES = [
    "/api/products",
    "/api/recommendations",
];

// Sensitive or user-specific APIs must bypass caching and always hit the network.
const BYPASS_CACHE_PATHS = [
    "/api/auth",
    "/api/cart",
    "/api/orders",
    "/api/payment",
    "/api/admin",
    "/api/chat",
    "/ws/",
];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(["/", "/manifest.json"])));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== CATALOG_CACHE)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Only standard GET requests are eligible for caching.

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    const isStaticAsset = STATIC_ASSET_PATTERNS.some((pattern) => pattern.test(url.pathname));
    const isCatalogRequest = PUBLIC_CATALOG_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
    const shouldBypass = BYPASS_CACHE_PATHS.some((prefix) => url.pathname.startsWith(prefix));

    if (shouldBypass) {
        event.respondWith(fetch(request));
        return;
    }

    if (isStaticAsset) {
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
        return;
    }

    if (isCatalogRequest) {
        event.respondWith(networkFirst(request, CATALOG_CACHE));
        return;
    }
});

async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    const networkPromise = fetch(request)
        .then((response) => {
            if (response && response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch(() => cachedResponse);

    return cachedResponse || networkPromise;
}

async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch {
        const cachedResponse = await cache.match(request);
        return cachedResponse || fetch(request);
    }
}
