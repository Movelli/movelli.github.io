/**
 * THE COMPONENT AND RESOLVED-PAGE CHECKS — everything `renderComponent` can answer on its own.
 *
 * [decided 2026-09-03, owner] The checks split into THREE groups, each its own file and each ONE
 * call. Two of them are here, because they are true of a component HOWEVER it was built and so must
 * run at the one point every path passes through:
 *
 *   · COMPONENT — one instance on its own: the type exists, every key is declared, an enum CONFIG
 *     value is one its declaration lists, its `classes` are plain class names (2026-10-06), `anchor` is
 *     a valid id, no `media:`/`sponsor:` ref survived unexpanded.
 *   · PAGE, RESOLVED — the parent/child rules answerable only once the components are built: a child
 *     its container has not been designed with.
 *
 * A page's LAYOUTS and their slots are checked by the build (`source/checks-layouts.mjs`): only pages
 * have them.
 *
 * [hard] WHY THE FIELD CHECKS ARE NOT HERE, though the decision listed them. `required`, an invalid
 * enum and an unresolvable ref are all LOCALE-DEPENDENT: they fail the build on the primary locale
 * and fall back quietly on a secondary one. A renderer has no locale — it is handed one resolved
 * config — so those stay in the resolver beside the transforms that produce them. What IS here is
 * everything that does not depend on which locale is being built.
 * [owner 2026-09-27] …WHICH IS WHY AN ENUM IN `config` IS CHECKED HERE AFTER ALL. The locale argument
 * is about CONTENT: a content enum is a token that resolves to a per-locale LABEL, so it stays in
 * the resolver. A config value is never per-locale — it is passed through verbatim — and until now
 * nothing checked it anywhere, so a value renamed in the catalog but not in the data (`wide` →
 * `md`) rendered a class nothing styles, silently. Brought forward from the recorded engine todo
 * *A DECLARED `type` IS NOT ENFORCED*, for the layout work's renames.
 *
 * [hard] IT RUNS IN FOUR RUNTIMES, so it lives beside the catalog rather than in `generator/`: the
 * Node build, the browser, the Cloud Function and the MCP apps all reach `renderComponent`.
 */

/** An id must be lowercase, start with a letter, and not collide with the sprite's own prefixes. */
const ID = /^[a-z][a-z0-9-]*$/;
const SPRITE_PREFIX = /^(icon|logo)-/;

/**
 * [owner 2026-10-06] A CUSTOM CLASS — what `classes` may hold, on a component (below) and on a layout
 * (`source/checks-layouts.mjs`): a plain class name, letters, digits, `-` and `_`, starting with a letter. So
 * a value cannot leave the class attribute, start a second class or carry markup — and it is escaped at
 * emission all the same. One answer for both, so the two cannot drift. `''` when the list is good.
 */
export const CLASS_NAME = /^[A-Za-z][A-Za-z0-9_-]*$/;
/**
 * [owner 2026-10-08] A CLASS THE SITE OWNS CANNOT BE AN INSTANCE'S OWN: the shared look and state classes (`component`, `sr-only`, `js-only`,
 * `assistant-only`, `is-underlined`, `btn`, `chip`, `icon`, …), any option class (`component-variant--…`, `layout-variant--…`), and the class of any
 * component or layout — its own name, and its parts and presets (`card`, `card__body`, `card--index`). `classes: ["sr-only"]` would hide the
 * instance from sight; `["card"]` would restyle it as a card. `ownNames` is the component keys (and, for a layout, the layout names too).
 */
export const SHARED_CLASSES = ['component', 'component__body', 'component__title', 'sr-only', 'js-only', 'assistant-only', 'is-underlined',
  'btn', 'btn--secondary', 'chip', 'icon', 'toast'];
const baseOf = (key) => String(key).split('--')[0];
export const reservedClass = (name, ownNames = []) => SHARED_CLASSES.includes(name) || /^(component|layout)-variant--/.test(name)
  || ownNames.some((k) => { const b = baseOf(k); return name === b || name.startsWith(`${b}__`) || name.startsWith(`${b}--`); });

