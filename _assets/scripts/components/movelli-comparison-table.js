/**
 * <movelli-comparison-table> — progressive enhancement for a comparison table.
 *
 * Wraps a real, semantic <table> (works with zero JS and is fully accessible).
 * When the table overflows horizontally on narrow screens, this makes the
 * scroll container keyboard-focusable and labels it, so keyboard users can
 * scroll it and screen readers announce it as a scrollable region.
 *
 * [hard, fixed 2026-09-13] IT MEASURES AND MARKS `.comparison-table__body`, NOT `this`.
 * `overflow-x: auto` sits on that inner box, so the custom element itself NEVER overflows —
 * `this.scrollWidth > this.clientWidth` was false at every viewport, and the whole affordance had
 * been dead since it was written. Marking the outer element would have been wrong twice over even
 * if the measurement had passed: focus has to land on the element that actually scrolls, or the
 * arrow keys do nothing.
 * MEASURED in a real headless Chrome on /test/ at a 320px viewport — the record suspected this and
 * this is the number: the OUTER element is 280 wide with a 280 scrollWidth (zero overflow, at every
 * viewport), while the INNER box is 280 wide with a 413 scrollWidth — 133px that could not be
 * reached by keyboard at all. After the fix the inner box carries tabindex/role/aria-label and takes
 * the ordinary focus ring; the outer element carries neither.
 *
 * [hard] A SCROLL CONTAINER HOLDING ONLY TEXT IS NOT RELIABLY KEYBOARD-SCROLLABLE WITHOUT THIS.
 * Chrome makes such a region focusable on its own; other engines historically do not, which leaves a
 * wide table unreachable by keyboard. `tabindex="0"` plus the accessible name is the portable answer.
 */
import { copy } from '../copy-data.mjs';

/* [owner 2026-09-18] THE HINT IS COPY, and it was a hardcoded English string here until this date —
   a sentence a screen reader speaks, in one language, in a file. Read once at module scope, like
   movelli-video.js's own label: the page's locale cannot change under it.
   The caption is joined to it with an EM DASH and that is deliberate: the house separator is a pipe
   for TITLE-like joins, and this is a sentence about a table rather than a title. */
const HINT = copy('comparison_scroll_hint');

class MovelliCompare extends HTMLElement {
  connectedCallback() {
    this.box = this.querySelector('.comparison-table__body');
    if (!this.box) return;

    // [owner 2026-09-18] IT IS MEASURED AGAIN WHEN THE BOX CHANGES SIZE, and until this date it was
    // not: one `connectedCallback` plus one rAF, no observer and no resize listener, while the
    // comment below has always said "a resize, a font-size change". The condition is a LIVE one —
    // rotate a phone, widen a window, raise the browser's default font — and the answer was frozen
    // at load. So a table could be scrollable with no tab stop, or carry one with nothing to scroll,
    // for the rest of the page's life.
    // The observer replaces the rAF rather than joining it: ResizeObserver delivers a first callback
    // when it starts observing, after layout, which is what the rAF was for. Where it is missing,
    // the rAF is the one-shot fallback.
    // [hard] IT CANNOT LOOP. The callback writes `tabindex`, `role` and `aria-label` — three
    // attributes that change no geometry — so it can never resize what it observes.
    if (window.ResizeObserver) {
      this.ro = new ResizeObserver(() => this.sync());
      this.ro.observe(this.box);
    } else {
      requestAnimationFrame(() => this.sync());
    }
  }

  disconnectedCallback() {
    this.ro?.disconnect();
    this.ro = null;
  }

  sync() {
    const box = this.box;
    if (!box) return;
    if (box.scrollWidth > box.clientWidth + 1) {
      box.setAttribute('tabindex', '0');
      box.setAttribute('role', 'region');
      const caption = this.querySelector('caption');
      box.setAttribute('aria-label', `${caption ? caption.textContent.trim() + ' — ' : ''}${HINT}`);
      return;
    }
    // It can stop overflowing — a resize, a font-size change — and a focusable region with
    // nothing to scroll is a tab stop that leads nowhere.
    // …unless the visitor is standing in it. Removing `tabindex` from the focused element drops
    // focus to <body>, so someone who had tabbed into the table and then widened the window would
    // lose their place. A stale tab stop until the next resize is the smaller harm, and the next
    // sync clears it.
    if (box.contains(document.activeElement)) return;
    box.removeAttribute('tabindex');
    box.removeAttribute('role');
    box.removeAttribute('aria-label');
  }
}

customElements.define('movelli-comparison-table', MovelliCompare);
