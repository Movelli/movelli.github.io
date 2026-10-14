/**
 * THE ASSISTANT DIALOG — opening and closing the conversation, and the state that goes with it.
 *
 * [owner 2026-09-26] IT WAS `panel.js`, and it is named for the one dialog it is about —
 * `#assistant-dialog` — the way `assistant-menu.js` is named for `#assistant-menu`.
 *
 * It is one of `<movelli-assistant>`'s internals: `toChat()` and `toPage()` are the doors,
 * `focusOnOpen()` decides where focus lands, `syncAssistantButton()` keeps the control honest, and
 * the listeners at the foot cover the ways the dialog can open or close WITHOUT going through
 * either door.
 *
 * [2026-09-23] IT WAS `views.js`, AND ITS HEADER DESCRIBED A DESIGN THAT WAS DELETED IN SEPTEMBER.
 * Four blocks of it — "THE TWO VIEWS", the four cues that made them read as different surfaces, the
 * page card that the scale used to end in, and "HIDING IS `visibility`, NOT `display`" — were all
 * about a page view and a chat view swapping inside one document. There is ONE surface: a page,
 * with a non-modal dialog over it. The reasoning for that design is in
 * `docs/record/shell-history.md`, which is kept as evidence and says which of the three recorded
 * shells is the site. The file was renamed in the assistant rework and its header was not, which is
 * this codebase's most-recorded failure — a comment that outlives what it describes and reads as
 * live.
 *
 * WHAT SURVIVES FROM IT, because both rules still bind:
 *
 * [hard] NOTHING HERE FIRES ON FOCUS. WCAG 3.2.1 On Focus (Level A): receiving focus must not
 * initiate a change of context, and opening the conversation is one — a keyboard user tabbing past
 * the assistant button would be thrown into it. The trigger is a CLICK, which crosses no such line.
 * *(The other trigger this warned about, "the first text entered", was deleted with the two views.
 * Its lesson outlives it: written as `keydown` it fired for the SHIFT of a Shift+Tab, so tabbing
 * BACKWARDS out of the input opened the chat. Any future "the visitor is typing" trigger wants the
 * `input` event, which fires if and only if the value changed.)*
 *
 * [hard] THE DIALOG'S OWN `open` IS THE FACT, never a class a function sets — see `dialog()` below
 * and the two listeners at the foot of this file, which exist because `show()` and `close()` can be
 * called from anywhere.
 */

import { isTouch } from './pointer.js';
import * as store from '../store.mjs';
import * as visualViewport from './visual-viewport.js';
import { track, keepEntry } from './dialog-handlers.js';

/** Set while the last input was a Tab — the Ask pill's ring gate. See the listeners at the bottom. */

/** The conversation's own <dialog>. Exported because the element asks it whether it is open —
 *  an element's own `open` is the fact, and reading it beats any class a function has to set. */
export const dialog = () => document.getElementById('assistant-dialog');
/** The one control that opens and closes it. By `id`: a script that means THIS control asks for it
 *  by id, never by a class that names a KIND. */
const button = () => document.getElementById('assistant-button');
const chatBody = () => document.getElementById('chat-body');

/**
 * Is there a conversation? A question about the dialog's own DOM, so it lives with the element
 * rather than in session.js — which had this selector written out a second time, and which imports
 * THIS module (so asking the other way round would be an import cycle).
 */
export function hasHistory() { const l = chatBody(); return !!l && l.children.length > 0; }

/**
 * [hard] THE CONVERSATION SCROLLS ON `.chat__scroll`, NOT ON THE LOG — and everything that
 * scrolls the chat has to ask for it here rather than assume. *(It said `.chat-view` until
 * 2026-09-23; that class was renamed with the dialog on 2026-09-22 and this note did not follow.)*
 *
 * In the DIALOG the log WAS the scroll container, so `log().scrollTop = …` was correct and every
 * caller wrote it that way. Moving the log into the chat view moved the scrolling one level OUT (the
 * view owns `overflow-y: auto` plus the padding that keeps content clear of the fixed chrome) and
 * left the log at `overflow: visible` — where `scrollHeight === clientHeight` and a write to
 * `scrollTop` is a silent no-op. Measured: switching into a 2060px conversation landed at the TOP of
 * it, and a new turn never scrolled into view.
 */
