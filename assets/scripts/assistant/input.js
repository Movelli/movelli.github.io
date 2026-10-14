/**
 * THE ASSISTANT INPUT — at the foot of the assistant's dialog, and the thing that runs a TURN.
 *
 * [owner 2026-09-24] IT WAS "the composer". The owner renamed it with the rest of the `ask`
 * vocabulary: *"call things what they are, no need for technical terms if it does not add value."*
 * The endpoint it posts to keeps its own name — /ask is the NLWeb route, not this box.
 *
 * It enhances a server-rendered `<form action="/ask">`: POSTs the question (plus the multi-turn
 * `prev` history) to the generative agent (`output: 'components'`) and appends the exchange as
 * direct children of `.chat__body` — the assistant's opening line or the visitor's bubble,
 * then the AI's ordered component configs, each rendered through the shared catalog. With no JS the
 * form still submits natively.
 *
 * [owner 2026-09-23] IT WAS `<movelli-ask>`, A WEB COMPONENT OF ITS OWN, AND IT IS NOT ANY MORE.
 * The owner deleted the element with the rework: *"the composer is part of the assistant, not a
 * thing beside it."* An element beside `<movelli-assistant>` was one more piece of the assistant
 * that a host site would have had to know about, and one more thing anything on the page could
 * reach. It is a module inside the boundary now, exported as a SINGLETON — there is exactly one
 * assistant input in a document, the same as there is exactly one panel.
 *
 * The conversation lives in the log (persisted across navigation and reload — session.js);
 * `conversation` is the AI's own context, sent back as `prev` and capped at CONTEXT_TURNS.
 */
import { ingest } from './ingest.js';
import * as session from './session.js';
import * as chat from './assistant-dialog.js';
import * as menu from './assistant-menu.js';
import { fadeIn } from './reveal.js';
import { ready } from './movelli-assistant.js';
import { reveal } from './reveal.js';
import { copy } from '../copy-data.mjs';
import * as store from '../store.mjs';
import { pageContext } from '../page-context.mjs';
import { POINTER_COARSE, isTouch } from './pointer.js';

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// How many prior turns to resend to the AI as context — bounds LLM cost/latency.
// History keeps the whole session; only this window is sent. TODO: tune.
const CONTEXT_TURNS = 6;
/**
 * [hard, owner 2026-09-22/23] THE ASSISTANT DOES NOT COLLECT CONTEXT FROM THE PAGE'S MARKUP. A chip declares which context SOURCES it wants and
 * `proactive.js` resolves them, because only the page knows its own session. The page's own facts come from the shared `page-context.mjs`
 * (a global util, like `store.mjs`), which states the `[data-page]` interface once — the assistant holds no selector of its own.
 */

// The AI's session context — retained across navigations AND reloads (store.mjs owns the key),
// while the visible chat is segmented (session.js). Each entry = one { query, answer }.
const conversation = store.read('conversation', []);
function saveConversation() { store.write('conversation', conversation); syncSkipLink(); }
// [owner 2026-10-08] THE SKIP LINK TO THE MESSAGE FIELD appears once the conversation has FOUR messages (the visitor's), and goes when it is cleared. The
// field has focus when the dialog opens, so before that a link to it is noise; after that, reaching it means tabbing through every answer above. The link is
// the assistant's own markup (`#assistant-skip-to-input`); this file owns the conversation, so it owns the count, and moves focus itself (no history entry).
const SKIP_AFTER = 4;
function syncSkipLink() {
  const link = document.getElementById('assistant-skip-to-input');
  if (link) link.hidden = conversation.length < SKIP_AFTER;
}

// Context API — snapshot / reset / restore the AI's session context (used by the clear-history
// flow, which must wipe BOTH the visible log and this in-memory context, and undo both).
export function snapshotContext() { return conversation.slice(); }
export function resetContext() { conversation.length = 0; store.remove('conversation'); syncSkipLink(); }
export function restoreContext(snap) { conversation.length = 0; if (Array.isArray(snap)) conversation.push(...snap); saveConversation(); }

const log = () => document.getElementById('chat-body');

/**
 * [hard] ONE QUERY DECIDES WHETHER ENTER SENDS — read by the keydown handler AND by the hint that
 * announces it, so the two can never disagree. It is the PRIMARY pointer, so a phone is coarse and a
 * laptop (touchscreen or not) is fine; a convertible can flip mid-session, which is why the hint
 * listens for `change` rather than reading this once.
 */
const enterSends = () => !isTouch();

/**
 * The bar at the foot of the dialog — `.assistant-controls`: the reply chip, the menu button and the
 * `<search>` landmark with the field. [2026-09-26] It was the search itself until the menu button
 * moved in beside it; the chip sits outside the landmark, so lookups are scoped to the bar.
 */
const barEl = () => document.getElementById('assistant-controls');

/**
 * [owner 2026-09-26] ESC CLOSES THE ASSISTANT WHERE A KEYBOARD IS THE MAIN INPUT, so that is where
 * its hint is read. Stated as its own query rather than reusing `enterSends()`: today they agree,
 * but "Enter sends" is a choice about the field and "Esc works" is a fact about the keyboard.
 */
const escapeCloses = () => !isTouch();

