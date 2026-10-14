/**
 * The session visit tracker (A.4.2b) — records the pages seen this session so the pro-active
 * opener can pick a user-type version (see visits-core.mjs + proactive.js). Persisted through
 * store.mjs, which owns every key and states the privacy position once. Records the current page on
 * load; nav.js records each in-app navigation.
 */
import { computeUserType } from './visits-core.mjs';
import * as store from './store.mjs';

export function getVisits() { return store.read('visits', []); }

/** Record a page visit (dedupe a consecutive same-url record). The trail's cap lives in the store's
 *  registry with every other key's — segmentation only needs recency + category spread. */
export function record(url, category) {
  if (!url) return;
  const v = getVisits();
  if (v.length && v[v.length - 1].url === url) return; // reload / re-record of the same page → skip
  v.push({ url, category: category || null });
  store.write('visits', v);
}

/** The current user-type, from the session's visits + the current page's category slug. */
export function userType() {
  const cat = document.querySelector('[data-page]')?.dataset.category || null;
  return computeUserType(getVisits(), cat);
}

// Record the current page on load (before the opener computes its type on scroll-approach).
if (typeof document !== 'undefined') {
  const page = document.querySelector('[data-page]');
  if (page) record(page.dataset.url || location.pathname, page.dataset.category || null);
}
