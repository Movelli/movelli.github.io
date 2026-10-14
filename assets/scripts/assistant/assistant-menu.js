/**
 * THE ASSISTANT'S CONTEXT MENU — an overlay inside the dialog, opened from the menu button beside the
 * input.
 *
 * [owner 2026-09-24] IT REPLACES THE SEGMENT DRAWER, and the rename is the point: the segments and
 * the clear-history button are what it holds TODAY. The owner expects to put other things in it, so
 * naming it for its first contents would guarantee a rename the day it earned its second.
 *
 * WHAT THE DRAWER NEEDED AND THIS DOES NOT: an `is-shown` class to drive its slide, a
 * `transitionend` listener with a timeout backstop, a `dvh` cap, and a position measured against a
 * bar. The menu is `inset: 0` inside a fixed dialog, and its slide up from the controls bar is the
 * `translate` + `[open]` + `@starting-style` + `allow-discrete` arrangement `.assistant-dialog`
 * itself uses — so `show()` and `close()` are the whole of it and the stylesheet owns the motion.
 * (The drag at the bottom of this file writes the same `translate` inline while a finger holds it.)
 *
 * [hard] `.show()`, NOT `showModal()`. This is an overlay within an overlay, not a new modal layer:
 * `showModal()` would put it in the top layer, above the dialog it belongs to, and make the page
 * behind inert — which is exactly what the non-modal assistant exists not to do.
 *
 * [hard, owner 2026-09-25] THIS FILE USED TO SAY THE NATIVE `close` EVENT DOES NOT FIRE. It does —
 * re-measured on a bare probe after `show()` and after `showModal()`, and on the real dialog. What
 * does NOT fire it is removing the `open` ATTRIBUTE instead of calling `close()`, which is correct
 * spec behaviour and is almost certainly what the 2026-08-31 probe did. The wrong reading had been
 * written in as a `[hard]` rule and was about to cost a design: the menu was going to be closed by a
 * MutationObserver watching an attribute, which no dialog added later would have benefited from.
 * The general behaviour is one listener in `dialog-handlers.js`; this file listens for its OWN close.
 */
import { tokenMs } from './timing.js';
import { track } from './dialog-handlers.js';

const menu = () => document.getElementById('assistant-menu');
const opener = () => document.getElementById('assistant-menu-button');

/**
 * WHAT THE MENU COVERS, and therefore what must not be reachable behind it.
 *
 * The menu is a CHILD of the dialog, so `inert` on the dialog would inert the menu with it. This
 * takes the dialog's other children instead — everything except the menu and the toast region,
 * which has to stay live because clearing the history leaves the menu open and toasts over it.
 *
 * [hard] IT IS A SET DEFINED BY EXCLUSION, not an element singled out by position. The rule against
 * positional targeting is about finding ONE particular element; this is "everything else in here",
 * which stays correct however many children the dialog grows.
 */
const behind = () => [...(menu()?.parentElement?.children || [])]
  .filter((el) => el.id !== 'assistant-menu' && !el.classList.contains('assistant-toast'));

export function isOpen() { return !!menu()?.open; }

/** How long the open/close animation runs — read from the token the stylesheet transitions on. */
export function durationMs() { return tokenMs('--view-swap-dur', 400); }

export function open() {
  const m = menu();
  if (!m || m.open) return;
  m.show();
  // [2026-09-26] `show()` focuses the menu's first control and scrolls it into view — and the menu
  // is still parked one full height down, where its slide starts, so that scrolled the whole
  // conversation dialog up and the slide never showed (measured: 380px). The dialog is a scroll
  // container only to hold its overscroll and has nothing of its own to scroll, so put it back
  // before anything is painted. `refocus()` below cannot scroll it again.
  m.parentElement.scrollTop = 0;
  opener()?.setAttribute('aria-expanded', 'true');
  for (const el of behind()) el.setAttribute('inert', '');
  refocus();
}

/**
 * PUT FOCUS ON THE MENU ITSELF — its own `tabindex="-1"` target, never a control inside it: a button
 * would show the keyboard-focus ring on something the visitor did not reach for. The menu
 * carries its own `aria-label`, so landing here announces what they are in. (It was an sr-only
 * heading until 2026-09-25; a heading that exists only to name a dialog is two elements doing what
 * one attribute does.)
 *
 * EXPORTED, because clearing the history destroys the control that was pressed — `refresh()`
 * disables the clear button — so focus has to be put somewhere or the browser drops it to <body>.
 */
export function refocus() { menu()?.focus({ preventScroll: true }); }

/**
 * PUT THE DIALOG BACK THE WAY THE MENU FOUND IT. Driven by the menu's own `close` event, so it runs
 * however the menu was closed — its own control, Escape, or the assistant dialog closing and taking
 * it along (see dialog-handlers.js). It moves NO focus: the interactive path below does that, and the path
 * where the whole dialog closed must not, because the control it would focus went with it.
 *
 * Idempotent, and called twice on the interactive path on purpose: `close()` needs the subtree
 * un-inerted SYNCHRONOUSLY before it focuses, and the event is queued as a task rather than fired
 * inline — a focus target inside an inert subtree is silently refused.
 */
function restore() {
  opener()?.setAttribute('aria-expanded', 'false');
  for (const el of behind()) el.removeAttribute('inert');
}

