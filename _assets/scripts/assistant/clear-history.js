/**
 * Clear chat history — the SEGMENT DRAWER's trash control.
 *
 * Wiping the chat resets the two stores that are the ASSISTANT'S OWN: the visible transcript
 * (session.js: the log + `movelli:log`) and the AI's session context (the assistant input's in-memory
 * `conversation` array + `movelli:conversation`). It snapshots both, wipes both, and shows a top
 * toast with **Undo** that restores them. [2026-09-26] The input's per-page segment marks go with
 * them, so the next turn opens a segment as a page's first does — and come back with the Undo. It lives in its own module so neither session.js nor
 * assistant-menu.js has to import the other (they are already coupled).
 *
 * [hard, owner 2026-09-23] IT USED TO WIPE A THIRD STORE — THE OPENER'S — BY IMPORTING IT, and that
 * is deleted. *"We should trigger a custom event when the chat history is cleared and it is up to
 * proactive.js to listen to that and act upon it or not."* The opener is one entry point among
 * many; the assistant importing it made the arrow point from the assistant to a surface it is
 * supposed to know nothing about, so the suggestions block could not have been deleted or replaced without
 * this file breaking.
 * So it ANNOUNCES: `movelli:assistant-cleared`, and `movelli:assistant-restored` on the Undo. Each
 * entry point holds its own snapshot and decides for itself what a cleared history means for it —
 * which is the same division the `movelli:assistant-ready` report already follows.
 *
 * [hard] IT DOES NOT CLOSE ANYTHING, and the header used to say it did. That was true of the chat
 * DIALOG, which held the whole conversation; the drawer holds only the segment list, so there is
 * nothing to be yanked out of.
 */
import * as session from './session.js';
import { input, snapshotContext, resetContext, restoreContext } from './input.js';
import * as menu from './assistant-menu.js';
import { emit } from './movelli-assistant.js';
import { assistantToast } from './assistant-toast.js';
import { copy } from '../copy-data.mjs';

/** Say what happened. Whoever cares is listening; this file does not know who they are.
 *  It goes out on the ELEMENT and bubbles — see `emit` in movelli-assistant.js for why. */
const announce = (name) => emit(name);

function clearWithUndo() {
  const snap = { log: session.snapshotLog(), ctx: snapshotContext() };
  session.wipeLog();   // clear the visible transcript (+ movelli:log) + refresh the controls
  resetContext();      // clear the AI context (in-memory + movelli:conversation)
  input.clearReply();   // drop any pending "Re:" reply-context chip
  snap.seg = input.resetSegmentState();   // the next turn opens a segment, as a page's first does
  // …and TELL WHOEVER STARTED SOMETHING. The opener is one such listener: it was still showing an
  // answer to a conversation that no longer exists, which is the one place the page went on
  // claiming something had happened. It decides that for itself now.
  announce('cleared');
  // The DRAWER stays open (owner's decision, carried over from the dialog). The reason it was given
  // has expired — closing the dialog would have returned the visitor to the page, where closing the
  // drawer only returns them to the conversation they are already in — but the behaviour is unchanged
  // rather than quietly reversed: what it leaves is an empty list above a disabled button, which
  // reads as "there is nothing here" and is still closable.

  // PUT FOCUS BACK, because the control that was just activated is destroyed by its own effect:
  // wipeLog() → refresh() DISABLES the clear button and hides the drawer's opener in the Ask bar,
  // so a keyboard or screen-reader user is left on a disabled control — which drops focus to <body>
  // and loses their place in the document entirely.
  //
  // [owner 2026-09-23] THE TARGET IS THE DRAWER, NOT THE ASK INPUT, and that removes a trade rather
  // than resolving it. Focusing the input meant summoning the on-screen keyboard over a chat the
  // visitor may have cleared precisely to put away — so it was skipped on `(pointer: coarse)`, and
  // that test cannot tell a sighted tapper from a VoiceOver user on a phone, who navigates BY focus
  // and was the one person the skip was wrong for. A non-field target repairs focus for all three
  // and opens no keyboard, so there is nothing left to branch on.
  // It is the drawer's OWN focus target, the one `open()` uses, so landing here announces the thing
  // they are still in rather than a control they did not reach for.
  //
  // WHAT IS LOST, stated rather than glossed: the input answered "what now?" by being actionable.
  // The toast below carries that instead — it says what happened AND offers the Undo, which is the
  // more useful next step at this moment.
  //
  // BEFORE the toast, deliberately. A focus move is announced immediately while `aria-live="polite"`
  // waits for a pause, so focusing first lets the toast follow the focus announcement; doing it the
  // other way round risks some screen readers dropping the pending polite message in favour of the
  // focus change, and "Chat history cleared" is the half that carries the Undo.
  menu.refocus();

  // [owner 2026-09-24] INTO THE DIALOG'S OWN REGION, not the page's (its own toast since 2026-10-08: `assistant-toast.js`). This is a message about the
  // conversation, and the visitor is looking at the conversation — a bar sliding down at the top of
  // the WINDOW, behind an open menu, is a message about nothing they can see.
  assistantToast(copy('chat_history_cleared'), {
    actionLabel: copy('chat_history_undo'),
    onAction: () => {
      session.restoreLog(snap.log);
      restoreContext(snap.ctx);
      input.restoreSegmentState(snap.seg);
      announce('restored');
    },
  });
}

document.getElementById('chat-clear-history')?.addEventListener('click', clearWithUndo);
