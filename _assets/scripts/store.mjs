/**
 * SESSION STORE — the one module that touches browser storage.
 *
 * Every persisted value on the public site is declared in `KEYS` below, and nothing else in
 * `src/scripts/` reads or writes `sessionStorage` directly. That single rule is the point: before
 * this, four modules each carried their own key constant and their own copy of the same
 * try/JSON/quota dance, two of them had separately-written array caps, and `session.clear()` reached
 * into another module's key **as a string literal** — so renaming that constant would have silently
 * stopped the clear from clearing. The registry makes "what do we persist?" answerable in one place,
 * and `clearAll()` means no module has to know another's key.
 *
 * PRIVACY, stated once instead of in four comments: all of this is `sessionStorage` — first-party,
 * scoped to the tab, dropped when it closes, and holding no personal data. That is what keeps the
 * site inside the GDPR "strictly necessary" exemption and out of cookie-banner territory. A key that
 * ever needs to outlive the session is a decision to take HERE, deliberately, not in a component.
 *
 * Deliberately NOT a storage framework: no namespacing, migrations, schema versions or TTLs. Six
 * session-scoped keys need none of it, and fewer moving parts is the whole objective.
 * (It said FIVE until 2026-09-17: `fromChat` joined in `04f55e6`, when the client-side router was
 * deleted and the one thing a real navigation could not carry had to be written down instead. It is
 * five again since 2026-09-23, when `openerSeen` was dropped, and six since 2026-10-05, when `draft`
 * joined.)
 *
 * `.mjs` so the browser imports it and `node:test` can require it (the renderers.mjs pattern); the
 * backend is injectable so the caps and fallbacks are testable without a browser.
 */

/**
 * `kind: 'text'` stores the string as-is; `'json'` round-trips through JSON.
 * `cap` bounds an ARRAY value to its most recent N entries — applied on write, in one place, rather
 * than by each caller remembering to splice.
 */
export const KEYS = {
  // The visible transcript, as TURN DATA (component configs). Restored through the ingest point at init — session.js.
  log:          { key: 'movelli:log',          kind: 'json' },
  // The AI's context: the turns resent as `prev`. Separate from the transcript on purpose — one is
  // what the visitor sees, the other is what the model is told, and clearing must drop both.
  conversation: { key: 'movelli:conversation', kind: 'json' },
  // The session's page trail, feeding user-type segmentation (visits-core computeUserType).
  visits:       { key: 'movelli:visits',       kind: 'json', cap: 20 },
  // The answer the visitor gave to a page's opener question, keyed by opener src: `[{ id, a }]`.
  // Keyed by the PAGE rather than by `src|version`: if their user-type changes mid-session the
  // question's wording changes, but they still answered it on that page and their answer stands.
  // [owner 2026-09-23] It was `openerReply`, holding the query they SENT, because a reply collapsed
  // the chip row into a turn on the page. Nothing collapses now — the chips stay and the chosen one
  // fills in — so what has to survive is WHICH chip, not what it said to the assistant.
  // (`openerSeen` went with it: it existed only to play a streamed reveal once per piece of
  // content, and the reveal was deleted on 2026-09-22.)
  proactiveAnswer: { key: 'movelli:proactive-answer', kind: 'json', cap: 20 },
  // Set when the visitor follows a link the AI handed them, read and cleared by the assistant input on the
  // next page. It is the ONE thing a real navigation cannot carry that the old router passed as a
  // function argument: "the AI sent you here" (continue the thread) versus "you browsed here" (seed
  // a new segment). A flag rather than a value — its presence is the whole message.
  fromChat:     { key: 'movelli:from-chat',    kind: 'text' },
  // [owner, hard] What is typed in the assistant's field and not yet sent, so it survives a
  // navigation and a reload (docs/record/ai.md, step 1). Written by the field as it changes, removed
  // when it is emptied or the message is sent — input.js. Whether it should also survive the tab
  // closing is still open; that would be `localStorage`, and so a decision for this file.
  draft:        { key: 'movelli:draft',        kind: 'text' },
};

let backend; // undefined = use sessionStorage; anything else (incl. null) is an explicit override

/** Point the store at a fake for tests. Pass `undefined` to restore the real one. */
export function setBackend(b) { backend = b; }

/** The live backend, or null where there is none (Node, or storage disabled by the browser). */
function storage() {
  if (backend !== undefined) return backend;
  // Touching sessionStorage can THROW, not just be absent — Safari in private mode historically,
  // and any browser with site data blocked. A store that throws on import would take the chat with it.
  try { return typeof sessionStorage === 'undefined' ? null : sessionStorage; } catch { return null; }
}

function def(name) {
  const d = KEYS[name];
  // A programming error, not a runtime condition: names are module-level constants, so a typo
  // surfaces on the first call rather than silently reading a key that does not exist.
  if (!d) throw new Error(`store: unknown key "${name}" — declare it in KEYS`);
  return d;
}

/** Read a value, or `fallback` if it is absent, unreadable, or corrupt. Never throws. */
export function read(name, fallback = null) {
  const d = def(name);
  const s = storage();
  if (!s) return fallback;
  let raw;
  try { raw = s.getItem(d.key); } catch { return fallback; }
  if (raw == null) return fallback;
  if (d.kind === 'text') return raw;
  // A corrupt value returns the fallback rather than throwing. This matters: these reads happen
  // inside a chat turn, and a half-written value from a previous quota failure must not break it.
  try { const v = JSON.parse(raw); return v == null ? fallback : v; } catch { return fallback; }
}

/**
 * Write a value, applying the registry's cap. Returns what was actually stored — capped, so a
 * caller holding the array in memory can stay in step with it instead of re-implementing the trim.
 * Silent on quota: a failed write must never break the page it happened on.
 */
export function write(name, value) {
  const d = def(name);
  const stored = (d.cap && Array.isArray(value) && value.length > d.cap)
    ? value.slice(value.length - d.cap)   // keep the MOST RECENT entries
    : value;
  const s = storage();
  if (!s) return stored;
  try { s.setItem(d.key, d.kind === 'text' ? String(stored) : JSON.stringify(stored)); } catch { /* quota — skip */ }
  return stored;
}

export function remove(name) {
  const s = storage();
  if (!s) return;
  try { s.removeItem(def(name).key); } catch { /* ignore */ }
}

/** Drop everything this site persists. What `session.clear()` needs, without naming another module's key. */
export function clearAll() {
  for (const name of Object.keys(KEYS)) remove(name);
}

/** The overview: what is persisted right now, and how big it is. Handy from the console. */
export function list() {
  const s = storage();
  return Object.entries(KEYS).map(([name, d]) => {
    let raw = null;
    try { raw = s ? s.getItem(d.key) : null; } catch { /* ignore */ }
    return { name, key: d.key, bytes: raw ? raw.length : 0 };
  });
}