export function classesProblem(classes, ownNames = null) {
  if (!Array.isArray(classes)) return `classes is a list of class names, like ["my-class"] — got ${JSON.stringify(classes)}`;
  const wrong = classes.filter((c) => typeof c !== 'string' || !CLASS_NAME.test(c));
  if (wrong.length) {
    return `classes holds ${wrong.map((c) => JSON.stringify(c)).join(', ')} — a class name is letters, digits, "-" and "_", starting with a letter`;
  }
  // A list names each class once, as a variant list does — one twice is the same class written twice.
  if (new Set(classes).size !== classes.length) return `classes names ${JSON.stringify(classes)} — each class once`;
  // Reserved names (see `reservedClass`) — checked where the catalog's names are known.
  if (ownNames) {
    const taken = classes.filter((c) => reservedClass(c, ownNames));
    if (taken.length) return `classes holds ${taken.map((c) => JSON.stringify(c)).join(', ')} — a class the site owns (a shared class, an option class, or a component's or layout's own); pick a name of your own`;
  }
  return '';
}

/** `__path` is the authoring path the resolver attaches so an error can name the instance. */
/**
 * Where a config came from, for an error message. The resolver puts the authoring path on each
 * instance it builds (`page:about#3`), so a build error can point at a file; a config the AI or a
 * listing composed at runtime has none, and says so rather than pointing at nothing.
 *
 * Exported so the other check files use the same wording — and because the MCP app concatenates
 * this folder into one scope, where two `const at` would be a SyntaxError.
 */
export const atPath = (c) => (c && c.__path ? ` at ${c.__path}` : ' (a config built at runtime)');

/** Keys every component carries, whatever it declares. [2026-09-27] `width` left this list with the
 *  retired width presets: nothing read it. A MEDIA field still brings its pixel `width` — below.
 *  [2026-10-05] `children` left it with the last component that took any (the slider, a layout now). */
const UNIVERSAL = new Set(['type', '__path']);

/**
 * Two field types do not resolve to a VALUE — they EXPAND, and the resolver assigns the extra keys
 * onto the config beside the field. So a component declaring one `image` arrives carrying six keys
 * it never declared, and one declaring an `href` can arrive carrying two more.
 *
 * They are allowed only where the component actually declares a field of that type, so this stays a
 * consequence of the declaration rather than a general escape hatch.
 */
const EXPANDS = {
  media: ['src', 'srcset', 'sizes', 'width', 'height', 'alt'],
  // The sponsor registry decides the disclosure, so `rel`/`target` travel with the URL.
  link: ['rel', 'target'],
};
function expansionKeys(comp) {
  const out = [];
  for (const bucket of [comp.config, comp.content]) {
    for (const def of Object.values(bucket || {})) {
      if (def && EXPANDS[def.type]) out.push(...EXPANDS[def.type]);
    }
  }
  return out;
}

/**
 * [hard] REQUIRED MEANS PRESENT AND NOT EMPTY — AND "EMPTY" DEPENDS ON THE TYPE. [owner 2026-10-08] It moved here from
 * `generator/resolve-page.js` (`isEmptyFor`, which took the declaration) so every runtime that makes a component can ask it, and
 * it takes the TYPE: `hasValue(value, type)`.
 *
 * It is NOT "not falsy": `0` is a perfectly good number and `false` a perfectly good boolean. For a field that holds a STRING,
 * `''` is empty, exactly as an empty string does not satisfy a required form field; so are `[]` and `{}`.
 */
export function hasValue(value, type) {
  if (value === undefined || value === null) return false;
  if (type === 'number' || type === 'integer' || type === 'boolean') return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return value !== '';
}

