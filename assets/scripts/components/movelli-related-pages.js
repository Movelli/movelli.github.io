/**
 * <movelli-related-pages> — the pages most like the one the visitor asked for, as cards under a lead line.
 *
 * [owner 2026-10-06] IT WAS `src/scripts/not-found.js`, which the 404 loaded on its own and which found its
 * page by the page's class (OUTSTANDING 7). The owner, 2026-09-07: *"The code belongs to that component so
 * it shouldn't be in a not-found.js but be included in the component JS file. The fact that the path we
 * pass to /ask as query is a path for which no page exists is not relevant."* So it is a catalog component
 * now, placed by the 404's data where the script used to insert its suggestions, and it fills its own box.
 *
 * IT ALWAYS SEARCHES WITH THE PAGE'S OWN ADDRESS (owner, 2026-10-06: no query setting until one is
 * needed — *"we can add a query setting later if/when we see the need"*). Firebase Hosting serves
 * `404.html` AT the requested URL with a 404 status — it does not redirect — so on the 404
 * `location.pathname` IS the broken path and nothing has to be passed to the page. (The dev server does the
 * same, so this is testable locally.)
 *
 * `model: false` is deliberate: retrieval ONLY, with no LLM call. A 404 is hit by stale inbound links,
 * typos and dead bookmarks — traffic we do not control — and a generative answer would spend a Gemini call
 * on every one. The vector search is what finds the match either way; only the sentence around it would
 * have cost anything.
 *
 * [decided 2026-09-03, owner] IT ASKS FOR COMPONENTS, NOT DATA. Turning results into cards is the server's
 * job, where `askGenerative` already does it. The caller names the card PRESET, so the server has no
 * component choice hardcoded in it.
 *
 * Progressive enhancement, like everything else here: the build ships the box empty and hidden, so with no
 * JS, offline, or with nothing found, there is nothing on the page and no gap where it would be. Nothing
 * above it moves when it fills; what is below it does, which is the one place the 404 departs from the
 * layout-shift-free rule — the suggestion is the most useful thing on the page, so it comes before the
 * general ways out, not after them.
 */
import { renderComponent } from '../render/renderers.mjs';
import { esc } from '../catalog/esc.mjs';
import { pluralize } from '../copy-data.mjs';

const MAX_CARDS = 3;    // one row — a wall of weak matches is worse than a short list
const MAX_WORDS = 12;   // a path longer than this is machine noise, not a page anyone asked for

/**
 * A URL path → a search query: `/best-travel-esim-japan/` → `best travel esim japan`.
 *
 * Separators are the only structure a path has, so `/`, `-`, `_` and `.` all become spaces. A segment with
 * no letter in it — an id, a date, a page number — is dropped: it matches nothing in a vector index and only
 * dilutes the words that do.
 *
 * Returns `''` when there is nothing worth searching for, which is the caller's signal to stay quiet rather
 * than to guess. A wrong suggestion is worse than none.
 *
 * Exported so the suite can run it. (It was the pure half of the 404 script, in `not-found-core.mjs`; it is
 * the component's own code, so it lives in the component's file.)
 */
export function pathToQuery(pathname) {
  const words = String(pathname || '')
    .replace(/\.[a-z0-9]{1,5}$/i, '')          // a trailing extension is not part of the subject
    .split(/[/\-_.]+/)
    .filter((w) => /[a-z]/i.test(w));
  return words.length && words.length <= MAX_WORDS ? words.join(' ') : '';
}

class MovelliRelatedPages extends HTMLElement {
  connectedCallback() {
    // ONCE per element. Moving it is a disconnect and a connect, and a move must not search again.
    if (this.searched) return;
    this.searched = true;
    this.search().catch(() => { /* related pages are optional — the page works without them */ });
  }

  /** Ask `/ask` for cards, and draw them under the lead line. Nothing found, or no answer: stay hidden. */
  async search() {
    const query = pathToQuery(location.pathname);
    if (!query) return;

    let components;
    try {
      const res = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, output: 'components', model: false, limit: MAX_CARDS }),
      });
      if (!res.ok) return;
      ({ components } = await res.json());
    } catch {
      return;                                       // offline, or the function is down — say nothing
    }
    // [owner 2026-10-05] Cards on their own, as in the chat — no card grid around them.
    const cards = (components || []).filter((c) => c && typeof c.type === 'string' && c.type.split('--')[0] === 'card');
    if (!cards.length) return;

    // A PARAGRAPH, not a heading: it is one line of the page's own copy, in the same voice as the sentence
    // above it — a heading would announce a section where there is only a question. Its forms are the
    // component's content, on the root as data (see the renderer); the number of cards picks one, since
    // "one of these" over a single card is wrong. The attribute hands back plain text, so it is escaped
    // before it becomes the prose's markup — whoever builds a config makes its strings safe.
    const forms = Object.fromEntries([['one', this.dataset.leadOne], ['other', this.dataset.leadOther]]
      .filter(([, text]) => text != null));
    const lead = forms.other != null ? pluralize(forms, cards.length) : '';
    this.querySelector('.related-pages__body').innerHTML =
      (lead ? renderComponent({ type: 'prose', html: `<p>${esc(lead)}</p>` }) : '')
      + cards.map((c) => renderComponent(c)).join('');
    this.hidden = false;
  }
}

customElements.define('movelli-related-pages', MovelliRelatedPages);
