/**
 * Movelli Service Worker
 *
 * Strategy:
 *   - Static assets (CSS, JS, SVG, fonts, images, media): cache-first
 *     → served from cache immediately; refreshed in the background.
 *   - HTML pages: network-first, fallback to cache, then offline page
 *     → always try live content; cached copy used when offline.
 *
 * Cache versioning:
 *   CACHE_VERSION is injected at build time by build.js. Changing it busts all
 *   caches on the next activation.
 */

/* BUILD_INJECT:CACHE_VERSION */
const CACHE_VERSION = 'vddf1ac7f09a1';
/* END_BUILD_INJECT */

const STATIC_CACHE = `movelli-static-${CACHE_VERSION}`;
const PAGES_CACHE  = `movelli-pages-${CACHE_VERSION}`;
const OFFLINE_URL  = '/offline/';

// Anything NOT in this set is treated as a page (network-first). `.mjs` was missing, so the four ES
// modules the site loads — the catalog, reveal-core, store, visits-core — were being written into the
// PAGES cache: code, cached the way content is. Harmless but wrong, and it showed up as noise in the
// offline page's list of readable pages.
//
// [known gap, 2026-09-01] VIDEO IS ROUTED HERE BUT CAN NEVER BE STORED. A <video> fetches with HTTP
// RANGE requests, which return 206 Partial Content, and `cache.put()` rejects a partial response
// outright — so the write always fails (quietly, via store()'s catch). `.mp4`/`.webm` being in this
// set is therefore aspirational, not working. Our clips also carry `preload="none"`, so nothing is
// even requested until someone presses play. Caching video means fetching the whole file separately
// and putting THAT — a decision, since these are megabytes.
// [2026-09-26] And a range request no longer reaches this code at all — see the fetch handler.
const STATIC_EXTS = new Set([
  '.css', '.js', '.mjs', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico',
  '.woff2', '.webmanifest', '.mp4', '.webm', '.vtt',
]);

// Shell pre-cached on install so the first offline visit works. Individual
// fetches (not cache.addAll) so one missing asset can't abort installation.
//
// [hard, owner 2026-09-05] NO SCRIPTS. This listed NINE of the 29 modules `main.js` reaches, which
// is the worst of both: it cost a refetch and delivered nothing, because SEVEN of main.js's fifteen
// DIRECT imports were missing and one failed static import takes the whole graph down. So the case
// it was written for — one page loaded, then offline — got a dead hamburger with no <noscript>
// fallback either, since JS is enabled and merely broken.
//
// WHY THE GAP EXISTED AT ALL: a service worker controls a CLIENT, and a page that REGISTERS the
// worker is not controlled by it — the same lifecycle fact `cacheThisPage` in main.js documents for
// the HTML. So on a first visit the whole module graph is fetched uncontrolled and none of it
// reaches `cacheFirst`. From the SECOND navigation the page is controlled and the graph is cached
// for free.
//
// The fix was to DROP the nine, not add the twenty: completing the list means refetching 82 KB
// (brotli) on every first visit, because `cache: 'reload'` below deliberately bypasses the HTTP
// cache — and it buys a working menu in a window where exactly one page is readable, so there is
// nowhere to navigate anyway. Against a stated constraint of low-end phones on slow connections,
// that is the wrong trade. The scripts arrive through `cacheFirst` like every other static asset.
//
// It also deletes a HAND-KEPT LIST, which is what drifted: it named `story-dialog.js` but not
// `assistant-menu.js`, and no `render/` file at all.
// [owner 2026-10-14] THE FONT CUTS THE OFFLINE PAGE NEEDS come from the site config (`fonts`, the cuts marked `precache`), filled in by the build like CACHE_VERSION: they were two names typed here.
/* BUILD_INJECT:FONTS */
const FONT_URLS = ["/_assets/fonts/poppins-400.woff2","/_assets/fonts/poppins-700.woff2"];
/* END_BUILD_INJECT */
const PRECACHE_URLS = [
  '/',
  '/_assets/styles/main.css',
  '/_assets/icons/sprite.svg',
  '/_assets/icons/favicon.svg',
  // The shell's own typeface. The offline page uses --font-sans like every other page, so leaving
  // these out would make the one page that MUST work without a network the only one in a fallback.
  // The SERIF is deliberately absent: this list is the SHELL plus the offline page, and that page is
  // sans-only — so precaching 60 KB of reading face at install would charge every visitor, including
  // one who never opens an article, for something the runtime cache-first rule already picks up on
  // the first page that actually uses it.
  // [2026-10-06] STALE: the serif went on 2026-09-20, so that sentence names a face the stylesheet no
  // longer has. Its third cut, the Poppins ITALIC, is not listed either, and nothing records that as a
  // decision. The offline page does use it: the note under its list of cached pages is italic
  // (measured in Chrome).
  ...FONT_URLS,
  OFFLINE_URL,
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) =>
          // `cache: 'reload'` is load-bearing: a plain fetch() goes through the browser's HTTP cache,
          // so a NEW service worker would fill its fresh cache with the OLD files — the CACHE_VERSION
          // bump busts our cache but not the HTTP cache underneath it.
          fetch(url, { cache: 'reload' })
            .then((res) => { if (res.ok) cache.put(url, res); })
            .catch(() => { /* cached on first real request instead */ })
        )
      )
    ).then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== PAGES_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  // [2026-09-26, owner] A RANGE REQUEST GOES STRAIGHT TO THE NETWORK, untouched. That is how a
  // <video> fetches, and Safari will not play one whose range is answered with the WHOLE file —
  // which is exactly what a cache-first read returns: `caches.match()` ignores the Range header, so
  // any full copy of a clip that ever landed in the cache would be handed to every range request
  // after it. Found on the dev server, which answered ranges with a 200 that then got stored; the
  // same shape is reachable live the day anything fetches a clip without a range.
  if (request.headers.has('range')) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // don't touch cross-origin (affiliate links, etc.)
  // [2026-10-05] THE DEV SERVER'S LIVE-RELOAD STREAM GOES STRAIGHT TO THE NETWORK. `/__reload` is the
  // Server-Sent Events stream `generator/dev.js` holds open. It has no file extension, so it fell to
  // networkFirst — and while the dev server restarted, the catch handed the EventSource the offline
  // page, which it refuses (wrong MIME type), so live reload stopped until the tab was reloaded.
  // Dev-only: nothing a visitor can reach is served at this path.
  if (url.pathname === '/__reload') return;
  // [owner 2026-10-12] THE CMS AND THE DRAFT PREVIEW ARE NEVER THE WORKER'S. `/_cms/**` is behind the login and must show the record as it is now: a stored copy would
  // be a page nobody asked for, and a cache-first CMS script would be one the author cannot get rid of.
  if (url.pathname.startsWith('/_cms/')) return;

  const ext = url.pathname.match(/\.[^./]+$/)?.[0]?.toLowerCase() || '';

  if (STATIC_EXTS.has(ext)) {
    event.respondWith(cacheFirst(event, STATIC_CACHE));
  } else {
    event.respondWith(networkFirst(event, isVisit(request) ? PAGES_CACHE : null));
  }
});