/**
 * [owner 2026-10-08] A `config` VALUE MUST BE OF ITS DECLARED TYPE — the other half of the one config check (with `required`, below).
 * Until now only an ENUM was checked, so an entry could say `object[]` and be given anything. Each declared type of a config key
 * has its test here; an enum is checked beside it, with its values. `''` when the value is good.
 */
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const TYPE_TESTS = {
  string: [(v) => typeof v === 'string', 'a string'],
  text: [(v) => typeof v === 'string', 'text'],
  url: [(v) => typeof v === 'string', 'a URL (a string)'],
  boolean: [(v) => typeof v === 'boolean', 'true or false'],
  number: [(v) => typeof v === 'number' && Number.isFinite(v), 'a number'],
  integer: [(v) => Number.isInteger(v), 'a whole number'],
  object: [isPlainObject, 'an object'],
  list: [Array.isArray, 'a list'],
  'string[]': [(v) => Array.isArray(v) && v.every((x) => typeof x === 'string'), 'a list of strings'],
  'object[]': [(v) => Array.isArray(v) && v.every(isPlainObject), 'a list of objects'],
};
function typeProblem(value, type) {
  const test = Object.hasOwn(TYPE_TESTS, type) ? TYPE_TESTS[type] : null;
  return test && !test[0](value) ? test[1] : '';
}

export function checkComponent(config, catalog) {
  // Own keys only: `constructor` or `toString` is not a component because every object inherits one.
  const comp = Object.hasOwn(catalog, String(config.type)) ? catalog[config.type] : null;
  if (!comp) throw new Error(`unknown component "${config.type}"${atPath(config)}`);

  // `slots` only where the entry declares slots — the components inside a component
  // (`docs/record/layout-sections-2026.md` § 5), checked below.
  const declared = new Set([...UNIVERSAL,
    ...Object.keys(comp.config || {}), ...Object.keys(comp.content || {}),
    ...expansionKeys(comp), ...(comp.slots ? ['slots'] : [])]);
  const unknown = Object.keys(config).filter((k) => !declared.has(k));
  if (unknown.length) {
    throw new Error(`"${config.type}"${atPath(config)} sets keys the catalog does not declare: `
      + `${unknown.join(', ')} — it declares ${[...declared].sort().join(', ')}`);
  }
  // An enum CONFIG value must be one the declaration lists — see the header for why here, and why
  // only config. Strict equality: `level: 2` and `level: '2'` are different values.
  // [owner 2026-09-30] `enum[]` is a LIST of them — `utility` is the first — and every item is checked.
  for (const [k, def] of Object.entries(comp.config || {})) {
    if (!def || !['enum', 'enum[]'].includes(def.type) || config[k] == null) continue;
    const values = def.values || [];
    const given = def.type === 'enum[]' ? (Array.isArray(config[k]) ? config[k] : [config[k]]) : [config[k]];
    const wrong = given.filter((v) => !values.includes(v));
    // [2026-10-04] A list names each value once — a repeated variant would write its class twice.
    if (def.type === 'enum[]' && Array.isArray(config[k]) && new Set(config[k]).size !== config[k].length) {
      throw new Error(`"${config.type}"${atPath(config)} sets ${k} to ${JSON.stringify(config[k])} — each value once`);
    }
    if (wrong.length || (def.type === 'enum[]' && !Array.isArray(config[k]))) {
      throw new Error(`"${config.type}"${atPath(config)} sets ${k} to ${JSON.stringify(config[k])}, which its `
        + `declaration does not list — it takes ${def.type === 'enum[]' ? 'a list of ' : ''}${values.map((v) => JSON.stringify(v)).join(', ')}`);
    }
  }
  // [owner 2026-10-08] THE ONE CONFIG CHECK: every key a config sets is of its declared type, and every key the declaration marks
  // `required` has a value. (An enum was the only type checked, above; and `required` in `config` was enforced on the record path
  // only — a card authored with no `url` shipped a link to nowhere.) A config is never per-locale, so it is checked here.
  for (const [k, def] of Object.entries(comp.config || {})) {
    if (!def) continue;
    if (config[k] != null && k !== 'classes' && !['enum', 'enum[]'].includes(def.type)) {   // `classes` has its own message, below
      const wanted = typeProblem(config[k], def.type);
      if (wanted) throw new Error(`"${config.type}"${atPath(config)} sets ${k} to ${JSON.stringify(config[k])}, but its declaration is ${def.type} — it takes ${wanted}`);
    }
    if (def.required && !hasValue(config[k], def.type)) {
      throw new Error(`"${config.type}"${atPath(config)} is missing its required config ${k}`);
    }
  }
  // [owner 2026-10-06] Custom classes: plain class names only (`CLASS_NAME`, above). Every component declares
  // `classes` (the processor adds it), so the key check above already let it through.
  if (config.classes != null) {
    const problem = classesProblem(config.classes, Object.keys(catalog));
    if (problem) throw new Error(`"${config.type}"${atPath(config)}: ${problem}`);
  }
  if (config.slots != null) checkSlots(config, comp, catalog);
  if (config.anchor != null && !(ID.test(config.anchor) && !SPRITE_PREFIX.test(config.anchor))) {
    throw new Error(`"${config.type}"${atPath(config)} has an invalid anchor "${config.anchor}" — `
      + 'lowercase, starting with a letter, and not an icon-/logo- prefix');
  }
  // A ref that reached the renderer never resolved: a dead image, or a commercial link with no
  // sponsored disclosure. Both are worse than a build error.
  for (const [k, v] of Object.entries(config)) {
    if (typeof v === 'string' && /^(media|sponsor):/.test(v)) {
      throw new Error(`"${config.type}"${atPath(config)} ships an unexpanded ref in \`${k}\`: ${v}`);
    }
  }
}

