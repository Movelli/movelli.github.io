/**
 * THE INGEST POINT'S PURE HALF — a config, made safe. No DOM, so Node can test it (`ingest.js` is the DOM half: it renders and appends).
 * See `ingest.js` for why every turn passes through one function.
 */
import { catalog, baseName } from '../catalog/catalog.mjs';
import { sanitizeHtml, safeUrl } from '../sanitize.mjs';

const URL_TYPES = new Set(['url', 'link', 'media']);

/**
 * THE CONTENT FIELDS A RENDERER ESCAPES ITSELF (`esc()` at emission), so cleaning them first would escape twice — the visitor's own words in a `chat-turn`
 * (`A & B` would show as `A &amp; B`), a note's text. Every OTHER content field is emitted verbatim and is cleaned here. The list is read off the renderers and
 * HELD to them: `a11y.test.js` probes every component's text fields with markup and fails the day this list and the renderers disagree.
 */
export const ESCAPED_BY_RENDERER = new Set(['chat-turn.text', 'chat-thinking.text', 'chat-continue.label', 'status-message.text', 'note.text',
  'byline.updated', 'byline.updatedLabel', 'byline.readingTime', 'overview-table.caption']);

/** Every string in a nested content value, sanitized at `level`. A content field that holds a list or an object (a table's rows, an FAQ's items) carries its words in them. */
function deep(value, level) {
  if (typeof value === 'string') return sanitizeHtml(value, level);
  if (Array.isArray(value)) return value.map((v) => deep(v, level));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deep(v, level)]));
  return value;
}

/**
 * The config, made safe: content sanitized by its own level, a URL-typed value dropped unless its scheme is one a page may load (a dropped REQUIRED url
 * then fails the component check, and the turn shows the library's error note). Returns a new object; the caller's is untouched.
 */
export function clean(config) {
  const entry = catalog[config && config.type];
  if (!entry) return config;   // an unknown type: `renderComponent` refuses it, by name
  const out = { ...config };
  for (const [key, def] of Object.entries(entry.content || {})) {
    if (!(key in out) || out[key] == null) continue;
    if (ESCAPED_BY_RENDERER.has(`${baseName(out.type)}.${key}`)) continue;   // the renderer escapes it
    if (URL_TYPES.has(def && def.type)) {
      if (typeof out[key] !== 'string' || !safeUrl(out[key])) delete out[key];
    } else {
      out[key] = deep(out[key], (def && def.allowHtml) || 'none');
    }
  }
  for (const [key, def] of Object.entries(entry.config || {})) {
    if (def && def.type === 'url' && typeof out[key] === 'string' && !safeUrl(out[key])) delete out[key];
  }
  // The chat's own presentation: a prose in the conversation is the smaller size, unless it is a standfirst or already smaller.
  if (baseName(out.type) === 'prose') {
    const has = Array.isArray(out.variant) ? out.variant : [];
    if (!has.includes('standfirst') && !has.includes('smaller')) out.variant = [...has, 'smaller'];
  }
  return out;
}