/**
 * Is this request a page the visitor actually OPENED?
 *
 * [owner 2026-09-01] The pages cache is what the offline page lists as "still readable", so a page
 * that was merely PREFETCHED does not belong in it: `movelli-card` prefetches on hover, and a
 * prefetch fetches the HTML and nothing else — so those pages came back with no images and no other
 * subresource, listed as if they were whole.
 *
 * Two shapes count as a visit, and nothing else does:
 *   · `mode: 'navigate'` — the browser navigating, i.e. a full page load.
 *   · nav.js's own header — an in-app swap is a `fetch()`, so its mode is not 'navigate', but it IS
 *     the visitor going to that page.
 * A `<link rel="prefetch">` has neither. It is still SERVED normally and still lands in the browser's
 * HTTP cache, so the prefetch keeps its speed benefit; it simply does not claim to be offline-ready.
 */
function isVisit(request) {
  return request.mode === 'navigate' || request.headers.get('X-Requested-With') === 'movelli-app';
}

/**
 * Write to a cache, keeping the worker ALIVE until the write finishes.
 *
 * [owner 2026-09-01] Both strategies used to do `cache.put(request, response.clone())` without
 * awaiting it and without `event.waitUntil()`. The browser may terminate a service worker as soon as
 * `respondWith`'s promise settles and nothing is pending — and a `put` still draining a cloned body
 * dies with it, silently. That is worst on a FAST server, where the response settles in about a
 * millisecond, which is exactly where it showed: on localhost the pages cache stayed EMPTY however
 * many pages were visited, so nothing was readable offline except the precached shell.
 *
 * `waitUntil` is the whole fix. It does not delay the response; it tells the browser the worker
 * still has work to do.
 *
 * The catch is not defensive noise — `cache.put` genuinely REJECTS for a redirected response, which
 * is reachable in production: Hosting's cleanUrls/trailingSlash redirect `/guides` to `/guides/`, so
 * a visitor arriving at the un-slashed URL throws here. Caching is best-effort and must never break
 * the navigation it rides on. [todo] that page still ends up uncached; storing it means rebuilding
 * the response from its body, which wants verifying against a real deploy.
 */
function store(event, cacheName, request, response) {
  event.waitUntil(
    caches.open(cacheName)
      .then((cache) => cache.put(request, response))
      .catch(() => { /* best-effort: a redirected or partial response cannot be stored */ }),
  );
}

// ── Strategies ────────────────────────────────────────────────────────────────
async function cacheFirst(event, cacheName) {
  const request = event.request;
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) store(event, cacheName, request, response.clone());
    return response;
  } catch {
    return new Response('Asset unavailable offline', { status: 503 });
  }
}

async function networkFirst(event, cacheName) {
  const request = event.request;
  try {
    const response = await fetch(request);
    // `cacheName` is null for a request that is not a visit — served, never stored. See isVisit.
    if (response.ok && cacheName) store(event, cacheName, request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response('You are offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}
