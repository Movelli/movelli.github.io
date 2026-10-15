const M0 = {};
const M1 = {};
const M2 = {};
(() => {
Object.assign(M0, { fallbackChain, isI18nValue, pickLocale });
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
Object.assign(M1, { isPluralForms, pluralize });
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
Object.assign(M1, { PLURAL_CATEGORIES, categoriesFor });
})();
(() => {
const { pickLocale, isI18nValue } = M0;
const { PLURAL_CATEGORIES, categoriesFor, isPluralForms, pluralize } = M1;
Object.assign(M2, { makeCopy, fill, copyLinks, fillLinks, validateCopy });
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
Object.assign(M2, { PLURAL_CATEGORIES, isPluralForms, pluralize });
})();
export const { makeCopy, fill, copyLinks, fillLinks, validateCopy, PLURAL_CATEGORIES, isPluralForms, pluralize } = M2;