export function scroller() { return document.getElementById('chat-scroll'); }

/**
 * "The AI sent you here" — set when the visitor follows a link out of the TRANSCRIPT, read and
 * cleared by the assistant input on the next page so that page's opener knows not to introduce itself.
 *
 * ON THE LOG, not on the document: a header click while the chat is showing is still browsing, so
 * "the chat is open" was never the test — "the link was inside the transcript" is.
 *
 * [2026-09-23] AND IT IS ON THE LOG NOW, WHICH THIS COMMENT HAS CLAIMED SINCE IT WAS WRITTEN. The
 * listener sat on `document` and filtered with `.closest('.chat__body')`, so every click
 * anywhere in the page ran a DOM walk to discover it was not in the transcript. The filter made the
 * BEHAVIOUR right and left the cost, and the comment described the intent rather than the code —
 * this file's most-recorded failure shape. Scoping it is the same rule the owner applied to the
 * opener's chips: no expensive listener on the body when the element is in hand.
 */
chatBody()?.addEventListener('click', (e) => {
  if (e.target.closest('a[href]')) store.write('fromChat', '1');
});

/* [owner 2026-09-23] THE COMPOSER'S TWO COPY MODES ARE DELETED — `ASK_COPY`, `syncAskCopy` and
 * the cross-fade that swapped between them. There were four pairs of strings: a label, a
 * placeholder and two halves of the submit button, said one way on a page and another way in a
 * conversation, swapped on whether the log had anything in it.
 *
 * All four are gone for the same reason. The submit button is ICON-ONLY with ONE hidden name,
 * "Send your message", which is true in both states. The placeholder says the same sentence, and
 * where it varies it now varies by what an ENTRY asked for (`assistant.start({ placeholder })`)
 * rather than by how much history there happens to be. The label is DERIVED from the placeholder,
 * so it cannot disagree with it. See `input.setPlaceholder`.
 *
 * What went with them: the `.ask.is-swapping` cross-fade, which existed because two words trading
 * places in one spot reads as a glitch — there is nothing left to trade — and `appliedCopy`, the
 * no-op guard that stopped the button blinking on every turn.
 */

/**
 * WHERE FOCUS GOES WHEN THE PANEL OPENS — and on a phone it is NOT the input.
 *
 * [hard, owner 2026-09-23] FOCUSING THE INPUT ON TOUCH SUMMONS THE KEYBOARD, and the panel is
 * opening at that moment. The owner: *"opening the dialog and at the same time the keyboard popping
 * up is too much motion and it might even look bad when the increasing height of dialog open
 * transition fights against the decreasing height from the keyboard popup."*
 *
 * It also breaks the assumption the 2026-09-21 rule was built on — *"it is a panel you open to ask
 * a question now"* — which the owner has narrowed rather than reversed: *"When the user clicks on
 * the assistant for the first time they don't even know they open a chat so this isn't necessarily
 * true."* It holds for someone who knows what the control does and came to type. It does not hold
 * for a first visit, and it does not hold for a reply chip, where the visitor wants to READ what
 * came back. On a desktop the cost of being wrong is a cursor in a field; on a phone it is half the
 * screen. So: the input where a keyboard is already there, the CONVERSATION where it is not.
 *
 * The scroll box is the right second choice rather than a fallback — it is the content, and it
 * carries `tabindex="0"` for the recorded reason that a transcript of plain text has nothing
 * focusable in it and an unreachable scroll container cannot be scrolled by keyboard.
 *
 * [2026-09-23] This is a CONSISTENCY fix as much as a new rule: `clear-history.js` has skipped this
 * focus on touch since it was written, for the same reason, and `toChat()` did not.
 */
