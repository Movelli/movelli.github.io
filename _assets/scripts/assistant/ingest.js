/**
 * THE INGEST POINT — the ONE way anything enters the chat log.
 *
 * [hard, owner 2026-09-24, built 2026-10-08] EVERY TURN PASSES THROUGH `ingest()`, WHATEVER PRODUCED IT: the visitor's own bubble, the answer from `/ask`, the
 * "thinking" placeholder, a segment's divider and heading, and the `seed` an entry point hands to `start()`. It does, in one place:
 *
 *   CHECK     the config against the catalog — `renderComponent` (inside `renderElement`) refuses a key the component does not declare, a value of the
 *             wrong type and a missing required one; a refused config becomes the library's own error note, never a half-drawn element.
 *   SANITIZE  every CONTENT field, at the level the component declares (`allowHtml`) — the same allowlist the build uses (`src/scripts/sanitize.mjs`) — and
 *             every URL-typed value, by scheme. Idempotent: content that arrives already safe (the build's, the function's) comes out unchanged.
 *   RENDER    through the one shared renderer, into the log.
 *   STORE     the cleaned config is kept with its element, so the log is saved as TURN DATA (`turns()`), never as the HTML it drew, and restored by
 *             ingesting those turns again (`replaceTurns()`) — a stored turn is checked and sanitized on the way back in exactly like a new one.
 *
 * WHY ONE FUNCTION AND NOT A CONVENTION: § Output escaping's contract — whoever BUILDS a config makes its strings safe, so the renderer emits CONTENT verbatim —
 * is between us and ourselves, and `start({ seed })` is PUBLIC: a page script, a future island, a host site's own code. Measured 2026-09-24, a seed
 * carrying `<img src=x onerror=…>` ran its handler. A boundary anything may call cannot be secured by asking its callers to behave.
 *
 * NOTHING INSIDE THE ASSISTANT APPENDS TO THE LOG ANY OTHER WAY, and `a11y.test.js` refuses it: no other file here calls `renderElement` or
 * `appendChild`/`insertBefore` on the log. A seventh producer added later fails that test rather than becoming the eighth way of doing it.
 */
import { clean } from './clean-config.mjs';
import { renderElement } from './render-element.mjs';

const log = () => document.getElementById('chat-body');

/** element → the config it was drawn from. Weak: a removed element takes its turn with it. */
const turnOf = new WeakMap();

/** The turns that are not part of the conversation: the placeholder shown while `/ask` is in flight. */
const TRANSIENT = new Set(['chat-thinking']);

/**
 * Check, sanitize, render and append ONE component to the log — at the end, or ahead of `before`. Returns the element (the caller animates it), or null when
 * there is no log on this page.
 */
export function ingest(config, { before = null } = {}) {
  const l = log();
  if (!l) return null;
  const cleaned = clean(config);
  const el = renderElement(cleaned);
  if (!el) return null;
  turnOf.set(el, cleaned);
  if (before) l.insertBefore(el, before); else l.appendChild(el);
  return el;
}

/** The log as data, in the order it is drawn — what is stored, and what the clear-history Undo holds. */
export function turns() {
  const l = log();
  if (!l) return [];
  return [...l.children].map((el) => turnOf.get(el)).filter((cfg) => cfg && !TRANSIENT.has(cfg.type));
}

/** Empty the log and ingest `list` into it. Returns the elements drawn. */
export function replaceTurns(list) {
  const l = log();
  if (!l) return [];
  l.replaceChildren();
  return (Array.isArray(list) ? list : []).map((cfg) => ingest(cfg)).filter(Boolean);
}
