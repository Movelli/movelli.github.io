/**
 * [owner 2026-10-08] THE ONE SANITIZER — isomorphic, in `src/scripts/`, because the assistant's ingest point (`assistant/ingest.js`) runs it in the BROWSER on
 * whatever `start({ seed })` hands it, and the build, the CMS and the Cloud Function run the same one: "the same allowlist the build uses, not a second one".
 * `generator/sanitize.js` and `functions/sanitize.js` are one-line shims over this file (the function's is written by the build, with a copy of this file beside
 * it, because `functions/` is self-contained). It has no imports and no globals, so it runs anywhere.
 */

/**
 * HTML sanitizer (Phase B slice 1a) — a small, pure, zero-dep allowlist tokenizer.
 * A text content field declares `allowHtml`; this enforces it, on the BUILD and
 * (later) on CMS API writes — the allowlist IS the validation.
 *
 *   'none'   → plain text: strip every tag, escape.
 *   'inline' → strong · em · u · s · br · a[href,target,rel]   (semantic, not styled spans)
 *   'block'  → inline + p · h1–h6 · ul · ol · li
 *
 * Disallowed FORMATTING tags are unwrapped (tag dropped, text kept); `script/style/
 * iframe/…` are dropped WITH their content; attributes are filtered to the allowlist
 * and validated (no `javascript:`/`data:` URLs; `target` only `_blank`; `rel` tokens
 * allowlisted). Mis-nested/unclosed tags are closed conservatively. Not a full HTML5
 * parser — the input is authored / AI-generated + sanitized on write, not arbitrary
 * live public input; it errs toward stripping.
 */

// The allowlist. Everything here is deliberate; everything absent is stripped, and the build now
// SAYS SO (see the `removed` sink on sanitizeHtml) rather than losing it in silence.
//
// `sup`/`sub`/`code` are attribute-free, so they add no attack surface, and the first two change
// MEANING when stripped rather than merely losing a style: `30 m<sup>2</sup>` became `30 m2` and
// `CO<sub>2</sub>` became `CO2`. `code` earns its place on a site whose own prose talks about
// `rel="sponsored"` and `media:<id>`.
//
// Deliberately ABSENT, and worth knowing why before anyone adds them:
//   · `span`  — only does anything with a class, and classes are stripped so content can never
//               inject a styling hook. Use `strong`/`em`.
//   · `img`   — media goes through the library, which owns the alt text and the renditions.
//   · `table` — that is the `comparison` / `overview-table` component. A table written in prose
//               collapses to a run of bare cell text, which is worse than not having one.
// `cite` is the ELEMENT (the title of a work), not the blockquote's `cite` ATTRIBUTE — different
// things that share a name. Attribute-free, and it is what the HTML spec's own quote example uses:
// `<figcaption>— Jane Doe, <cite>The Times</cite></figcaption>`.
// `small` is small print — a side note, a caveat, an attribution — not "shrink this text". It is
// attribute-free, the site already emits one (the comparison table's note), and it carries a meaning
// no other allowed element does: `em` would claim emphasis it does not have.
const INLINE = { strong: {}, em: {}, u: {}, s: {}, br: {}, sup: {}, sub: {}, code: {}, cite: {},
  small: {}, a: { href: 1, target: 1, rel: 1 } };
const LEVELS = {
  none: {},
  inline: INLINE,
  //   · `blockquote` and `pre` are deliberately NOT here (both were, briefly). A pull quote and a code
  //     BLOCK are COMPONENTS, for the same reason `table` is: each carries its own layout, and the
  //     code block additionally needs its content left UNSANITIZED — markup inside it is data, so
  //     running it through an HTML sanitizer would delete the sample. See `quote` and `code-block`.
  //     Inline `code` stays on the list: a word of code inside a sentence is emphasis, like `strong`.
  // `time` carries a machine-readable `datetime` beside the localised visible text — the recorded
  // way to write a date, and what `page-header` already emits. Its one attribute is a plain string
  // (no URL, no script) and is attribute-escaped like any other.
  // [owner 2026-10-14] A section heading (`h2`) may say how it is in the table of contents: `data-toc="off"` leaves it out and `data-toc-title="…"` is its short label. The build reads both and
  // writes neither (`finishComponents`, `generator/resolve-page.js`); no other tag takes them.
  block: { ...INLINE, p: {}, h1: {}, h2: { 'data-toc': 1, 'data-toc-title': 1 }, h3: {}, h4: {}, h5: {}, h6: {}, ul: {}, ol: {}, li: {},
    time: { datetime: 1 } },
};

