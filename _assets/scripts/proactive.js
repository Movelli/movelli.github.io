/**
 * THE PRO-ACTIVE SUGGESTIONS — the in-page entry point to the assistant.
 *
 * The `.secondary-content` `<aside>` is a block of PAGE CONTENT: a heading, a line saying what the cards
 * are, two cards, one question, the buttons that answer it, and a footer note.
 *
 * [owner 2026-09-23] ALL OF IT IS IN THE PAGE EXCEPT THE QUESTION AND THE CHIPS, which are the only
 * part that differs by user-type and so the only part a single HTML document cannot carry. This
 * module fetches those and APPENDS them to the box the build left empty for them, in the suggestions
 * layout's last slot (2026-10-05). Everything else — heading, intro, cards — is there before this file
 * runs, so a visitor with no JavaScript, a failed fetch or a slow connection still gets the panel.
 *
 * It is rendered through the shared catalog (`renderComponent`) — the same components the pages and
 * the chat use.
 *
 * [hard, owner 2026-09-23] THE ANSWERED STATE LIVES HERE, NOT IN THE ASSISTANT. It is the ENTRY
 * POINT's behaviour — *"with other assistant entries I might not want to do this"* — so the
 * assistant only reports what happened and this module decides what that means.
 *
 * [owner 2026-09-26] THE CHOSEN OPTION IS MARKED, AND NOTHING IS DISABLED. It used to be: once the
 * assistant took the turn, the question and every option went disabled. The owner reversed it, for
 * three reasons — an open "Yes, I have a question" could not be used to ask another; with several
 * options you might want to change your answer; and, the biggest, *"disabling this section in the
 * page gives the impression the Assistant isn't working at the moment."* So now:
 * · pressing the CHOSEN option again only opens the assistant if it is closed — nothing is sent and
 *   nothing is added, so the same thing is never said twice;
 * · pressing a DIFFERENT option is a changed answer: the log opens with the visitor's own message
 *   (`seedOnChange`, built with the versions) instead of the assistant's opening line, the option's
 *   own prompt is sent, and the context says what they answered before;
 * · the new option is marked once the assistant confirms, exactly as the first one was.
 */
import { renderComponent } from './render/renderers.mjs';
import { copy, fill } from './copy-data.mjs';
import * as answer from './proactive-core.mjs';
import { userType, getVisits } from './visits.js';
import * as store from './store.mjs';

// The opener's BODY — the box the build leaves empty in the suggestions layout's last slot, under the cards; the
// question and its chips are appended to it.
const chat = () => document.getElementById('secondary-content-body');
// Its FOOTER — the note lands here, and only while the assistant can be reached.
const footer = () => document.getElementById('secondary-content-footer');
let currentSrc = null; // this page's opener file — the id the answer is remembered against
let pending = null;    // the chip pressed, waiting on the assistant to confirm it took the turn
let answered = null;   // the KEY of the chip this page's question has already been answered with
let shownVersion = null; // which user-type version is on screen — pinned once answered (see below)
/**
 * THE CHIPS ON SCREEN, AS DATA: `[{ key, label, state, el }]`, filled when they are injected.
 *
 * [hard, owner 2026-09-23] THE STATE STAYS IN A VARIABLE, NOT IN THE DOM. *"We might not even need
 * data-attributes with JSON on the chips; we can keep the data in a variable."* This module has the
 * config in hand at the moment it renders it — serialising it onto a button so something can parse
 * it back out is a round trip with nothing at either end. It is also what made the assistant able
 * to reach in and read it, which is the thing the rework undid.
 *
 * `key` is the chip's INDEX IN ITS VERSION, and that is the identity the answered state is
 * remembered by. It used to be the label's rendered TEXT — `textContent.trim() === answered` — so
 * an entry was identified by the characters it happened to draw, and a copy edit silently forgot
 * which chip somebody had pressed.
 */
let chips = [];