class AssistantInput {
  /**
   * [2026-09-23] THIS WAS `connectedCallback`. A module script is deferred, so the markup is parsed
   * before this runs, and the singleton below calls it at import — the same moment the custom
   * element would have upgraded. `q()` scopes every lookup to the bar, which is what `this.` used
   * to do for free when the class WAS the element.
   */
  connect() {
    const bar = barEl();
    if (!bar) return;
    const q = (sel) => bar.querySelector(sel);
    this.form = q('form');
    this.input = q('[name="query"]'); // a <textarea> (auto-growing)
    this.button = q('button[type="submit"]');
    this.replyChip = q('.continue-segment');
    this.replyTitleEl = q('.continue-segment__title');
    this.replyTitle = null;
    // Per-PAGE segment state: the first chat engagement on a browsed-to page seeds a new segment
    // from that page's opener (design: an engaged opener = a segment).
    //
    // [owner 2026-09-01] Read from the store rather than set by a router. Every navigation is a real
    // one now, so this element is CONSTRUCTED fresh on each page — the reset happens by existing at
    // all. The one thing a navigation cannot carry is WHY the visitor came, so a click inside the
    // chat log leaves a flag (assistant-menu.js) and it is consumed here, once.
    this.openerConsumed = false;
    this.suppressOpener = store.read('fromChat') === '1';
    if (this.suppressOpener) store.write('fromChat', '');   // one navigation, one use
    // Passive availability (see setAvailable). `onLine` is false ONLY when the device is definitely
    // offline; true means "no reason to think otherwise", never a guarantee — which is why the
    // failed-request signal below carries the rest of the weight.
    this.available = true;
    if (navigator.onLine === false) this.setAvailable(false);
    addEventListener('offline', () => this.setAvailable(false));
    addEventListener('online', () => this.setAvailable(true));
    if (!this.form || !this.input) return;
    // [owner, hard] WHAT IS TYPED SURVIVES NAVIGATION AND RELOAD — *"That it's technically multipage
    // is not their concern, they expect single page behaviour."* (docs/record/ai.md, step 1.) Every
    // page builds a fresh field, so the unsent text is kept in the store and put back here. Restored
    // BEFORE the listener below is bound, and only into an EMPTY field, so it never writes over a
    // value the field already holds. The field writes on every keystroke and removes the key when it
    // is emptied; a send clears the field in code, which fires no `input`, so `ask()` removes it too.
    if (!this.input.value) this.input.value = store.read('draft', '');
    this.input.addEventListener('input', () => {
      if (this.input.value) store.write('draft', this.input.value);
      else store.remove('draft');
    });
    this.form.addEventListener('submit', (e) => { e.preventDefault(); this.submitFromInput(); });
    // [2026-09-26, owner reported] THE FIELD KEEPS FOCUS WHEN THE SEND BUTTON IS PRESSED. A press
    // moved focus to the button, and the send then disables it while the answer loads — and a
    // disabled element drops focus to the page, so the next Tab landed on the page's first link.
    this.holdFieldFocus(this.button);
    // The textarea auto-grows in pure CSS (field-sizing) — no height scripts here. Enter sends on
    // desktop (Shift+Enter = newline); on touch Enter inserts a newline (send via the button).
    // IME: the Enter that CONFIRMS a composed word is not a send. `isComposing` says so everywhere
    // but Safari, which fires this keydown after the composition has ended, with `isComposing` false
    // and `keyCode` 229 — deprecated, and the only signal WebKit gives (WebKit bug 165004). Without
    // it a Japanese, Chinese or Korean visitor sends half a sentence every time they pick a word.
    this.input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
      if (e.shiftKey || !enterSends()) return; // newline
      e.preventDefault();
      this.submitFromInput();
    });
    // The skip link to this field (see `syncSkipLink`): shown from the fourth message, and it focuses the field rather than navigating to it.
    document.getElementById('assistant-skip-to-input')?.addEventListener('click', (e) => { e.preventDefault(); this.input.focus(); });
    syncSkipLink();
    // …and SAY so, to the one audience that cannot discover it. See syncKeyboardHints.
    this.syncKeyboardHints();
    POINTER_COARSE.addEventListener('change', () => this.syncKeyboardHints());
    // The reply-context chip (a "Re: <segment title>" above the input) — the ✕ cancels the reply.
    // [owner 2026-09-26] It hides its own chip, so it drops focus to the page exactly as the send
    // button did — and it is answered the same way: the field keeps focus, or gets it back.
    const dismiss = q('.continue-segment__dismiss');
    this.holdFieldFocus(dismiss);
    dismiss?.addEventListener('click', () => { this.returnFocusToField(); this.clearReply(); });
    // [owner 2026-09-17] THE WHOLE PILL FOCUSES THE FIELD. It is DRAWN as one input — the ground,
    // the border and the radius belong to the form, not to the textarea inside it — so a click on
    // its padding must do what a click on an input does. "Everything that is styled as an input
    // should behave as an input since the user can't see that the actual input is smaller."
    // [hard] EVERY REAL CONTROL IS EXCLUDED BY ROLE, not by name: the send button and the segment
    // drawer button both live inside this form, and stealing focus from either would break them.
    // `closest('button, a, input, textarea, select, [tabindex]')` covers the two that exist and the
    // next one that is added, which a list of classes would not.
    q('.assistant-input__body')?.addEventListener('click', (e) => {
      if (e.target.closest('button, a, input, textarea, select, [tabindex]')) return;
      this.input?.focus();
    });
    this.bar = bar;
    // [hard, owner 2026-09-23] THE `.chat-reply` LISTENER IS DELETED, and with it `fromChip`. It
    // was delegated on `document` so it would catch the chips `proactive.js` injects into the
    // OPENER — which is the assistant reaching into a page to find controls that are not its own,
    // and it is what made the whole rework necessary. A delegated handler receives only an element,
    // so everything followed from it: the state had to live in `data-` attributes, the label had to
    // be read from `textContent`, and there was no function that took a state object.
    // The opener binds its own chips now, at the moment it injects them, and calls `start()`. If
    // the CHAT ever grows quick replies of its own they get their own code: *"if the chips might
    // look the same they most likely won't behave the same."*
    //
    // "Continue with this segment" stays, and is scoped to the LOG rather than the document — it is
    // the assistant's own control, inside the assistant's own box. Delegated within it because
    // `session.divider()` adds these as the conversation grows, and the innerHTML restore replaces
    // them all at once.
    log()?.addEventListener('click', (e) => {
      const cont = e.target.closest?.('.chat-continue');
      if (cont) { e.preventDefault(); this.setReply(cont.dataset.title || ''); return; }
      // THE CHAT'S OWN QUICK REPLIES — the chips the model emits into an answer. Their LABEL IS
      // THE QUERY, which is what a chip in a transcript has always meant, and they carry no state
      // at all: the visitor is already in the conversation and there is nothing to hand over.
      // Always a forced CONTINUE — the chip IS the disambiguation, so nothing is classified.
      const chip = e.target.closest?.('.chat-reply');
      if (chip) { e.preventDefault(); this.ask(chip.textContent.trim(), { forceContinue: true }); }
    });
  }

  /**
   * WHAT THE FIELD INVITES — and its accessible name, derived from it.
   *
   * [hard, owner 2026-09-25] THE LABEL IS THE PLACEHOLDER, VERBATIM, AND THAT IS A WCAG REQUIREMENT
   * RATHER THAN A FLOURISH. `placeholder` is settable per entry through
   * `assistant.start({ placeholder })`, and 2.5.3 Label in Name asks that a control's accessible
   * NAME contain its VISIBLE text. The field's own <label> is sr-only, so the placeholder is the
   * only text a sighted visitor can read — a FIXED label would stop containing it the moment an
   * entry set one. Setting both from the same `value` satisfies that by identity and cannot drift.
   *
   * It was a formula until 2026-09-25: `assistant_input_label` read *"Chat input with placeholder
   * text: {placeholder}"*, which is the implementation explaining itself out loud rather than
   * naming the control. Deleting it also deleted the site's one `{placeholder}` token — the
   * recorded i18n hazard, since a translator reads that as a word and breaks the substitution.
   *
   * Passing nothing restores the default. An entry that asks for no placeholder is not asking to
   * keep the last entry's, and a stale invitation from a conversation two turns ago is worse than
   * the generic one.
   */
  setPlaceholder(text) {
    const value = String(text || '') || copy('assistant_input_placeholder');
    if (this.input) this.input.placeholder = value;
    const label = document.querySelector('label[for="assistant-input-field"]');
    // The label IS the placeholder — see the partial, which ships it already derived so no-JS is
    // correct too. One string, one source, and WCAG 2.5.3 satisfied by identity rather than by a
    // sentence describing the field.
    if (label) label.textContent = value;
  }

  /**
   * A SEED WITH NO PROMPT — the whole of what some entries do. Nothing is sent, nothing is fetched,
   * and the conversation opens with an authored line.
   *
   * The opener's FOCUSED chip is the case it was built for: that visitor has read deepest into one
   * category and is the most valuable one on the site, and they used to arrive at the assistant's
   * generic empty state. The greeting is authored, arrives with no round trip, and cannot come back
   * wrong — the owner's call: *"No need to go via the AI already."*
   *
   * A DIVIDER but NO HEADING, and that is honest rather than lazy: a segment's title comes from the
   * model, and no model ran. The drawer lists the segments that have one.
   */
  seedOnly(seed) {
    if (!Array.isArray(seed) || !seed.length) return;
    // The page's opener has had its turn, so a typed question after this extends rather than
    // re-opens — the same bookkeeping `prepareSegment` does on the fetched path.
    if (!this.openerConsumed && session.hasHistory()) session.divider();
    this.openerConsumed = true;
    const first = this.seedTurn(seed);
    session.save();
    session.refresh();
    this.scrollToTurn(first, first, { instant: true });
  }

  /** Send what's typed. With an active reply chip, the message continues the referenced thread:
   *  the query becomes `Re: <title> — <message>` (so retrieval + the AI get the topic) and it's a
   *  forced CONTINUE (no new segment). The chip is cleared once the turn sends. */
  submitFromInput() {
    const msg = this.input.value.trim();
    if (!msg) return;
    // …and the send button is about to be disabled, so focus goes back to the field first.
    this.returnFocusToField();
    if (this.replyTitle) this.ask(`Re: ${this.replyTitle} — ${msg}`, { fromInput: true, forceContinue: true });
    else this.ask(msg, { fromInput: true });
  }

  /** Show a reply-context chip for an older segment: the next turn continues that thread. The chip
   *  grows the bar in pure CSS. Focuses the input. Called from a segment's own "Continue with this
   *  segment" button in the log. */
  setReply(title) {
    if (!title || !this.replyChip) return;
    this.replyTitle = title;
    if (this.replyTitleEl) this.replyTitleEl.textContent = title;
    this.replyChip.hidden = false;
    this.input?.focus();
  }

  /**
   * [owner 2026-09-26] A CONTROL NEXT TO THE FIELD THAT DISABLES OR HIDES ITSELF WHEN PRESSED — the
   * send button, the reply chip's ✕ — must not take focus with it to the page.
   * A FINGER OR A PEN never moves focus: its mousedown is cancelled, which keeps focus in the field
   * and a phone's on-screen keyboard up. A MOUSE's is not cancelled, because Firefox then draws no
   * press state on the control; `returnFocusToField` puts focus back instead.
   */
  holdFieldFocus(control) {
    control?.addEventListener('pointerdown', (e) => { this.pressedBy = e.pointerType; });
    control?.addEventListener('mousedown', (e) => { if (this.pressedBy !== 'mouse') e.preventDefault(); });
  }

  /**
   * After a MOUSE or KEYBOARD press of one of those controls, put focus back in the field: the
   * control took it (Chrome, or Tab then Enter), or the dialog did (Safari and Firefox focus the
   * nearest focusable ancestor of a pressed button). Not after a finger's: it never moved focus, and
   * focusing the field would open a keyboard the visitor had put away.
   */
  returnFocusToField() {
    const byTouch = this.pressedBy === 'touch' || this.pressedBy === 'pen';
    this.pressedBy = null;
    if (!byTouch && document.activeElement !== this.input) this.input.focus({ preventScroll: true });
  }

  /** Cancel the reply context (the ✕ chip button, or after a reply turn sends). */
  clearReply() {
    this.replyTitle = null;
    if (this.replyChip) this.replyChip.hidden = true;
  }


  /**
   * POINT THE FIELD AT ITS KEYBOARD HINTS — "Press Enter to send" and, since 2026-09-26, "Press
   * Escape to close" — each only where it is true. What follows was written for the first and
   * holds for both.
   *
   * [hard] IT IS THE ONE FACT ABOUT THIS FIELD THAT NOTHING ELSE SAYS, AND THE TREE SUGGESTS THE
   * OPPOSITE. Measured in Chrome: a <textarea> is announced MULTILINE (its implicit
   * `aria-multiline`), which tells a screen-reader user that Enter makes a new line — true
   * everywhere except here, on a fine pointer. There is no visible hint either, so a sighted
   * visitor is in the same position; this closes the half we can close cheaply.
   *
   * [hard] SET FROM JS, NEVER SHIPPED IN THE HTML, because the sentence is FALSE in two states the
   * static markup cannot tell apart: with JS off a textarea never submits a form on Enter, and on
   * TOUCH our own handler deliberately inserts a newline (the send button is the way). Mobile is the
   * primary audience, so an unconditional hint would state something untrue to most visitors. It
   * reads `enterSends()` — the same query the keydown handler uses — and re-runs on `change`, so a
   * convertible that gains or loses a mouse mid-session keeps a description that matches what the
   * key does.
   *
   * The target is `hidden`: the accname spec includes a hidden node that is DIRECTLY referenced
   * (measured in Chrome — the description resolves), so it costs no CSS and cannot be read twice by
   * a reader browsing the page, selected, or found by in-page search. Re-verify in the recorded
   * VoiceOver pass; a visually-hidden span is the fallback if any engine disagrees.
   */
  syncKeyboardHints() {
    if (!this.input) return;
    // [owner 2026-09-26] TWO HINTS, EACH WHERE IT IS TRUE, read in this order after the field's name:
    // "Press Enter to send", "Press Escape to close". On touch neither applies, so nothing is read.
    const hints = [
      enterSends() && 'assistant-input-enter-hint',
      escapeCloses() && 'assistant-input-escape-hint',
    ].filter(Boolean);
    if (hints.length) this.input.setAttribute('aria-describedby', hints.join(' '));
    else this.input.removeAttribute('aria-describedby');
  }

  /**
   * @param {string} query     what is SENT to the assistant — for an entry chip, its `prompt`.
   * @param {Array}  [seed]    AUTHORED component configs that OPEN the exchange, in place of the
   *                           visitor's own turn. See `seedTurn`.
   * @param {string} [context] turn context the ENTRY POINT pushed, already resolved.
   *
   * [2026-09-23] `label` IS DELETED. It existed so an entry chip's BUTTON TEXT could be shown as
   * the visitor's turn while the model-facing `prompt` was what got sent — a workaround for there
   * being no seed. The owner: *"the button label is totally irrelevant."* Every caller now either
   * passes a seed (an entry) or is a typed question (which is both).
   */
  async ask(query, { forceContinue = false, fromInput = false, context = '', seed = null } = {}) {
    // [2026-09-26] `false` when the turn is REFUSED — a turn is already running — so `start()` can
    // report it. Nothing else reads the value.
    if (!query || this.pending) return false;
    this.setPending(true);
    // Was the chat already open? If this turn is what OPENS it, the scroll below must be instant —
    // an animated scroll running behind the entry transition is visible and looks broken.
    const wasOpen = chat.isOpen();

    // [owner 2026-09-23] THE DIALOG OPENS AT ONCE, from a chip as well as from the input. There used
    // to be a 1.6s handover on the chip path — the recorded "the switch is not sprung on the
    // visitor" rule — and it was built out of two things the owner has now removed: the chip
    // collapsing into a turn ON THE PAGE, and a note sliding in under it saying where the
    // conversation was going. Neither exists, so the pause had nothing to show and nothing to
    // announce; holding an empty page still for 1.6s after a press reads as broken, not as gentle.
    // If the switch turns out to need announcing again, it needs something to announce first.
    const opening = wasOpen ? Promise.resolve() : chat.toChat();
    // Sending closes the segment panel: it covers the conversation, and the answer is about to land
    // there. It is a no-op on desktop, where the panel is a permanent column. (This is reachable at
    // all because the panel no longer covers the Ask bar — it used to sit behind a backdrop.)
    // Resolves once the menu has finished its exit (immediately if it was not open).
    // The scroll to the new turn waits on it, so the menu's exit and the conversation's
    // vertical move happen in sequence rather than on top of each other.
    const menuGone = menu.close();
    // The answer is held by `opening` below — awaiting it IS the gate the reveal used to need.

    // Echo the question + a thinking indicator IMMEDIATELY — waiting for the round-trip before
    // showing anything makes the chat look dead (testing note #1). The segment structure isn't known
    // until the answer lands, so `prepareSegment` inserts ABOVE this bubble via the anchor.
    // THE TURN'S OPENING, and its anchor: the segment structure slots in above it, and the scroll
    // lands on it. A seed where the entry authored one; the visitor's own words otherwise.
    const user = seed ? this.seedTurn(seed) : this.userBubble(query);
    const thinking = this.thinkingIndicator();   // labelled itself; the answer's label rides its prose
    if (fromInput) { this.input.value = ''; this.clearReply(); store.remove('draft'); } // clear the input on send, not on reply
    // [hard] A DEFERRED SCROLL MUST YIELD TO A LATER ONE. The answer's own scroll (below) can land
    // FIRST when the round-trip is quicker than the panel's exit — measured happening with the dev
    // mock — and this one would then scroll back up to the question a moment after the reply
    // arrived. `scrollSeq` is bumped by every scroll, so a pending one that is no longer the most
    // recent request simply does not run.
    const seq = this.scrollSeq;
    menuGone.then(() => { if (this.scrollSeq === seq) this.scrollToTurn(user, thinking, { instant: !wasOpen }); });

    // [hard, owner 2026-09-06] THE TURN ALWAYS ENDS, however it goes wrong. `pending` gates the very
    // top of this function, so a throw anywhere below used to strand it at `true` and every later
    // submit returned early — the Ask bar dead for the rest of the session, with nothing on screen
    // saying why. That is exactly what happened: the AI's grid carried a child the layout check
    // rightly refused, `renderElement` threw, and the turn died four lines before `setPending(false)`.
    // The check was correct; what was wrong is that a refusal took the whole surface with it.
    try {
      let out = null;
      try {
        const res = await fetch('/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ query, prev: conversation.slice(-CONTEXT_TURNS), output: 'components', page: pageContext(), context }),
        });
        if (!res.ok) throw new Error(String(res.status));
        out = await res.json();
      } catch {
        out = null;              // network error / undeployed → degraded message below
        this.setAvailable(false); // …and the Ask bar goes with it until we are told otherwise
      }

      // [hard] HOLD THE ANSWER, NEVER THE REQUEST. The fetch above started the moment the visitor
      // sent; this only waits for the SWAP before the answer is allowed to land, so a round-trip
      // that outlasts the opening costs nothing. Already resolved whenever the chat was open.
      await opening;

      thinking.remove();                       // the answer (or the failure) replaces it
      this.prepareSegment(out, forceContinue, user); // segment structure slots ABOVE the whole turn
      this.appendAnswer(query, out, user, { instant: !wasOpen, gate: null });
      // [hard, owner 2026-08-28] SAVE UNCONDITIONALLY. This was `if (out)`, so a FAILED turn was
      // appended to the log and never persisted. The visitor's own question is part of the
      // transcript whether or not an answer came back, and restoring the failure message is honest
      // — it is what happened.
      session.save();
      session.refresh(); // the current segment is now engaged → history control + Recents update
      // [hard, owner 2026-09-23] TELL WHOEVER STARTED THE TURN HOW IT WENT. An entry point (the
      // opener's chips) disables itself only once the assistant has actually taken the turn —
      // *"to prevent disabling while the user didn't get what they ask for yet"*. `out` is null when
      // the request failed, so a dead /ask leaves the question live and pressable.
      // An EVENT, not a call: the assistant holds no reference to any entry point and does not know
      // what a chip is. It reports; the entry decides what the report means.
      // [2026-09-23] `movelli:assistant-ready`, not `movelli:turn-done` — the same report, renamed
      // for the case where the entry sends no prompt and there is no turn to be done.
      ready(!!out);
    } finally {
      // In `finally`, not after the last statement: a half-rendered answer is a bad turn, a dead
      // input is a dead feature. The error still reaches the console — nothing is swallowed.
      //
      // [decided 2026-09-06, owner] AND IT RUNS HERE, AT THE END OF THE WHOLE TURN — so the SEND
      // BUTTON stays greyed for the handover too, about two seconds, long after the request itself
      // has returned. That is deliberate: the turn is not finished until its answer is placed, and a
      // second message sent into the gap would race the first into the log. Do not "fix" it by
      // releasing the button when the fetch settles. (What was wrong was the whole PILL dimming with
      // it — a separate rule, see `.assistant-input__body:has(.assistant-input__field:disabled)` in main.css.)
      this.setPending(false);
    }
  }

  /** The user's message, echoed into the log the moment they send.
   *
   *  ONLY the user's turn is a bubble. The AI's reply renders exactly as page content does — no
   *  surface, no wrapper, no name — which is the integrated look the whole shell is built around;
   *  the inverted bubble is then the one thing on screen that is unmistakably the visitor's own.
   *  Neither turn is labelled: with one side in a bubble and the other not, a caption saying which
   *  is which is redundant furniture. */
  userBubble(query) {
    // A component, like every other direct child of the log. The CLASS carries the styling, so
    // renaming the element leaves every `.chat-turn` rule untouched.
    // A COMPONENT, from the catalog — the same one the aside's collapsed reply uses, so a rule
    // written for one surface cannot miss the other. `text` rather than `html`, so the renderer
    // escapes it: these are the visitor's own words.
    return this.placeBubble(ingest({ type: 'chat-turn', text: query }));
  }

  placeBubble(el) {
    if (el) fadeIn(el);
    return el;
  }

  /**
   * THE SEED — what an entry point authored for the assistant to OPEN with.
   *
   * [hard, owner 2026-09-23] IT REPLACES THE VISITOR'S TURN, IT DOES NOT SIT BESIDE IT. A chip
   * press is not something anybody said. While there was no seed, the entry's model-facing
   * `prompt` was echoed back as a user bubble — so the log opened with *"Tell me briefly what
   * Movelli is about, then ask me one question…"* presented as the visitor's own words. The
   * alternative on offer was to show the BUTTON's label instead, and the owner refused both: *"the
   * button label is totally irrelevant."*
   *
   * It renders as ORDINARY CONTENT, exactly as the answer under it does — no bubble, no name. That
   * is not a shortcut: the bubble is what marks a turn as the VISITOR's, and this is the assistant
   * speaking. The seed and the answer then read as one continuous reply, which is what they are.
   *
   * Returns the FIRST element, so it can stand in for the bubble everywhere the turn needs an
   * anchor — the segment heading inserts above it and the scroll lands on it.
   */
  seedTurn(seed) {
    if (!log()) return null;
    let first = null;
    for (const cfg of seed) {
      const el = ingest(cfg);   // check, sanitize, render, append — `start({ seed })` is a public door
      if (!el) continue;
      fadeIn(el);
      first = first || el;
    }
    return first;
  }

  /** An animated "thinking" placeholder shown while `/ask` is in flight. `aria-live=polite` +
   *  a visually-hidden label so it's announced once, not spelled out as three dots. */
  thinkingIndicator() {
    const el = ingest({ type: 'chat-thinking', text: copy('chat_thinking') });
    if (el) fadeIn(el);
    return el;
  }

  /**
   * Decide the segment boundary before rendering the turn.
   *  (1) The FIRST engagement on a browsed-to page opens a NEW segment — the deploy-independent
   *      trigger, "an engaged opener is a segment": a divider (if the log has content) and a
   *      model-titled segment. The turn then CONTINUES into it.
   *  (2) Within the same page: a typed query classed NEW starts a fresh model-titled segment; a
   *      reply chip (`forceContinue`) or a CONTINUE just extends the current segment.
   *  (3) [owner 2026-09-26] AFTER "Clear chat history" THE NEXT TURN IS THE PAGE'S FIRST AGAIN —
   *      see resetSegmentState below. Without it the first engagement had already been spent, a
   *      chip press is always a forced CONTINUE, and the turn continued nothing: no title, and so
   *      nothing for the history to list.
   *
   * [owner 2026-09-23] THE SEGMENT IS NO LONGER SEEDED BY CLONING THE OPENER'S DOM. `seedOpener`
   * copied the suggestions block's rendered children into the log so the conversation began with what the
   * visitor had just read, and its heading titled the segment. Two things ended it: the suggestions block is
   * not chat-shaped any more — it is an intro, two cards and a question, and a grid of cards
   * cloned into a 400px panel is not the start of a conversation — and its heading is now the same
   * generic line on every page, which titles nothing. It also closes the recorded todo THE OPENER
   * SEED MUST COME FROM CONFIGS, NOT A DOM CLONE, by deleting the clone rather than converting it:
   * what replaces it is an AUTHORED `seed` on the entry itself, which is specified and not yet
   * built (see `docs/record/ai.md`). Until then the segment takes the model's own title, which is
   * the path this already fell back to whenever the suggestions block had not finished loading.
   */
  prepareSegment(out, forceContinue, before = null) {
    if (!out) return; // network error → no segment change, just append the error message
    // A reply chip is a deterministic CONTINUE; otherwise the model classifies the turn.
    const isNew = !forceContinue && out.continuation === 'new';
    if (!this.openerConsumed && !this.suppressOpener) {
      this.openerConsumed = true; // the page's opener had its chance at this first engagement
      // startSegment draws the divider itself. [2026-09-26] A second call here drew it TWICE — two
      // rules and two "Continue with this segment" — on every first turn on a page that continued a
      // conversation, which is every option press.
      session.startSegment(out.title, before);
      return;
    }
    if (isNew) session.startSegment(out.title, before);
  }

  /**
   * [owner 2026-09-26] CLEARING THE HISTORY MAKES THE NEXT TURN THE PAGE'S FIRST AGAIN. Once the
   * conversation is gone there is no segment to continue and no conversation that sent the visitor
   * here, so both per-page marks go back to how a fresh page starts. Returns what they were, for the
   * Undo (`restoreSegmentState`), which puts the conversation back and so puts them back too.
   * It is a reset rather than a rule read from the log because a first turn that FAILS after a clear
   * leaves its error in the log: the retry has to count as the first turn all the same, as it does on
   * a fresh page — the mark is only spent by a turn that got an answer.
   */
  resetSegmentState() {
    const before = { openerConsumed: this.openerConsumed, suppressOpener: this.suppressOpener };
    this.openerConsumed = false;
    this.suppressOpener = false;
    return before;
  }

  restoreSegmentState(state) {
    if (!state) return;
    this.openerConsumed = state.openerConsumed;
    this.suppressOpener = state.suppressOpener;
  }

  setPending(on) {
    this.pending = on;
    // `|| !this.available` matters: setPending(false) runs at the END of every submit, including the
    // one that just discovered the assistant is unreachable — without it, that call would re-enable
    // the button a moment after setAvailable disabled it.
    if (this.button) this.button.disabled = on || this.available === false;
    this.bar?.setAttribute('aria-busy', on ? 'true' : 'false');
  }

  /**
   * Whether the assistant can be reached — the Ask input and its button are disabled when it cannot.
   *
   * PASSIVE by construction: nothing here polls, and nothing sends a request of its own. There are
   * exactly two signals, and both are things the browser hands us for free:
   *   · `navigator.onLine === false` (and the `offline` event) — the device has no network at all,
   *     so we know BEFORE any attempt is made. This is the only case we can catch pre-emptively.
   *   · a failed `/ask` — the request the visitor already made. When the network is fine but the
   *     function is down (the `ERR_CONNECTION_REFUSED` case) this is the ONLY thing that can tell
   *     us, so the first message is always allowed through and is what discovers it.
   *
   * Coming back: the `online` event re-enables, and a page load starts from `navigator.onLine`. A
   * function that recovers while the network never dropped is therefore only noticed on a refresh —
   * accepted, because the alternative is exactly the poller this is written to avoid.
   */
  setAvailable(on) {
    this.available = on;
    if (this.input) this.input.disabled = !on;
    if (this.button) this.button.disabled = !on || this.pending;
    // [owner 2026-09-23] AND IT SAYS SO IN THE DOM, so surfaces the assistant knows nothing about
    // can answer it. The opener's question, its chips and its footer note all offer something that
    // cannot happen while the assistant is unreachable, and they hide — a CSS rule reads this.
    // The assistant still holds no reference to any entry point: it states a fact about itself.
    //
    // [hard, owner 2026-09-25] ON THE ELEMENT, NOT ON <body>. It used to toggle an
    // `assistant-unavailable` class on the host's body, which is the element writing to a document
    // it does not own — the same fault as the nested-dialog listener. The attribute says the same
    // thing where it belongs, and `body:has()` still lets a page rule read it. The markup ships
    // `data-available="true"`, so the fact is right before any of this runs and with JS off.
    document.querySelector('movelli-assistant')?.setAttribute('data-available', String(on));
  }

  /** Append the exchange as direct children of the chat log: a user bubble, then the AI's
   *  ordered component configs (grounded prose + cards), each rendered through the shared
   *  catalog — siblings of the segment's opener content. */
  appendAnswer(query, out, user, { instant = false, gate = null } = {}) {
    const l = log();
    if (!l) return;

    const components = out && Array.isArray(out.components) ? out.components : [];
    let firstReply = null; // the first component of the reply (the top the user should land near)
    const revealed = [];   // the answer's elements, revealed together as ONE sequence
    if (components.length) {
      for (const cfg of components) {
        // The reply's components go in AS THEY ARE — the same prose, cards and forms a page renders.
        // Nothing wraps them, so the AI's answer reads as content rather than as a message.
        const el = ingest(cfg);
        if (el) { revealed.push(el); firstReply = firstReply || el; }
      }
    } else {
      // [owner 2026-09-01] `status-message`, through the CATALOG. Two changes, one cause.
      //
      // It used to assemble a `movelli-note` and its classes BY HAND, under a comment saying "same
      // shape the catalog's note renders" — one role, two renderers, with only a comment keeping
      // them in step. And `note` was the wrong component: this is the SYSTEM saying the assistant
      // cannot be reached, not an aside beside content and not something the AI said, so it takes
      // the reading size at full ink rather than the notes family's 13px italic secondary. It had
      // rendered as a note since 31 Aug, when the family was rekeyed from a class list to
      // `movelli-note` and silently pulled it in.
      //
      // `text` rather than `html`: the renderer `esc()`s a `text` field, which is the textContent
      // guarantee this path had, kept.
      //
      // [owner 2026-09-01] THE SECOND MESSAGE IS DELETED. "No answer just now — try rephrasing your
      // question." was the `out`-truthy branch, and nothing can reach it: `askGenerative` never
      // returns an empty list (no results goes to `handoff()`, and components that fail to resolve
      // fall back to prose plus the top three as cards), and the dev mock always returns something.
      // It was also wrong twice over — saying "I don't know" IS an answer, and it would have been
      // the AI's turn rather than a system message.
      const msg = ingest({ type: 'status-message', text: copy('chat_unavailable') });
      if (msg) { revealed.push(msg); firstReply = msg; }
    }
    // ONE call for the whole answer, so prose streams and the components that follow it come in
    // after it finishes — a single sequence rather than each element animating on its own clock.
    reveal(revealed, { gate });

    // Multi-turn: keep the exchange (question + the AI's prose answer as text) for `prev`.
    conversation.push({ query, answer: this.proseText(components) });
    saveConversation();                 // survive reload (context)
    // land the user on the top of the new turn, not its bottom — instantly when this turn is what
    // switched the view, so nothing animates behind the swap.
    this.scrollToTurn(user, firstReply, { instant });
  }

  /** The first prose component's text (feeds the multi-turn `prev` history). */
  proseText(components) {
    const p = components.find((c) => c && c.type === 'prose');
    return p ? String(p.html || '').replace(/<[^>]+>/g, '').trim() : '';
  }

  /** After a turn is appended, scroll so the user sees the START of the exchange — NOT its bottom.
   *  Anchor the top of the new turn (its segment heading if there is one, else the user's prompt) at
   *  the top of the log, so their own prompt and the beginning of the reply are visible. But if the
   *  prompt is so tall that anchoring its top would push the reply's top off the bottom, anchor the
   *  reply's top instead so at least the start of the reply stays on screen. The CHAT VIEW scrolls
   *  internally (not the page) — see `chat.scroller()`: the log itself is `overflow: visible`, so
   *  writing to its scrollTop does nothing at all. */
  scrollToTurn(userEl, replyEl, { instant = false } = {}) {
    this.scrollSeq = (this.scrollSeq || 0) + 1;   // see the deferred-scroll note in submit()
    const l = chat.scroller();
    if (!l || !userEl) return;
    let anchor = userEl;
    // A NEW segment adds a heading just above the prompt. The heading is a COMPONENT (<movelli-chat-segment-title>), so the
    // sibling to test is that element — named by its public tag, not by a class inside it (owner 2026-10-08, E4).
    const prev = userEl.previousElementSibling;
    if (prev && prev.matches?.('movelli-chat-segment-title')) anchor = prev;
    // Both rects are in viewport coordinates: setting scrollTop to `topOf(el) - MARGIN` lands the
    // element MARGIN px below the top of the scroll box.
    const topOf = (el) => el.getBoundingClientRect().top - l.getBoundingClientRect().top + l.scrollTop;
    // [owner 2026-09-26] THE AIR ABOVE A TURN IS THE SCROLL BOX'S OWN `scroll-padding-top` — the
    // space it keeps above the log (its own top padding since step 66), so a turn lands where the first segment sits at rest and exactly where a
    // jump from the chat history lands a heading (scrollIntoView honours scroll-padding; scrollTo
    // does not, so it is read here). It was a 12px of its own: a first turn scrolled 20px into the
    // log's air, and one heading sat at two heights depending on how the visitor got to it.
    const MARGIN = parseFloat(getComputedStyle(l).scrollPaddingTop) || 0;
    const REPLY_MIN = 40;  // keep at least this much of the reply's top on screen, below that air
    const visible = l.clientHeight;
    const anchorTop = topOf(anchor);
    const replyTop = replyEl ? topOf(replyEl) : anchorTop;
    const target = (replyTop - anchorTop <= visible - MARGIN - REPLY_MIN)
      ? anchorTop - MARGIN   // the prompt fits with the reply → put the turn's top at the top
      : replyTop - MARGIN;   // the prompt is too tall → keep the reply's top on screen instead
    l.scrollTo({ top: Math.max(0, target), behavior: (instant || reduceMotion()) ? 'auto' : 'smooth' });
  }
}

/**
 * ONE COMPOSER PER DOCUMENT, constructed at import and wired as soon as it exists. There is no
 * registry and no tag: `<movelli-assistant>` reaches it by importing this module, and nothing
 * outside the assistant can reach it at all — which is the point of the boundary.
 */
export const input = new AssistantInput();
input.connect();
