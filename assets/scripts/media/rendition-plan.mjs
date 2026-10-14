/**
 * THE FILES AN IMAGE USE NEEDS — which sizes to make, and in what shape, from where the image is shown.
 *
 * [owner 2026-10-13] The sizes of an image are no longer a fixed ladder (800, 1200, 1600, 2400). `image-widths.mjs` says how wide an image is shown, per window range, and in what shape; this turns that
 * into the files: the widths the image is shown at, at one and two device pixels per CSS pixel, between the smallest and the largest it ever shows, none above what the master has, and none within
 * a tenth of the next. When the image has ONE shape (the card's 16/9) the files are cut to it, so no shipped pixel is thrown away by `object-fit`; with several shapes, or the image's own, they keep
 * the master's shape; the several shapes of one image are `planPicture`'s (below): each shape is a RUN of ranges, planned as an image of that one shape, and each run but the narrowest is a
 * `<source media>` of a `<picture>`.
 *
 * A file is named by what it is: `<base>-<w>.webp`, or `<base>-<w>x<h>.webp` when cropped. The name IS the specification, so the step that makes the files needs nothing but the pages' own
 * markup (`generator/media-renditions.js`).
 *
 * Pure: it knows the ranges it is handed and the master's size, nothing else (not a record, not the codec). The crop box is the codec's (`cropBox`), repeated here by its one fact — the largest box of the
 * shape that fits the master — and `media.test.js` keeps the two equal.
 */

import { evaluateLength } from './lengths.mjs';
import { keyPx } from './image-widths.mjs';

/** The narrowest window there is (px). */
export const WINDOW_MIN = 320;
/** The widest window the ladder is worked out for: past it a full-width image would ask for more than any screen shows. */
export const WINDOW_MAX = 2560;
/** The densities a ladder serves: one and two device pixels per CSS pixel. */
export const DENSITIES = [1, 2];
/** Between two widths the ladder never leaves more than this factor (a sloping width is filled in at this step). */
export const STEP = 1.4;
/** Two files within this factor of each other are one file (the larger). */
export const MERGE = 1.1;
/** The `src` of an image is the largest file not wider than this, else the smallest: it is what a browser without `srcset` loads. */
export const SRC_MAX = 1600;
/** Without a place to measure (an image not directly in a layout's slot) an image is shown this wide. */
export const UNPLACED = [{ from: '0', width: '50rem' }];

const NAME = /^(.*)-(\d+)(?:x(\d+))?\.(webp|jpg)$/;

/** The file name of a size of the image at `base`: a WebP, or (the share image's) a JPEG, `ext` `jpg`. */
export const renditionName = (base, w, h, ext = 'webp') => `${base}-${w}${h ? `x${h}` : ''}.${ext}`;

/** `{ base, w, h?, ext }` from a file name this module made (`ext` is `webp` or `jpg`), or null. */
export function parseRendition(name) {
  const m = NAME.exec(name);
  return m ? { base: m[1], w: Number(m[2]), ...(m[3] ? { h: Number(m[3]) } : {}), ext: m[4] } : null;
}

/** A ratio written `16/9` as the pair, or null for `auto`, nothing, or what is not a ratio. */
function ratioPair(ratio) {
  const m = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(String(ratio || '').trim());
  return m && Number(m[1]) > 0 && Number(m[2]) > 0 ? [Number(m[1]), Number(m[2])] : null;
}

/** The CSS widths an image is shown at over `ranges`, in px: each range's two ends, and a sloping range filled in. */
function shownWidths(ranges, until = WINDOW_MAX) {
  const out = new Set();
  ranges.forEach((r, i) => {
    const start = Math.max(keyPx(r.from), WINDOW_MIN);
    const end = i + 1 < ranges.length ? keyPx(ranges[i + 1].from) : until;
    const a = evaluateLength(r.width, { vw: start });
    const b = evaluateLength(r.width, { vw: Math.max(start, end) });
    out.add(a); out.add(b);
    const lo = Math.min(a, b); const hi = Math.max(a, b);
    for (let w = lo * STEP; lo > 0 && w < hi / 1.001; w *= STEP) out.add(w);
  });
  return [...out].filter((w) => w > 0);
}

