/**
 * THE SEGMENT MODEL — the transcript, and the named parts of it.
 *
 * The full conversation lives in the dialog's log (`.chat__body`): a flat
 * column of content web components, split into SEGMENTS by an `<hr>` + a heading. This is
 * the single source of truth for the visible transcript — the dialog always shows the whole
 * log (NO reveal/prepend; the old reveal/collapse/marker/scroll-compensation is gone). It
 * persists across navigation (it is restored from session storage on each page) and
 * across reload (via store.mjs, which owns every persisted key).
 *
 * Transcript ≠ context: this is only what's SHOWN; the AI's context lives in the assistant input's
 * `conversation`. the assistant input drives segment creation (NEW/CONTINUE) and calls `save`; the
 * segment list and the clear-history control are wired here.
 */
import { scrollToSegment, hasHistory } from './assistant-dialog.js';
import * as menu from './assistant-menu.js';
import { ingest, turns, replaceTurns } from './ingest.js';
import * as store from '../store.mjs';
import { copy } from '../copy-data.mjs';

const log = () => document.getElementById('chat-body');

// `hasHistory` lives in assistant-dialog.js — it is a question about the dialog's own DOM, and this
// module already imports from there. It is re-exported because the assistant input and the tests read it
// through `session.*`, and one name for one question beats two doors to it.
export { hasHistory };

/** Persist the log as turn data for the session (survives reload). */
export function save() {
  if (log()) store.write('log', turns());
}

/** Restore the persisted conversation into the (hidden) chat log — once, at init. */
function restore() {
  const l = log();
  if (!l) return;
  const stored = store.read('log', []);
  if (!Array.isArray(stored) || !stored.length) return;
  replaceTurns(stored);
}

/** The title of the segment currently at the end of the log (the one about to be divided off), or ''. */
function currentSegmentTitle(l, before = null) {
  let titles = [...l.querySelectorAll('movelli-chat-segment-title')];   // the component's public element, not a class inside it
  // With an insert anchor, only the segments ABOVE it count — the pending turn isn't part of the
  // segment being closed off.
  if (before) titles = titles.filter((t) => t.compareDocumentPosition(before) & Node.DOCUMENT_POSITION_FOLLOWING);
  return titles.length ? titles[titles.length - 1].textContent || '' : '';
}

/** Append an `<hr>` segment divider — only if the log already has content (no leading rule). The
 *  just-ended segment first gets a bottom-right "Continue with this segment" affordance (above the
 *  rule): a delegated click (the assistant input) drops a reply-context chip on the input. It lives in the
 *  log HTML, so it survives reload; the listener is delegated, so it survives the innerHTML restore. */
/** `before` = insert ahead of this element instead of appending. The chat echoes the user's bubble
 *  IMMEDIATELY (before the answer is known), so the segment structure decided post-fetch has to slot
 *  in ABOVE that bubble — hence the anchor. Without one, everything appends as before. */
export function divider(before = null) {
  const l = log();
  if (!l || !l.children.length) return;
  // "has content" must ignore the pending turn itself — a divider above the very first bubble would
  // be a leading rule.
  if (before && !before.previousElementSibling) return;
  const title = currentSegmentTitle(l, before);
  if (title) {
    // A CATALOG COMPONENT. It used to be built here by hand, which is how the chat's elements came
    // to differ from every other component on the site — see the rule that a `movelli-*` element IS
    // content. The delegated handler still reads `.closest('.chat-continue')`, which finds this
    // wrapper from the button inside it.
    ingest({ type: 'chat-continue', segment: title, label: copy('chat_continue') }, { before });
  }
  // The <hr> keeps its role=separator, so the component is the WRAPPER — the catalog's renderer
  // states that once, for every surface.
  ingest({ type: 'chat-divider' }, { before });
}

/** Start a new segment: an `<hr>` divider (only if the log already has content) + a heading. */
export function startSegment(title, before = null) {
  if (!log()) return;
  divider(before);
  if (title) {
    // [2026-09-23] FROM A CONFIG, like every other element in the log. This was the LAST one built
    // by hand — six `createElement` lines duplicating `renderChatSegmentTitle`, with the element name, both
    // class strings and the heading level written out a second time. Verified byte-identical to the
    // renderer's output before the swap.
    // [hard] IT IS THE PRECONDITION FOR THE LOG STORING DATA RATHER THAN `innerHTML` (see STEP 2 in
    // docs/record/ai.md): a turn can only be RECORDED as it is appended if there is a config behind
    // it, and this was the one thing in the log with none. The recorded blocker was the suggestions block's
    // DOM clone; that was deleted on 2026-09-23 and this survived it unnoticed.
    // (h3, because a segment sits inside the dialog, which is named by its own h2.)
    ingest({ type: 'chat-segment-title', text: title }, { before });
  }
  refresh();
}