function focusOnOpen() {
  // `preventScroll` on both: the caller has just landed the conversation at its bottom, and focus
  // must not undo that.
  const target = isTouch() ? scroller() : document.getElementById('assistant-input-field');
  target?.focus({ preventScroll: true });
}

/**
 * The assistant button's state, for a screen reader. `aria-expanded` is what a control that opens
 * and closes a thing is supposed to carry, and it is what stops the name being a lie: the button
 * still says "Assistant" while the conversation is open, and this is what says pressing it now
 * closes rather than opens.
 * [hard] Set from the DIALOG's own `open`, so a programmatic open cannot leave it stale.
 */
/**
 * [hard, 2026-09-23] BY `id`, AND THE TWO READERS NOW AGREE. This used to walk
 * `querySelectorAll('.assistant-button')` as if there could be several, while `toPage()` below did
 * `querySelector('.assistant-button').focus()` as if there were exactly one — so one function's
 * assumption contradicted the other's, and neither was the rule. There is exactly one assistant per
 * document and it has an `id`; a script that means THAT control asks for it by id.
 */
function syncAssistantButton() {
  button()?.setAttribute('aria-expanded', String(!!dialog()?.open));
}

let pending = Promise.resolve();

/**
 * [2026-09-24] THE DIALOG'S OWN `open`, NOT A CLASS. This read `body.assistant-dialog-open`, a class
 * this file set and removed on every path — a second copy of a fact the element already carries,
 * kept in step by hand. It was scheduled for removal as soon as nothing needed an ANCESTOR hook,
 * and nothing does: the one CSS rule left using it now asks `body:has(#assistant-dialog[open])`,
 * which the stylesheet was already doing everywhere else.
 */
export function isOpen() { return !!dialog()?.open; }

/* `switched()` retired 2026-09-23. It handed out `pending` for the ANSWER to wait on, and its one
   caller was `handOverToChat` — the 1.6s suggestions handover, deleted the same day. Every other path
   waits on what `toChat()` itself returns, which is the same promise. */

/**
 * Open the conversation.
 *
 * [owner 2026-09-21] FOCUS GOES TO THE INPUT. It went to the scroll box, on the rule that a visitor
 * who pressed the switch asked to READ and that focusing the field would open a phone's keyboard
 * before they had seen anything. That rule was written when the chat was a whole VIEW arriving with
 * a conversation already in it; it is a panel you open to ask a question now, and the question is
 * the reason you opened it.
 *
 * [owner 2026-09-23] NARROWED TO A FINE POINTER — and the 2026-09-21 reasoning turned out to be the
 * thing that needed checking, not the behaviour. *"it is a panel you open to ask a question"*
 * assumes the visitor knows what the control does. The owner: *"When the user clicks on the
 * assistant for the first time they don't even know they open a chat so this isn't necessarily
 * true … When the user clicks on reply chips in the suggestions block it is not true; the user also doesn't
 * know a chat will open the first time and would want to read the chat content first anyway."*
 * So the old rule was not wrong, it was answering for one visitor — the returning one who came to
 * type — and being applied to all of them. The scroll box it used to focus is back, on touch, where
 * the cost of guessing wrong is half the screen rather than a stray cursor. See `focusOnOpen`.
 *
 * The `from` argument went with it. It existed for ONE case — a submit from the Ask input, which
 * must not have its focus stolen mid-sentence — and that case cannot arise any more: the input is
 * inside the dialog, so a submit from it happens with the dialog already open and this function
 * returns at the first line. Measured trace from when it could (the swap took focus 16ms after the
 * click and five real keystrokes landed nowhere) is kept in the git history, not here.
 */
