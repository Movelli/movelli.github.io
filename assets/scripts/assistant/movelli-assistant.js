/**
 * <movelli-assistant> — THE ASSISTANT, AND THE BOUNDARY AROUND IT.
 *
 * [hard, owner 2026-09-23] EVERYTHING THE ASSISTANT IS LIVES INSIDE THIS ELEMENT, AND EVERYTHING
 * OUTSIDE TALKS TO IT THROUGH ONE METHOD. That is the 2026-09-22 decision — one web component,
 * because it has to be installable in a site we did not build — and until now it was not built: the
 * assistant was a button in the site header, a <dialog> in the body, a <movelli-ask> inside that,
 * and behaviour spread across five modules that anything could import.
 *
 * A custom element's API is its METHODS, which is what makes the same call work for our own code
 * and for a host site's script. One tag to add, one script to load:
 *
 *     document.querySelector('movelli-assistant')?.start({ seed, prompt, placeholder, context });
 *
 * [hard] IT IS NOT A FILE MOVE. An element with 1,400 lines in one file is not the goal — the
 * element is the BOUNDARY, and what is inside it is as many modules as it needs (they sit beside
 * this one in `src/scripts/assistant/`). What must be true is that nothing OUTSIDE reaches past
 * `start()` and the `movelli:assistant-ready` event. `test/a11y.test.js` asserts exactly that.
 *
 * [hard] THE BUTTON IS INSIDE IT TOO, and it left the site header to get here. The header is the
 * wordmark and nothing else now; this element is fixed to the top-right corner, above the header's
 * z-index, so the button sits exactly where it always did while belonging to the thing it opens.
 * Its DOM position — immediately after </header> — is what keeps the tab order unchanged: skip
 * links, brand, assistant, main. See the markup in generator/page-renderer.js.
 */
import * as assistantDialog from './assistant-dialog.js';
import { bindDialogHandlers } from './dialog-handlers.js';
import { input } from './input.js';
import './session.js';
import './assistant-menu.js';
import './clear-history.js';

class MovelliAssistant extends HTMLElement {
  /**
   * [2026-09-26] EVERY LISTENER BELOW IS BOUND FOR ONE CONNECTION, and released when the element
   * leaves the document. Moving an element is a disconnect followed by a connect, so without this a
   * host page that moved the assistant — into a different container, after a layout change — bound
   * each listener a second time: the button's click then fired twice, opened and closed in one
   * press, and the assistant could not be opened at all. One signal per connection, aborted in
   * `disconnectedCallback`, keeps it to exactly one of each however often the element moves.
   */
  connectedCallback() {
    this.listening?.abort();
    this.listening = new AbortController();
    const { signal } = this.listening;

    this.button = this.querySelector('#assistant-button');
    // ONE CONTROL, BOTH WAYS: it opens the assistant, and while the assistant is open it closes it.
    // Bound to the button itself rather than delegated on `document` — the button is this element's
    // own child, so there is nothing to delegate and nothing to pay for on every click in the page.
    // `detail` is 0 when Enter or Space pressed it, so only a keyboard close brings the focus ring back.
    this.button?.addEventListener('click', (e) => (this.isOpen() ? assistantDialog.toPage({ pointer: e.detail > 0 }) : assistantDialog.toChat()), { signal });

    // [owner 2026-09-26] THE DIALOG HANDLERS — closing a dialog closes what is nested in it, Esc
    // closes the dialog that holds focus, and (on a phone) Back closes the top one. All of them in
    // dialog-handlers.js, handed this element and this connection's signal, so they are bound to
    // the assistant and nothing outside it, and released with everything else.
    bindDialogHandlers(this, signal);
  }

  disconnectedCallback() { this.listening?.abort(); }

