/**
 * THE PLURAL RULE — one definition, delivered two ways.
 *
 * It is its own file because the OFFLINE PAGE cannot import it. That page's script is inlined into
 * the HTML as a classic `<script>`, because the module graph is not precached and the page must
 * depend on nothing — so the build INLINES THIS FILE'S SOURCE beside the copy it injects
 * (`generator/assets/copy.js`), while every other runtime imports it normally. Two deliveries, one
 * definition: writing the four-line category pick a second time in `list.js` would be the second
 * mechanism for one job that this codebase refuses.
 *
 * [hard] KEEP IT SELF-CONTAINED. It imports nothing, so the injector can take the file as it stands
 * rather than resolving a graph; an import added here breaks the offline page and nothing else.
 */

/**
 * [decided 2026-09-17, owner] A LOCALE'S VALUE MAY BE PLURAL FORMS, AND THE VOCABULARY IS WHAT MAKES
 * THAT SAFE TO ALLOW.
 *
 * The rule it revises said a locale holds a STRING and never a nested object, because a stray key
 * makes `pickLocale` hand back the OBJECT and the page renders `[object Object]` while validation
 * passes. The owner's objection to loosening it was exactly right: *"we can't test anymore if a
 * nested object was a mistake or deliberate for singular/plural."*
 *
 * The answer is that CLDR's plural categories are a CLOSED SET of six, and `Intl.PluralRules` says
 * which of them each locale actually uses — so a forms object is recognisable rather than merely
 * object-shaped. `validateCopy` below is STRICTER than the rule it replaces: the categories must be
 * the ones that locale uses, `other` must be there, and no locale may opt out alone. Nobody typos
 * their way into `{ one, other }`; `{ en: { en } }`, `{ en: { text } }` and `{ en: { plural } }` are
 * all rejected by name.
 *
 * NO `plural: true` FLAG, deliberately. The shape already says it, and an entry is `{ context, text }`
 * — a third field would be a second way to state one fact and would break that rule for nothing.
 */
export const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'];

/** The categories a locale actually uses — `['one','other']` for en, `['other']` for ja. */
export const categoriesFor = (locale) => new Intl.PluralRules(locale).resolvedOptions().pluralCategories;

/** A locale's value is FORMS rather than a string: a plain object keyed only by plural categories. */
export function isPluralForms(v) {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  const keys = Object.keys(v);
  return keys.length > 0 && keys.every((k) => PLURAL_CATEGORIES.includes(k));
}

/**
 * Pick the form for `count` — the THIRD function, and it does one job.
 *
 * `fill` answers *put these values in it*, `copy` answers *what does this site say*, and this answers
 * *which of these forms*. A `copy(key, count)` overload would have been two jobs in one function,
 * which is the rule `fill` exists to keep and the `resolveField` mistake this codebase records.
 *
 * [hard] THE COUNT MUST BE A REAL, FINITE NUMBER, AND THIS FUNCTION IS THE ONLY THING THAT CHECKS.
 * `Intl.PluralRules.select()` throws on NOTHING — measured 2026-09-17, every one of `"abc"`, `NaN`,
 * `null`, `undefined`, `{}` and `[]` returns `'other'` silently. So `select(items.length)` on an
 * undefined list would render the plural sentence and report nothing, which is the same silent
 * failure `copy()` refuses a missing key for and `fill()` refuses a missing variable for.
 * A NUMERIC STRING IS REFUSED TOO, and that is not pedantry: `select('1.0')` returns `'one'` where
 * CLDR says 1.0 is `other` in English ("1.0 pages"). Coercion drops the visible decimals, so the bug
 * cannot be detected after the fact — only before.
 *
 * A plain string passes straight through, so a caller that does not know whether a key has forms
 * stays correct either way.
 */
export function pluralize(value, count, locale) {
  if (!isPluralForms(value)) return value;
  if (typeof count !== 'number' || !Number.isFinite(count)) {
    throw new TypeError(`copy: pluralize needs a finite number, got ${typeof count} ${JSON.stringify(count)} `
      + '— Intl.PluralRules would silently answer "other" for it');
  }
  const category = new Intl.PluralRules(locale).select(count);
  // `other` is the category every language has, and validateCopy requires it — so this cannot be
  // undefined for a file that built.
  return value[category] ?? value.other;
}
