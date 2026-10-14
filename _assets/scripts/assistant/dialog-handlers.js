/**
 * DIALOG HANDLERS — how the assistant's dialogs close: together, on Esc, on a tap beside the one on
 * top, and on Back.
 *
 * [owner 2026-09-26] Every dialog in `<movelli-assistant>` is non-modal (`show()`), so the page
 * behind stays live — and that costs the platform's own Esc-to-close and, on a phone, the Back
 * button closing an overlay before it leaves the page. Both come back here, in one file, because
 * they are one job: turn what the visitor did into "close the dialog on top", through the same
 * `cancel` event (see `requestClose`).
 *
 * WHAT IT KNOWS, and it is deliberately little: nothing about WHICH dialogs exist. Esc is decided by
 * where focus is; Back only acts for a dialog that asked to be tracked, with its own way to reopen.
 * A dialog that does neither — the owner named a future pro-active dialog with no opener — is
 * simply not affected, so adding one cannot change how the others behave.
 */

/**
 * BIND THE HANDLERS THAT LIVE ON THE ELEMENT — the nested close, Esc and the tap beside. Called once per connection
 * by `<movelli-assistant>`, with the connection's `signal`, so moving the element releases them and
 * binds them again rather than twice. (Back is not here: history belongs to the window, and a dialog
 * opts in with `track()` below.)
 */
export function bindDialogHandlers(element, signal) {
  bindNestedClose(element, signal);
  bindEsc(element, signal);
  bindTapBeside(element, signal);
}

/**
 * CLOSING A DIALOG IN HERE CLOSES WHATEVER IS NESTED IN IT — the menu goes down with the
 * conversation. Without it the menu keeps its `open` attribute while its parent is gone and is
 * still open the next time the conversation is shown.
 *
 * [hard, owner 2026-09-25] BOUND TO THE ELEMENT, NEVER TO `document`. It covers every dialog in the
 * element, including ones added later — but nothing outside it. The first version listened on
 * `document` and the owner caught it: *"The assistant is a web component that I might insert in
 * client web sites. And the code that you just added is going to control whatever dialog and
 * nested dialogs the client might have on its website."*
 *
 * [hard] CAPTURE, BECAUSE `close` DOES NOT BUBBLE. Measured 2026-09-25: with capture off a
 * listener on an ancestor never fires for a dialog's close; with it on it fires for the dialog
 * and for one nested inside it. Capture is also what lets ONE listener cover them all.
 *
 * [hard] AND THE EVENT FIRES — `assistant-menu.js` carried *"THE NATIVE `close` EVENT DOES NOT
 * FIRE IN THIS ENGINE"* as a `[hard]` rule from 2026-08-31 and it is wrong. What does not fire
 * it is removing the `open` ATTRIBUTE rather than calling `close()`. See CLAUDE.md: a
 * limitation of Claude's environment is never a reason to build the worse thing.
 */
function bindNestedClose(element, signal) {
  element.addEventListener('close', (e) => {
    const d = e.target;
    if (!(d instanceof HTMLDialogElement)) return;
    for (const nested of d.querySelectorAll('dialog[open]')) nested.close();
  }, { capture: true, signal });
}

/**
 * ASK A DIALOG TO CLOSE. It fires the dialog's `cancel` event, the platform's own "a close was asked
 * for", and closes the dialog if nothing cancelled it. A dialog whose close does more — returning
 * focus to the control that opened it — cancels the event and closes itself its own way; a dialog
 * with nothing extra to do needs no code at all. `cancel` does not bubble, so each hears only its own.
 *
 * [owner 2026-09-26] THE EVENT SAYS WHETHER A POINTER ASKED — `detail.pointer`. A dialog that gives
 * focus back reads it to give it back without a ring, as its own close button does after a click;
 * Esc leaves it false, because that visitor needs to see where focus landed.
 */
function requestClose(d, { pointer = false } = {}) {
  if (d.dispatchEvent(new CustomEvent('cancel', { cancelable: true, detail: { pointer } }))) d.close();
}

