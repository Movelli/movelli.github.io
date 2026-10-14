/**
 * Streamed reveal of AI chat content — prose word by word, components in sequence.
 *
 * CONTAINER-OWNED, by design and by rule. The catalog emits byte-identical HTML and no `movelli-*`
 * element knows this exists: the `[hard]` rule is that a component is the SAME in page content and
 * in the chat, differing only in static vs dynamic. So the choreography lives here, with the chat
 * containers, exactly as external spacing does.
 *
 * THE CONTENT IS INSERTED COMPLETE; ONLY ITS VISIBILITY IS ANIMATED. Nothing is appended over time.
 * Three reasons, and it is better on all three:
 *   1. `.chat__body` is `aria-live="polite"` — appending text progressively would make a
 *      screen reader announce a growing fragment on every tick. Inserted whole, it is announced
 *      once, whole, while sighted users watch it write itself.
 *   2. `[hard]` layout-shift-free: a real typewriter reflows on every word. The final space is
 *      reserved up front, so there is no reflow, no CLS and no scroll drift as the answer appears.
 *   3. Copy/paste and find-in-page work mid-animation.
 *
 * JS assigns indices and start offsets; CSS runs the animation (`animation-delay`). There is no
 * timer or rAF loop driving frames — the one timeout here is cleanup.
 */
import { splitParts, stepFor } from './reveal-core.mjs';

/**
 * FADE ONE PIECE OF CHAT CONTENT IN — the simple arrival, beside the staged one.
 *
 * [owner 2026-09-25] IT WAS `src/scripts/fade.js`, AT THE SHARED LEVEL. It sat there because TWO
 * callers used it, and the second was the suggestions block; once that stopped fading, nothing
 * outside the assistant did. The owner: *"It feels like the code that handles the appearing of chat
 * content is spread over multiple files. I would prefer if we would centralise this so we can tweak
 * it better."* So every motion decision for arriving chat content is in this one file now: the
 * block fade here, the staged words below, and the single reduced-motion check they share.
 *
 * The class runs the `chat-enter` animation and takes itself off again, so nothing has to clean up
 * and a second call on the same element is harmless.
 *
 * [hard] IT NO LONGER LEAKS UNDER REDUCED MOTION. The animation used to sit inside
 * `@media (prefers-reduced-motion: no-preference)`, so under `reduce` it never ran, `animationend`
 * never fired, and the class was never removed — against the promise in the line above. The global
 * reset shortens the animation instead of removing it, so it always ends and the cleanup always
 * happens.
 */
export function fadeIn(el) {
  if (!el) return;
  el.classList.add('chat-enter');
  el.addEventListener('animationend', () => el.classList.remove('chat-enter'), { once: true });
}

const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * What makes an element a BLOCK (faded as one unit) rather than text to stream. A structural test,
 * deliberately — no component names, so a component added in phase C needs no change here. In
 * practice: cards, figures, forms and reply chips fade; prose, headings and callouts stream.
 * Streaming words inside these would be wrong anyway — a card's label is not a sentence, and a
 * form's fields should be usable the moment they appear.
 */
import { tokenMs } from './timing.js';

// [2026-10-05] `.card-grid, .slider` went with the chat's card grid: a card on its own fades as one block, as it did inside
// the grid. It was by the arrow (`svg`) of its "Read guide" line; [owner 2026-10-08] the card has no such line any more, so
// the card names itself — a result card is one piece, whatever it holds.
const WIDGET = 'movelli-card, img, svg, form, input, select, textarea, button';

/**
 * Wrap every word of `root`'s text in a `<span class="chat-rv-w">`, in document order. Returns the count.
 *
 * Walks TEXT NODES and builds each span with `textContent` — the content is never re-parsed as
 * HTML, so the `[hard]` output-escaping boundary is not crossed at all and inline markup
 * (`<strong>`, `<a href>`) is left exactly as the sanitizer produced it, attributes included. The
 * words simply nest inside whatever inline element already held them.
 */