/**
 * THE ANSWER THE VISITOR GAVE, kept per page so it survives leaving and coming back —
 * `[{ id, a, v }]` keyed by opener src: the chip's key, and the VERSION it was on. Without it the
 * question came back with no answer marked, under chips the visitor had already used.
 *
 * Keyed by the PAGE, not by `src|version`: they answered on that page and it stands, whatever their
 * user-type has become since.
 *
 * [hard] THE VERSION IS PINNED ONCE THE QUESTION IS ANSWERED, and `v` is only there for that.
 * The user-type is recomputed on every page load, so a visitor who answers on /banks/, reads
 * something in another category and comes back is now `exploring` where they were `landed` — and
 * without this the page would show the EXPLORING question with no chip marked, because
 * the chip they actually pressed is not in that version. Measured happening. Two things are wrong
 * with it and they pull the same way: a question they never answered is shown as answered, and the
 * answer they did give has vanished. Pinning gives back the surface they left.
 */
const recordFor = (id) => store.read('proactiveAnswer', []).find((e) => e && e.id === id) || null;
function rememberAnswer(id, a, v) {
  const all = store.read('proactiveAnswer', []).filter((e) => e && e.id !== id);
  all.push({ id, a, v });
  store.write('proactiveAnswer', all);
}

/**
 * The assistant reported. WHAT IT MEANS is `answer.ready` in proactive-core.mjs — a press only arms
 * the entry and the report commits it, a failed report forgets it. What is the PAGE's is here:
 * remembering the answer and moving the mark.
 *
 * [hard, owner 2026-09-23] THE ENTRY WAITS FOR THE ASSISTANT TO CONFIRM. *"It also requires the
 * assistant entry (the chips/buttons) to get feedback if the chat was successfully initiated to
 * prevent disabling while the user didn't get what they ask for yet."* Nothing is disabled any more
 * (2026-09-26), and the rule stands for the MARK.
 */
function assistantReady(ok) {
  const r = answer.ready({ answered, pending }, ok);
  answered = r.answered;
  pending = r.pending;
  if (!r.commit) return;
  if (currentSrc) rememberAnswer(currentSrc, answered, shownVersion);
  applyAnswered();
}

/**
 * THE QUESTION — the paragraph the chips answer.
 *
 * [hard, owner 2026-09-23] FOUND BY `id`, NEVER BY POSITION OR BY BEING THE ONLY ONE. The build
 * puts `id="proactive-question"` on it (see `openers.js`). This has been wrong twice in two days
 * and both were the same mistake at different distances: first `.prose` — correct only while the
 * question was the suggestions block's one paragraph, and wrong the moment the line above the cards became a
 * `prose` too — then `chips.previousElementSibling`, which is the same assumption wearing a
 * relationship. The owner: *"That is not steady. Content can change so these kind of scripts will
 * always break sooner or later. Use id's to target specific elements."*
 */
const question = () => document.getElementById('proactive-question');

/**
 * Put the surface in its answered state: the chip they chose fills in, so the page says WHICH
 * answer was given — and a changed answer moves the mark. [owner 2026-09-26] Nothing goes quiet:
 * every chip stays pressable and the question stays as it is.
 * Idempotent, so a late-loading opener and a restored session can both call it.
 */
function applyAnswered() {
  // No early return for an unanswered question: it CLEARS every mark — which is what an Undo of a
  // cleared history needs when an option was chosen while the Undo was still on offer.
  if (!chips.length) return;
  // WHICH is `answer.marks` — by key, never by rendered text. The version is PINNED once answered
  // (see `recordFor`), so the key always refers to the same list it was recorded against.
  answer.marks(answered, chips).forEach((chosen, i) => {
    const { el } = chips[i];
    el.classList.toggle('reply-options__option--selected', chosen);
    if (chosen) el.setAttribute('aria-pressed', 'true');
    else el.removeAttribute('aria-pressed');
  });
}

