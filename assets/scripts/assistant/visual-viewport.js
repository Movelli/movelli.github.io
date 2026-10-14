/**
 * THE VISUAL VIEWPORT — how much of it the on-screen keyboard is eating, published as
 * `--keyboard-inset` on `<movelli-assistant>`.
 *
 * [owner 2026-09-25] IT WAS `viewport.js`, WHICH READ AS SOMETHING GLOBAL. The owner: *"The name
 * of the file made me think it was a global thing."* It is the assistant's own, it is about the
 * VISUAL viewport specifically — the distinction the whole file turns on — and the name says both
 * now.
 *
 * [hard, owner 2026-09-23] THE PROBLEM IS iOS, AND IT IS ABOUT WHICH VIEWPORT. There are two. The
 * LAYOUT viewport is what `100dvh`, `100vh` and `position: fixed` resolve against; the VISUAL
 * viewport is what is actually on screen. On iOS the keyboard shrinks only the VISUAL one — the
 * layout viewport does not move a pixel — so a `position: fixed` panel sized in `dvh` keeps its
 * full height and its assistant input ends up UNDER the keyboard, with no event that `dvh` can hear.
 *
 * The owner's question, and it is the one that makes the fix legible: *"If the problem is that the
 * viewport height values don't change when the keyboard pops up on iOS, why would the resize event
 * fire?"* Because the event belongs to the visual viewport, which is precisely the one that DID
 * change. `window.resize` stays silent; `visualViewport.resize` does not.
 *
 * WHAT IS PUBLISHED, and why it is this number rather than the visual viewport's height:
 *
 *     --keyboard-inset = clientHeight - (visualViewport.height + visualViewport.offsetTop)
 *
 * That is the distance from the bottom of the LAYOUT viewport up to the top of the keyboard, in the
 * coordinate space a fixed element is actually laid out in. Three things follow from it, and each
 * is a reason not to publish the simpler `visualViewport.height`:
 *
 * · **It is ZERO wherever there is no keyboard**, because the visual viewport then fills the layout
 *   viewport exactly. So a closed keyboard and a browser without `visualViewport` read the 0px
 *   `movelli-assistant` declaration and the box is unchanged.
 *
 * · **It is ZERO ON ANDROID TOO, for the opposite reason, and that is what stops a double
 *   subtraction.** The page's viewport meta carries `interactive-widget=resizes-content`, so
 *   Chromium shrinks the LAYOUT viewport instead: `dvh` has already reacted, `clientHeight` has
 *   already come down, and this arithmetic correctly reports nothing left to take. One mechanism,
 *   both platforms, with no branch on which browser this is.
 *
 * · **It folds in `offsetTop`**, which the visual viewport's height alone cannot. If the engine
 *   scrolls the layout viewport to reveal the focused field, the keyboard's top edge moves in
 *   layout coordinates and this number moves with it.
 *
 * [hard] IT DOES NOT COMPENSATE THE PANEL'S *TOP* EDGE, and that is a claim to test rather than an
 * oversight. An engine scrolls the layout viewport only when it must bring the focused field into
 * view — and with the panel's bottom pinned to the keyboard line, the assistant input inside it is already
 * fully visible, so there should be nothing left to scroll for. If a real iPhone disagrees, the
 * symptom is the panel's TOP sliding under the header, the height will still be right, and the fix
 * is one more published number (`visualViewport.offsetTop`) added to `--chat-top`.
 *
 * [hard] A PINCH-ZOOMED VISITOR GETS NOTHING. While `scale > 1` the visual viewport is a zoom
 * WINDOW, not a keyboard-shrunk viewport — the arithmetic above would report most of the page as
 * "keyboard" and collapse the panel to a sliver. Zoomed, we publish 0 and the panel keeps the size
 * it has, which is the behaviour before this file existed rather than a new fault.
 *
 * [hard, owner 2026-09-26] IT ONLY RUNS ON A TOUCH DEVICE — `isTouch()` from `pointer.js`, the
 * codebase's one stand-in for "focusing a field opens a keyboard". This file used to argue the
 * opposite: that nothing had to ask whether a device HAS a virtual keyboard, since that question
 * has no reliable answer. The owner: that is no reason not to rule out the devices that certainly
 * have NONE — no touch, no virtual keyboard — so a desktop and most laptops no longer run it at all.
 * Asked at each open, not once, so a convertible that flipped between opens is followed.
 * [owner 2026-09-26] `isTouch()` asks whether a finger is the MAIN pointer, so a touchscreen laptop
 * used as a laptop does not run this either. Kept deliberately, over a wider "any touch" check.
 *
 * [hard] IT IS ONLY LISTENING WHILE THE PANEL IS OPEN. `visualViewport.resize` and `scroll` fire on
 * every scroll frame and every pinch on a phone, and each write to a custom property on the
 * element is a style recalculation for its subtree. Nothing but the panel reads `--keyboard-inset`, so nothing but
 * the panel's own open state should be paying for it. The write is also skipped when the value has
 * not changed, which is most frames.
 */

import { isTouch } from './pointer.js';

const vv = () => window.visualViewport;

let applied = null;

/**
 * Write `--keyboard-inset`, or take it off entirely when there is nothing to report.
 *
 * [hard, owner 2026-09-25] ON `<movelli-assistant>`, NOT ON `<html>`. Only the dialog inside the
 * element reads it, and custom properties inherit — so the host's root never has to carry a
 * property belonging to a component installed in their page. It was the last of three places the
 * assistant wrote to a document it does not own.
 */
function publish(px) {
  if (px === applied) return;
  applied = px;
  const el = document.querySelector('movelli-assistant');
  if (!el) return;
  if (px > 0) el.style.setProperty('--keyboard-inset', `${px}px`);
  // …and removing it lets the stylesheet's `movelli-assistant` declaration show through, which is
  // 0px. An INLINE property on the element beats the rule targeting that same element, so this is
  // one value with a resting state rather than two places both saying zero.
  else el.style.removeProperty('--keyboard-inset');
}

function measure() {
  const v = vv();
  if (!v) return;
  // Zoomed: the visual viewport is a window onto the page, not a keyboard inset. Report nothing.
  // The tolerance is because `scale` is a float and a pinch can settle at 1.0000001.
  if (Math.abs(v.scale - 1) > 0.01) { publish(0); return; }
  // Round DOWN, and never below zero: a fractional over-estimate would leave a hairline of
  // keyboard over the assistant input, and rubber-band overscroll can briefly make this negative.
  publish(Math.max(0, Math.floor(document.documentElement.clientHeight - (v.height + v.offsetTop))));
}

let listening = false;

/** Start tracking the keyboard. Called when the panel opens; acts only on a touch device. Safe to call twice. */
export function watch() {
  const v = vv();
  if (!v || listening || !isTouch()) return;
  listening = true;
  v.addEventListener('resize', measure);
  v.addEventListener('scroll', measure);
  measure();
}

/** Stop, and clear the inset — the panel is closed, so nothing is being covered. */
export function unwatch() {
  const v = vv();
  if (!v || !listening) return;
  listening = false;
  v.removeEventListener('resize', measure);
  v.removeEventListener('scroll', measure);
  publish(0);
}