export function toChat() {
  const d = dialog();
  if (!d || d.open) return pending;
  // Land the conversation at the bottom BEFORE it is shown, so it is never seen scrolling into place.
  const sc = scroller();
  if (sc) sc.scrollTop = sc.scrollHeight;
  // [owner 2026-09-21] show(), NOT showModal(): the page stays live behind it — readable,
  // scrollable, clickable — which is the point of one surface with a panel over it. It costs the
  // top layer, so the dialog carries its own z-index (main.css), and the browser's own Esc-to-close,
  // which only a modal dialog gets. [2026-09-26] Esc is the element's to give back — see the
  // `cancel` listener below and dialog-handlers.js.
  // The grow-and-fade is CSS (@starting-style on .assistant-dialog), not a view transition — it has an
  // origin to come from, which a root-level transition cannot express.
  d.show();
  // Start tracking the on-screen keyboard. It is the panel's own concern and nobody else's, so it
  // runs only while the panel is up — see visual-viewport.js for why the listener is not permanent.
  visualViewport.watch();
  syncAssistantButton();
  focusOnOpen();
  pending = Promise.resolve();
  return pending;
}

/**
 * Return to the page view. The conversation persists; nothing about it is torn down.
 * `pointer`: the close came from a mouse or a finger, so focus returns without a ring — see
 * `close()` in assistant-menu.js, where Safari showed why.
 * `moveFocus: false`: the caller is about to put focus somewhere else itself (a skip link), so it stays where it is.
 */
export function toPage({ pointer = false, moveFocus = true, keepHistory = false } = {}) {
  const d = dialog();
  if (!d || !d.open) return pending;
  // [owner 2026-09-17] THE REPLY SURVIVES THE CLOSE — the owner's reason is the flow that reading a
  // page IS: *"users might want to go back to the page where they came from when starting the chat
  // to read something again"*, so leaving is part of continuing the thread, not abandoning it.
  if (keepHistory) keepEntry();
  d.close();
  visualViewport.unwatch();
  syncAssistantButton();
  // Focus returns to the control that opens it — the dialog pattern, and with one surface again it
  // is the right one: the visitor is back where they were.
  if (moveFocus) button()?.focus({ preventScroll: true, ...(pointer && { focusVisible: false }) });
  // `movelli:chat-closed` retired 2026-09-23. It was the aside's return trip: the suggestions block swapped
  // its note back from "Taking you to the full conversation…" when the visitor came back to the
  // page. There is no note to swap any more, so it was a signal with no listener — and a dispatch
  // nobody hears reads as live code. It is two lines to bring back when something needs it (case 2,
  // the follow-up after a chat-sourced navigation, is the likely one).
  pending = Promise.resolve();
  return pending;
}

/** Show the chat and scroll a segment heading into view — the menu's and the drawer's jump links. */
export function scrollToSegment(el) {
  if (!el) return;
  const go = () => el.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    block: 'start',
  });
  if (isOpen()) { go(); return; }
  toChat().then(go);
}

/* [owner 2026-09-25] THE LAST `document` CLICK LISTENER IS DELETED. It closed the panel when the
 * visitor used "Skip to main content" while it was open — the assistant's last reach into a
 * document it does not own, kept because the skip link is outside `<movelli-assistant>` and there
 * was nothing to scope it to. That was the argument FOR it and it is also the argument against:
 * on a host site the selector can never match, so it was a handler on every click in someone
 * else's page. The owner removed it while reworking the skip links.
 *
 * WHAT IT BOUGHT, so a return of the behaviour is read as a reopening rather than something new:
 * the visitor is not left reading the page through an open panel. WCAG 2.4.1 Bypass Blocks is NOT
 * at risk — that was measured against the deleted two-view design, where the page was
 * `visibility: hidden` behind the chat and #main had nothing focusable; the page is live behind a
 * non-modal dialog now, so the skip link works either way.
 */
