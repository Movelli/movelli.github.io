/**
 * THE NUMBERS THAT ARE A SITE'S POLICY, not the engine's. [owner 2026-10-14] How an image is encoded (the quality ladder, the similarity floor, the size of a master), the size of the share image,
 * and how much history of an article is kept. They are `images` and `articleHistory` in `site.config.json`; a value the config leaves out takes the one below. Pure, so the build, the scripts and the
 * Cloud Functions read it the same way.
 */
export const DEFAULT_IMAGES = {
  masterMax: 3200,                                 // the longest side of an upload's master, in pixels
  masterQuality: 90,                               // the master's WebP quality
  webpQuality: 78,                                 // a size too small to measure
  jpegQuality: 85,                                 // the share image's JPEG
  qualities: [90, 85, 80, 75, 70, 65, 60, 55, 50], // heaviest first: the lightest that keeps the similarity floor is used
  ssimFloor: 0.935,
  shareImage: { width: 1200, height: 675 },        // what Google Discover asks for: at least 1200 wide, 16:9 recommended
};
export const DEFAULT_ARTICLE_HISTORY = { versions: 10, entries: 50 };   // brief versions kept; decisions kept that refer to no version

export const imagesOf = (cfg) => {
  const own = (cfg && cfg.images) || {};
  return { ...DEFAULT_IMAGES, ...own, shareImage: { ...DEFAULT_IMAGES.shareImage, ...(own.shareImage || {}) } };
};
export const articleHistoryOf = (cfg) => ({ ...DEFAULT_ARTICLE_HISTORY, ...((cfg && cfg.articleHistory) || {}) });

/** What is wrong with the `images` and `articleHistory` of a config, in words: a list, empty when all is well. */
export function policyProblems(cfg) {
  const out = [];
  const num = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
  const im = imagesOf(cfg);
  for (const k of ['masterMax']) if (!Number.isInteger(im[k]) || im[k] < 800) out.push(`images.${k} must be a whole number of at least 800`);
  for (const k of ['masterQuality', 'webpQuality', 'jpegQuality']) if (!Number.isInteger(im[k]) || !num(im[k], 1, 100)) out.push(`images.${k} must be a whole number from 1 to 100`);
  if (!num(im.ssimFloor, 0.5, 1)) out.push('images.ssimFloor must be a number from 0.5 to 1');
  if (!Array.isArray(im.qualities) || !im.qualities.length || im.qualities.some((q, i) => !Number.isInteger(q) || q < 1 || q > 100 || (i && q >= im.qualities[i - 1]))) out.push('images.qualities must be a list of whole numbers from 1 to 100, heaviest first');
  if (!Number.isInteger(im.shareImage.width) || !Number.isInteger(im.shareImage.height) || im.shareImage.width < 200 || im.shareImage.height < 100) out.push('images.shareImage needs a whole width and height (at least 200 × 100)');
  const h = articleHistoryOf(cfg);
  for (const k of ['versions', 'entries']) if (!Number.isInteger(h[k]) || h[k] < 1) out.push(`articleHistory.${k} must be a whole number of at least 1`);
  return out;
}
