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
(() => {
const INTENT_MS = 200;
class MovelliCard extends HTMLElement {
connectedCallback() {
const link = this.querySelector('a[href]');
if (!link) return;
this.listening?.abort();
this.listening = new AbortController();
const { signal } = this.listening;
let timer = null;
let done = false;
const cancel = () => { clearTimeout(timer); timer = null; };
const arm = () => {
if (done || timer) return;
timer = setTimeout(() => {
timer = null;
done = true;
const l = document.createElement('link');
l.rel = 'prefetch';
l.href = link.href;
document.head.appendChild(l);
warmHeroImage(this);
}, INTENT_MS);
};
this.addEventListener('pointerenter', arm, { signal });
this.addEventListener('pointerleave', cancel, { signal });
this.addEventListener('pointercancel', cancel, { signal });
link.addEventListener('focus', arm, { signal });
link.addEventListener('blur', cancel, { signal });
}
disconnectedCallback() { this.listening?.abort(); }
}
function warmHeroImage(card) {
if (!card.dataset.heroImage || (navigator.connection && navigator.connection.saveData)) return;
let hero;
try { hero = JSON.parse(card.dataset.heroImage); } catch { return; }
const chosen = (Array.isArray(hero.sources) ? hero.sources : []).find((s) => s && s.media && window.matchMedia(s.media).matches) || hero;
if (!chosen.srcset) return;
const img = new Image();
img.fetchPriority = 'low';
if (chosen.sizes) img.sizes = chosen.sizes;
img.srcset = chosen.srcset;
}
customElements.define('movelli-card', MovelliCard);
})();
(() => {
Object.assign(M1, { fallbackChain, isI18nValue, pickLocale });
function fallbackChain(locale, cfg) {
return [...new Set([locale, ...((cfg.fallback && cfg.fallback[locale]) || []), cfg.primary])];
}
function isI18nValue(v, cfg) {
if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
const keys = Object.keys(v);
return keys.length > 0 && keys.every((k) => cfg.locales.includes(k));
}
const present = (x) => x != null;
function pickLocale(value, locale, cfg) {
if (!isI18nValue(value, cfg)) {
if (value === '') return { value: undefined, usedLocale: null, blanked: true };
return present(value) ? { value, usedLocale: locale } : { value: undefined, usedLocale: null };
}
for (const loc of fallbackChain(locale, cfg)) {
if (!(loc in value)) continue;
if (value[loc] === null || value[loc] === undefined) continue;
if (value[loc] === '') return { value: undefined, usedLocale: null, blanked: true };
return { value: value[loc], usedLocale: loc };
}
return { value: undefined, usedLocale: null };
}
})();
(() => {
Object.assign(M2, { isPluralForms, pluralize });
const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'];
const categoriesFor = (locale) => new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
function isPluralForms(v) {
if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
const keys = Object.keys(v);
return keys.length > 0 && keys.every((k) => PLURAL_CATEGORIES.includes(k));
}
function pluralize(value, count, locale) {
if (!isPluralForms(value)) return value;
if (typeof count !== 'number' || !Number.isFinite(count)) {
throw new TypeError(`copy: pluralize needs a finite number, got ${typeof count} ${JSON.stringify(count)} `
+ '— Intl.PluralRules would silently answer "other" for it');
}
const category = new Intl.PluralRules(locale).select(count);
return value[category] ?? value.other;
}
Object.assign(M2, { PLURAL_CATEGORIES, categoriesFor });
})();
(() => {
const { pickLocale, isI18nValue } = M1;
const { PLURAL_CATEGORIES, categoriesFor, isPluralForms, pluralize } = M2;
Object.assign(M3, { makeCopy, fill, copyLinks, fillLinks, validateCopy });
function makeCopy(data, cfg) {
return function copy(key, locale = cfg.primary) {
const entry = data[key];
if (!entry) throw new Error(`copy: no such key "${key}" in site.copy.json`);
const { value } = pickLocale(entry.text, locale, cfg);
if (value === undefined) throw new Error(`copy: "${key}" has no value for "${locale}" or its fallbacks`);
if (isPluralForms(value)) {
throw new Error(`copy: "${key}" has plural forms — call pluralize(copy(key), count) with the count`);
}
return value;
};
}
function fill(text, ...values) {
if (HAS_LINK.test(text)) throw new Error(`copy: "${text}" holds a link token — turn it into a link first (copyHtml, generator/copy.js)`);
return text.replace(/\{%(\d+)%\}/g, (token, n) => {
if (!(n >= 1 && n <= values.length)) throw new Error(`copy: "${text}" wants ${token}, which was not given`);
return values[n - 1];
});
}
const LINK = '\\{%(\\d+)%\\}\\[\\s*"((?:[^"\\\\]|\\\\.)*)"\\s*,\\s*([^\\]\\s]+)\\s*\\]';
const HAS_LINK = /\{%\d+%\}\[/;
const TARGET = /^(?:\/(?!\/)\S*|https?:\/\/\S+|sponsor:[a-z0-9][a-z0-9-]*(?:\/[a-z0-9][a-z0-9-]*)?)$/;
function copyLinks(text) {
const out = [];
for (const m of String(text).matchAll(new RegExp(LINK, 'g'))) out.push({ n: Number(m[1]), text: m[2].replace(/\\(.)/g, '$1'), target: m[3], raw: m[0], at: m.index });
const heads = [...String(text).matchAll(/\{%\d+%\}\[/g)].length;
if (heads !== out.length) throw new Error(`copy: "${text}" has a link that is not {%N%}["link text", address]`);
for (const l of out) {
if (!l.text.trim()) throw new Error(`copy: "${text}" has a link with no text`);
if (!TARGET.test(l.target)) throw new Error(`copy: "${text}" links to "${l.target}", which is not a path on the site (/x/), a web address (https://…) or a sponsor (sponsor:id)`);
}
return out;
}
function fillLinks(text, make, between = (s) => s) {
let at = 0; let out = '';
for (const l of copyLinks(text)) { out += between(String(text).slice(at, l.at)) + make(l); at = l.at + l.raw.length; }
return out + between(String(text).slice(at));
}
const FIELDS = ['context', 'text'];
function validateCopy(data, cfg) {
const untranslated = [];
for (const [key, entry] of Object.entries(data)) {
if (!entry || typeof entry !== 'object') throw new Error(`site.copy.json: "${key}" is not an entry`);
if (!entry.context) throw new Error(`site.copy.json: "${key}" has no "context" — say where and how it is used`);
if (!('text' in entry)) throw new Error(`site.copy.json: "${key}" has no "text"`);
const stray = Object.keys(entry).filter((k) => !FIELDS.includes(k));
if (stray.length) {
throw new Error(`site.copy.json: "${key}" has ${stray.map((k) => `"${k}"`).join(', ')}, `
+ `which nothing reads. An entry is { ${FIELDS.join(', ')} }.`);
}
if (!isI18nValue(entry.text, cfg)) {
throw new Error(`site.copy.json: "${key}".text is not a translation object — every key must be `
+ `a declared locale (${cfg.locales.join(', ')}). A stray key here resolves to [object Object] `
+ `with nothing failing.`);
}
const primary = pickLocale(entry.text, cfg.primary, cfg);
if (primary.value === undefined) throw new Error(`site.copy.json: "${key}" has no "${cfg.primary}" value`);
for (const loc of cfg.locales) {
const value = entry.text[loc];
if (value === undefined || typeof value === 'string' || isPluralForms(value)) continue;
const stray = (value && typeof value === 'object' && !Array.isArray(value))
? Object.keys(value).filter((k) => !PLURAL_CATEGORIES.includes(k))
: [];
throw new Error(`site.copy.json: "${key}".text.${loc} is ${stray.length
? `an object keyed by ${stray.map((k) => `"${k}"`).join(', ')}` : `a ${typeof value}`}. `
+ `A locale holds a STRING, or PLURAL FORMS keyed by ${PLURAL_CATEGORIES.join('/')} — `
+ 'anything else resolves to [object Object] on the page with nothing failing here.');
}
for (const loc of cfg.locales) {
const value = entry.text[loc];
if (typeof value !== 'string' || !HAS_LINK.test(value)) continue;
let links;
try { links = copyLinks(value); } catch (e) { throw new Error(`site.copy.json: "${key}".text.${loc}: ${e.message}`); }
const plain = [...value.replace(new RegExp(LINK, 'g'), '').matchAll(/\{%(\d+)%\}/g)].map((m) => Number(m[1]));
const clash = links.map((l) => l.n).filter((n) => plain.includes(n));
if (clash.length) throw new Error(`site.copy.json: "${key}".text.${loc} uses {%${clash[0]}%} both as a link and as a placeholder a value fills`);
}
const pluralLocales = cfg.locales.filter((loc) => isPluralForms(entry.text[loc]));
if (pluralLocales.length) {
for (const loc of cfg.locales) {
const value = entry.text[loc];
if (value === undefined) continue;
if (!isPluralForms(value)) {
throw new Error(`site.copy.json: "${key}" has plural forms for `
+ `${pluralLocales.map((l) => `"${l}"`).join(', ')} but a plain string for "${loc}". `
+ 'A key either takes a count in every locale or in none.');
}
const allowed = categoriesFor(loc);
const wrong = Object.keys(value).filter((c) => !allowed.includes(c));
if (wrong.length) {
throw new Error(`site.copy.json: "${key}".text.${loc} declares `
+ `${wrong.map((c) => `"${c}"`).join(', ')}, which "${loc}" does not use. `
+ `Its categories are ${allowed.join(', ')}.`);
}
if (!('other' in value)) {
throw new Error(`site.copy.json: "${key}".text.${loc} has no "other" — `
+ 'every language has that category and it is the fallback when a count matches no other.');
}
}
}
for (const loc of cfg.locales) {
if (loc === cfg.primary) continue;
if (pickLocale(entry.text, loc, cfg).usedLocale !== loc) untranslated.push(`${key} (${loc})`);
}
}
return { untranslated };
}
Object.assign(M3, { PLURAL_CATEGORIES, isPluralForms, pluralize });
})();
(() => {
const { makeCopy, fill, pluralize: pick } = M3;
const DATA = {
"site_description": {
"text": {
"en-US": "Discover practical guides and comparisons for digital nomads. Compare top eSIMs, VPNs, borderless banking, and nomad insurance on Movelli."
}
},
"site_tagline": {
"text": {
"en-US": "Digital Nomad Guides, eSIMs & Remote Work Tech"
}
},
"chrome_skip_to_navigation": {
"text": {
"en-US": "Skip to navigation"
}
},
"chrome_skip_to_content": {
"text": {
"en-US": "Skip to main content"
}
},
"ai_component_error": {
"text": {
"en-US": "Something went wrong showing this part of my answer."
}
},
"ai_deadend_offer": {
"text": {
"en-US": "Sorry, I couldn’t find anything. I’d still like to help: shall I ask someone to get back to you?"
}
},
"ai_deadend_offer_yes": {
"text": {
"en-US": "Yes, please"
}
},
"ai_deadend_offer_no": {
"text": {
"en-US": "No, thanks"
}
},
"ai_deadend_declined": {
"text": {
"en-US": "No problem, I’m here if you have any other question."
}
},
"ai_deadend_form_intro": {
"text": {
"en-US": "Just your name and how to reach you, and we’ll come back to you."
}
},
"ai_results_intro": {
"text": {
"en-US": "Here’s what I found:"
}
},
"mcp_no_results": {
"text": {
"en-US": "Unfortunately I couldn’t find anything on Movelli."
}
},
"mcp_form_unavailable": {
"text": {
"en-US": "Sorry, this form is unavailable."
}
},
"mcp_form_submitted": {
"text": {
"en-US": "Thanks, we’ll be in touch shortly."
}
},
"assistant_input_landmark": {
"text": {
"en-US": "Assistant input"
}
},
"chrome_feed_title": {
"text": {
"en-US": "Movelli — latest guides"
}
},
"media_credit": {
"text": {
"en-US": "Photo: {%1%}"
}
},
"nav_menu_title": {
"text": {
"en-US": "Menu"
}
},
"nav_breadcrumb": {
"text": {
"en-US": "Breadcrumb"
}
},
"nav_breadcrumb_home": {
"text": {
"en-US": "Home"
}
},
"nav_primary_about": {
"text": {
"en-US": "About"
}
},
"nav_primary_privacy": {
"text": {
"en-US": "Privacy"
}
},
"assistant_input_placeholder": {
"text": {
"en-US": "Your message"
}
},
"assistant_input_submit": {
"text": {
"en-US": "Send your message"
}
},
"assistant_input_escape_hint": {
"text": {
"en-US": "Press Escape to close"
}
},
"assistant_input_enter_hint": {
"text": {
"en-US": "Press Enter to send"
}
},
"nav_back": {
"text": {
"en-US": "Back"
}
},
"page_affiliate_note": {
"text": {
"en-US": "We may earn a commission if you buy through certain links. See our {%1%}[\"affiliate disclosure\", /disclosure/]."
}
},
"footnote_back": {
"text": {
"en-US": "Back to the text"
}
},
"continue_segment_prefix": {
"text": {
"en-US": "Re:"
}
},
"continue_segment_dismiss": {
"text": {
"en-US": "Cancel reply"
}
},
"offline_intro": {
"text": {
"en-US": {
"one": "No connection right now. The page you've already opened is still available:",
"other": "No connection right now. The following {%1%} pages that you've already opened are still available:"
}
}
},
"offline_list_label": {
"text": {
"en-US": "Pages available offline"
}
},
"assistant_skip_to_input": {
"text": {
"en-US": "Skip to message field"
}
},
"assistant_dialog_title": {
"text": {
"en-US": "Assistant"
}
},
"chat_history_title": {
"text": {
"en-US": "Chat history"
}
},
"assistant_menu_title": {
"text": {
"en-US": "Assistant menu"
}
},
"assistant_menu_open": {
"text": {
"en-US": "Open assistant menu"
}
},
"assistant_menu_close": {
"text": {
"en-US": "Close assistant menu"
}
},
"chat_no_history": {
"text": {
"en-US": "No chat history yet."
}
},
"chat_clear_history": {
"text": {
"en-US": "Clear chat history"
}
},
"assistant_button": {
"text": {
"en-US": "Assistant"
}
},
"chat_close": {
"text": {
"en-US": "Close chat"
}
},
"chat_empty": {
"text": {
"en-US": "Nothing here yet — ask your question below."
}
},
"chat_thinking": {
"text": {
"en-US": "Thinking…"
}
},
"chat_continue": {
"text": {
"en-US": "Continue with this segment"
}
},
"chat_segment_fallback": {
"text": {
"en-US": "Chat"
}
},
"chat_unavailable": {
"text": {
"en-US": "The assistant isn't available right now."
}
},
"chat_history_cleared": {
"text": {
"en-US": "Chat history cleared"
}
},
"chat_history_undo": {
"text": {
"en-US": "Undo"
}
},
"comparison_scroll_hint": {
"text": {
"en-US": "comparison table, scroll horizontally"
}
},
"video_unavailable": {
"text": {
"en-US": "Video not available"
}
},
"form_error_required": {
"text": {
"en-US": "{%1%} is required"
}
},
"form_error_email": {
"text": {
"en-US": "a valid email is required"
}
},
"form_error_url": {
"text": {
"en-US": "a full web address (http:// or https://) is required"
}
},
"form_error_min": {
"text": {
"en-US": "must be {%1%} or more"
}
},
"form_error_max": {
"text": {
"en-US": "must be {%1%} or less"
}
},
"form_error_step_integer": {
"text": {
"en-US": "a whole number is required"
}
},
"form_error_step": {
"text": {
"en-US": "must be a multiple of {%1%}"
}
},
"form_error_minlength": {
"text": {
"en-US": {
"one": "must be at least {%1%} character",
"other": "must be at least {%1%} characters"
}
}
},
"form_error_maxlength": {
"text": {
"en-US": {
"one": "must be {%1%} character or fewer",
"other": "must be {%1%} characters or fewer"
}
}
},
"form_error_unreadable": {
"text": {
"en-US": "{%1%} is not a value we can read"
}
},
"form_error_pattern": {
"text": {
"en-US": "{%1%} is not in the format we expect"
}
},
"form_fallback_back": {
"text": {
"en-US": "← Back to Movelli"
}
},
"form_field_fallback": {
"text": {
"en-US": "This field"
}
},
"form_sending": {
"text": {
"en-US": "Sending…"
}
},
"form_submit_fallback": {
"text": {
"en-US": "Send"
}
},
"form_sent": {
"text": {
"en-US": "Thanks — your message is on its way. We reply to most within a few days."
}
},
"form_send_failed": {
"text": {
"en-US": "Sorry, that didn’t send. Please try again."
}
},
"form_error_generic": {
"text": {
"en-US": "{%1%} is not valid"
}
},
"form_error_number": {
"text": {
"en-US": "a number is required"
}
},
"form_error_datetime": {
"text": {
"en-US": "a date and time is required"
}
},
"form_error_datetime_real": {
"text": {
"en-US": "a real date and time is required"
}
},
"form_error_future": {
"text": {
"en-US": "please choose a time in the future"
}
},
"form_error_after": {
"text": {
"en-US": "must be {%1%} or later"
}
},
"form_error_before": {
"text": {
"en-US": "must be {%1%} or earlier"
}
},
"form_error_unexpected": {
"text": {
"en-US": "{%1%} has an unexpected value"
}
},
"form_error_empty": {
"text": {
"en-US": "the message is empty"
}
},
"form_fallback_ok_title": {
"text": {
"en-US": "Thanks — Movelli"
}
},
"form_fallback_ok_heading": {
"text": {
"en-US": "Thanks — message received"
}
},
"form_fallback_ok_body": {
"text": {
"en-US": "We read everything and reply to most messages within a few days."
}
},
"form_fallback_error_title": {
"text": {
"en-US": "Something went wrong — Movelli"
}
},
"form_fallback_error_heading": {
"text": {
"en-US": "That didn’t send"
}
},
"form_error_server": {
"text": {
"en-US": "Something went wrong on our side. Please try again."
}
},
"secondary_content_title": {
"text": {
"en-US": "Let us guide you"
}
},
"proactive_intro": {
"text": {
"en-US": "Here are some of the top guides about {%1%} that you can find on Movelli"
}
},
"proactive_intro_fallback": {
"text": {
"en-US": "Here are some of the top guides that you can find on Movelli"
}
},
"proactive_note": {
"text": {
"en-US": "You can use the assistant to ask or find anything else."
}
},
"proactive_landed_question": {
"text": {
"en-US": "Want to know what else you can find on Movelli?"
}
},
"proactive_landed_reply_1": {
"text": {
"en-US": "Yes, please"
}
},
"proactive_landed_reply_1_seed": {
"text": {
"en-US": "Happy to show you around."
}
},
"proactive_landed_reply_1_prompt": {
"text": {
"en-US": "What can I find on Movelli, and what can the Movelli Assistant do for me?"
}
},
"proactive_focused_question": {
"text": {
"en-US": "Do you have any questions about {%1%}?"
}
},
"proactive_focused_question_fallback": {
"text": {
"en-US": "Do you have any questions?"
}
},
"proactive_focused_reply_1": {
"text": {
"en-US": "Yes, I have a question"
}
},
"proactive_focused_reply_1_seed": {
"text": {
"en-US": "Welcome. You've been reading about {%1%} — ask me anything about it, or about anything else on Movelli."
}
},
"proactive_focused_reply_1_seed_fallback": {
"text": {
"en-US": "Welcome. Ask me anything about Movelli, or about what you're looking for."
}
},
"proactive_exploring_question": {
"text": {
"en-US": "Is {%1%} what you're looking for or are you not sure yet?"
}
},
"proactive_exploring_question_fallback": {
"text": {
"en-US": "Is this what you're looking for or are you not sure yet?"
}
},
"proactive_exploring_reply_1": {
"text": {
"en-US": "Yes, I'm interested in {%1%}"
}
},
"proactive_exploring_reply_1_fallback": {
"text": {
"en-US": "Yes, this page is what I'm looking for"
}
},
"proactive_exploring_reply_1_seed": {
"text": {
"en-US": "Good — let's look at {%1%}."
}
},
"proactive_exploring_reply_1_seed_fallback": {
"text": {
"en-US": "Good — let's find what you're looking for."
}
},
"proactive_exploring_reply_1_prompt": {
"text": {
"en-US": "I'm interested in {%1%}. Tell me how you can help me find more about it, and that I can ask you anything else."
}
},
"proactive_exploring_reply_1_prompt_fallback": {
"text": {
"en-US": "Tell me how you can help me find what I'm looking for, and that I can ask you anything else."
}
},
"proactive_exploring_reply_2": {
"text": {
"en-US": "I'm not sure yet"
}
},
"proactive_exploring_reply_2_seed": {
"text": {
"en-US": "No problem — let's work out what you need."
}
},
"proactive_exploring_reply_2_prompt": {
"text": {
"en-US": "Tell me briefly what Movelli is about, then ask me one question to work out what I'm looking for."
}
},
"proactive_changed_answer": {
"text": {
"en-US": "I've changed my mind: {%1%}"
}
},
"proactive_changed_answer_context": {
"text": {
"en-US": "Earlier on this page they answered \"{%1%}\" to the same question, and they have now changed their answer to \"{%2%}\". Acknowledge the change briefly and do not repeat what you already told them."
}
},
"proactive_exploring_reply_3": {
"text": {
"en-US": "I'm just looking around"
}
},
"proactive_exploring_reply_3_seed": {
"text": {
"en-US": "Of course. Here's what Movelli covers."
}
},
"proactive_exploring_reply_3_prompt": {
"text": {
"en-US": "Tell me briefly what Movelli is about, and end by saying I can use you to navigate or ask anything."
}
},
"chat_replies_group": {
"text": {
"en-US": "Suggested replies"
}
},
"reply_options_group": {
"text": {
"en-US": "Replies"
}
}
};
const CFG = {"locales":["en-US","en-GB"],"primary":"en-US","fallback":{}};
const locale = (typeof document !== 'undefined' && document.documentElement.lang) || CFG.primary;
const lookup = makeCopy(DATA, CFG);
const copy = (key, loc = locale) => lookup(key, loc);
const pluralize = (value, count, loc = locale) => pick(value, count, loc);
const copyForms = (key, loc = locale) => {
const entry = DATA[key];
if (!entry) throw new Error(`copy: no such key "${key}" in site.copy.json`);
return entry.text[loc] ?? entry.text[CFG.primary];
};
Object.assign(M4, { copy, pluralize, copyForms, fill });
})();
(() => {
const { copy } = M4;
const HINT = copy('comparison_scroll_hint');
class MovelliCompare extends HTMLElement {
connectedCallback() {
this.box = this.querySelector('.comparison-table__body');
if (!this.box) return;
if (window.ResizeObserver) {
this.ro = new ResizeObserver(() => this.sync());
this.ro.observe(this.box);
} else {
requestAnimationFrame(() => this.sync());
}
}
disconnectedCallback() {
this.ro?.disconnect();
this.ro = null;
}
sync() {
const box = this.box;
if (!box) return;
if (box.scrollWidth > box.clientWidth + 1) {
box.setAttribute('tabindex', '0');
box.setAttribute('role', 'region');
const caption = this.querySelector('caption');
box.setAttribute('aria-label', `${caption ? caption.textContent.trim() + ' — ' : ''}${HINT}`);
return;
}
if (box.contains(document.activeElement)) return;
box.removeAttribute('tabindex');
box.removeAttribute('role');
box.removeAttribute('aria-label');
}
}
customElements.define('movelli-comparison-table', MovelliCompare);
})();
(() => {
Object.assign(M6, { loadWhenNear });
function loadWhenNear(video, signal) {
const later = video.querySelectorAll('source[data-src]');
if (!later.length) return;
const load = () => {
for (const s of later) { s.src = s.dataset.src; s.removeAttribute('data-src'); }
video.load();
video.play().catch(() => {});
};
if (!('IntersectionObserver' in window)) return load();
const watch = new IntersectionObserver((entries) => {
if (!entries.some((e) => e.isIntersecting)) return;
watch.disconnect();
load();
}, { rootMargin: '100% 0px' });
watch.observe(video);
signal.addEventListener('abort', () => watch.disconnect());
}
})();
(() => {
const { copy } = M4;
const { loadWhenNear } = M6;
const LABEL = copy('video_unavailable');
class MovelliVideo extends HTMLElement {
connectedCallback() {
this.video = this.querySelector('video');
if (!this.video) return;
this.listening?.abort();
this.listening = new AbortController();
const { signal } = this.listening;
const fail = () => this.setUnavailable(true);
this.video.addEventListener('error', fail, { signal });
for (const s of this.video.querySelectorAll('source')) s.addEventListener('error', fail, { signal });
window.addEventListener('offline', () => this.setUnavailable(true), { signal });
window.addEventListener('online', () => this.setUnavailable(false), { signal });
if (!navigator.onLine) this.setUnavailable(true);
loadWhenNear(this.video, signal);
}
disconnectedCallback() { this.listening?.abort(); }
setUnavailable(on) {
const frame = this.querySelector('.video__frame');
if (!frame || this.unavailable === on) return;
this.unavailable = on;
frame.classList.toggle('video__frame--unavailable', on);
if (!on) { this.note?.remove(); this.note = null; return; }
const poster = this.video.getAttribute('poster');
if (poster) frame.style.setProperty('--video-poster', `url('${poster.replace(/'/g, '%27')}')`);
this.note = document.createElement('p');
this.note.className = 'video__unavailable';
this.note.textContent = LABEL;
frame.append(this.note);
}
}
customElements.define('movelli-video', MovelliVideo);
})();
(() => {
const { loadWhenNear } = M6;
class MovelliBanner extends HTMLElement {
connectedCallback() {
const video = this.querySelector('video');
if (!video) return;
this.listening?.abort();
this.listening = new AbortController();
loadWhenNear(video, this.listening.signal);
}
disconnectedCallback() { this.listening?.abort(); }
}
customElements.define('movelli-banner', MovelliBanner);
})();
(() => {
const tags = ["movelli-chat-segment-title","movelli-prose","movelli-intro","movelli-card","movelli-heading","movelli-more-link","movelli-chat-turn","movelli-chat-thinking","movelli-chat-divider","movelli-chat-continue","movelli-chat-replies","movelli-reply-options","movelli-status-message","movelli-note","movelli-footnotes","movelli-banner","movelli-page-title","movelli-byline","movelli-props","movelli-toc","movelli-overview-table","movelli-cta","movelli-callout","movelli-code-block","movelli-quote","movelli-list","movelli-comparison-table","movelli-faq","movelli-video","movelli-figure","movelli-one-column","movelli-button-row","movelli-wide","movelli-two-column","movelli-two-thirds-left","movelli-two-thirds-right","movelli-full-width","movelli-page-head","movelli-card-grid","movelli-slider","movelli-suggestions","movelli-page-head-centered"];
Object.assign(M9, { tags });
})();
(() => {
const { tags } = M9;
class MovelliBlock extends HTMLElement {}
for (const tag of tags) {
if (!customElements.get(tag)) customElements.define(tag, class extends MovelliBlock {});
}
})();
(() => {
Object.assign(M11, { setBackend, read, write, remove, clearAll, list });
const KEYS = {
log: { key: 'movelli:log', kind: 'json' },
conversation: { key: 'movelli:conversation', kind: 'json' },
visits: { key: 'movelli:visits', kind: 'json', cap: 20 },
proactiveAnswer: { key: 'movelli:proactive-answer', kind: 'json', cap: 20 },
fromChat: { key: 'movelli:from-chat', kind: 'text' },
draft: { key: 'movelli:draft', kind: 'text' },
};
let backend;
function setBackend(b) { backend = b; }
function storage() {
if (backend !== undefined) return backend;
try { return typeof sessionStorage === 'undefined' ? null : sessionStorage; } catch { return null; }
}
function def(name) {
const d = KEYS[name];
if (!d) throw new Error(`store: unknown key "${name}" — declare it in KEYS`);
return d;
}
function read(name, fallback = null) {
const d = def(name);
const s = storage();
if (!s) return fallback;
let raw;
try { raw = s.getItem(d.key); } catch { return fallback; }
if (raw == null) return fallback;
if (d.kind === 'text') return raw;
try { const v = JSON.parse(raw); return v == null ? fallback : v; } catch { return fallback; }
}
function write(name, value) {
const d = def(name);
const stored = (d.cap && Array.isArray(value) && value.length > d.cap)
? value.slice(value.length - d.cap)
: value;
const s = storage();
if (!s) return stored;
try { s.setItem(d.key, d.kind === 'text' ? String(stored) : JSON.stringify(stored)); } catch { }
return stored;
}
function remove(name) {
const s = storage();
if (!s) return;
try { s.removeItem(def(name).key); } catch { }
}
function clearAll() {
for (const name of Object.keys(KEYS)) remove(name);
}
function list() {
const s = storage();
return Object.entries(KEYS).map(([name, d]) => {
let raw = null;
try { raw = s ? s.getItem(d.key) : null; } catch { }
return { name, key: d.key, bytes: raw ? raw.length : 0 };
});
}
Object.assign(M11, { KEYS });
})();
(() => {
Object.assign(M12, { computeUserType });
function computeUserType(visits, currentCategory) {
const list = Array.isArray(visits) ? visits : [];
if (list.length <= 1) return 'landed';
const cats = new Set(list.map((v) => v && v.category).filter(Boolean));
if (cats.size >= 2) return 'exploring';
if (currentCategory && cats.has(currentCategory)) return 'focused';
return 'exploring';
}
})();
(() => {
const store = M11;
const { computeUserType } = M12;
Object.assign(M13, { getVisits, record, userType });
function getVisits() { return store.read('visits', []); }
function record(url, category) {
if (!url) return;
const v = getVisits();
if (v.length && v[v.length - 1].url === url) return;
v.push({ url, category: category || null });
store.write('visits', v);
}
function userType() {
const cat = document.querySelector('[data-page]')?.dataset.category || null;
return computeUserType(getVisits(), cat);
}
if (typeof document !== 'undefined') {
const page = document.querySelector('[data-page]');
if (page) record(page.dataset.url || location.pathname, page.dataset.category || null);
}
})();
(() => {
const backBtn = () => document.getElementById('nav-back');
const standalone = () =>
window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
function canGoBack() {
if (!standalone()) return false;
if (window.navigation && typeof window.navigation.canGoBack === 'boolean') return window.navigation.canGoBack;
return history.length > 1;
}
function arm() {
const back = backBtn();
if (back) back.hidden = !canGoBack();
}
function init() {
backBtn()?.addEventListener('click', () => history.back());
arm();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
})();
(() => {
const closeEveryDialog = () => {
document.querySelector('movelli-assistant')?.close({ moveFocus: false, keepHistory: true });
document.querySelectorAll('dialog').forEach((d) => { if (!d.closest('movelli-assistant')) d.close(); });
};
document.getElementById('skip-to-content')?.addEventListener('click', closeEveryDialog);
document.getElementById('skip-to-navigation')?.addEventListener('click', closeEveryDialog);
})();
(() => {
if ('serviceWorker' in navigator) {
window.addEventListener('load', () => {
navigator.serviceWorker.register('/sw.js')
.then(cacheThisPage)
.catch(() => { });
});
}
async function cacheThisPage() {
if (!('caches' in window) || !document.querySelector('[data-page]')) return;
try {
await navigator.serviceWorker.ready;
if (!navigator.serviceWorker.controller) {
await new Promise((resolve) => {
const done = () => resolve();
navigator.serviceWorker.addEventListener('controllerchange', done, { once: true });
setTimeout(done, 3000);
});
}
if (!navigator.serviceWorker.controller) return;
const names = (await caches.keys()).filter((n) => n.startsWith('movelli-pages-'));
for (const n of names) if (await (await caches.open(n)).match(location.href)) return;
await fetch(location.href, { headers: { 'X-Requested-With': 'movelli-app' } });
} catch { }
}
})();
export const modules = { "copy-data.mjs": M4, "store.mjs": M11, "visits.js": M13 };
