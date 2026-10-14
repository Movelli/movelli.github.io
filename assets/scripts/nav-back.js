/**
 * THE HEADER'S BACK BUTTON — the one control in the left slot that is not always there.
 *
 * [owner 2026-09-10] This file was `sticky-title.js`, and most of it is gone with the feature it was
 * named for: once the h1 had scrolled up and the visitor was scrolling DOWN, the slot swapped the
 * brand for the page's title with an arrow back to the top. The owner removed it, and the reason is
 * the useful part — *"there were too many controls changing depending on state and it resulted in
 * confusing/bad UX so I have to make choices and this feature wasn't essential, only a nice
 * addition."* The scroll observer, the direction rule and its whole core module went with it.
 *
 * What is left is one question asked once per page: is there a back button, and does it work.
 *
 * [hard] STANDALONE ONLY. In a browser tab the back button is already there, in the browser's own
 * chrome; an installed app has none, which is the only reason this exists.
 */

/**
 * [hard, owner 2026-09-25] BY `id`, AND BOUND TO ITSELF. Two things were wrong here and both were
 * leftovers rather than decisions:
 *
 * · The click was DELEGATED on `.app-header__start` — the header's own class, held by a file that
 *   is not the header. That was correct when this file was `sticky-title.js` and SWAPPED the slot's
 *   contents, so the button came and went; the feature was removed, the button is static markup
 *   that only toggles `hidden`, and the delegation outlived what it was written for. Binding the
 *   button itself is what takes the header's class out of this file.
 * · It found the button with `querySelector('.nav-back')` — a class that names a KIND, used to
 *   single out ONE element, which is exactly what the recorded id rule forbids.
 */
const backBtn = () => document.getElementById('nav-back');

/** Standalone = installed, so there is no browser back button to fall back on. */
const standalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

/**
 * [hard] `history.length > 1` IS A PROXY AND IT IS THE FALLBACK, NOT THE TEST. It counts forward
 * entries too, so it can say yes when there is nothing behind us — and a back button that goes
 * nowhere is worse than no back button. The Navigation API answers the real question and is used
 * wherever it exists; the proxy only covers engines that do not have it.
 */
function canGoBack() {
  if (!standalone()) return false;
  if (window.navigation && typeof window.navigation.canGoBack === 'boolean') return window.navigation.canGoBack;
  return history.length > 1;
}

/** Shown or not — and `hidden` takes the tab order with it, which a transform would not. */
function arm() {
  const back = backBtn();
  if (back) back.hidden = !canGoBack();
}

function init() {
  backBtn()?.addEventListener('click', () => history.back());
  arm();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
