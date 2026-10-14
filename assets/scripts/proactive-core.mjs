/**
 * THE SUGGESTIONS BLOCK'S ANSWER — the PURE rules, isomorphic (no DOM, no storage, no events) so the
 * Node suite can RUN them and `proactive.js` can import them. The visits-core.mjs pattern.
 *
 * [owner 2026-09-26] SPLIT OUT SO THE RULES ARE TESTED BY WHAT THEY DO. They were tested by reading
 * `proactive.js`'s source, which cannot tell a rule from the characters that spell it — an adversarial
 * review showed the old/new labels could be passed the wrong way round, and a failed press left
 * armed, with every such test still green. `proactive.js` keeps what is the page's: the buttons, the
 * store, the events and the one call into the assistant.
 *
 * THE STATE is `{ answered, pending }`, each an option KEY or `null`:
 * · `answered` — the option this page's question was answered with, and the one that is marked.
 * · `pending`  — an option pressed and not yet confirmed by the assistant.
 * An OPTION is `{ key, label, state }`: its index in the version, its text, and what it hands the
 * assistant (`seed`, `prompt`, `placeholder`, `context`, and `seedOnChange` for a changed answer).
 */

/**
 * A PRESS. Returns `{ pending, call }`: the new pending key, and what to hand `start()` — `null` for
 * nothing at all, `{}` to only open the assistant.
 *
 * `resolveContext(names)` turns the option's context SOURCES into text; `changeLine(before, after)`
 * writes the AI-facing line for a changed answer. Both are the page's to supply — this module knows
 * no session and no copy.
 *
 * [2026-09-26] ONE PRESS AT A TIME. While a press is still being answered, another is ignored: the
 * report that comes back says nothing about WHICH press it answers, so a second one armed now would
 * be marked by the first one's turn — the mark saying one thing and the log another.
 *
 * [owner 2026-09-26] THE CHOSEN OPTION AGAIN only opens the assistant — its answer is already in the
 * conversation, and sending it again would say the same thing twice. A DIFFERENT option is a changed
 * answer: the log opens with the visitor's own message (`seedOnChange`) rather than the assistant's
 * line, the option's own prompt is sent, and the context says what changed — the model receives the
 * prompt, not the message in the log. The change line comes FIRST: the server keeps the first 600
 * characters of the context, and a long visits trail ahead of it would cut that line off.
 *
 * [hard, owner 2026-09-23] THE PRESS ONLY ARMS IT; THE ASSISTANT'S REPORT COMMITS IT (`ready` below).
 * The pending state is deliberately not persisted by the page — a press nobody got an answer to is
 * not an answer.
 */
export function press({ answered, pending }, entry, options, { resolveContext, changeLine }) {
  if (pending !== null) return { pending, call: null };
  if (entry.key === answered) return { pending, call: {} };
  const before = answered === null ? null : options.find((o) => o.key === answered) || null;
  const { prompt, seed, seedOnChange, placeholder, context } = entry.state || {};
  const changed = before ? changeLine(before.label, entry.label) : '';
  return {
    pending: entry.key,
    call: {
      // A question with a single option has no `seedOnChange` — and cannot be changed — but a missing
      // one must not leave a turn with no seed, which would echo the model-facing prompt as the
      // visitor's words.
      seed: before ? (seedOnChange || seed) : seed,
      prompt,
      placeholder,
      context: [changed, resolveContext(context)].filter(Boolean).join('\n'),
    },
  };
}

/**
 * THE ASSISTANT REPORTED. `ok` is false when the visitor did not get what they pressed for — a failed
 * or refused turn — so the mark stays where it was. Returns `{ answered, pending, commit }`; `commit`
 * is true when the mark moved and the answer has to be remembered.
 *
 * [2026-09-26] A FAILED PRESS IS FORGOTTEN, not left armed. Every turn reports, a typed question
 * included — so a press left `pending` after a failure was marked by the visitor's NEXT successful
 * turn, whatever it was. And a report with nothing pending (a typed question) changes nothing.
 */
export function ready({ answered, pending }, ok) {
  if (pending === null) return { answered, pending, commit: false };
  if (!ok) return { answered, pending: null, commit: false };
  return { answered: pending, pending: null, commit: true };
}

/**
 * WHICH OPTIONS ARE MARKED — exactly the answered one, or none when nothing is answered (which is
 * what an Undo of a cleared history needs). BY KEY, never by rendered text: rewording an option must
 * not forget the answer somebody gave it.
 */
export function marks(answered, options) {
  return options.map((o) => o.key === answered);
}
