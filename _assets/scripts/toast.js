/**
 * A tiny toast primitive (redesign slice 4) — a message that slides in from the top of the
 * page, optionally with one action (e.g. Undo), and auto-dismisses. Renders into the
 * body-level `.app-toast` (`role="status" aria-live="polite"`, so it's announced). One
 * toast at a time; a new toast replaces the current one. Reusable by future slices.
 */
/**
 * WHERE A TOAST LANDS: the page-level region, `#app-toast`, the one that exists on every page and the one form feedback belongs in.
 * [owner 2026-10-08] THE ASSISTANT HAS ITS OWN TOAST (`assistant/assistant-toast.js`), so this file takes no `region` and knows nothing of the
 * assistant. It looks the region up by id, like every element a script singles out.
 */
const region = () => document.getElementById('app-toast');

let current = null; // { el, timer }

/**
 * Show a toast. `onAction` runs then the toast dismisses; it also auto-dismisses after `duration` ms
 * — a countdown that PAUSES while the toast is hovered or holds focus (see `arm` below).
 *
 * 5s, down from 7: long enough to read a one-line message twice over, short enough not to sit in the
 * corner of the eye. The number is a floor set by the ACTION, not by the text — an Undo the user
 * cannot reach in time is worse than no Undo, and reaching it means hearing the message, deciding,
 * and tabbing to it. The pause is what makes the shorter window safe.
 */
export function toast(message, { actionLabel, onAction, duration = 4000, variant } = {}) {
  const r = region();
  if (!r) return;
  dismiss(); // only one at a time

  const el = document.createElement('div');
  // `variant` is the only styling hook: 'error' swaps the inverse bar for the error surface. Anything
  // else (including nothing) is the default notification.
  el.className = variant === 'error' ? 'toast toast--error' : 'toast';
  const msg = document.createElement('span');
  msg.className = 'toast__msg';
  msg.textContent = message;
  el.appendChild(msg);

  if (actionLabel && onAction) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast__action is-underlined';
    btn.textContent = actionLabel;
    btn.addEventListener('click', () => { onAction(); dismiss(); });
    el.appendChild(btn);
  }

  r.appendChild(el);
  void el.offsetWidth; // flush the hidden frame so .is-shown slides in
  el.classList.add('is-shown');
  current = { el, timer: setTimeout(dismiss, duration) };

  // HOLD THE TOAST WHILE IT IS BEING USED. Without this, an action in a self-dismissing element is
  // a race: the only route to Undo is Tab (it is never focused, because stealing focus for an
  // optional action is worse), so a keyboard or screen-reader user has to hear the message, decide,
  // and arrive — all before the countdown ends. Anyone who gets there now keeps it.
  // `focusin`/`focusout` rather than focus/blur: those do not bubble, and the target is the BUTTON
  // inside, not this element. Resuming restarts the FULL window rather than the remainder — if you
  // reached for it, you get the whole window back, and it saves tracking elapsed time for a
  // difference nobody perceives. Listeners die with the element on dismiss.
  const pause = () => { if (current?.el === el) clearTimeout(current.timer); };
  const resume = () => { if (current?.el === el) current.timer = setTimeout(dismiss, duration); };
  el.addEventListener('mouseenter', pause);
  el.addEventListener('mouseleave', resume);
  el.addEventListener('focusin', pause);
  el.addEventListener('focusout', resume);
}

/** Slide out + remove the current toast (idempotent). */
export function dismiss() {
  if (!current) return;
  const { el, timer } = current;
  current = null;
  clearTimeout(timer);
  el.classList.remove('is-shown');
  const done = () => el.remove();
  // [owner 2026-09-25] NO reduced-motion BRANCH, HERE OR AT THE FLUSH ABOVE. This used to remove the
  // toast immediately, because the slide-out was gated by `no-preference` and `transitionend`
  // therefore never arrived. The gate is gone: the global reset SHORTENS the transition to 0.01ms
  // rather than removing it, so the event fires either way and one path serves both. It also
  // deletes the second copy of the media query — it was written once in CSS and once here, and the
  // two had to agree by hand.
  el.addEventListener('transitionend', done, { once: true });
  setTimeout(done, 500); // fallback > --dur-normal: a cancelled transition never fires the event
}