/*
 * [owner 2026-09-17] THE KEYBOARD TRIGGER IS DELETED TOO, with the click one above it. The first
 * character typed in the page view used to swap the view; now it just types.
 * Its own record is worth keeping because the trap it documents outlives it: that listener started
 * as `keydown` minus a two-key deny-list, and a MODIFIER fires a keydown of its own — so holding
 * Shift to tab BACKWARDS out of the input threw the visitor into the chat. The fix was not a longer
 * deny-list (every arrow, F-key, Home/End, `Dead` for a compose key — the hand-kept list this
 * codebase keeps finding incomplete) and not the allow-list either (`e.key.length === 1` fires for
 * Cmd+A, and excluding modifiers breaks AltGr, which reports ctrlKey AND altKey on Windows). It was
 * `input`, which fires if and only if the value actually changed and covers paste, drag-and-drop and
 * IME composition for free. ANY future "the visitor is typing" trigger wants that event, not a key.
 */

/*
 * [owner 2026-09-17] `key-nav` IS DELETED — the class, both listeners, and the removal inside
 * `toChat`. It existed for exactly one job: gating the page view's focus ring so a pointer press,
 * which was then always on its way to the chat view, never painted one. The ring is gone (the input
 * shows focus by widening, whitening and dissolving its island instead) and the pointer press no
 * longer swaps anything, so both halves of that job went the same day.
 * `a11y.test.js` carried a guard written to catch exactly this deletion as a regression; it is
 * rewritten against the new indicator rather than dropped.
 */

/* [2026-09-24] A SEPARATE `close` LISTENER STOOD HERE AND IS DELETED WITH THE CLASS. Its job was to
 * catch a close that did not go through `toPage()` — Escape, or `dialog.close()` from anywhere — and
 * remove `body.assistant-dialog-open`, which nothing sets any more. Everything else it did, the
 * observer below already does for BOTH directions and from any source.
 * [hard] IT ALSO CARRIED THE ONE THING `[open]` COULD NOT EXPRESS: it read the class as a "toPage
 * has already tidied up" sentinel, to avoid doing the work twice. That distinction dies with the
 * class and costs nothing — by the time either fires, the dialog's `open` is already false, and the
 * work on the other side is idempotent.
 */

/**
 * [owner 2026-09-26] ESC AND BACK ARRIVE AS `cancel`, from dialog-handlers.js, which fires it on the
 * top layer. Cancelled because this close does more than the plain one:
 * `toPage()` returns focus to the assistant button, where a bare `close()` would drop it to <body>.
 * It only ever fires with focus INSIDE the dialog, so moving it is always right here — a skip link
 * closes the dialog with `close()` directly and never passes through this.
 */
dialog()?.addEventListener('cancel', (e) => { e.preventDefault(); toPage(); });
// Back closes it and Forward reopens it, through its own door — see dialog-handlers.js.
track(dialog(), toChat);

/**
 * [hard, owner 2026-09-23] AND A DIALOG CAN BE OPENED FROM ANYWHERE TOO — the same argument as the
 * listener above, which only ever covered the CLOSE half. There is no `open` event for `<dialog>`,
 * so a bare `show()` from anything that is not `toChat()` left the state behind: measured, the
 * button went red and grew its cross (the stylesheet reads `[open]` directly with `:has()`, so it
 * cannot be wrong) while `aria-expanded` still said `false` and `body.assistant-dialog-open` was unset.
 * A screen-reader user was told the control was collapsed while the conversation was on screen.
 *
 * The owner asked for this explicitly — *"Make sure the button is also changed to a close button
 * when the dialog is opened programmatically"* — and it matters more as overlays arrive, since
 * something other than a button press will be opening this.
 *
 * `attributes` on `open` is the only signal there is. It is IDEMPOTENT with `toChat`/`toPage`, which
 * keep doing their own work synchronously: an observer runs a microtask later, which is a frame too
 * late for the entry animation to read.
 */
if (dialog() && window.MutationObserver) {
  new MutationObserver(() => {
    const open = !!dialog().open;
    // The keyboard tracker rides on the same signal as everything else here, so a panel opened or
    // closed by anything that is not toChat/toPage still gets it — idempotent by construction.
    if (open) visualViewport.watch(); else visualViewport.unwatch();
    syncAssistantButton();
  }).observe(dialog(), { attributes: true, attributeFilter: ['open'] });
}