function wrapWords(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      // Whitespace-only nodes are left untouched (skipping them preserves them verbatim), and
      // anything inside a widget keeps its own text — it fades with the widget, not word by word.
      if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      if (node.parentElement?.closest(WIDGET)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);

  let i = 0;
  for (const node of texts) {
    const frag = document.createDocumentFragment();
    for (const part of splitParts(node.nodeValue)) {
      if (!part.word) { frag.appendChild(document.createTextNode(part.text)); continue; }
      const span = document.createElement('span');
      span.className = 'chat-rv-w';
      span.style.setProperty('--chat-rv-i', String(i++));
      span.textContent = part.text;
      frag.appendChild(span);
    }
    node.parentNode.replaceChild(frag, node);
  }
  return i;
}

/**
 * Reveal freshly-inserted chat elements in sequence: text streams word by word, everything else
 * fades as a unit, each starting where the previous finished.
 *
 * `gate` — an optional promise; nothing appears until it resolves. Used for the suggestions aside → chat
 * handover, so the answer does not animate behind the view swap itself (what `toChat()` returns).
 *
 * Elements must already be in the DOM. Under reduced motion this returns immediately, having
 * touched nothing (see below).
 */
export function reveal(elements, { gate = null } = {}) {
  const els = [...elements].filter(Boolean);
  if (!els.length) return;

  // REDUCED MOTION: no wrapping, no hiding, no gate — the content is simply there, which is exactly
  // the behaviour before this feature existed. Deliberately an early return rather than a CSS
  // bypass: bypassing in CSS would still build a few hundred spans per answer for the users least
  // able to benefit, and would still hold their content behind the view swap.
  if (reduceMotion()) return;

  const step = tokenMs('--chat-rv-step-dur', 22);
  const wordDur = tokenMs('--chat-rv-word-dur', 180);
  const blockDur = tokenMs('--chat-rv-block-dur', 260);
  const cap = tokenMs('--chat-rv-max-dur', 1500);
  const minTotal = tokenMs('--chat-rv-min-dur', 420);

  let offset = 0; // ms; where the next element starts — the running sequence
  for (const el of els) {
    el.style.setProperty('--chat-rv-start-delay', `${Math.round(offset)}ms`);
    el.classList.add('chat-rv-pending');

    const words = (el.matches(WIDGET) || el.querySelector(WIDGET)) ? 0 : wrapWords(el);
    if (!words) {                       // a widget, or an element with no text to stream
      el.classList.add('chat-rv-block');
      offset += blockDur;
      continue;
    }
    const s = stepFor(words, step, cap, minTotal);
    if (s !== step) el.style.setProperty('--chat-rv-step-dur', `${s.toFixed(2)}ms`);
    offset += (words - 1) * s + wordDur; // the last word still needs time to fade in
  }

  const start = () => {
    for (const el of els) { el.classList.remove('chat-rv-pending'); el.classList.add('chat-rv-go'); }
    // Drop `chat-rv-go` once the sequence has played, leaving the elements in a neutral, fully-visible
    // state. That matters beyond tidiness: `seedOpener` CLONES suggestions nodes into the chat log, and a
    // clone carrying `chat-rv-go` would replay the whole animation on content the visitor has read.
    setTimeout(() => { for (const el of els) el.classList.remove('chat-rv-go'); }, offset + wordDur + 100);
  };
  if (gate && typeof gate.then === 'function') gate.then(start, start); else start();
}

/**
 * Strip reveal state from an element AND its descendants, leaving everything plainly visible. The
 * word spans stay — they are inert without the classes, and `textContent` is unchanged — so this is
 * a cheap, non-destructive reset. Two callers, both load-bearing:
 *
 *  - `seedOpener` clones suggestions nodes into the chat log; a clone carrying `chat-rv-go` would replay the
 *    animation on text the visitor has already read.
 *  - `session.js` restores the log from `sessionStorage` as raw HTML. If a save caught the log
 *    mid-reveal, the stored markup contains `chat-rv-pending` — and NOTHING would ever clear it, because
 *    `reveal()` does not re-run on restored content. The answer would come back permanently
 *    invisible. Settling on restore also repairs any transcript already stored that way.
 */
export function clearReveal(el) {
  for (const n of [el, ...el.querySelectorAll('.chat-rv-pending, .chat-rv-go')]) {
    n.classList.remove('chat-rv-pending', 'chat-rv-go');
    n.style.removeProperty('--chat-rv-start-delay');
    n.style.removeProperty('--chat-rv-step-dur');
  }
}