/**
 * CLEARING THE CHAT HISTORY UNDOES THIS TOO — and the suggestions block decides that for itself.
 *
 * [hard, owner 2026-09-23] IT IS AN EVENT, NOT A CALL. `clear-history.js` used to import these
 * three functions, which put the assistant's clear path in charge of an entry point's state: *"We
 * should trigger a custom event when the chat history is cleared and it is up to proactive.js to
 * listen to that and act upon it or not."* The listeners are at the foot of this file.
 *
 * Without the reset, the suggestions block kept showing an answer to a conversation that no longer exists —
 * the one place the page still claimed something had happened. The SNAPSHOT is held here, for the
 * same reason: the Undo has to give back this surface's own state, and only this module knows what
 * that is.
 */
let cleared = null;   // what the suggestions block looked like before the history was wiped, for the Undo

function snapshotEngagement() { return { entries: store.read('proactiveAnswer', []), a: answered }; }

function resetEngagement() {
  // Session-wide: clearing the history clears every page's opener, not just this one — only this
  // page's DOM is on screen to restore, but the rest must not resurrect on a later visit.
  store.remove('proactiveAnswer');
  answered = null;
  pending = null;
  // The version is NOT reset: it is what is on screen, and clearing the history does not re-render
  // the suggestions block. Re-picking it on the next page load is correct — nothing is pinned any more.
  for (const { el } of chips) {
    el.classList.remove('reply-options__option--selected');
    el.removeAttribute('aria-pressed');
  }
}

function restoreEngagement(snap) {
  if (!snap) return;
  store.write('proactiveAnswer', snap.entries || []);
  answered = snap.a ?? null;
  applyAnswered();
}

/**
 * THE CONTEXT AN ENTRY PUSHES, resolved by NAME.
 *
 * [hard, owner 2026-09-22] The assistant never collects context — the entry point sends it. The
 * build cannot know a visitor's session, so it declares which SOURCES this chip wants
 * (`data-context="visits"`) and the resolving happens here, where the session is.
 *
 * The current page is deliberately not a source: it is already sent with every turn as `page`.
 */
const SOURCES = {
  // What they have read this session, newest last — the trail `visits.js` keeps for segmentation.
  visits() {
    const seen = getVisits().filter((v) => v && v.url);
    if (!seen.length) return '';
    return `Pages they have read this session: ${seen.map((v) =>
      (v.category ? `${v.url} (${v.category})` : v.url)).join(', ')}`;
  },
};

/**
 * `names` is the config's own value — an ARRAY of source names, as `openers.js` authors it. It also
 * takes a comma string, which is what it used to be handed when the list had been through a
 * `data-` attribute and back; that round trip is gone, and accepting both costs one `split`.
 */
function resolveContext(names) {
  const list = Array.isArray(names) ? names : String(names || '').split(',');
  return list.map((n) => String(n).trim()).filter(Boolean)
    .map((n) => (SOURCES[n] ? SOURCES[n]() : '')).filter(Boolean).join('\n');
}

/**
 * (Re)arm the suggestions block for the current page: fetch its versions at the first browser IDLE.
 *
 * [owner 2026-09-23] THE SCROLL TRIGGER IS GONE. There were two, whichever fired first: an
 * IntersectionObserver 300px ahead of the panel, and this idle callback. The observer existed so the
 * opener's CONTENT arrived just as the reader reached it — and the content is in the page now, so
 * there is nothing to arrive. What is left to fetch is one question and its buttons, about 1.3 KB.
 * The owner: *"there is no need anymore to wait until the suggestions block is almost scrolled into the
 * viewport."* Idle keeps the deferral, which is the half that still earns its place.
 */
export function arm() {
  answered = null; // a new page means a NEW question, so it starts unanswered…
  pending = null;
  shownVersion = null;
  const c = chat();
  const src = document.querySelector('[data-page]')?.dataset.proactive;
  currentSrc = src || null; // …unless this page was already answered — load() restores that below
  if (!c || !src || question()) return; // no opener / no file / the question is already in
  if (window.requestIdleCallback) window.requestIdleCallback(() => load(src), { timeout: 2500 });
  else setTimeout(() => load(src), 1500);
}

