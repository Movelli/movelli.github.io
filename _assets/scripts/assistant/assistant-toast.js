/**
 * THE ASSISTANT'S OWN TOAST — a short message inside the assistant dialog, with one optional action (Undo), that dismisses itself.
 *
 * [owner 2026-10-08] IT DOES NOT SHARE `toast.js`. The page's toast (`src/scripts/toast.js`) used to take a `region` selector from the assistant, a
 * selector into the toast feature's own markup, and carried an option that existed for no other caller: each side held a fact about the other. Now the
 * assistant owns its toast, in its own region (`#assistant-toast`, in the assistant's markup), and `toast.js` knows nothing of the assistant. What they
 * SHARE is the LOOK — the `.toast`, `.toast__msg` and `.toast__action` classes, as `.btn` and `.chip` are shared — and nothing else.
 *
 * "Chat history cleared" is about the conversation and the visitor is looking at the conversation: a bar sliding down at the top of the WINDOW, while the
 * dialog and an open menu cover the middle of it, is a message about nothing they can see.
 *
 * One toast at a time (a new one replaces the current), 4s, and the countdown PAUSES while the toast is hovered or holds focus, so an action the
 * visitor is reaching for is not taken away; resuming restarts the full window. The slide-out ends on `transitionend` with a timer as the fallback
 * (a cancelled transition never fires the event). No reduced-motion branch: the global reset shortens the transition rather than removing it.
 */

const region = () => document.getElementById('assistant-toast');

let current = null;   // { el, timer }

export function assistantToast(message, { actionLabel, onAction, duration = 4000 } = {}) {
  const r = region();
  if (!r) return;
  dismiss();

  const el = document.createElement('div');
  el.className = 'toast';
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
  void el.offsetWidth;   // flush the hidden frame so `.is-shown` slides in
  el.classList.add('is-shown');
  current = { el, timer: setTimeout(dismiss, duration) };

  const pause = () => { if (current?.el === el) clearTimeout(current.timer); };
  const resume = () => { if (current?.el === el) current.timer = setTimeout(dismiss, duration); };
  el.addEventListener('mouseenter', pause);
  el.addEventListener('mouseleave', resume);
  el.addEventListener('focusin', pause);
  el.addEventListener('focusout', resume);
}

/** Slide out and remove the current toast (idempotent). */
function dismiss() {
  if (!current) return;
  const { el, timer } = current;
  current = null;
  clearTimeout(timer);
  el.classList.remove('is-shown');
  const done = () => el.remove();
  el.addEventListener('transitionend', done, { once: true });
  setTimeout(done, 500);
}