/** Snapshot the current log turns (for the clear-history Undo). */
export function snapshotLog() { return turns(); }

/** Wipe the visible transcript (the log + its persisted copy); leaves the AI context alone
 *  (the clear-history flow resets that separately via the assistant input). */
export function wipeLog() {
  log()?.replaceChildren();
  store.remove('log');
  refresh();
}

/** Restore a snapshotted log (the clear-history Undo). */
export function restoreLog(list) {
  const l = log();
  if (!l) return;
  replaceTurns(list);
  save();
  refresh();
}

/** Wipe EVERYTHING this site persists — the log, the AI context, the visit trail, the suggestions block state.
 *  Dev/reset helper (the clear-history UI also resets the assistant input's in-memory context; this only
 *  drops the stored copies, so a reload gives a fully clean slate):
 *  `import('/assets/scripts/assistant/session.js').then(s => s.clear())`.
 *
 *  It used to remove `'movelli:conversation'` as a STRING LITERAL — reaching into a key the assistant input
 *  owns, so renaming that constant would have quietly stopped this from clearing it. `clearAll()`
 *  means no module needs to know another's keys, and a key added to the registry is covered here
 *  automatically instead of being forgotten. */
export function clear() {
  log()?.replaceChildren();
  store.clearAll();
  refresh();
}

// ── The segment list (segment headings → jump targets in the conversation) ──
function segments() {
  const l = log();
  if (!l) return [];
  const heads = [...l.querySelectorAll('movelli-chat-segment-title')];   // the component's public element, not a class inside it
  return heads.map((h) => ({ title: h.textContent, el: h }));
}

/** Render the chat-segment list — plain jump targets (no "current" highlight: whether the next
 *  input continues the last segment or starts a new one depends on the input + context, so marking
 *  one as "current" would mislead). A click closes the menu and scrolls to that segment.
 *
 *  [hard] IT RENDERS THE LIST AND NOTHING ELSE. It used to hide the drawer's opener too, on
 *  "is there a segment to list?", while `updateControl` hid the same button on "is there a
 *  conversation at all?" — two conditions writing one property, settled by which ran last. One
 *  gate now, in `updateControl`, and it is the right one: the menu holds the only "Clear chat
 *  history" control, so a conversation with no segment heading yet must still be able to reach it. */
export function renderRecents() {
  const entries = segments();

  const makeItem = (e) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chat-history__link';
    btn.textContent = e.title || copy('chat_segment_fallback');
    // [owner 2026-09-24] THE SCROLL STARTS HALF WAY THROUGH THE CLOSE, not after it and not with
    // it. Together, the jump happens behind a menu still covering the conversation and the visitor
    // never sees it; afterwards, the conversation sits still for the whole animation and then
    // lurches. Half way, the movement is already under way as the menu clears.
    // The duration is read from the token the stylesheet animates on, so the two cannot drift.
    btn.addEventListener('click', () => {
      menu.close();
      setTimeout(() => scrollToSegment(e.el), menu.durationMs() / 2);
    });
    li.appendChild(btn);
    // (The "continue an older segment" affordance now lives in the log — a "Continue with this
    // segment" button at each ended segment's bottom, added by divider() — not in this rail list.)
    return li;
  };
  // CONVERSATION ORDER, always. There is one segment list, so the `data-order` attribute it used to
  // be selected by is gone too.
  // The EMPTY case is not handled here: an empty <ol> hides itself and reveals the status message
  // beside it, in CSS — see .chat-history__list:empty. Server-rendered once, because this call
  // replaces the list wholesale and would drop anything JS had put inside it.
  document.getElementById('chat-history-list')?.replaceChildren(...entries.map(makeItem));
}

/** Show the drawer's opener only when there is a conversation to open, and DISABLE its clear button
 *  when the log is empty (so a cleared chat reads as empty rather than as broken).
 *
 *  [2026-09-23] IT USED TO SYNC THE COMPOSER'S COPY TOO — the label, the placeholder and the submit
 *  button said one thing on a page and another once there was a thread to message into. The
 *  the assistant input has ONE wording now (an icon-only button named "Send your message", and a placeholder
 *  that varies by what an ENTRY asked for rather than by how much history there is), so there is
 *  nothing here to keep in step. */
function updateControl() {
  const has = hasHistory();
  // [owner 2026-09-24] It also hid the drawer's opener. The drawer is the assistant MENU now and
  // its control lives in the dialog's header, where it is always available — a menu that may hold
  // other things should not disappear because the chat happens to be empty. What is left to sync is
  // the clear button, which has nothing to clear.
  const clear = document.getElementById('chat-clear-history');
  if (clear) clear.disabled = !has;
}

export function refresh() { updateControl(); renderRecents(); }

// Init: restore a prior session's conversation into the (hidden) log, then sync controls.
if (log()) {
  restore();
  refresh();
}