/**
 * Close it and return focus to the control that opened it — never to <body>.
 *
 * [2026-09-26, owner reported in Safari] A POINTER CLOSE RETURNS FOCUS WITHOUT A RING. Focus moved
 * by script inherits "was that visible?" from the element it leaves, and Safari counts the menu's own
 * focus as visible — so closing with the mouse painted the ring on `more`, which a mouse user never
 * reached for. `pointer` says the close came from a click by mouse or finger, and then the ring is
 * turned off explicitly (`focusVisible: false`, Safari 18.4 / Chrome 145 / Firefox 104). A keyboard
 * close still shows it: that visitor needs to see where they landed.
 *
 * The exit needs no bookkeeping: `close()` drops `[open]`, the stylesheet's `:not([open])` slides it
 * back down, and `transition: display allow-discrete` holds `display: flex` until that finishes. What the
 * drawer used a `transitionend` and a timeout backstop for, the cascade does here.
 */
export function close({ pointer = false } = {}) {
  const m = menu();
  if (!m || !m.open) return Promise.resolve();
  m.close();
  restore();
  opener()?.focus(pointer ? { focusVisible: false } : undefined);
  // IT RESOLVES WHEN THE EXIT IS DONE, on the token rather than on a `transitionend`. The element is
  // already closed by then — `[open]` is what the stylesheet animates off — so nothing depends on
  // this firing; it is only for callers that want to follow the exit rather than race it. A caller
  // that never opened the menu gets an already-resolved promise and no delay.
  return new Promise((resolve) => setTimeout(resolve, durationMs()));
}

if (menu()) {
  menu().addEventListener('close', restore);
  opener()?.addEventListener('click', () => (isOpen() ? close() : open()));
  // `detail` counts the clicks of a mouse or a finger, and is 0 when Enter or Space pressed the button.
  menu().querySelector('.assistant-menu__close')?.addEventListener('click', (e) => close({ pointer: e.detail > 0 }));
  // [owner 2026-09-26] Esc, Back and a tap beside the menu arrive as `cancel`, from
  // dialog-handlers.js. Cancelled because this close does more than the plain one: it returns focus
  // to the menu button — without a ring when a pointer asked (`detail` is absent on a native cancel).
  menu().addEventListener('cancel', (e) => { e.preventDefault(); close({ pointer: !!e.detail?.pointer }); });
  // Back closes it and Forward reopens it, through its own open() — see dialog-handlers.js.
  track(menu(), open);
  dragToClose(menu());
}

/**
 * [owner 2026-09-26] ON TOUCH, THE MENU CAN BE DRAGGED DOWN TO CLOSE IT — but only while its list is
 * scrolled to the top; anywhere else a downward drag is the list scrolling, and the two must not
 * fight. It follows the finger, and on release it closes if it travelled past a third of its own
 * height or was flicked, and springs back fully open otherwise. The close button stays the way to
 * do the same without a gesture, which is what makes a gesture acceptable (WCAG 2.5.1).
 *
 * TOUCH EVENTS, not pointer events: following the finger means stopping the browser's own scroll
 * and overscroll, which only a non-passive `touchmove` can do — a pointer drag on touch is taken
 * over by the browser's panning and cancelled.
 *
 * The motion is the stylesheet's own: while dragging, an inline `translate` with its transition
 * off; on release both inline values are dropped together, so the menu's `translate` transition
 * carries it from where the finger left it — to fully open, or (through `close()`) off the bottom.
 */
const DRAG_SLOP = 8;     // px down before a touch counts as a drag, so a tap never becomes one
const FLICK = 0.5;       // px per ms: a quick downward flick closes, whatever the distance
function dragToClose(m) {
  const scrollBox = () => m.querySelector('.assistant-menu__scroll');
  let startY = null, startT = 0, dy = 0, dragging = false;
  const reset = () => { m.style.transition = ''; m.style.translate = ''; startY = null; dragging = false; };
  m.addEventListener('touchstart', (e) => {
    // A drag is one finger. A second one ends a drag in progress — it springs back as if released
    // short — and never starts one; without this the inline styles outlived the gesture and the menu
    // stayed part-way down, and came back there on every later open.
    if (dragging) reset();
    startY = e.touches.length === 1 && (scrollBox()?.scrollTop || 0) <= 0 ? e.touches[0].clientY : null;
    startT = e.timeStamp; dy = 0; dragging = false;
  }, { passive: true });
  m.addEventListener('touchmove', (e) => {
    if (startY === null) return;
    dy = e.touches[0].clientY - startY;
    if (!dragging) {
      if (dy < 0) { startY = null; return; }   // upwards: the list scrolling, not a drag
      if (dy < DRAG_SLOP) return;
      dragging = true;
    }
    e.preventDefault();
    m.style.transition = 'none';
    m.style.translate = `0 ${Math.max(0, dy)}px`;
  }, { passive: false });
  m.addEventListener('touchend', (e) => {
    if (!dragging) { startY = null; return; }
    const far = dy > m.getBoundingClientRect().height / 3;
    const fast = dy / Math.max(1, e.timeStamp - startT) > FLICK;
    reset();
    if (far || fast) close({ pointer: true });
  });
  m.addEventListener('touchcancel', reset);
}
