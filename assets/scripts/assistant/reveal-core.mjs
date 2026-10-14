/**
 * Streamed-reveal PURE helpers — isomorphic (no DOM), so the Node test suite can `require` them
 * and the browser can `import` them (the visits-core.mjs pattern).
 *
 * These two functions are where a bug would actually hurt: `splitParts` is the only thing that
 * touches the CONTENT of an AI answer, and `stepFor` is the only thing standing between a long
 * answer and a reveal that crawls for seven seconds. The DOM walking around them (reveal.js) is
 * ordinary API use; this is the half worth guarding.
 */

/**
 * Split a run of text into alternating word / whitespace parts, LOSSLESSLY.
 *
 * The loss-free property is the whole point and is asserted by the tests: `splitParts(s).join('')`
 * always equals `s`, for any input. reveal.js rebuilds the text node from these parts — words become
 * `<span>`s, whitespace stays a bare text node — so an exact round-trip is what guarantees that
 * wrapping never alters `textContent`, never collapses a double space, and never changes where a
 * line may break. (Whitespace has to survive as real text: `<span>a</span><span>b</span>` renders as
 * "ab", and words that cannot be separated cannot be wrapped either.)
 *
 * Returns `[{ text, word }]` — `word: false` for whitespace runs, which get no span and no index.
 */
export function splitParts(text) {
  const s = String(text ?? '');
  if (!s) return [];
  // The capturing group keeps the separators, so nothing is dropped.
  return s.split(/(\s+)/).filter(Boolean).map((text) => ({ text, word: !/^\s+$/.test(text) }));
}

/**
 * The per-word delay for an element of `n` words. What is held steady is the TOTAL time the element
 * takes to write itself — clamped between `minTotalMs` and `capMs` — and the per-word step falls out
 * of that. A fixed rate fails at both ends:
 *
 *  - TOO SHORT. A three-word opener ("New to Movelli?") at 22ms/word staggers over 44ms, which no
 *    one can perceive: it reads as a plain fade, not as text being written. This is why the suggestions aside
 *    appeared not to stream at all while the dialog's prose clearly did — same code, ten times the
 *    words. Short text has to slow DOWN to show the same effect.
 *  - TOO LONG. At the same 22ms a 300-word answer would crawl for seven seconds, which stops being
 *    an effect and becomes a wait.
 *
 * So `stepMs` is the preferred rate, used whenever the resulting total already lands in the window;
 * outside it, the total is pinned to the nearer bound. Capping the TOTAL rather than truncating the
 * text means a long answer simply streams faster — the impression survives, the delay does not.
 */
export function stepFor(n, stepMs, capMs, minTotalMs = 0) {
  if (!(n > 1)) return 0;              // 0 or 1 words: nothing to stagger
  const gaps = n - 1;                  // the first word starts at 0, so only the gaps cost time
  const total = gaps * stepMs;
  if (total < minTotalMs) return minTotalMs / gaps;   // short text: slow down until it reads
  if (total > capMs) return capMs / gaps;             // long text: speed up so it never drags
  return stepMs;
}
