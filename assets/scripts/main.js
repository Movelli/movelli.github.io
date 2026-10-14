/**
 * Movelli — main.js
 *
 * The site is fully functional with zero JavaScript: content is server-rendered
 * semantic HTML, navigation is plain links, and the app-like page transitions
 * are handled declaratively by the browser (CSS `@view-transition`).
 *
 * This script is pure progressive enhancement:
 *   - registers the native Web Components, which upgrade already-rendered markup
 *   - registers the Service Worker for offline support and asset caching
 *   - makes the two skip links close every open dialog (skip-link.js)
 *
 * Loaded as <script type="module"> (deferred by spec), after first paint.
 */
import './components/movelli-card.js';
import './components/movelli-comparison-table.js';
import './components/movelli-video.js';
import './components/movelli-banner.js';
import './components/movelli-form.js';
import './components/movelli-related-pages.js';
import './components/movelli-blocks.js';
// THE ASSISTANT IS ONE IMPORT, because it is one element. Its internals — the panel, the
// transcript, the segment drawer, the reveal, the clear-history coordinator — are imported by the
// element itself and are nothing this file (or any other) has to know about. See
// `assistant/movelli-assistant.js`.
import './assistant/movelli-assistant.js';
import './visits.js';
import './proactive.js';
import './nav-back.js';
import './skip-link.js';

// [2026-10-06] THE 404's SUGGESTIONS ARE A COMPONENT, `related-pages` (owner, OUTSTANDING 7), imported
// above like every component that carries behaviour — so this file still has no branch that knows
// which page uses it. It cannot load from a page's `assets` instead, as `not-found.js` did:
// `movelli-blocks.js` would define the element first, as a passive one, and a second define() for one
// name throws.
// [owner 2026-09-05] Before that they were a dynamic import here, gated on `.not-found-page` — a
// page-specific branch in the script every page runs, kept dynamic so the 404's code stayed off
// everyone else's critical path — and then `scripts/not-found.js` in the 404's own `assets`.

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(cacheThisPage)
      .catch(() => { /* Offline support unavailable — the site works fine without it. */ });
  });
}

/**
 * Store the page the visitor ARRIVED on.
 *
 * [owner 2026-09-01] The first page of a session is the one page that never got cached, so it was
 * missing from the offline list while every page browsed after it was there. The cause is the
 * lifecycle, not a bug: a document that registers the service worker is NOT controlled by it, so its
 * own request never passed through the fetch handler. (A hard reload is uncontrolled for the same
 * reason — see the dev-server notes.)
 *
 * Once the worker is active and has claimed this client, re-requesting the page DOES go through it,
 * and networkFirst stores it like any other. One small HTML request, once per session, and only
 * when the page is not already cached — a returning visitor pays nothing.
 *
 * [owner 2026-09-05] THE OFFLINE PAGE IS NO LONGER SKIPPED HERE. It used to be, because it had no
 * `[data-page]` — it is a real `pages` item now and carries one like every other page. So opening
 * /offline/ directly while online does store it, and the rule that matters ("not a page anyone chose
 * to visit") lives where it is actually enforced instead: `src/offline/list.js` excludes /offline/
 * from the list it builds. That holds however the page reached the cache, where a rule here would
 * only have held for one route in.
 */
async function cacheThisPage() {
  if (!('caches' in window) || !document.querySelector('[data-page]')) return;
  try {
    await navigator.serviceWorker.ready;
    // `ready` means there is an ACTIVE worker; it does not mean this client is controlled yet.
    // clients.claim() delivers that as a controllerchange, so wait for it rather than assume.
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => {
        const done = () => resolve();
        navigator.serviceWorker.addEventListener('controllerchange', done, { once: true });
        setTimeout(done, 3000);                      // never hang on a claim that does not come
      });
    }
    if (!navigator.serviceWorker.controller) return;
    // [hard] LOOK IN THE PAGES CACHE ONLY. `caches.match()` searches EVERY cache, and `/` is
    // PRECACHED into the static one — so on the homepage this returned early, the page never reached
    // the pages cache, and it was missing from the offline list even though the visitor started
    // there. The two caches mean different things: static is the shell, pages is what you opened.
    const names = (await caches.keys()).filter((n) => n.startsWith('movelli-pages-'));
    for (const n of names) if (await (await caches.open(n)).match(location.href)) return;
    // The header is what marks this as a VISIT — the same one nav.js sends. Without it the worker
    // treats this like a prefetch and (correctly) refuses to store it. See isVisit in sw.js.
    await fetch(location.href, { headers: { 'X-Requested-With': 'movelli-app' } });
  } catch { /* best-effort: the page works whether or not it is available offline later */ }
}