/**
 * ESC CLOSES THE DIALOG THAT HOLDS FOCUS — one listener, bound to the element, and released with
 * the `signal` when that element leaves the document.
 *
 * WHICH ONE: the TOP LAYER of the dialog focus is in. First the nearest open dialog around the
 * focused element — when focus is out on the page there is none, and Esc is not ours: the assistant
 * does not own the page (owner). Then the last open dialog nested inside that one, because a dialog
 * opened inside another is drawn over it. That second step is not a nicety: with the menu open, the
 * toast's Undo is still reachable — it is deliberately left out of the inert set, and it belongs to
 * the conversation, not the menu — so focus can sit in the conversation while the menu covers it,
 * and Esc there has to close the menu, not everything. A SIBLING of the conversation is not nested
 * in it, so neither can take Esc from the other.
 *
 * IME: the Esc that cancels a composition belongs to the composition, not to us. `isComposing` says
 * so everywhere but Safari, which fires this keydown AFTER the composition has ended, with
 * `isComposing` false and `keyCode` 229 — deprecated, and the only signal WebKit gives. Not
 * measurable here; the event shape is documented in WebKit bug 165004.
 */
function bindEsc(element, signal) {
  element.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing || e.keyCode === 229) return;
    let d = e.target instanceof Element ? e.target.closest('dialog[open]') : null;
    if (!d || !element.contains(d)) return;
    d = [...d.querySelectorAll('dialog[open]')].pop() || d;
    e.preventDefault();
    requestClose(d);
  }, { signal });
}

/**
 * [owner 2026-09-26] A TAP ON A DIALOG WHILE ANOTHER IS OPEN INSIDE IT CLOSES THE ONE ON TOP — the
 * way a drawer closes when the page above it is tapped. With the menu open, everything else in the
 * conversation is inert, and an inert element is passed over by hit-testing — so a tap on the part
 * of the conversation still in view lands on the conversation DIALOG itself, and that is the one
 * shape this looks for: a click whose target is an open dialog with an open dialog inside it.
 *
 * Like Esc it names no dialog, so a dialog opened inside the conversation later closes this way too.
 * A tap on the top dialog's own box is not this (its target has nothing open inside it), and a tap
 * with nothing nested open is not either. Through `cancel`, exactly like Esc, marked as a pointer's.
 */
function bindTapBeside(element, signal) {
  element.addEventListener('click', (e) => {
    const d = e.target;
    if (!(d instanceof HTMLDialogElement) || !d.open || !element.contains(d)) return;
    const top = [...d.querySelectorAll('dialog[open]')].pop();
    if (top) requestClose(top, { pointer: e.detail > 0 });
  }, { signal });
}

/* ── BACK CLOSES, FORWARD REOPENS ─────────────────────────────────────────────────────────────────
 * [owner 2026-09-26] ONLY WHILE THE CONVERSATION IS A FULL-SCREEN SHEET — on a phone, or a tablet
 * held upright — where it covers the page and Back leaving the page would lose it. Over the inset
 * panel the page is right there, and Back keeps its ordinary meaning.
 *
 * HOW: a tracked dialog that opens adds a history entry carrying the ids of every tracked dialog
 * open at that moment. Back then lands on the entry below — same document, so the page does not
 * change — and whatever that entry no longer lists is closed, top layer first, through `cancel`
 * exactly like Esc. Two presses with the menu open: the menu, then the conversation (owner).
 * Forward lands on an entry that lists more than is open, and that is REOPENED with the dialog's own
 * open function (owner: *"reopen what back closed"*).
 *
 * [hard, owner] AN ENTRY EXISTS ONLY WHILE ITS DIALOG IS OPEN. A dialog closed any other way — its
 * button, Esc, a skip link — steps back over its entry, so the visitor's next Back is never a press
 * that does nothing. A page cannot DELETE a history entry, only step back over it, so the entry
 * stays as a FORWARD entry until the visitor opens another page; Forward onto it reopens the dialog,
 * which is the same rule as above.
 *
 * [owner 2026-10-08] ONE EXCEPTION: A SKIP LINK. It closes the dialog and then jumps, and the jump adds its own entry on top of the dialog's —
 * so there is nothing to step back over, and stepping back anyway undid the jump. `keepEntry()` makes the closes of this moment leave the entry
 * alone; Back from the jump then lands on it and reopens the dialog, which is where the visitor came from.
 */