/**
 * A component's SLOTS: each one the entry declares, each ONE stack `{ components }` — and — [hard]
 * ONE LEVEL — no component inside a slot has slots of its own, so everything that reads content walks
 * a fixed depth. Checked here, not only in the resolver, because a config with slots can be built in
 * code in any of the four runtimes. [2026-10-02] A list in the banner's slot was accepted, walked
 * into the table of contents, the region's name and the text `/ask` reads — and never rendered.
 * [owner 2026-10-04] A slot that declared `list: true` could be a list of stacks, for a carousel's
 * slides; nothing declared one, and it went: there is no carousel, and it was mistaken for a role.
 */
function checkSlots(config, comp, catalog) {
  const slots = config.slots;
  if (!slots || typeof slots !== 'object' || Array.isArray(slots)) {
    throw new Error(`"${config.type}"${atPath(config)} has slots that are not an object of named slots`);
  }
  for (const [name, slot] of Object.entries(slots)) {
    if (!Object.hasOwn(comp.slots || {}, name)) {
      throw new Error(`"${config.type}"${atPath(config)} fills a slot "${name}" it does not declare`);
    }
    if (!slot || Array.isArray(slot) || !Array.isArray(slot.components)) {
      throw new Error(`"${config.type}"${atPath(config)}: slot "${name}" is one { components: [ … ] }`);
    }
    for (const k of slot.components) {
      if (k && (catalog[k.type] || {}).slots) {
        throw new Error(`"${k.type}"${atPath(k)} has slots of its own — a component with slots cannot go into a slot`);
      }
      // [owner 2026-10-08] NO IMAGE INSIDE A COMPONENT'S SLOT. The banner declares no slot widths, so no width is known to size an
      // image there to (its `sizes` hint) or to run the fit check against — and the owner will never put one there, so it is
      // refused outright rather than given a wrong hint in silence. An image component is one that declares `widths.media`.
      if (k && ((catalog[k.type] || {}).widths || {}).media) {
        throw new Error(`"${k.type}"${atPath(k)} is an image component, and slot "${name}" of "${config.type}" declares no width — no width is known to size its image to`);
      }
    }
  }
}