  /**
   * THE ONE WAY IN. Everything that triggers the assistant — a reply chip in the suggestions block, a future
   * island, a share control, a host site's own page script — calls this and nothing else.
   *
   * [hard, owner 2026-09-23] IT TAKES A STATE OBJECT AND NOTHING DOM-ISH. No element, no event, no
   * button label. *"If it ever needs a node it has stopped being the API."* What shipped before
   * this method existed was the inverse — the assistant reached into the page with a delegated
   * listener, found `.chat-reply` buttons and read their state back out of `data-` attributes — so
   * triggering it from a script meant building a button and clicking it, which is the exact failure
   * the spec named.
   *
   * [hard] `label` IS NOT IN THE SHAPE AND NEVER WAS. The owner: *"the button label is totally
   * irrelevant."* It belongs to whatever control the visitor pressed; what goes in the log is
   * `seed`.
   *
   * @param {object}  state
   * @param {Array}   [state.seed]     AUTHORED component configs to put in the log before the turn —
   *                                   the assistant's own opening line, so the conversation does not
   *                                   begin with a turn the visitor never took. With no `prompt`
   *                                   it is the whole of what this entry does — nothing is sent.
   * @param {string}  [state.prompt]   what is SENT. Absent means "just open, with the seed".
   * @param {string}  [state.placeholder] what the assistant input's field should invite. Its accessible
   *                                   label is DERIVED from it — see `syncPlaceholder` — because a
   *                                   placeholder that changes under a fixed label breaks WCAG
   *                                   2.5.3 Label in Name. Nothing authors one yet.
   * @param {string}  [state.context]  turn context the ENTRY POINT resolved and is pushing. The
   *                                   assistant never collects context; it is handed it.
   */
  async start({ seed, prompt, placeholder, context } = {}) {
    await assistantDialog.toChat();
    // Unconditionally, including with nothing to set: an entry that asks for no placeholder is not
    // asking to keep the LAST entry's, and the label is re-derived with it.
    input.setPlaceholder(placeholder);
    if (prompt) {
      // The turn reports through `movelli:assistant-ready` when it finishes — see `ask()`.
      // [2026-09-26] …AND EVERY CALL REPORTS, including the ones that never become a turn. A turn
      // already running makes `ask()` refuse this one, and it used to refuse SILENTLY: no seed, no
      // request, no event — so an entry that pressed during a typed question waited on a report
      // that never came, and the running turn's own `ready(true)` was taken for its answer. A
      // refusal, or a turn that throws, is `ok: false`: the visitor did not get what they pressed for.
      let took;
      try { took = await input.ask(prompt, { forceContinue: true, context, seed }); } catch (e) { ready(false); throw e; }
      if (took === false) ready(false);
      return;
    }
    // NO PROMPT: the seed is the whole answer. It goes in the log and the assistant is ready — no
    // request, no waiting, and nothing that can come back wrong.
    input.seedOnly(seed);
    ready(true);
  }

  /**
   * Close the conversation. The page keeps the conversation; nothing is torn down.
   * @param {object}  [opts]
   * @param {boolean} [opts.moveFocus=true]  return focus to the assistant's button. A caller that moves focus itself, such as a skip link, passes false.
   * @param {boolean} [opts.keepHistory=false]  on the phone sheet, do not step back over the conversation's history entry. A caller that is about to navigate itself (a skip link's jump) passes true.
   */
  close({ moveFocus = true, keepHistory = false } = {}) { assistantDialog.toPage({ moveFocus, keepHistory }); }

  /** Is the conversation on screen? The DIALOG's own `open` is the fact — never a class. */
  isOpen() { return !!assistantDialog.dialog()?.open; }
}

/**
 * THE ONE WAY BACK: `movelli:assistant-ready`, fired at whichever moment is truthful — the turn
 * completed and something came back, or (with no prompt) there is simply something to read.
 *
 * [hard, owner 2026-09-23] AN EVENT AND NOT A CALLBACK, for the reason the installable goal already
 * gives: a host can listen without importing our modules or calling our functions in the right
 * order. A callback also serves only its caller, and the owner's own share-article case is a page
 * script with no button at all — the suggestions block, a future island and a host's analytics can all hear an
 * event. It keeps the recorded line intact: the assistant REPORTS, and the entry decides what the
 * report means.
 *
 * It replaces `movelli:turn-done`, which would be a lie in the case where no turn happened.
 *
 * `ok: false` says the visitor did not get what they pressed for — a failed request, nothing back.
 * The opener reads exactly that to decide whether its question counts as answered.
 */
/**
 * [hard, owner 2026-09-25] EVERY `movelli:*` EVENT IS DISPATCHED ON THE ELEMENT AND BUBBLES. They
 * were fired on `document`, which reaches the same listeners and says the wrong thing about where
 * they came from: on a host site an event from the whole document is not attributable to the
 * component that raised it, and a host cannot scope a listener to the assistant.
 *
 * `bubbles: true` is what keeps the existing listeners working unchanged — `document` is on the
 * bubble path, so `document.addEventListener('movelli:assistant-ready', …)` in proactive.js hears
 * it exactly as before. `composed` is not set: the assistant is light DOM, so there is no shadow
 * boundary to cross.
 *
 * If the element is not in the page there is nothing to fire from and nothing to hear it, so the
 * call is a no-op rather than a throw.
 */
export function emit(name, detail) {
  document.querySelector('movelli-assistant')
    ?.dispatchEvent(new CustomEvent(`movelli:assistant-${name}`, { bubbles: true, detail }));
}

export function ready(ok) { emit('ready', { ok: !!ok }); }

if (!customElements.get('movelli-assistant')) customElements.define('movelli-assistant', MovelliAssistant);