/**
 * [owner 2026-09-26] CHECKED ONCE, WHEN THE PAGE LOADS, and never again. Rotating a tablet turns the
 * sheet into the panel and back, and following that would mean removing and re-adding entries
 * mid-conversation; the owner chose one behaviour for the life of the page instead.
 * [hard] IT IS THE SAME LINE AS THE STYLESHEET'S, where the conversation stops being a sheet and
 * becomes the inset panel (`@media (min-width: 54rem)` around `.assistant-dialog`). CSS cannot
 * export it, so it is written twice and `a11y.test.js` asserts the two agree.
 */
const PANEL = '(min-width: 54rem)';
const SHEET = !matchMedia(PANEL).matches;

const tracked = new Map();   // id → { dialog, reopen }
let layers = [];             // ids of the tracked dialogs open now, in the order they opened
let own = 0;                 // history steps WE started, whose popstate is ours to ignore
let keep = false;            // a close of this moment must leave its entry alone — see keepEntry()

/** The closes of this moment (a skip link's) do not step back over the dialog's entry. Lasts until the next task, past the click's own jump. */
export function keepEntry() {
  keep = true;
  setTimeout(() => { keep = false; });
}

const entryLayers = () => history.state?.assistantLayers || [];

/**
 * MAKE THE CURRENT HISTORY ENTRY MATCH WHAT IS OPEN — one entry per open layer.
 * More open than the entry lists: add the entries. Fewer: step back over the extra ones, as ONE
 * traversal, and remember that its popstate is ours. While one of our own steps is still on its
 * way this waits, and runs again when it lands — adding an entry in the middle of a traversal is
 * the one ordering the History API does not promise to keep.
 */
function sync() {
  if (own) return;
  const have = entryLayers();
  if (layers.length > have.length) {
    for (let n = have.length + 1; n <= layers.length; n++) {
      history.pushState({ ...history.state, assistantLayers: layers.slice(0, n) }, '');
    }
  } else if (layers.length < have.length) {
    if (keep) return;
    own++;
    history.go(layers.length - have.length);
  }
}

// A tracked dialog opened or closed, by anything — the attribute is the only signal there is, and
// the same one `assistant-dialog.js` already reads for the button's state.
const watch = new MutationObserver((records) => {
  for (const { target: d } of records) {
    layers = layers.filter((id) => id !== d.id);
    if (d.open) layers.push(d.id);
  }
  sync();
});

/**
 * TRACK A DIALOG FOR BACK AND FORWARD. `reopen` is the dialog's own way to open — so Forward puts
 * focus and state back exactly as a click would. Called once per dialog by the module that owns it.
 * Does nothing when the page loaded as the panel.
 */
export function track(dialog, reopen) {
  if (!SHEET || !dialog?.id) return;
  tracked.set(dialog.id, { dialog, reopen });
  watch.observe(dialog, { attributes: true, attributeFilter: ['open'] });
}

addEventListener('popstate', () => {
  if (own) { own--; sync(); return; }
  if (!SHEET) return;
  const want = entryLayers();
  // BACK: close what the entry no longer lists, top layer first.
  for (const id of [...layers].reverse()) {
    if (!want.includes(id)) { const t = tracked.get(id); if (t) requestClose(t.dialog); }
  }
  // FORWARD: reopen what it lists and is closed, bottom layer first.
  for (const id of want) {
    if (!layers.includes(id)) tracked.get(id)?.reopen();
  }
});

/**
 * A RELOAD KEEPS THE ENTRY AND LOSES THE DIALOG. Reloading while the assistant is open lands on an
 * entry that lists open layers, over a page where nothing is open — so the next Back would do
 * nothing visible. Step back over it, once, at load. (A page restored from the back/forward cache is
 * not a load: it comes back with its dialogs open and its entry matching, and this does not run.)
 */
if (entryLayers().length && history.length > entryLayers().length) {
  own++;
  history.go(-entryLayers().length);
}
