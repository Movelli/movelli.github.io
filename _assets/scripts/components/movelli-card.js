/**
 * <movelli-card> — progressive enhancement for a content card.
 *
 * The card is fully server-rendered as a real <a>, so it works with zero JS. This upgrade adds a
 * speculative prefetch of the destination, so the navigation feels instant.
 *
 * [owner 2026-09-01] WITH AN INTENT DELAY, on hover AND on focus. Both fired immediately before, so
 * sweeping the pointer across a grid — or tabbing down it — sent a request per card, almost all of
 * them wasted. 200ms is long enough that a pass-over does not count and short enough to still win
 * most of the latency: it starts while the pointer is settling, well before the click. (It was 120;
 * the owner raised it, and it may go higher — the number is one constant, to be tuned by watching.)
 *
 * IT WARMS THE DESTINATION'S IMAGE TOO, not just its HTML. The document is a couple of KB and the
 * band at the top of it is tens — so the image is what the next page's first paint actually waits
 * for, and with a cross-document view transition it is worse than slow: the new document's snapshot
 * is taken before first render, so an unloaded band could be captured as an EMPTY BOX and the card
 * morph into nothing. [owner 2026-10-13] That half was never fed (nothing set the data it reads) until now:
 * the build gives each card the linked page's hero (`data-hero-image`). It helps when a card is hovered or
 * focused; a tap, or a link in a text, is not warmed, and whether the snapshot ever misses the image is not measured.
 *
 * A detached `new Image()` with `srcset` + `sizes` is the mechanism, not a `<link rel=prefetch>`:
 * `imagesrcset`/`imagesizes` are defined for `rel=preload`, and preload is for the CURRENT document.
 * Setting srcset on an Image makes the browser run its own candidate selection and fetch the file it
 * would pick — the same one the destination will pick, since the viewport is the same — straight into
 * the HTTP cache. `fetchPriority = 'low'` so it never competes with the page being read.
 *
 * `pointercancel` matters as much as `pointerleave`: on touch it is what fires when the browser
 * decides a gesture is a SCROLL, which is the case that would otherwise prefetch a card per swipe.
 *
 * Deliberately not on `pointerdown` — it fires before the browser knows whether a touch is a tap or
 * a scroll, so on a phone it would fire on most scrolls to save about 100ms on a tap.
 */
const INTENT_MS = 200;

class MovelliCard extends HTMLElement {
  connectedCallback() {
    const link = this.querySelector('a[href]');
    if (!link) return;
    // Bound for this connection only — moving the element disconnects and reconnects it, and the
    // listeners go with the first and come back with the second. See the component checklist.
    this.listening?.abort();
    this.listening = new AbortController();
    const { signal } = this.listening;

    let timer = null;
    let done = false;
    const cancel = () => { clearTimeout(timer); timer = null; };
    const arm = () => {
      if (done || timer) return;
      timer = setTimeout(() => {
        timer = null;
        done = true;
        const l = document.createElement('link');
        l.rel = 'prefetch';
        l.href = link.href;
        document.head.appendChild(l);
        warmHeroImage(this);
      }, INTENT_MS);
    };

    this.addEventListener('pointerenter', arm, { signal });
    this.addEventListener('pointerleave', cancel, { signal });
    this.addEventListener('pointercancel', cancel, { signal });   // touch: the gesture became a scroll
    link.addEventListener('focus', arm, { signal });
    link.addEventListener('blur', cancel, { signal });
  }

  disconnectedCallback() { this.listening?.abort(); }
}

/**
 * Fetch the candidate the destination's hero will choose, into the HTTP cache.
 *
 * [owner 2026-10-13] The build says what the hero will be (`data-hero-image`: `{ srcset, sizes?, sources? }`, from the linked page's own layouts — `generator/image-keys.js`). A hero with several
 * shapes is a `<picture>`, so the file it takes depends on the window: the first `<source>` whose `media` matches wins, as in the page, and the `<img>`'s own `srcset` is the rest. Choosing
 * with `matchMedia` here is what makes the file warmed the file the page will pick; a detached `Image` given the `<img>`'s `srcset` alone would warm the narrow shape for a visitor on a wide window.
 *
 * Skipped entirely when the visitor has asked for less data: this is a GUESS about where they are
 * going, and a hero is tens of KB against the document's couple.
 */
function warmHeroImage(card) {
  if (!card.dataset.heroImage || (navigator.connection && navigator.connection.saveData)) return;
  let hero;
  try { hero = JSON.parse(card.dataset.heroImage); } catch { return; }          // the build wrote it; a page that was changed on the way warms nothing
  const chosen = (Array.isArray(hero.sources) ? hero.sources : []).find((s) => s && s.media && window.matchMedia(s.media).matches) || hero;
  if (!chosen.srcset) return;
  const img = new Image();
  img.fetchPriority = 'low';        // never compete with the page being read
  if (chosen.sizes) img.sizes = chosen.sizes;
  img.srcset = chosen.srcset;       // last: setting it is what starts the selection and the fetch
}

customElements.define('movelli-card', MovelliCard);