/** The allowlist as prose, for an AUTHORING PROMPT — derived, so it can never drift from the code. */
function allowedHtml(level = 'block') {
  const tags = Object.keys(LEVELS[level] || {}).sort();
  return tags.length ? tags.map((t) => `<${t}>`).join(' ') : '(no HTML — plain text only)';
}

const VOID = new Set(['br']);
const DROP_TREE = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript', 'svg', 'math']);
const REL_OK = new Set(['noopener', 'noreferrer', 'nofollow', 'sponsored', 'ugc']);
const ENTITY = /&(?![a-zA-Z][a-zA-Z0-9]*;|#\d+;|#x[0-9a-fA-F]+;)/g; // a bare & (not a valid entity)

const escapeText = (s) => String(s).replace(ENTITY, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => String(s).replace(ENTITY, '&amp;').replace(/"/g, '&quot;')
  .replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Drop every codepoint <= 0x20 (C0 control chars + space) — unmask obfuscated URL schemes
 *  (e.g. `java\tscript:`), without needing control-char literals in this source. */
const stripCtrl = (s) => Array.from(s).filter((ch) => ch.charCodeAt(0) > 0x20).join('');

// A browser decodes HTML character references in an attribute BEFORE it detects a URL scheme, so an
// entity-obfuscated scheme (`java&#9;script:`, `javascript&colon;…`, `&#106;avascript:`) would slip past
// a raw-string check. We decode the same way for the SCHEME DECISION ONLY (the emitted value stays the
// escaped original), then stripCtrl the result. Over-decoding only ever makes a value look MORE like a
// blocked scheme — a legit relative/http URL can't be turned into one — so there are no false positives.
const NAMED_REF = { tab: '\t', newline: '\n', colon: ':', sol: '/', nbsp: ' ' };
const cp = (n) => (Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '');
const decodeRefs = (s) => s
  .replace(/&#x([0-9a-f]+);?/gi, (_, h) => cp(parseInt(h, 16)))
  .replace(/&#(\d+);?/g, (_, d) => cp(parseInt(d, 10)))
  .replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in NAMED_REF ? NAMED_REF[n.toLowerCase()] : m));

/**
 * Is this a URL we are willing to emit? The check every `href` goes through, exposed on its own so a
 * `link`-TYPED content field gets the same guarantee as one written inline in rich text.
 *
 * A link field must NOT be HTML-escaped the way text is: `?a=1&b=2` escaped to `?a=1&amp;b=2` and then
 * escaped again at the output boundary decodes to a broken query string. So the scheme is validated
 * here and the raw URL travels on, to be `esc()`'d exactly once by whichever renderer places it.
 */
function safeUrl(val) {
  const v = String(val == null ? '' : val).trim();
  if (!v) return null;
  const norm = stripCtrl(decodeRefs(v)).toLowerCase();
  if (/^(javascript|data|vbscript|file):/.test(norm)) return null;
  // `sponsor:<id>` is an INTERNAL reference the build expands into the real commercial URL — it has
  // to survive sanitization to reach the expander, and an unexpanded one is a dead link rather than
  // a vulnerability (no browser resolves the scheme).
  // a declared scheme must be http(s)/mailto/tel/sponsor; else it's relative ("/…", "./…", "#…", "path/…")
  // `footnote:<id>` is the same kind of internal reference: the build numbers it and links it to the footnote (generator/footnotes.js).
  if (/^[a-z][a-z0-9+.-]*:/.test(norm) && !/^(https?|mailto|tel|sponsor|footnote):/.test(norm)) return null;
  return v;
}

/**
 * `id` is allowed on ANY content element — authors need in-page anchors, and the engine's own
 * `block-heading.anchor` only reaches top-level headings, never an <h3> inside a prose block.
 *
 * It is the one attribute content shares a namespace with the ENGINE: the shell (`#main`,
 * `#assistant-dialog`, `#assistant-menu`), every sprite symbol (`#icon-*`, `#logo-wordmark`) and every
 * heading anchor live in the same document. A duplicate breaks `getElementById`, `aria-labelledby`,
 * label/for pairing and a sprite `<use>` reference — an icon silently resolving to a paragraph.
 * Two guards, deliberately at different levels:
 *   · HERE — a strict token, and the sprite's prefixes refused outright (that collision is the
 *     nastiest because it breaks chrome far from the content that caused it);
 *   · at BUILD — a per-page duplicate check, which catches everything this cannot see from
 *     inside a single field.
 */
const ID_OK = /^[a-z][a-z0-9-]*$/;               // lowercase + hyphens: URL fragments are case-sensitive
const ID_RESERVED = /^(icon|logo)-/;             // the SVG sprite owns these

/**
 * THE one id rule, exported so every producer shares it. There are two: content HTML (here) and a
 * `block-heading`'s `anchor` config, which is what gives the table of contents its jump targets.
 * They are the same namespace and must answer to the same rule — validating only the newer one is
 * exactly how a guard ends up half-applied.
 */
function safeId(val) {
  const v = String(val == null ? '' : val).trim();
  return v && ID_OK.test(v) && !ID_RESERVED.test(v) ? v : null;
}

function validateAttr(name, val) {
  if (name === 'href') return safeUrl(val);
  if (name === 'id') return safeId(val);
  if (name === 'data-toc') return val === 'off' ? 'off' : null;           // the one value there is: leave the heading out
  if (name === 'data-toc-title') return val.trim().slice(0, 80) || null;
  if (name === 'target') return val === '_blank' ? '_blank' : null;
  if (name === 'rel') {
    const toks = val.split(/\s+/).map((t) => t.toLowerCase()).filter((t) => REL_OK.has(t));
    return toks.length ? [...new Set(toks)].join(' ') : null;
  }
  return val;
}

/** Attributes allowed on EVERY element, on top of the per-tag list. */
const GLOBAL_ATTRS = { id: 1 };

function filterAttrs(str, allowed, note) {
  const out = [];
  const re = /([a-zA-Z][a-zA-Z0-9-]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(str))) {
    const name = m[1].toLowerCase();
    // Dropping an attribute was as silent as dropping a tag used to be: an author writing
    // `class="lead"` or `id="Fees"` got no signal at all. Both are reported now.
    if (!allowed[name] && !GLOBAL_ATTRS[name]) { if (note) note(`[${name}]`); continue; }
    const raw = m[3] ?? m[4] ?? m[5] ?? '';
    const val = validateAttr(name, raw);
    if (val == null) { if (note) note(`[${name}]`); continue; }
    out.push(` ${name}="${escapeAttr(val)}"`);
  }
  return out.join('');
}

/** Sanitize `input` HTML to the given `allowHtml` level. Returns a safe HTML (or escaped-text) string. */
/** Remove `script`/`style`/`iframe`/… elements AND their content, for the tag-stripping 'none' path. */
function stripDroppedTrees(src, note) {
  let out = src;
  for (const tag of DROP_TREE) {
    const seen = () => { if (note) note(tag); return ''; };
    out = out.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), seen);
    out = out.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), seen);   // unclosed / self-closing
  }
  return out;
}

