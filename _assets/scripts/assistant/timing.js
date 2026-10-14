/**
 * Read a duration token from CSS, so the stylesheet stays the ONE source of timing.
 *
 * JS needs these because a `transitionend` is not a guarantee — it never arrives under reduced
 * motion, in a backgrounded tab, or if the property never actually changes — so every overlay here
 * carries a timeout backstop. Those backstops were hand-derived numbers (`700`, `500`) with a
 * comment naming the token they were meant to exceed, which is precisely the shape that goes stale:
 * shortening `--dialog-dur` left a dialog that still took 700ms to finish closing whenever the
 * happy path did not fire.
 *
 * `--dialog-dur: 0.22s` → 220. Accepts `s` and `ms`; falls back when the token is missing, so a
 * stylesheet that fails to load cannot leave an overlay stuck open.
 */
export function tokenMs(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return raw.endsWith('ms') ? n : n * 1000;
}

/**
 * How long to wait before giving up on a transition, given the token that governs it.
 *
 * Deliberately generous: this is the BACKSTOP, not the happy path, and firing it early would cut a
 * transition short — the failure it exists to prevent is an overlay stuck open forever, not a few
 * spare milliseconds.
 */
export function backstopMs(name, fallback) {
  return tokenMs(name, fallback) + 200;
}
