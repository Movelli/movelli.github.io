/**
 * [owner 2026-10-14] A VIDEO THAT WAITS FOR THE SCREEN. A clip that plays by itself (autoplay, muted) cannot wait for a press, so its address is left in `data-src` on its <source>, and nothing is fetched while it
 * is far down the page. This moves the address to `src` once the clip is within a screen's height of the viewport, and starts it. Without IntersectionObserver the clip loads at once; without JavaScript it stays on
 * its poster. A global util, for every element that holds such a clip (`movelli-video`, `movelli-banner`): the renderer writes `data-src`, this reads it, and neither knows the other.
 * @param {HTMLVideoElement} video
 * @param {AbortSignal} signal  the connection's: the watching stops with it
 */
export function loadWhenNear(video, signal) {
  const later = video.querySelectorAll('source[data-src]');
  if (!later.length) return;
  const load = () => {
    for (const s of later) { s.src = s.dataset.src; s.removeAttribute('data-src'); }
    video.load();
    video.play().catch(() => {});        // a browser may refuse; the poster (and the controls, if any) remain
  };
  if (!('IntersectionObserver' in window)) return load();
  const watch = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    watch.disconnect();
    load();
  }, { rootMargin: '100% 0px' });
  watch.observe(video);
  signal.addEventListener('abort', () => watch.disconnect());
}
