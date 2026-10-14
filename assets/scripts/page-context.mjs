/**
 * THE PAGE'S OWN FACTS — what the page element (`[data-page]`) says about the page it is, read in one place.
 *
 * A global util, like `store.mjs`: any part may import it, and none holds the `[data-page]` selector or its `data-*` names itself. The engine writes
 * those attributes (`page-renderer.js`); this is where the interface is stated.
 */

// Compact engaged-context cap — keep the /ask body small; the server re-caps defensively.
const PAGE_EXCERPT_MAX = 600;

const collapse = (s) => String(s || '').replace(/\s+/g, ' ').trim();

/** The compact context of the page the visitor is reading — sent with each engaged /ask so the AI can resolve "it"/"this" and answer in context
 *  (grounding stays on the retrieved results). Null on a page without the page element. */
export function pageContext() {
  const page = document.querySelector('[data-page]');
  if (!page) return null;
  return {
    title: page.dataset.title || '',
    url: page.dataset.url || '',
    category: page.dataset.category || '',
    description: document.querySelector('meta[name="description"]')?.content || '',
    excerpt: collapse(page.textContent).slice(0, PAGE_EXCERPT_MAX),
  };
}
