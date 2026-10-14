/**
 * User-type segmentation (A.4.2b) — the PURE rule, isomorphic (no DOM/storage) so the Node
 * test suite can `require` it and the browser can `import` it. The visit tracker (visits.js)
 * feeds it the session's page visits; the pro-active opener (proactive.js) picks its version
 * by the returned type. A rule-based SCRIPT, not AI (the recorded pro-active-content model).
 *
 * `visits` — the session's pages so far (current page recorded first), each `{ url, category }`
 * (category = the slug, or null for uncategorised pages). `currentCategory` — the current page's
 * category slug (or null).
 */
export function computeUserType(visits, currentCategory) {
  const list = Array.isArray(visits) ? visits : [];
  if (list.length <= 1) return 'landed';                       // first page of the session
  const cats = new Set(list.map((v) => v && v.category).filter(Boolean));
  if (cats.size >= 2) return 'exploring';                      // pages across multiple categories
  if (currentCategory && cats.has(currentCategory)) return 'focused'; // deep in one category
  return 'exploring';                                          // 2+ pages, no clear single-category focus
}
