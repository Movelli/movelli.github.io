/**
 * THE SIZE AN IMAGE IS SHOWN AT — per window range, its width and its shape.
 *
 * [owner 2026-10-04] Each part keeps its own facts, and this combines them (`docs/record/layouts.md` § 8):
 *   · a layout's slot says how wide each component in it is, per WINDOW range — its `media`;
 *   · a component says the shape of the image it holds, per its OWN width — its `widths.media`, with each
 *     listed variant's added key by key.
 * The width an image is shown at is its slot's: no image component caps its image. Where the slot's width
 * crosses one of the component's own breakpoints inside a window range, the range is split there — found
 * exactly, because a slot width is a straight line in the window width (rem and `vw` only, no `min()`).
 *
 * The build writes the browser's `sizes` hint from it (`sizeHint`); the CMS will crop images to the right
 * size and shape from it later. Pure: it knows only the two shapes it is handed.
 */

import { evaluateLength, REM } from './lengths.mjs';

/** A window width in px as a media key: `0`, or rem with up to four decimals. */
const asKey = (px) => (px === 0 ? '0' : `${+(px / REM).toFixed(4)}rem`);
export const keyPx = (key) => (key === '0' ? 0 : parseFloat(key) * REM);

/** The component's shape steps — its own media with each listed variant's added — as `[[px, ratio]]`, rising. */
function shapeSteps(widths = {}, variant = []) {
  const media = { ...(widths.media || {}) };
  for (const name of variant || []) Object.assign(media, ((widths.variants || {})[name] || {}).media || {});
  return Object.entries(media).map(([k, v]) => [keyPx(k), v.ratio]).sort((a, b) => a[0] - b[0]);
}

/** The shape at a component width: the widest step it has reached. */
const shapeAt = (steps, width) => steps.reduce((ratio, [at, r]) => (Math.max(0, width) >= at - 1e-6 ? r : ratio), undefined);

/**
 * @param {Record<string, { width: string }>} slotMedia  the slot's widths, per window range
 * @param {{ media?: object, variants?: object }} [widths]  the component's widths
 * @param {string[]} [variant]  the component instance's variant list
 * @param {{ ratio?: number }} [own]  the image's OWN shape, width over height — with the component's `widths.maxHeight` it caps the width
 * @returns {Array<{ from: string, width: string, ratio?: string }>}  rising, `from` a window width
 */
export function imageWidths(slotMedia, widths = {}, variant = [], own = {}) {
  const steps = shapeSteps(widths, variant);
  // The tallest the image may be, as a width: maxHeight × its own ratio. None for a component with no maxHeight or an image of no known shape.
  const cap = widths.maxHeight && own.ratio > 0 ? parseFloat(widths.maxHeight) * REM * own.ratio : Infinity;
  const keys = Object.keys(slotMedia || {});
  const out = [];
  keys.forEach((key, i) => {
    const { width } = slotMedia[key];
    const start = keyPx(key);
    const end = i + 1 < keys.length ? keyPx(keys[i + 1]) : Infinity;
    // The slot's width is a·W + b in the window width W.
    const b = evaluateLength(width, { vw: 0 });
    const a = (evaluateLength(width, { vw: 1000 }) - b) / 1000;
    const cuts = [start];
    if (a !== 0) {
      for (const [at] of steps.filter(([px]) => px > 0)) {
        const w = (at - b) / a;
        if (w > start && w < end) cuts.push(w);
      }
      // …and where the slot's width reaches the cap
      if (Number.isFinite(cap)) {
        const w = (cap - b) / a;
        if (w > start && w < end) cuts.push(w);
      }
    }
    const sorted = [...new Set(cuts)].sort((x, y) => x - y);
    sorted.forEach((cut, j) => {
      // The shape INSIDE the piece, not at its edge: where the width falls as the window grows, the width
      // at the cut is the step itself, and the piece after it is already below.
      const next = j + 1 < sorted.length ? sorted[j + 1] : (end === Infinity ? cut + 2 : end);
      const inside = a * ((cut + next) / 2) + b;
      const shown = inside > cap + 1e-6 ? `${+(cap / REM).toFixed(4)}rem` : width;   // the cap, where the slot is wider than it
      out.push({ from: asKey(cut), width: shown, ...(steps.length ? { ratio: shapeAt(steps, inside) } : {}) });
    });
  });
  return out;
}

/**
 * The widest classic scrollbar, in px. A `sizes` condition measures the WINDOW, and the layouts step on the
 * VIEW CONTAINER — the window less a classic scrollbar (Windows; macOS with a mouse). Past a step where a
 * slot gets narrower, the hint would change first and ask for the narrow width while the page still draws
 * the wide one: at the `two-column` split, half the width shown, and a soft image. So a narrowing step is
 * written this much later, and the hint errs wide, never narrow.
 */
export const SCROLLBAR_PX = 17;

/**
 * The browser's `sizes` hint: the widths of `imageWidths`, a range per width, widest window first, the
 * narrowest range last and bare — mobile-first, so every condition is a `min-width`. A range whose width
 * starts NARROWER than the one before it ended starts one scrollbar later (`SCROLLBAR_PX`).
 */
export function sizeHint(ranges) {
  const runs = [];
  for (const r of ranges) if (!runs.length || runs[runs.length - 1].width !== r.width) runs.push({ ...r });
  runs.forEach((r, i) => {
    if (i === 0 || r.from === '0') return;
    const at = keyPx(r.from);
    if (evaluateLength(r.width, { vw: at }) < evaluateLength(runs[i - 1].width, { vw: at }) - 0.5) r.from = asKey(at + SCROLLBAR_PX);
  });
  return runs.slice().reverse()
    .map((r) => (r.from === '0' ? r.width : `(min-width: ${r.from}) ${r.width}`))
    .join(', ');
}