/**
 * @param {*} input
 * @param {string} level  'none' | 'inline' | 'block'
 * @param {Set<string>} [removed]  OPTIONAL sink: every tag name this call strips is added to it.
 *   Sanitizing is silent by design — it returns clean output and says nothing — which means an author
 *   (or the CMS's AI) writing `30 m<sup>2</sup>` gets `30 m2` back with no error, and the MEANING has
 *   changed, not just the styling. Callers that can surface that (the build, `cms_upsert_item`) pass
 *   a Set and report it. Optional so the ~15 existing call sites are untouched.
 */
function sanitizeHtml(input, level = 'block', removed = null) {
  if (input == null) return '';
  const src = String(input);
  // Display-ready tokens: `<sup>` for a tag, `[id]` for an attribute, so one sink covers both.
  const note = removed ? (t) => removed.add(/^\[/.test(t) ? t : `<${String(t).toLowerCase()}>`) : null;
  // 'none' takes a regex shortcut instead of walking the tree — which meant DROP_TREE never applied
  // here, so the SOURCE of a <script> survived as visible (escaped, inert) text where 'inline'/'block'
  // drop it entirely. Not a vulnerability — everything below is escaped — but a CMS author pasting
  // markup would see stray code printed on the page. Drop those trees first, then strip what's left.
  // `</?[a-zA-Z]…>` — only something that could BE a tag. The old `<[^>]*>` ate any angle-bracket span,
  // so plain text like "5 < 6 and 7 > 2" silently became "5  2". Factsheet values are full of
  // comparisons, so that is real content loss, not a curiosity.
  // escapeAttr, not escapeText: a 'none' value is PLAIN TEXT with no markup, and the renderers put it
  // in BOTH text position (a heading, a table cell) and ATTRIBUTE position (`alt`, `aria-label`).
  // escapeText leaves `"` alone, which is fine in text but breaks out of an attribute — so the one
  // escaping has to cover the stricter context. Entities decode identically either way, so a quote in
  // a heading still reads as a quote. This is what lets every renderer emit a sanitized value
  // VERBATIM, which is what removes the double-escaping.
  if (level === 'none' || !LEVELS[level]) {
    return escapeAttr(stripDroppedTrees(src, note)
      .replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (_, t) => { if (note) note(t); return ''; }));
  }
  const allow = LEVELS[level];
  const out = [];
  const stack = [];
  let dropDepth = 0; // >0 = inside a DROP_TREE subtree
  let last = 0;
  const tagRe = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/g;
  let m;
  while ((m = tagRe.exec(src))) {
    const text = src.slice(last, m.index);
    if (!dropDepth && text) out.push(escapeText(text));
    last = tagRe.lastIndex;
    if (m[0].startsWith('<!--')) continue; // drop comments
    const isClose = m[0][1] === '/';
    const tag = (m[1] || '').toLowerCase();
    if (isClose) {
      if (dropDepth) { if (DROP_TREE.has(tag)) dropDepth--; continue; }
      if (stack[stack.length - 1] === tag) { out.push(`</${tag}>`); stack.pop(); } // else: drop stray/mis-nested close
      continue;
    }
    if (DROP_TREE.has(tag)) { if (note) note(tag); dropDepth++; continue; }
    if (dropDepth || !allow[tag]) { if (note && !dropDepth) note(tag); continue; } // disallowed → unwrap (keep children)
    const attrs = filterAttrs(m[2] || '', allow[tag], note);
    out.push(`<${tag}${attrs}>`);
    if (!VOID.has(tag)) stack.push(tag);
  }
  const tail = src.slice(last);
  if (!dropDepth && tail) out.push(escapeText(tail));
  while (stack.length) out.push(`</${stack.pop()}>`); // close any unclosed allowed tags
  return out.join('');
}

/**
 * Literal text — escaped for HTML, with NOTHING stripped. For a `code` content field, where markup is
 * the DATA rather than markup: `sanitizeHtml` is an HTML sanitizer, so it removes tags, and a code
 * sample fed through it loses the very thing it demonstrates — `<div class="x">hi</div>` comes back
 * as `hi`, and `<script>alert(1)</script>` comes back empty.
 *
 * `escapeAttr`, not `escapeText`, for the same reason the 'none' level uses it: the escaping contract
 * says the resolver hands the renderer a string it can emit verbatim, and a quote that is safe in text
 * position would break out if the same value ever reached an attribute. Entities decode identically in
 * both, so a quote in a code sample still reads as a quote.
 */
const escapeCode = (s) => escapeAttr(String(s == null ? '' : s));

export { sanitizeHtml, safeUrl, allowedHtml, safeId, escapeCode };