/** The largest box of the shape `rw:rh` inside a `mw × mh` master, as the codec crops it. */
function boxOf(mw, mh, rw, rh) {
  let w = mw; let h = Math.round((mw * rh) / rw);
  if (h > mh) { h = mh; w = Math.round((mh * rw) / rh); }
  return { width: w, height: h };
}

/**
 * @param {{ from: string, width: string, ratio?: string }[]} ranges  `imageWidths`' answer (or `UNPLACED`)
 * @param {{ width: number, height: number }} master  the master's size
 * @param {number} [until]  the window width, in px, the last range lasts until (the next shape's start, in a run); the widest window there is otherwise
 * @returns {{ files: { w: number, h?: number }[], src: { w: number, h?: number }, cropped: boolean }}  `files` rising; `src` is one of them
 */
export function planRenditions(ranges, master, until = WINDOW_MAX) {
  if (!(master && master.width > 0 && master.height > 0)) throw new Error('an image needs its master\'s size to be planned');
  const shapes = [...new Set((ranges || []).map((r) => r.ratio || ''))];
  const pair = shapes.length === 1 ? ratioPair(shapes[0]) : null;
  const box = pair ? boxOf(master.width, master.height, pair[0], pair[1]) : { width: master.width, height: master.height };
  const widest = box.width;
  const wanted = [];
  for (const shown of shownWidths(ranges && ranges.length ? ranges : UNPLACED, until)) {
    for (const d of DENSITIES) wanted.push(Math.min(Math.ceil(shown * d), widest));
  }
  wanted.sort((x, y) => x - y);
  const widths = [];
  for (const w of wanted) {
    if (widths.length && widths[widths.length - 1] === w) continue;
    if (widths.length && w <= widths[widths.length - 1] * MERGE) widths[widths.length - 1] = w;   // within a tenth: the larger stands for both
    else widths.push(w);
  }
  const files = widths.map((w) => (pair ? { w, h: Math.max(1, Math.round((w * pair[1]) / pair[0])) } : { w }));
  const fit = files.filter((f) => f.w <= SRC_MAX);
  return { files, src: fit.length ? fit[fit.length - 1] : files[0], cropped: !!pair };
}

/**
 * [owner 2026-10-13] AN IMAGE WITH SEVERAL SHAPES IS A `<picture>`; WITH ONE, AN `<img>`. `imageWidths`' ranges are cut into RUNS, consecutive ranges of one shape, and each run is planned as an
 * image of that one shape — cut to it around the focal point. The narrowest run is the `<img>` itself (its files, and what a browser with no `<source>` match loads); each later run is a
 * `<source media="(min-width: <from>)">`, from the window width where its shape starts. An image with one run (or none: an image of its own shape, `auto`) is not a picture.
 * The `<source>` switches at the window width where the build worked the shape step out, the same width its `sizes` hint changes at.
 *
 * @param {{ from: string, width: string, ratio?: string }[]} ranges
 * @param {{ width: number, height: number }} master
 * @returns {{ picture: boolean, runs: { from: string, ranges: object[], plan: ReturnType<typeof planRenditions> }[] }}  runs rising by `from`; the first is the `<img>`
 */
export function planPicture(ranges, master) {
  const runs = [];
  for (const r of ranges || []) {
    const last = runs[runs.length - 1];
    if (last && (last.ranges[0].ratio || '') === (r.ratio || '')) last.ranges.push(r);
    else runs.push({ from: r.from, ranges: [r] });
  }
  if (!runs.length) return { picture: false, runs: [{ from: '0', ranges: [], plan: planRenditions([], master) }] };
  runs.forEach((run, i) => { run.plan = planRenditions(run.ranges, master, i + 1 < runs.length ? Math.max(keyPx(runs[i + 1].from), WINDOW_MIN) : WINDOW_MAX); });
  return { picture: runs.length > 1, runs };
}