/** Pick the suggestions block for this session: the version the page's question was already ANSWERED on if
 *  there is one (see `recordFor`), else the one matching the user-type, falling back tolerantly to
 *  `landed` / the first one. A version is `{ components }` — [owner 2026-09-23] it carries no title
 *  any more: the heading is the same on every page and in every version, so the build writes it. */
function pickVersion(data, pinned) {
  const versions = data && data.versions;
  if (!versions) return null;
  const type = pinned && versions[pinned] ? pinned : userType();
  const key = versions[type] ? type : (versions.landed ? 'landed' : Object.keys(versions)[0]);
  shownVersion = key;
  return (versions[key] || {}).components || null;
}

async function load(src) {
  const c = chat();
  // [hard] THE TEST IS THE QUESTION. What this guards is a SECOND load appending a second question.
  // (The body shipped with the intro and the cards in it until 2026-10-05, so "is the body empty" could
  // not be the test; it ships empty now, and the question is still the plainest thing to ask.)
  if (!c || question()) return;
  let data;
  try { data = await (await fetch(src)).json(); } catch { return; }
  // The stored answer is read BEFORE the version is picked, because it decides which one to show.
  const was = recordFor(src);
  const config = pickVersion(data, was && was.v);
  if (!Array.isArray(config) || question()) return;
  // APPENDED to the box the build left empty in the suggestions layout's last slot — the question and
  // its chips. This module renders a list; it builds no chrome of its own.
  const tpl = document.createElement('template');
  // NO turn labels. The opener is page content with buttons — it never alternates speakers, so
  // "Movelli"/"You" labelled a conversation that isn't happening. They earn their place in the
  // DIALOG, where turns alternate and each sits in its own bubble.
  tpl.innerHTML = config.map((cfg) => renderComponent(cfg)).join('');
  const els = [...tpl.content.children]; // capture before append moves them
  c.append(...tpl.content.childNodes);
  bindChips(c, config);
  // Restore an answer given on THIS page before a reload or earlier this session — `arm()` cleared
  // the in-memory copy because the page changed, and only now do we know which page.
  // THE NOTE, into the aside's own <footer>. It arrives WITH the question rather than shipping in
  // the page, because it may only be shown while the assistant can be reached — so the assistant's
  // half of the panel appears as one thing and hides as one thing.
  // The FOOTER itself is what fades in, not the note inside it — so nothing has to reach for a
  // child, and the rule that a script targets by id rather than by position is not bent for one
  // convenience. `:not(:has(*))` in main.css is what keeps the empty box out of the flow until now.
  const f = footer();
  if (f && data.note && !f.children.length) { f.innerHTML = renderComponent(data.note); els.push(f); }
  if (answered === null && was) answered = was.a;
  applyAnswered(); // also covers a press that committed while this was still loading
  // [owner 2026-09-22] THE STAGED REVEAL IS GONE — everything fades in, first sight or not.
  // It used to WRITE ITSELF IN on first sight, so the suggestions block looked like the AI talking to the
  // visitor. That belonged to an opener shaped like a chat; this is page content with a button, and
  // content that types itself in is content the reader has to wait for.
  // [owner 2026-09-25] NO FADE. It used to arrive with the chat's own fade-in, from the days this
  // block was the chat opener. It is page content now — *"It's not chat anymore and we should
  // display this before it comes in view without transition."*
}

