import { modules as B_main } from '/_assets/scripts/main.f8dbaa93.js';
import { modules as B_renderer } from '/_assets/scripts/renderer.74bb12d9.js';
import { modules as B_form } from '/_assets/scripts/form.f5eaca80.js';
const M0 = {};
const M1 = {};
const M2 = {};
const M3 = {};
const M4 = {};
const M5 = {};
const M6 = {};
const M7 = {};
const M8 = {};
const M9 = {};
const M10 = {};
const M11 = {};
const M12 = {};
const M13 = {};
const M14 = {};
const M15 = {};
const M16 = {};
const M17 = {};
const M18 = {};
const M19 = {};
const M20 = {};
(() => {
const POINTER_COARSE = matchMedia('(pointer: coarse)');
const isTouch = () => POINTER_COARSE.matches;
Object.assign(M0, { POINTER_COARSE, isTouch });
})();
(() => {
const { isTouch } = M0;
Object.assign(M1, { watch, unwatch });
const vv = () => window.visualViewport;
let applied = null;
function publish(px) {
if (px === applied) return;
applied = px;
const el = document.querySelector('movelli-assistant');
if (!el) return;
if (px > 0) el.style.setProperty('--keyboard-inset', `${px}px`);
else el.style.removeProperty('--keyboard-inset');
}
function measure() {
const v = vv();
if (!v) return;
if (Math.abs(v.scale - 1) > 0.01) { publish(0); return; }
publish(Math.max(0, Math.floor(document.documentElement.clientHeight - (v.height + v.offsetTop))));
}
let listening = false;
function watch() {
const v = vv();
if (!v || listening || !isTouch()) return;
listening = true;
v.addEventListener('resize', measure);
v.addEventListener('scroll', measure);
measure();
}
function unwatch() {
const v = vv();
if (!v || !listening) return;
listening = false;
v.removeEventListener('resize', measure);
v.removeEventListener('scroll', measure);
publish(0);
}
})();
(() => {
Object.assign(M2, { bindDialogHandlers, keepEntry, track });
function bindDialogHandlers(element, signal) {
bindNestedClose(element, signal);
bindEsc(element, signal);
bindTapBeside(element, signal);
}
function bindNestedClose(element, signal) {
element.addEventListener('close', (e) => {
const d = e.target;
if (!(d instanceof HTMLDialogElement)) return;
for (const nested of d.querySelectorAll('dialog[open]')) nested.close();
}, { capture: true, signal });
}
function requestClose(d, { pointer = false } = {}) {
if (d.dispatchEvent(new CustomEvent('cancel', { cancelable: true, detail: { pointer } }))) d.close();
}
function bindEsc(element, signal) {
element.addEventListener('keydown', (e) => {
if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing || e.keyCode === 229) return;
let d = e.target instanceof Element ? e.target.closest('dialog[open]') : null;
if (!d || !element.contains(d)) return;
d = [...d.querySelectorAll('dialog[open]')].pop() || d;
e.preventDefault();
requestClose(d);
}, { signal });
}
function bindTapBeside(element, signal) {
element.addEventListener('click', (e) => {
const d = e.target;
if (!(d instanceof HTMLDialogElement) || !d.open || !element.contains(d)) return;
const top = [...d.querySelectorAll('dialog[open]')].pop();
if (top) requestClose(top, { pointer: e.detail > 0 });
}, { signal });
}
const PANEL = '(min-width: 54rem)';
const SHEET = !matchMedia(PANEL).matches;
const tracked = new Map();
let layers = [];
let own = 0;
let keep = false;
function keepEntry() {
keep = true;
setTimeout(() => { keep = false; });
}
const entryLayers = () => history.state?.assistantLayers || [];
function sync() {
if (own) return;
const have = entryLayers();
if (layers.length > have.length) {
for (let n = have.length + 1; n <= layers.length; n++) {
history.pushState({ ...history.state, assistantLayers: layers.slice(0, n) }, '');
}
} else if (layers.length < have.length) {
if (keep) return;
own++;
history.go(layers.length - have.length);
}
}
const watch = new MutationObserver((records) => {
for (const { target: d } of records) {
layers = layers.filter((id) => id !== d.id);
if (d.open) layers.push(d.id);
}
sync();
});
function track(dialog, reopen) {
if (!SHEET || !dialog?.id) return;
tracked.set(dialog.id, { dialog, reopen });
watch.observe(dialog, { attributes: true, attributeFilter: ['open'] });
}
addEventListener('popstate', () => {
if (own) { own--; sync(); return; }
if (!SHEET) return;
const want = entryLayers();
for (const id of [...layers].reverse()) {
if (!want.includes(id)) { const t = tracked.get(id); if (t) requestClose(t.dialog); }
}
for (const id of want) {
if (!layers.includes(id)) tracked.get(id)?.reopen();
}
});
if (entryLayers().length && history.length > entryLayers().length) {
own++;
history.go(-entryLayers().length);
}
})();
(() => {
const store = B_main["store.mjs"];
const visualViewport = M1;
const { isTouch } = M0;
const { track, keepEntry } = M2;
Object.assign(M3, { hasHistory, scroller, isOpen, toChat, toPage, scrollToSegment });
const dialog = () => document.getElementById('assistant-dialog');
const button = () => document.getElementById('assistant-button');
const chatBody = () => document.getElementById('chat-body');
function hasHistory() { const l = chatBody(); return !!l && l.children.length > 0; }
function scroller() { return document.getElementById('chat-scroll'); }
chatBody()?.addEventListener('click', (e) => {
if (e.target.closest('a[href]')) store.write('fromChat', '1');
});
function focusOnOpen() {
const target = isTouch() ? scroller() : document.getElementById('assistant-input-field');
target?.focus({ preventScroll: true });
}
function syncAssistantButton() {
button()?.setAttribute('aria-expanded', String(!!dialog()?.open));
}
let pending = Promise.resolve();
function isOpen() { return !!dialog()?.open; }
function toChat() {
const d = dialog();
if (!d || d.open) return pending;
const sc = scroller();
if (sc) sc.scrollTop = sc.scrollHeight;
d.show();
visualViewport.watch();
syncAssistantButton();
focusOnOpen();
pending = Promise.resolve();
return pending;
}
function toPage({ pointer = false, moveFocus = true, keepHistory = false } = {}) {
const d = dialog();
if (!d || !d.open) return pending;
if (keepHistory) keepEntry();
d.close();
visualViewport.unwatch();
syncAssistantButton();
if (moveFocus) button()?.focus({ preventScroll: true, ...(pointer && { focusVisible: false }) });
pending = Promise.resolve();
return pending;
}
function scrollToSegment(el) {
if (!el) return;
const go = () => el.scrollIntoView({
behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
block: 'start',
});
if (isOpen()) { go(); return; }
toChat().then(go);
}
dialog()?.addEventListener('cancel', (e) => { e.preventDefault(); toPage(); });
track(dialog(), toChat);
if (dialog() && window.MutationObserver) {
new MutationObserver(() => {
const open = !!dialog().open;
if (open) visualViewport.watch(); else visualViewport.unwatch();
syncAssistantButton();
}).observe(dialog(), { attributes: true, attributeFilter: ['open'] });
}
Object.assign(M3, { dialog });
})();
(() => {
Object.assign(M4, { tokenMs, backstopMs });
function tokenMs(name, fallback) {
const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const n = parseFloat(raw);
if (!Number.isFinite(n)) return fallback;
return raw.endsWith('ms') ? n : n * 1000;
}
function backstopMs(name, fallback) {
return tokenMs(name, fallback) + 200;
}
})();
(() => {
const { tokenMs } = M4;
const { track } = M2;
Object.assign(M5, { isOpen, durationMs, open, refocus, close });
const menu = () => document.getElementById('assistant-menu');
const opener = () => document.getElementById('assistant-menu-button');
const behind = () => [...(menu()?.parentElement?.children || [])]
.filter((el) => el.id !== 'assistant-menu' && !el.classList.contains('assistant-toast'));
function isOpen() { return !!menu()?.open; }
function durationMs() { return tokenMs('--view-swap-dur', 400); }
function open() {
const m = menu();
if (!m || m.open) return;
m.show();
m.parentElement.scrollTop = 0;
opener()?.setAttribute('aria-expanded', 'true');
for (const el of behind()) el.setAttribute('inert', '');
refocus();
}
function refocus() { menu()?.focus({ preventScroll: true }); }
function restore() {
opener()?.setAttribute('aria-expanded', 'false');
for (const el of behind()) el.removeAttribute('inert');
}
function close({ pointer = false } = {}) {
const m = menu();
if (!m || !m.open) return Promise.resolve();
m.close();
restore();
opener()?.focus(pointer ? { focusVisible: false } : undefined);
return new Promise((resolve) => setTimeout(resolve, durationMs()));
}
if (menu()) {
menu().addEventListener('close', restore);
opener()?.addEventListener('click', () => (isOpen() ? close() : open()));
menu().querySelector('.assistant-menu__close')?.addEventListener('click', (e) => close({ pointer: e.detail > 0 }));
menu().addEventListener('cancel', (e) => { e.preventDefault(); close({ pointer: !!e.detail?.pointer }); });
track(menu(), open);
dragToClose(menu());
}
const DRAG_SLOP = 8;
const FLICK = 0.5;
function dragToClose(m) {
const scrollBox = () => m.querySelector('.assistant-menu__scroll');
let startY = null, startT = 0, dy = 0, dragging = false;
const reset = () => { m.style.transition = ''; m.style.translate = ''; startY = null; dragging = false; };
m.addEventListener('touchstart', (e) => {
if (dragging) reset();
startY = e.touches.length === 1 && (scrollBox()?.scrollTop || 0) <= 0 ? e.touches[0].clientY : null;
startT = e.timeStamp; dy = 0; dragging = false;
}, { passive: true });
m.addEventListener('touchmove', (e) => {
if (startY === null) return;
dy = e.touches[0].clientY - startY;
if (!dragging) {
if (dy < 0) { startY = null; return; }
if (dy < DRAG_SLOP) return;
dragging = true;
}
e.preventDefault();
m.style.transition = 'none';
m.style.translate = `0 ${Math.max(0, dy)}px`;
}, { passive: false });
m.addEventListener('touchend', (e) => {
if (!dragging) { startY = null; return; }
const far = dy > m.getBoundingClientRect().height / 3;
const fast = dy / Math.max(1, e.timeStamp - startT) > FLICK;
reset();
if (far || fast) close({ pointer: true });
});
m.addEventListener('touchcancel', reset);
}
})();
(() => {
Object.assign(M6, { sanitizeHtml, safeUrl, allowedHtml, safeId });
const INLINE = { strong: {}, em: {}, u: {}, s: {}, br: {}, sup: {}, sub: {}, code: {}, cite: {},
small: {}, a: { href: 1, target: 1, rel: 1 } };
const LEVELS = {
none: {},
inline: INLINE,
block: { ...INLINE, p: {}, h1: {}, h2: { 'data-toc': 1, 'data-toc-title': 1 }, h3: {}, h4: {}, h5: {}, h6: {}, ul: {}, ol: {}, li: {},
time: { datetime: 1 } },
};
function allowedHtml(level = 'block') {
const tags = Object.keys(LEVELS[level] || {}).sort();
return tags.length ? tags.map((t) => `<${t}>`).join(' ') : '(no HTML — plain text only)';
}
const VOID = new Set(['br']);
const DROP_TREE = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript', 'svg', 'math']);
const REL_OK = new Set(['noopener', 'noreferrer', 'nofollow', 'sponsored', 'ugc']);
const ENTITY = /&(?![a-zA-Z][a-zA-Z0-9]*;|#\d+;|#x[0-9a-fA-F]+;)/g;
const escapeText = (s) => String(s).replace(ENTITY, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (s) => String(s).replace(ENTITY, '&amp;').replace(/"/g, '&quot;')
.replace(/</g, '&lt;').replace(/>/g, '&gt;');
const stripCtrl = (s) => Array.from(s).filter((ch) => ch.charCodeAt(0) > 0x20).join('');
const NAMED_REF = { tab: '\t', newline: '\n', colon: ':', sol: '/', nbsp: ' ' };
const cp = (n) => (Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '');
const decodeRefs = (s) => s
.replace(/&#x([0-9a-f]+);?/gi, (_, h) => cp(parseInt(h, 16)))
.replace(/&#(\d+);?/g, (_, d) => cp(parseInt(d, 10)))
.replace(/&([a-z]+);/gi, (m, n) => (n.toLowerCase() in NAMED_REF ? NAMED_REF[n.toLowerCase()] : m));
function safeUrl(val) {
const v = String(val == null ? '' : val).trim();
if (!v) return null;
const norm = stripCtrl(decodeRefs(v)).toLowerCase();
if (/^(javascript|data|vbscript|file):/.test(norm)) return null;
if (/^[a-z][a-z0-9+.-]*:/.test(norm) && !/^(https?|mailto|tel|sponsor|footnote):/.test(norm)) return null;
return v;
}
const ID_OK = /^[a-z][a-z0-9-]*$/;
const ID_RESERVED = /^(icon|logo)-/;
function safeId(val) {
const v = String(val == null ? '' : val).trim();
return v && ID_OK.test(v) && !ID_RESERVED.test(v) ? v : null;
}
function validateAttr(name, val) {
if (name === 'href') return safeUrl(val);
if (name === 'id') return safeId(val);
if (name === 'data-toc') return val === 'off' ? 'off' : null;
if (name === 'data-toc-title') return val.trim().slice(0, 80) || null;
if (name === 'target') return val === '_blank' ? '_blank' : null;
if (name === 'rel') {
const toks = val.split(/\s+/).map((t) => t.toLowerCase()).filter((t) => REL_OK.has(t));
return toks.length ? [...new Set(toks)].join(' ') : null;
}
return val;
}
const GLOBAL_ATTRS = { id: 1 };
function filterAttrs(str, allowed, note) {
const out = [];
const re = /([a-zA-Z][a-zA-Z0-9-]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
let m;
while ((m = re.exec(str))) {
const name = m[1].toLowerCase();
if (!allowed[name] && !GLOBAL_ATTRS[name]) { if (note) note(`[${name}]`); continue; }
const raw = m[3] ?? m[4] ?? m[5] ?? '';
const val = validateAttr(name, raw);
if (val == null) { if (note) note(`[${name}]`); continue; }
out.push(` ${name}="${escapeAttr(val)}"`);
}
return out.join('');
}
function stripDroppedTrees(src, note) {
let out = src;
for (const tag of DROP_TREE) {
const seen = () => { if (note) note(tag); return ''; };
out = out.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), seen);
out = out.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), seen);
}
return out;
}
function sanitizeHtml(input, level = 'block', removed = null) {
if (input == null) return '';
const src = String(input);
const note = removed ? (t) => removed.add(/^\[/.test(t) ? t : `<${String(t).toLowerCase()}>`) : null;
if (level === 'none' || !LEVELS[level]) {
return escapeAttr(stripDroppedTrees(src, note)
.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*>/g, (_, t) => { if (note) note(t); return ''; }));
}
const allow = LEVELS[level];
const out = [];
const stack = [];
let dropDepth = 0;
let last = 0;
const tagRe = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^"'>])*)>/g;
let m;
while ((m = tagRe.exec(src))) {
const text = src.slice(last, m.index);
if (!dropDepth && text) out.push(escapeText(text));
last = tagRe.lastIndex;
if (m[0].startsWith('<!--')) continue;
const isClose = m[0][1] === '/';
const tag = (m[1] || '').toLowerCase();
if (isClose) {
if (dropDepth) { if (DROP_TREE.has(tag)) dropDepth--; continue; }
if (stack[stack.length - 1] === tag) { out.push(`</${tag}>`); stack.pop(); }
continue;
}
if (DROP_TREE.has(tag)) { if (note) note(tag); dropDepth++; continue; }
if (dropDepth || !allow[tag]) { if (note && !dropDepth) note(tag); continue; }
const attrs = filterAttrs(m[2] || '', allow[tag], note);
out.push(`<${tag}${attrs}>`);
if (!VOID.has(tag)) stack.push(tag);
}
const tail = src.slice(last);
if (!dropDepth && tail) out.push(escapeText(tail));
while (stack.length) out.push(`</${stack.pop()}>`);
return out.join('');
}
const escapeCode = (s) => escapeAttr(String(s == null ? '' : s));
Object.assign(M6, { escapeCode });
})();
(() => {
const { catalog, baseName } = B_renderer["catalog/catalog.mjs"];
const { sanitizeHtml, safeUrl } = M6;
Object.assign(M7, { clean });
const URL_TYPES = new Set(['url', 'link', 'media']);
const ESCAPED_BY_RENDERER = new Set(['chat-turn.text', 'chat-thinking.text', 'chat-continue.label', 'status-message.text', 'note.text',
'byline.updated', 'byline.updatedLabel', 'byline.readingTime', 'overview-table.caption']);
function deep(value, level) {
if (typeof value === 'string') return sanitizeHtml(value, level);
if (Array.isArray(value)) return value.map((v) => deep(v, level));
if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deep(v, level)]));
return value;
}
function clean(config) {
const entry = catalog[config && config.type];
if (!entry) return config;
const out = { ...config };
for (const [key, def] of Object.entries(entry.content || {})) {
if (!(key in out) || out[key] == null) continue;
if (ESCAPED_BY_RENDERER.has(`${baseName(out.type)}.${key}`)) continue;
if (URL_TYPES.has(def && def.type)) {
if (typeof out[key] !== 'string' || !safeUrl(out[key])) delete out[key];
} else {
out[key] = deep(out[key], (def && def.allowHtml) || 'none');
}
}
for (const [key, def] of Object.entries(entry.config || {})) {
if (def && def.type === 'url' && typeof out[key] === 'string' && !safeUrl(out[key])) delete out[key];
}
if (baseName(out.type) === 'prose') {
const has = Array.isArray(out.variant) ? out.variant : [];
if (!has.includes('standfirst') && !has.includes('smaller')) out.variant = [...has, 'smaller'];
}
return out;
}
Object.assign(M7, { ESCAPED_BY_RENDERER });
})();
(() => {
const { renderComponent } = B_renderer["render/renderers.mjs"];
const { copy } = B_main["copy-data.mjs"];
Object.assign(M8, { renderElement });
function renderElement(config) {
const tpl = document.createElement('template');
try {
tpl.innerHTML = renderComponent(config);
} catch (e) {
console.error('[render] the component library refused a config:', e.message, config);
tpl.innerHTML = renderComponent({
type: 'note', text: copy('ai_component_error'),
});
}
return tpl.content.firstElementChild;
}
})();
(() => {
const { clean } = M7;
const { renderElement } = M8;
Object.assign(M9, { ingest, turns, replaceTurns });
const log = () => document.getElementById('chat-body');
const turnOf = new WeakMap();
const TRANSIENT = new Set(['chat-thinking']);
function ingest(config, { before = null } = {}) {
const l = log();
if (!l) return null;
const cleaned = clean(config);
const el = renderElement(cleaned);
if (!el) return null;
turnOf.set(el, cleaned);
if (before) l.insertBefore(el, before); else l.appendChild(el);
return el;
}
function turns() {
const l = log();
if (!l) return [];
return [...l.children].map((el) => turnOf.get(el)).filter((cfg) => cfg && !TRANSIENT.has(cfg.type));
}
function replaceTurns(list) {
const l = log();
if (!l) return [];
l.replaceChildren();
return (Array.isArray(list) ? list : []).map((cfg) => ingest(cfg)).filter(Boolean);
}
})();
(() => {
const menu = M5;
const store = B_main["store.mjs"];
const { scrollToSegment, hasHistory } = M3;
const { ingest, turns, replaceTurns } = M9;
const { copy } = B_main["copy-data.mjs"];
Object.assign(M10, { save, divider, startSegment, snapshotLog, wipeLog, restoreLog, clear, renderRecents, refresh });
const log = () => document.getElementById('chat-body');
function save() {
if (log()) store.write('log', turns());
}
function restore() {
const l = log();
if (!l) return;
const stored = store.read('log', []);
if (!Array.isArray(stored) || !stored.length) return;
replaceTurns(stored);
}
function currentSegmentTitle(l, before = null) {
let titles = [...l.querySelectorAll('movelli-chat-segment-title')];
if (before) titles = titles.filter((t) => t.compareDocumentPosition(before) & Node.DOCUMENT_POSITION_FOLLOWING);
return titles.length ? titles[titles.length - 1].textContent || '' : '';
}
function divider(before = null) {
const l = log();
if (!l || !l.children.length) return;
if (before && !before.previousElementSibling) return;
const title = currentSegmentTitle(l, before);
if (title) {
ingest({ type: 'chat-continue', segment: title, label: copy('chat_continue') }, { before });
}
ingest({ type: 'chat-divider' }, { before });
}
function startSegment(title, before = null) {
if (!log()) return;
divider(before);
if (title) {
ingest({ type: 'chat-segment-title', text: title }, { before });
}
refresh();
}
function snapshotLog() { return turns(); }
function wipeLog() {
log()?.replaceChildren();
store.remove('log');
refresh();
}
function restoreLog(list) {
const l = log();
if (!l) return;
replaceTurns(list);
save();
refresh();
}
function clear() {
log()?.replaceChildren();
store.clearAll();
refresh();
}
function segments() {
const l = log();
if (!l) return [];
const heads = [...l.querySelectorAll('movelli-chat-segment-title')];
return heads.map((h) => ({ title: h.textContent, el: h }));
}
function renderRecents() {
const entries = segments();
const makeItem = (e) => {
const li = document.createElement('li');
const btn = document.createElement('button');
btn.type = 'button';
btn.className = 'chat-history__link';
btn.textContent = e.title || copy('chat_segment_fallback');
btn.addEventListener('click', () => {
menu.close();
setTimeout(() => scrollToSegment(e.el), menu.durationMs() / 2);
});
li.appendChild(btn);
return li;
};
document.getElementById('chat-history-list')?.replaceChildren(...entries.map(makeItem));
}
function updateControl() {
const has = hasHistory();
const clear = document.getElementById('chat-clear-history');
if (clear) clear.disabled = !has;
}
function refresh() { updateControl(); renderRecents(); }
if (log()) {
restore();
refresh();
}
Object.assign(M10, { hasHistory });
})();
(() => {
Object.assign(M11, { splitParts, stepFor });
function splitParts(text) {
const s = String(text ?? '');
if (!s) return [];
return s.split(/(\s+)/).filter(Boolean).map((text) => ({ text, word: !/^\s+$/.test(text) }));
}
function stepFor(n, stepMs, capMs, minTotalMs = 0) {
if (!(n > 1)) return 0;
const gaps = n - 1;
const total = gaps * stepMs;
if (total < minTotalMs) return minTotalMs / gaps;
if (total > capMs) return capMs / gaps;
return stepMs;
}
})();
(() => {
const { splitParts, stepFor } = M11;
const { tokenMs } = M4;
Object.assign(M12, { fadeIn, reveal, clearReveal });
function fadeIn(el) {
if (!el) return;
el.classList.add('chat-enter');
el.addEventListener('animationend', () => el.classList.remove('chat-enter'), { once: true });
}
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const WIDGET = 'movelli-card, img, svg, form, input, select, textarea, button';
function wrapWords(root) {
const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
acceptNode(node) {
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
function reveal(elements, { gate = null } = {}) {
const els = [...elements].filter(Boolean);
if (!els.length) return;
if (reduceMotion()) return;
const step = tokenMs('--chat-rv-step-dur', 22);
const wordDur = tokenMs('--chat-rv-word-dur', 180);
const blockDur = tokenMs('--chat-rv-block-dur', 260);
const cap = tokenMs('--chat-rv-max-dur', 1500);
const minTotal = tokenMs('--chat-rv-min-dur', 420);
let offset = 0;
for (const el of els) {
el.style.setProperty('--chat-rv-start-delay', `${Math.round(offset)}ms`);
el.classList.add('chat-rv-pending');
const words = (el.matches(WIDGET) || el.querySelector(WIDGET)) ? 0 : wrapWords(el);
if (!words) {
el.classList.add('chat-rv-block');
offset += blockDur;
continue;
}
const s = stepFor(words, step, cap, minTotal);
if (s !== step) el.style.setProperty('--chat-rv-step-dur', `${s.toFixed(2)}ms`);
offset += (words - 1) * s + wordDur;
}
const start = () => {
for (const el of els) { el.classList.remove('chat-rv-pending'); el.classList.add('chat-rv-go'); }
setTimeout(() => { for (const el of els) el.classList.remove('chat-rv-go'); }, offset + wordDur + 100);
};
if (gate && typeof gate.then === 'function') gate.then(start, start); else start();
}
function clearReveal(el) {
for (const n of [el, ...el.querySelectorAll('.chat-rv-pending, .chat-rv-go')]) {
n.classList.remove('chat-rv-pending', 'chat-rv-go');
n.style.removeProperty('--chat-rv-start-delay');
n.style.removeProperty('--chat-rv-step-dur');
}
}
})();
(() => {
Object.assign(M13, { pageContext });
const PAGE_EXCERPT_MAX = 600;
const collapse = (s) => String(s || '').replace(/\s+/g, ' ').trim();
function pageContext() {
const page = document.querySelector('[data-page]');
if (!page) return null;
return {
title: page.dataset.title || '',
url: page.dataset.url || '',
category: page.dataset.category || '',
description: document.querySelector('meta[name="description"]')?.content || '',
excerpt: collapse(page.textContent).slice(0, PAGE_EXCERPT_MAX),
};
}
})();
(() => {
const session = M10;
const chat = M3;
const menu = M5;
const store = B_main["store.mjs"];
const { ingest } = M9;
const { fadeIn } = M12;
const ready = (...a) => M17.ready(...a);
const { reveal } = M12;
const { copy } = B_main["copy-data.mjs"];
const { pageContext } = M13;
const { POINTER_COARSE, isTouch } = M0;
Object.assign(M14, { snapshotContext, resetContext, restoreContext });
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const CONTEXT_TURNS = 6;
const conversation = store.read('conversation', []);
function saveConversation() { store.write('conversation', conversation); syncSkipLink(); }
const SKIP_AFTER = 4;
function syncSkipLink() {
const link = document.getElementById('assistant-skip-to-input');
if (link) link.hidden = conversation.length < SKIP_AFTER;
}
function snapshotContext() { return conversation.slice(); }
function resetContext() { conversation.length = 0; store.remove('conversation'); syncSkipLink(); }
function restoreContext(snap) { conversation.length = 0; if (Array.isArray(snap)) conversation.push(...snap); saveConversation(); }
const log = () => document.getElementById('chat-body');
const enterSends = () => !isTouch();
const barEl = () => document.getElementById('assistant-controls');
const escapeCloses = () => !isTouch();
class AssistantInput {
connect() {
const bar = barEl();
if (!bar) return;
const q = (sel) => bar.querySelector(sel);
this.form = q('form');
this.input = q('[name="query"]');
this.button = q('button[type="submit"]');
this.replyChip = q('.continue-segment');
this.replyTitleEl = q('.continue-segment__title');
this.replyTitle = null;
this.openerConsumed = false;
this.suppressOpener = store.read('fromChat') === '1';
if (this.suppressOpener) store.write('fromChat', '');
this.available = true;
if (navigator.onLine === false) this.setAvailable(false);
addEventListener('offline', () => this.setAvailable(false));
addEventListener('online', () => this.setAvailable(true));
if (!this.form || !this.input) return;
if (!this.input.value) this.input.value = store.read('draft', '');
this.input.addEventListener('input', () => {
if (this.input.value) store.write('draft', this.input.value);
else store.remove('draft');
});
this.form.addEventListener('submit', (e) => { e.preventDefault(); this.submitFromInput(); });
this.holdFieldFocus(this.button);
this.input.addEventListener('keydown', (e) => {
if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
if (e.shiftKey || !enterSends()) return;
e.preventDefault();
this.submitFromInput();
});
document.getElementById('assistant-skip-to-input')?.addEventListener('click', (e) => { e.preventDefault(); this.input.focus(); });
syncSkipLink();
this.syncKeyboardHints();
POINTER_COARSE.addEventListener('change', () => this.syncKeyboardHints());
const dismiss = q('.continue-segment__dismiss');
this.holdFieldFocus(dismiss);
dismiss?.addEventListener('click', () => { this.returnFocusToField(); this.clearReply(); });
q('.assistant-input__body')?.addEventListener('click', (e) => {
if (e.target.closest('button, a, input, textarea, select, [tabindex]')) return;
this.input?.focus();
});
this.bar = bar;
log()?.addEventListener('click', (e) => {
const cont = e.target.closest?.('.chat-continue');
if (cont) { e.preventDefault(); this.setReply(cont.dataset.title || ''); return; }
const chip = e.target.closest?.('.chat-reply');
if (chip) { e.preventDefault(); this.ask(chip.textContent.trim(), { forceContinue: true }); }
});
}
setPlaceholder(text) {
const value = String(text || '') || copy('assistant_input_placeholder');
if (this.input) this.input.placeholder = value;
const label = document.querySelector('label[for="assistant-input-field"]');
if (label) label.textContent = value;
}
seedOnly(seed) {
if (!Array.isArray(seed) || !seed.length) return;
if (!this.openerConsumed && session.hasHistory()) session.divider();
this.openerConsumed = true;
const first = this.seedTurn(seed);
session.save();
session.refresh();
this.scrollToTurn(first, first, { instant: true });
}
submitFromInput() {
const msg = this.input.value.trim();
if (!msg) return;
this.returnFocusToField();
if (this.replyTitle) this.ask(`Re: ${this.replyTitle} — ${msg}`, { fromInput: true, forceContinue: true });
else this.ask(msg, { fromInput: true });
}
setReply(title) {
if (!title || !this.replyChip) return;
this.replyTitle = title;
if (this.replyTitleEl) this.replyTitleEl.textContent = title;
this.replyChip.hidden = false;
this.input?.focus();
}
holdFieldFocus(control) {
control?.addEventListener('pointerdown', (e) => { this.pressedBy = e.pointerType; });
control?.addEventListener('mousedown', (e) => { if (this.pressedBy !== 'mouse') e.preventDefault(); });
}
returnFocusToField() {
const byTouch = this.pressedBy === 'touch' || this.pressedBy === 'pen';
this.pressedBy = null;
if (!byTouch && document.activeElement !== this.input) this.input.focus({ preventScroll: true });
}
clearReply() {
this.replyTitle = null;
if (this.replyChip) this.replyChip.hidden = true;
}
syncKeyboardHints() {
if (!this.input) return;
const hints = [
enterSends() && 'assistant-input-enter-hint',
escapeCloses() && 'assistant-input-escape-hint',
].filter(Boolean);
if (hints.length) this.input.setAttribute('aria-describedby', hints.join(' '));
else this.input.removeAttribute('aria-describedby');
}
async ask(query, { forceContinue = false, fromInput = false, context = '', seed = null } = {}) {
if (!query || this.pending) return false;
this.setPending(true);
const wasOpen = chat.isOpen();
const opening = wasOpen ? Promise.resolve() : chat.toChat();
const menuGone = menu.close();
const user = seed ? this.seedTurn(seed) : this.userBubble(query);
const thinking = this.thinkingIndicator();
if (fromInput) { this.input.value = ''; this.clearReply(); store.remove('draft'); }
const seq = this.scrollSeq;
menuGone.then(() => { if (this.scrollSeq === seq) this.scrollToTurn(user, thinking, { instant: !wasOpen }); });
try {
let out = null;
try {
const res = await fetch('/ask', {
method: 'POST',
headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
body: JSON.stringify({ query, prev: conversation.slice(-CONTEXT_TURNS), output: 'components', page: pageContext(), context }),
});
if (!res.ok) throw new Error(String(res.status));
out = await res.json();
} catch {
out = null;
this.setAvailable(false);
}
await opening;
thinking.remove();
this.prepareSegment(out, forceContinue, user);
this.appendAnswer(query, out, user, { instant: !wasOpen, gate: null });
session.save();
session.refresh();
ready(!!out);
} finally {
this.setPending(false);
}
}
userBubble(query) {
return this.placeBubble(ingest({ type: 'chat-turn', text: query }));
}
placeBubble(el) {
if (el) fadeIn(el);
return el;
}
seedTurn(seed) {
if (!log()) return null;
let first = null;
for (const cfg of seed) {
const el = ingest(cfg);
if (!el) continue;
fadeIn(el);
first = first || el;
}
return first;
}
thinkingIndicator() {
const el = ingest({ type: 'chat-thinking', text: copy('chat_thinking') });
if (el) fadeIn(el);
return el;
}
prepareSegment(out, forceContinue, before = null) {
if (!out) return;
const isNew = !forceContinue && out.continuation === 'new';
if (!this.openerConsumed && !this.suppressOpener) {
this.openerConsumed = true;
session.startSegment(out.title, before);
return;
}
if (isNew) session.startSegment(out.title, before);
}
resetSegmentState() {
const before = { openerConsumed: this.openerConsumed, suppressOpener: this.suppressOpener };
this.openerConsumed = false;
this.suppressOpener = false;
return before;
}
restoreSegmentState(state) {
if (!state) return;
this.openerConsumed = state.openerConsumed;
this.suppressOpener = state.suppressOpener;
}
setPending(on) {
this.pending = on;
if (this.button) this.button.disabled = on || this.available === false;
this.bar?.setAttribute('aria-busy', on ? 'true' : 'false');
}
setAvailable(on) {
this.available = on;
if (this.input) this.input.disabled = !on;
if (this.button) this.button.disabled = !on || this.pending;
document.querySelector('movelli-assistant')?.setAttribute('data-available', String(on));
}
appendAnswer(query, out, user, { instant = false, gate = null } = {}) {
const l = log();
if (!l) return;
const components = out && Array.isArray(out.components) ? out.components : [];
let firstReply = null;
const revealed = [];
if (components.length) {
for (const cfg of components) {
const el = ingest(cfg);
if (el) { revealed.push(el); firstReply = firstReply || el; }
}
} else {
const msg = ingest({ type: 'status-message', text: copy('chat_unavailable') });
if (msg) { revealed.push(msg); firstReply = msg; }
}
reveal(revealed, { gate });
conversation.push({ query, answer: this.proseText(components) });
saveConversation();
this.scrollToTurn(user, firstReply, { instant });
}
proseText(components) {
const p = components.find((c) => c && c.type === 'prose');
return p ? String(p.html || '').replace(/<[^>]+>/g, '').trim() : '';
}
scrollToTurn(userEl, replyEl, { instant = false } = {}) {
this.scrollSeq = (this.scrollSeq || 0) + 1;
const l = chat.scroller();
if (!l || !userEl) return;
let anchor = userEl;
const prev = userEl.previousElementSibling;
if (prev && prev.matches?.('movelli-chat-segment-title')) anchor = prev;
const topOf = (el) => el.getBoundingClientRect().top - l.getBoundingClientRect().top + l.scrollTop;
const MARGIN = parseFloat(getComputedStyle(l).scrollPaddingTop) || 0;
const REPLY_MIN = 40;
const visible = l.clientHeight;
const anchorTop = topOf(anchor);
const replyTop = replyEl ? topOf(replyEl) : anchorTop;
const target = (replyTop - anchorTop <= visible - MARGIN - REPLY_MIN)
? anchorTop - MARGIN
: replyTop - MARGIN;
l.scrollTo({ top: Math.max(0, target), behavior: (instant || reduceMotion()) ? 'auto' : 'smooth' });
}
}
const input = new AssistantInput();
input.connect();
Object.assign(M14, { input });
})();
(() => {
Object.assign(M15, { assistantToast });
const region = () => document.getElementById('assistant-toast');
let current = null;
function assistantToast(message, { actionLabel, onAction, duration = 4000 } = {}) {
const r = region();
if (!r) return;
dismiss();
const el = document.createElement('div');
el.className = 'toast assistant-toast__item';
const msg = document.createElement('span');
msg.className = 'toast__msg';
msg.textContent = message;
el.appendChild(msg);
if (actionLabel && onAction) {
const btn = document.createElement('button');
btn.type = 'button';
btn.className = 'toast__action is-underlined';
btn.textContent = actionLabel;
btn.addEventListener('click', () => { onAction(); dismiss(); });
el.appendChild(btn);
}
r.appendChild(el);
void el.offsetWidth;
el.classList.add('is-shown');
current = { el, timer: setTimeout(dismiss, duration) };
const pause = () => { if (current?.el === el) clearTimeout(current.timer); };
const resume = () => { if (current?.el === el) current.timer = setTimeout(dismiss, duration); };
el.addEventListener('mouseenter', pause);
el.addEventListener('mouseleave', resume);
el.addEventListener('focusin', pause);
el.addEventListener('focusout', resume);
}
function dismiss() {
if (!current) return;
const { el, timer } = current;
current = null;
clearTimeout(timer);
el.classList.remove('is-shown');
const done = () => el.remove();
el.addEventListener('transitionend', done, { once: true });
setTimeout(done, 500);
}
})();
(() => {
const session = M10;
const menu = M5;
const { input, snapshotContext, resetContext, restoreContext } = M14;
const emit = (...a) => M17.emit(...a);
const { assistantToast } = M15;
const { copy } = B_main["copy-data.mjs"];
const announce = (name) => emit(name);
function clearWithUndo() {
const snap = { log: session.snapshotLog(), ctx: snapshotContext() };
session.wipeLog();
resetContext();
input.clearReply();
snap.seg = input.resetSegmentState();
announce('cleared');
menu.refocus();
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
})();
(() => {
const assistantDialog = M3;
const { bindDialogHandlers } = M2;
const { input } = M14;
Object.assign(M17, { emit, ready });
class MovelliAssistant extends HTMLElement {
connectedCallback() {
this.listening?.abort();
this.listening = new AbortController();
const { signal } = this.listening;
this.button = this.querySelector('#assistant-button');
if (this.button) this.button.disabled = false;
this.button?.addEventListener('click', (e) => (this.isOpen() ? assistantDialog.toPage({ pointer: e.detail > 0 }) : assistantDialog.toChat()), { signal });
bindDialogHandlers(this, signal);
}
disconnectedCallback() { this.listening?.abort(); }
async start({ seed, prompt, placeholder, context } = {}) {
await assistantDialog.toChat();
input.setPlaceholder(placeholder);
if (prompt) {
let took;
try { took = await input.ask(prompt, { forceContinue: true, context, seed }); } catch (e) { ready(false); throw e; }
if (took === false) ready(false);
return;
}
input.seedOnly(seed);
ready(true);
}
close({ moveFocus = true, keepHistory = false } = {}) { assistantDialog.toPage({ moveFocus, keepHistory }); }
isOpen() { return !!assistantDialog.dialog()?.open; }
}
function emit(name, detail) {
document.querySelector('movelli-assistant')
?.dispatchEvent(new CustomEvent(`movelli:assistant-${name}`, { bubbles: true, detail }));
}
function ready(ok) { emit('ready', { ok: !!ok }); }
if (!customElements.get('movelli-assistant')) customElements.define('movelli-assistant', MovelliAssistant);
})();
(() => {
Object.assign(M18, { press, ready, marks });
function press({ answered, pending }, entry, options, { resolveContext, changeLine }) {
if (pending !== null) return { pending, call: null };
if (entry.key === answered) return { pending, call: {} };
const before = answered === null ? null : options.find((o) => o.key === answered) || null;
const { prompt, seed, seedOnChange, placeholder, context } = entry.state || {};
const changed = before ? changeLine(before.label, entry.label) : '';
return {
pending: entry.key,
call: {
seed: before ? (seedOnChange || seed) : seed,
prompt,
placeholder,
context: [changed, resolveContext(context)].filter(Boolean).join('\n'),
},
};
}
function ready({ answered, pending }, ok) {
if (pending === null) return { answered, pending, commit: false };
if (!ok) return { answered, pending: null, commit: false };
return { answered: pending, pending: null, commit: true };
}
function marks(answered, options) {
return options.map((o) => o.key === answered);
}
})();
(() => {
const answer = M18;
const store = B_main["store.mjs"];
const { renderComponent } = B_renderer["render/renderers.mjs"];
const { copy, fill } = B_main["copy-data.mjs"];
const { userType, getVisits } = B_main["visits.js"];
Object.assign(M19, { arm });
const chat = () => document.getElementById('secondary-content-body');
const footer = () => document.getElementById('secondary-content-footer');
let currentSrc = null;
let pending = null;
let answered = null;
let shownVersion = null;
let chips = [];
const recordFor = (id) => store.read('proactiveAnswer', []).find((e) => e && e.id === id) || null;
function rememberAnswer(id, a, v) {
const all = store.read('proactiveAnswer', []).filter((e) => e && e.id !== id);
all.push({ id, a, v });
store.write('proactiveAnswer', all);
}
function assistantReady(ok) {
const r = answer.ready({ answered, pending }, ok);
answered = r.answered;
pending = r.pending;
if (!r.commit) return;
if (currentSrc) rememberAnswer(currentSrc, answered, shownVersion);
applyAnswered();
}
const question = () => document.getElementById('proactive-question');
function applyAnswered() {
if (!chips.length) return;
answer.marks(answered, chips).forEach((chosen, i) => {
const { el } = chips[i];
el.classList.toggle('reply-options__option--selected', chosen);
if (chosen) el.setAttribute('aria-pressed', 'true');
else el.removeAttribute('aria-pressed');
});
}
let cleared = null;
function snapshotEngagement() { return { entries: store.read('proactiveAnswer', []), a: answered }; }
function resetEngagement() {
store.remove('proactiveAnswer');
answered = null;
pending = null;
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
const SOURCES = {
visits() {
const seen = getVisits().filter((v) => v && v.url);
if (!seen.length) return '';
return `Pages they have read this session: ${seen.map((v) =>
(v.category ? `${v.url} (${v.category})` : v.url)).join(', ')}`;
},
};
function resolveContext(names) {
const list = Array.isArray(names) ? names : String(names || '').split(',');
return list.map((n) => String(n).trim()).filter(Boolean)
.map((n) => (SOURCES[n] ? SOURCES[n]() : '')).filter(Boolean).join('\n');
}
function arm() {
answered = null;
pending = null;
shownVersion = null;
const c = chat();
const src = document.querySelector('[data-page]')?.dataset.proactive;
currentSrc = src || null;
if (!c || !src || question()) return;
if (window.requestIdleCallback) window.requestIdleCallback(() => load(src), { timeout: 2500 });
else setTimeout(() => load(src), 1500);
}
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
if (!c || question()) return;
let data;
try { data = await (await fetch(src)).json(); } catch { return; }
const was = recordFor(src);
const config = pickVersion(data, was && was.v);
if (!Array.isArray(config) || question()) return;
const tpl = document.createElement('template');
tpl.innerHTML = config.map((cfg) => renderComponent(cfg)).join('');
const els = [...tpl.content.children];
c.append(...tpl.content.childNodes);
bindChips(c, config);
const f = footer();
if (f && data.note && !f.children.length) { f.innerHTML = renderComponent(data.note); els.push(f); }
if (answered === null && was) answered = was.a;
applyAnswered();
}
function bindChips(box, config) {
const items = (config.find((cfg) => cfg && cfg.type === 'reply-options') || {}).items || [];
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
function press(entry) {
const r = answer.press({ answered, pending }, entry, chips, {
resolveContext,
changeLine: (before, after) => fill(copy('proactive_changed_answer_context'), before, after),
});
pending = r.pending;
if (r.call) document.querySelector('movelli-assistant')?.start(r.call);
}
document.addEventListener('movelli:assistant-ready', (e) => assistantReady(!!(e.detail && e.detail.ok)));
document.addEventListener('movelli:assistant-cleared', () => { cleared = snapshotEngagement(); resetEngagement(); });
document.addEventListener('movelli:assistant-restored', () => { restoreEngagement(cleared); cleared = null; });
if (chat()) arm();
})();
(() => {
})();
export const modules = { };
