/**
 * LOCALE RESOLUTION — the one walk, isomorphic.
 *
 * [hard] It lives HERE, in `src/scripts/`, rather than in `generator/`, because THREE runtimes need
 * it and they cannot share a CommonJS module: the Node build and the Cloud Function `require` it
 * (Node 24 `require(ESM)`, the same way they already require `renderers.mjs`), and the BROWSER
 * imports it — because `site.copy.json`'s strings are injected into the browser in EVERY locale, so
 * the browser picks one at runtime. A second implementation there would be two mechanisms for one
 * job, which is the thing this codebase rules out rather than weighs.
 *
 * `generator/i18n.js` re-exports these and keeps only `localeUrl`, which is build-specific.
 */

/** Resolution order for `locale`: itself → its declared fallback(s) → the primary. Deduped. */
export function fallbackChain(locale, cfg) {
  return [...new Set([locale, ...((cfg.fallback && cfg.fallback[locale]) || []), cfg.primary])];
}

/** An i18n value object = a plain object whose keys are ALL known locales (distinguishes it from a
 *  `group` content value). A bare scalar is treated as locale-invariant.
 *
 *  [hard] "ALL keys" is why `site.copy.json`'s `context` is a SIBLING of `text` rather than a key
 *  beside the locales: `{ en, nl, context }` would fail this test and resolve as a plain value. */
export function isI18nValue(v, cfg) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const keys = Object.keys(v);
  return keys.length > 0 && keys.every((k) => cfg.locales.includes(k));
}

const present = (x) => x != null;   // '' IS a value now; 0 and false always were

/**
 * Resolve an i18n value for `locale`. Returns `{ value, usedLocale, blanked? }`:
 *   usedLocale === locale → translated · !== locale → fell back · null → no value.
 * A bare scalar (non-i18n) resolves to itself (usedLocale = locale).
 *
 * [hard, owner 2026-09-03] `''` IS A VALUE; `null` IS THE ONLY WAY TO SAY NOTHING. Two states, not
 * three — and this INVERTS what stood here from 2026-07-30:
 *   key ABSENT, or `null`  → not set: keep walking the chain
 *   `''`                   → DELIBERATELY EMPTY: stop the chain, resolve to nothing (`blanked`)
 *   anything else          → use it
 *
 * The old rule made `null` the deliberate marker and `''` mean "not set", because clearing a CMS
 * text box yields `''` by accident. The owner's reason for turning it round: *"In code the only way
 * to say that something is not set is `null`. An empty string is a value. A falsy one but still a
 * value. Flipping those two around just because the CMS does something we don't like is going to be
 * a can of worms; we are going against code."* So the CMS OUTPUT is sanitised — a cleared box writes
 * `null` — rather than the semantics being bent to fit it.
 *
 * The tombstone did not disappear, it changed spelling: `''` now stops the chain exactly as `null`
 * used to, which is what lets a secondary locale be blanked without the primary's text reappearing.
 *
 * A blank resolves like an absent value (`usedLocale: null`), which gives callers two things for
 * free: it is NOT reported as an untranslated fall-back (it was a decision, not a gap), and it still
 * fails `required` on the primary locale — which is also why "required must test non-empty" needs no
 * separate rule: an explicit blank never arrives as a value at all.
 *
 * The same walk serves any future chain keyed by something other than locale, so the semantics are
 * defined once here.
 */
export function pickLocale(value, locale, cfg) {
  if (!isI18nValue(value, cfg)) {
    if (value === '') return { value: undefined, usedLocale: null, blanked: true };
    return present(value) ? { value, usedLocale: locale } : { value: undefined, usedLocale: null };
  }
  for (const loc of fallbackChain(locale, cfg)) {
    if (!(loc in value)) continue;                                                        // absent → keep walking
    if (value[loc] === null || value[loc] === undefined) continue;                        // not set → keep walking
    if (value[loc] === '') return { value: undefined, usedLocale: null, blanked: true };  // blank → stop
    return { value: value[loc], usedLocale: loc };
  }
  return { value: undefined, usedLocale: null };
}