/**
 * WIRE UP THE CHIPS THIS MODULE JUST INJECTED.
 *
 * [hard, owner 2026-09-23] A LISTENER PER CHIP, AT THE MOMENT IT IS INJECTED. *"No expensive
 * listener on the body. Just add listeners to the chips that are being injected."* There was one on
 * `document`, inside the assistant, and it is deleted: a delegated handler can only receive an
 * ELEMENT, which is why the state had to be serialised onto the button in the first place. Here the
 * config and the button exist in the same function, in the same tick.
 *
 * ZIPPING THE TWO LISTS IS NOT TARGETING BY POSITION. `items` is what this function just rendered
 * into `buttons`, in that order, one for one — the same case as `render-element.mjs` taking the one
 * child off a template it filled itself. There is no content that can change underneath it, which
 * is the whole of what the id rule is protecting against. What the rule DOES forbid is singling a
 * chip out later, and nothing does: after this, every chip is reached through `chips`.
 */
function bindChips(box, config) {
  const items = (config.find((cfg) => cfg && cfg.type === 'reply-options') || {}).items || [];
  // ALL of a kind inside a scope — correct however many there are.
  // [hard] THE COMPONENT'S OWN CLASS, NEVER `.chip`. `.chip` is the shared LOOK, and a handler that
  // bound on it would let a styling decision start deciding behaviour — and would catch the chat's
  // chips too, which are a different component with different code. See the guard in a11y.test.js.
  const buttons = [...box.querySelectorAll('.reply-options__option')];
  chips = [];
  buttons.forEach((el, i) => {
    const item = items[i];
    if (!item) return;
    const entry = {
      key: i,
      label: typeof item === 'object' ? item.label : item,
      state: (typeof item === 'object' && item.state) || {},
      el,
    };
    chips.push(entry);
    el.addEventListener('click', () => press(entry));
  });
}

/**
 * A chip was pressed: arm this entry, then hand the assistant its state.
 *
 * [hard, owner 2026-09-23] THE BUTTON'S LABEL IS NOT THE VISITOR'S TURN. *"the button label is
 * totally irrelevant."* It used to be read off `textContent` and sent as the visitor's turn, because
 * a delegated handler had nothing else to read. What the assistant is asked to do is `state`.
 * [owner 2026-09-26] The label is used in ONE place: the AI-facing line that says what the visitor
 * answered before and what they answer now, taken from the config this module rendered — never
 * read back off the button. What the LOG shows for a changed answer is authored data,
 * `seedOnChange`, built with the versions.
 *
 * `context` is resolved HERE, not there: the assistant never collects context, and only this page
 * knows its own session. The chip declares which SOURCES it wants, by name.
 */
function press(entry) {
  // WHAT A PRESS MEANS — one at a time, the chosen option only opens, a different one is a changed
  // answer — is `answer.press` in proactive-core.mjs, where it is tested by running it.
  const r = answer.press({ answered, pending }, entry, chips, {
    resolveContext,
    changeLine: (before, after) => fill(copy('proactive_changed_answer_context'), before, after),
  });
  pending = r.pending;
  // `start()` with nothing in it only opens the assistant, and does nothing when it is already open —
  // so there is no second method to ask first: `start()` stays the only way in.
  if (r.call) document.querySelector('movelli-assistant')?.start(r.call);
}

/**
 * The assistant's report. An EVENT rather than a callback so this module needs no reference to the
 * assistant beyond the one call above — and so a host site, a future island or anything else that
 * triggers it can hear the same signal without importing anything of ours.
 *
 * [2026-09-23] `movelli:assistant-ready` replaces `movelli:turn-done`, which would have been a lie
 * for an entry that sends no prompt: there is no turn, and the visitor still got what they pressed
 * for.
 */
document.addEventListener('movelli:assistant-ready', (e) => assistantReady(!!(e.detail && e.detail.ok)));

// The history was wiped, or the wipe was undone. The assistant states a fact about ITSELF; what
// that means for this surface is decided here.
document.addEventListener('movelli:assistant-cleared', () => { cleared = snapshotEngagement(); resetEngagement(); });
document.addEventListener('movelli:assistant-restored', () => { restoreEngagement(cleared); cleared = null; });

if (chat()) arm();
