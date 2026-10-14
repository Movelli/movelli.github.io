/**
 * A CSS LENGTH, WORKED OUT — in px, at a given window width.
 *
 * [owner 2026-10-04] The widths of a component and of a layout's slots are catalog information
 * (`docs/record/layouts.md` § 8), written as CSS lengths so a browser's `sizes` hint can be written from
 * them. This is the one place a length is worked out, for everything that compares them: the fit check,
 * the image widths, and the tests that keep the catalogs and the stylesheet in step.
 *
 * It reads `Npx`, `Nrem`, `Nvw`, a plain number (a factor), `var(--token)` from the tokens it is given,
 * and `calc()` / `min()` / `max()` / `clamp()` over them. It refuses what depends on a box it cannot see
 * — `%`, `cqi`, `cqw`, `vh` — a `var()` it was given no tokens for, and `vw` without a window width.
 *
 * Pure: it knows nothing outside itself, so the build, the tests and later the CMS can all use it.
 */

/** The px in a rem: the browser's default font size, which the site never changes. */
export const REM = 16;

/**
 * `expr` in px. `tokens` maps a custom property to its value; `vw` is the window width in px.
 * @param {string} expr
 * @param {{ tokens?: Record<string, string>, vw?: number }} [at]
 */
export function evaluateLength(expr, { tokens, vw } = {}) {
  const text = substitute(String(expr), tokens, 0);
  const p = parser(text, expr, vw);
  const value = p.sum();
  p.end();
  if (value.unit !== 'px') throw new Error(`"${expr}" is a number, not a length`);
  return value.n;
}

function substitute(text, tokens, depth) {
  if (depth > 10) throw new Error(`"${text}" refers to itself`);
  if (!/var\(/.test(text)) return text;
  if (!tokens) throw new Error(`"${text}" reads a custom property, and no tokens were given`);
  const out = text.replace(/var\(\s*(--[\w-]+)\s*(?:,[^()]*)?\)/g, (m, name) => {
    if (tokens[name] == null) throw new Error(`${name} is not declared`);
    return `(${tokens[name]})`;
  });
  return substitute(out, tokens, depth + 1);
}

/** A small parser over one expression: sums of products of terms, where a term is a value, a
 *  bracketed sum, or a function. A value carries its unit — `px` for a length, `n` for a number. */
function parser(text, expr, vw) {
  const tokens = [...text.matchAll(/\s*(-?\d*\.?\d+)([a-z%]*)|\s*([a-z-]+)\(|\s*([-+*/(),])|\s*(\S)/gi)];
  let i = 0;
  const peek = () => tokens[i];
  const fail = (why) => { throw new Error(`"${expr}" ${why}`); };
  const isOp = (t, ch) => t && t[4] === ch;

  const number = (t) => {
    const n = parseFloat(t[1]); const unit = t[2].toLowerCase();
    if (unit === '') return { n, unit: 'n' };
    if (unit === 'px') return { n, unit: 'px' };
    if (unit === 'rem') return { n: n * REM, unit: 'px' };
    if (unit === 'vw') {
      if (typeof vw !== 'number') fail('is relative to the window, and no window width was given');
      return { n: (n * vw) / 100, unit: 'px' };
    }
    return fail(`depends on a box this cannot see (${unit})`);
  };

  const args = () => {
    const list = [p.sum()];
    while (isOp(peek(), ',')) { i++; list.push(p.sum()); }
    if (!isOp(peek(), ')')) fail('has an unclosed function');
    i++;
    return list;
  };

  const same = (list, fn) => {
    if (list.some((v) => v.unit !== list[0].unit)) fail(`mixes a length and a number in ${fn}()`);
    return list[0].unit;
  };

  const term = () => {
    const t = peek();
    if (!t) return fail('ends too early');
    i++;
    if (t[1] !== undefined) return number(t);
    if (t[3] !== undefined) {
      const fn = t[3].toLowerCase();
      const list = args();
      if (fn === 'calc') { if (list.length !== 1) fail('has a calc() with more than one argument'); return list[0]; }
      if (fn === 'min' || fn === 'max') return { n: Math[fn](...list.map((v) => v.n)), unit: same(list, fn) };
      if (fn === 'clamp') {
        if (list.length !== 3) fail('has a clamp() without three arguments');
        const [lo, mid, hi] = list;
        return { n: Math.max(lo.n, Math.min(mid.n, hi.n)), unit: same(list, fn) };
      }
      return fail(`uses ${fn}(), which this cannot work out`);
    }
    if (isOp(t, '(')) {
      const v = p.sum();
      if (!isOp(peek(), ')')) fail('has an unclosed bracket');
      i++;
      return v;
    }
    if (isOp(t, '-')) { const v = term(); return { n: -v.n, unit: v.unit }; }
    return fail(`has "${t[0].trim()}" where a value belongs`);
  };

  const p = {
    product() {
      let v = term();
      while (isOp(peek(), '*') || isOp(peek(), '/')) {
        const op = peek()[4]; i++;
        const w = term();
        if (op === '*') {
          if (v.unit === 'px' && w.unit === 'px') fail('multiplies two lengths');
          v = { n: v.n * w.n, unit: v.unit === 'px' || w.unit === 'px' ? 'px' : 'n' };
        } else {
          if (w.unit === 'px') fail('divides by a length');
          if (w.n === 0) fail('divides by zero');
          v = { n: v.n / w.n, unit: v.unit };
        }
      }
      return v;
    },
    sum() {
      let v = p.product();
      while (isOp(peek(), '+') || isOp(peek(), '-')) {
        const op = peek()[4];
        // CSS reads `+` and `-` as operators only with white space on BOTH sides (`100vw- 4rem` is no
        // length a browser accepts), and this is written verbatim into a `sizes` hint.
        const spaced = (t) => !!t && /^\s/.test(t[0]);
        if (!spaced(peek()) || !spaced(tokens[i + 1])) fail(`needs a space on both sides of "${op}"`);
        i++;
        const w = p.product();
        if (v.unit !== w.unit) fail('adds a length and a number');
        v = { n: op === '+' ? v.n + w.n : v.n - w.n, unit: v.unit };
      }
      return v;
    },
    end() { if (i < tokens.length) fail(`has "${tokens[i][0].trim()}" left over`); },
  };
  return p;
}
