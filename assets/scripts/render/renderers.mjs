/**
 * The component catalog + render-from-config engine — the single source of truth
 * for the shared web-component library, used by BOTH sides:
 *   • the Node build (`require('…/renderers.mjs')` — Node 24 require(ESM)) renders
 *     page + AI-chat content to static HTML;
 *   • the browser (`import`) renders AI-generated / dynamic chat content.
 * One renderer → the page and the AI chat emit byte-identical markup; nothing can
 * drift (this replaces the hand-built card DOM that used to live in input.js).
 *
 * `renderComponent(config)` takes an already-RESOLVED, flat config object (never a
 * Firestore item — resolution stays upstream in the build / the AI) and returns an
 * HTML string. The catalog describes each component's purpose + configurable
 * attributes; later slices feed it to the LLM as the agent's output schema.
 *
 * Zero-dep, pure, isomorphic (no DOM, no Node APIs).
 */

// [owner 2026-09-07] IT IMPORTS THE CATALOG; IT DOES NOT RE-EXPORT IT. Ten consumers used to reach
// the catalog THROUGH the renderer — `resolve-page.js` took `catalog` from here and `baseName` from
// `catalog.mjs`, two files for two halves of one thing. One door: `catalog/catalog.mjs`.
import { baseName } from '../catalog/catalog.mjs';
import { esc } from '../catalog/esc.mjs';
import { prepareComponent } from '../catalog/prepare.mjs';
// A numeric attribute (width/height) emitted RAW would let a non-numeric value break out of the
// attribute (`1"><script>…`). Coerce to a positive integer at the emission boundary — `null` if it
// isn't one, so the attribute is omitted. Defence-in-depth alongside the resolver's number coercion.
const dim = (v) => { const n = Math.trunc(Number(v)); return Number.isFinite(n) && n > 0 ? n : null; };
// `fetchpriority`, omitted at its default. `auto` IS the browser's behaviour, so emitting it says
// nothing and only adds noise to every img on the site — the attribute earns its place only when it
// overrides. Shared so `figure` and `banner` cannot drift on the same standard attribute.
const priority = (v) => (v === 'high' || v === 'low' ? ` fetchpriority="${v}"` : '');

/**
 * The described catalog — per component: what it's for + which attributes are configurable. The
 * agent (later slices) reads this to know what it may emit.
 *
 * Each entry carries, in descending order of generality:
 *   · `purpose`      — WHAT the component is for, in one line. Which component to reach for.
 *   · `instructions` — [owner 2026-08-22] optional. HOW to configure it without falling into a trap,
 *                      where the trap belongs to no single attribute: a rule that spans several of
 *                      them, or a consequence of the HTML underneath. Attribute-specific notes stay
 *                      on the attribute's own `description`, which is the level below this.
 *   · `ai`           — `{ emit, purpose }`, and ONLY where what it renders can be grounded in
 *                      retrieved data. This is the chat AI's menu: the function derives it from its
 *                      own generated catalog (`componentMenu`), and collectAiComponents() writes a
 *                      reference copy to data/ai-components-menu.json.
 *   · `config` / `content` — the per-field schemas, each field with its own `description`.
 *
 * [gap, recorded] `purpose` and `instructions` have NO RUNTIME CONSUMER yet. The chat AI is served
 * by `ai`; the CMS agent — the one that would author a page template — is told nothing about the
 * components: the blocked-draft guard checks an item's component names against the function's own
 * catalog, so it can avoid inventing a component but cannot configure one. See the CMS-AI todo in
 * docs/record/interface.md (TELL THE CMS AGENT WHAT THE COMPONENTS ARE).
 */
/**
 * [hard, owner 2026-09-22] A COMPONENT EMITS NOTHING ABOUT ITS WIDTH. `data-width` and the three
 * presets behind it are deleted: the container decides the box, the component fills it and adjusts
 * its insides with a CONTAINER query. The only width a component may own is a `max-width` in its
 * own CSS, for when it is used standalone. See `docs/record/interface.md`.
 */




/**
 * A component's OWN heading. Every block-level component may carry one, and they all come through
 * here so that a heading is identical wherever it appears.
 *
 * WHY one helper rather than each renderer writing its own <h2>: three things have to agree and used
 * not to. The LEVEL (form/faq/callout/banner each hardcoded h2, pros-cons h3), the escaping contract
 * (`title` is CONTENT — sanitized upstream, emitted verbatim — while `anchor` is CONFIG and is
 * esc()'d here at the boundary), and the ANCHOR: a component may declare `anchor` to opt into the
 * table of contents, and nothing checked that it then actually emitted an element with that id. A
 * ToC entry pointing at an id nobody rendered is a dead link that no test can see. Routing every
 * heading through one function makes that structural instead of remembered.
 *
 * It replaces the `block-heading` COMPONENT, which was a heading standing beside the thing it
 * introduced rather than belonging to it.
 */
/** Everything that goes on a component's ROOT element, in one place.
 *
 *  [hard, owner 2026-08-26] EVERY COMPONENT ROOT CARRIES `component`. It is what makes a custom
 *  element a block box — one is INLINE by default — and it replaced a hand-kept list of `movelli-*`
 *  tags in the stylesheet, which is exactly the kind of list that gets forgotten: it had already
 *  gone stale twice (it still named `movelli-proscons`, deleted with the pros-cons decomposition,
 *  and was missing four live components). A class every root gets by construction cannot go stale,
 *  and its ABSENCE is easy to test for.
 *
 *  It also OWNS the class attribute, so a renderer cannot emit a second one. That has bitten:
 *  `class="layout" class="layout-width--md"` shipped once and the parser kept only the first, silently
 *  dropping the width preset.
 */
const rootAttrs = (c, ...classes) => {
  // [owner 2026-09-30] `utility`: the site's utility classes a template may put on a component
  // (`js-only`, `assistant-only`), declared per component like `id` and `hidden`. Config, so it is
  // escaped here at emission; the catalog lists the values, and the check refuses any other.
  const utility = c && Array.isArray(c.utility) ? c.utility.map((u) => esc(u)) : [];
  // [owner 2026-10-04] A component's VARIANTS: one generic class per name, `component-variant--<name>`,
  // on the root — the component's own CSS names itself with it. Config, so escaped here; the check
  // refused a name the catalog does not declare already. No variant renders nothing.
  const variants = c && Array.isArray(c.variant) ? c.variant.map((v) => `component-variant--${esc(v)}`) : [];
  // [owner 2026-10-06] Its CUSTOM classes, `classes`, last: the instance's own, set by a template or a page.
  // Config, so escaped here; the check refused anything but a plain class name already.
  const custom = c && Array.isArray(c.classes) ? c.classes.map((x) => esc(x)) : [];
  const cls = ['component', ...classes.filter(Boolean), ...variants, ...utility, ...custom]
    .filter(Boolean).join(' ');
  // [2026-09-17] `id` and `hidden` join `role` here, and for the same reason it is a mechanism
  // rather than a hardcoded attribute: both are declared PER COMPONENT in the catalog, so a
  // component that has no use for them cannot be given one, and widening the set later is a catalog
  // change rather than a renderer change. `hidden` is a BOOLEAN attribute — it is emitted bare or
  // not at all, never `hidden="false"`, which the HTML parser reads as hidden.
  return ` class="${cls}"${c && c.id ? ` id="${esc(c.id)}"` : ''}`
    + `${c && c.role ? ` role="${esc(c.role)}"` : ''}${c && c.hidden ? ' hidden' : ''}`
    ;
};

/**
 * [owner 2026-09-28] A TEXT COMPONENT'S OWN BOX — `<key>__body`, inside the root, around what the
 * component says (the layout work, step 28). The root fills the width its container gives it; this
 * box is what a text component's own line length will cap and what is placed across the width, so it
 * is always a separate element, even around a single paragraph. A component's title stays OUTSIDE
 * it, as on the tables, the video and the figure. One function, so the nine that use it cannot
 * spell the box nine ways.
 * [2026-10-03] Where the box sits is each component's own rule. Most read `--slot-body-margin-inline`
 * (`0 auto` by default, `auto` in a `page-head-centered` layout); the chat segment title's box is
 * always centred by its own rule.
 */
const textBody = (key, inner) => `<div class="${key}__body component__body">${inner}</div>`;
/* [owner 2026-10-04] A variant is no longer a class on this box (`<key>__body--{value}`, the spacing
   spec's S6): it is `component-variant--<name>` on the root, written by `rootAttrs`. */


/** [owner 2026-10-05] A heading's level, 2–6 — every component with an h2–h6 heading has the option — or the
 *  component's own default when it is unset. */
const headingLevel = (level, fallback) => ([2, 3, 4, 5, 6].includes(Number(level)) ? Number(level) : fallback);

export function componentTitle(c, defaultLevel = 2, box = '') {
  if (!c.title) return '';
  const level = headingLevel(c.level, defaultLevel);
  const id = c.anchor ? ` id="${esc(c.anchor)}"` : '';
  // [owner 2026-08-23] A CLASS, so a rule can address "a component's own heading" without naming five
  // tags — and without a negative selector, which is what `.callout > :not(h2)` was: correct only
  // while `level` happened to be 2, and silently wrong for the four other values the config allows.
  // [2026-10-05] `box`: the heading component's title IS its own box, `heading__body`, so it carries that class too.
  return `<h${level} class="${box ? `${box} ` : ''}component__title"${id}>${c.title}</h${level}>`;
}

export function renderComponent(input) {
  // Defaults + both checks. They are `prepareComponent` rather than three lines here because the
  // CLOUD FUNCTION runs exactly this much and then stops: it returns component CONFIGURATION, which
  // the client renders, so it has no use for what follows — but it must answer the same rules, and
  // it must answer them before it replies rather than in the visitor's browser.
  const config = prepareComponent(input);
  if (!config) return '';
  // DISPATCH ON THE BASE COMPONENT. A preset is emittable in its own right, so a config can arrive
  // as `card--index` — and rendering is a property of the COMPONENT, not of the configuration,
  // so every preset of `card` renders exactly as `card` does. That is why there is no entry
  // per preset here, and why the class and element name come out right for free.
  switch (baseName(config.type)) {
    case 'chat-segment-title': return renderChatSegmentTitle(config);
    case 'status-message': return renderStatusMessage(config);
    case 'note': return renderNote(config);
    case 'footnotes': return renderFootnotes(config);

    case 'page-title':  return renderPageTitle(config);
    case 'byline':      return renderByline(config);
    case 'props': return renderProps(config);
    case 'toc': return renderToc(config);
    case 'overview-table': return renderOverviewTable(config);
    case 'cta': return renderCta(config);
    case 'banner': return renderBanner(config);
    case 'callout': return renderCallout(config);
    case 'quote': return renderQuote(config);
    case 'code-block': return renderCodeBlock(config);
    case 'list': return renderList(config);
    case 'comparison-table': return renderComparison(config);
    case 'faq': return renderFaq(config);
    case 'video': return renderVideo(config);
    case 'prose': return renderProse(config);
    case 'intro': return renderIntro(config);
    case 'card':  return renderCard(config);
    case 'heading': return renderHeadingComponent(config);
    case 'more-link': return renderMoreLink(config);
    case 'related-pages': return renderRelatedPages(config);
    case 'chat-turn': return renderChatTurn(config);
    case 'chat-thinking': return renderChatThinking(config);
    case 'chat-divider': return renderChatDivider(config);
    case 'chat-continue': return renderChatContinue(config);
    case 'chat-replies': return renderReplies(config);
    case 'reply-options': return renderReplyOptions(config);
    case 'form':  return renderForm(config);
    case 'figure': return renderFigure(config);
    // Unreachable for an unknown type — `checkComponent` refuses that above. What DOES reach here
    // is a component the catalog declares and no renderer handles, which is a different mistake and
    // worth its own message.
    default: throw new Error(`the catalog declares "${config.type}" but no renderer handles it`);
  }
}

/** A lead/quote/contact form, pre-rendered to accessible semantic HTML (works with no JS via
 *  native POST). `c = { name, action, submitLabel, fields:[{name,label,type,required,options?}] }`.
 *  `<movelli-form>` enhances submit; the page-form path (render-blocks) resolves to this too. */
function renderForm(c) {
  // [owner 2026-10-08] A FORM'S NAME AND EVERY LABEL ARE REQUIRED — nothing stands in for a missing one (the field's `name`, an option's `value`, a form called `contact`).
  const named = (v, what) => { if (v == null || v === '') throw new Error(`form "${c.name}": ${what} has no label`); return v; };
  // [owner 2026-10-06] A FIELD'S id CARRIES ITS FORM'S NAME: `f-<form>-<field>`. It was `f-<field>`, so
  // two forms on one page with a field of the same name rendered one id twice, which the build refuses —
  // /test/'s banner form had to call its field `signup-email`. It is `email` again, beside the demo form's
  // `email`, so the build's own duplicate-id check proves this on a real page. A form's name is unique on
  // the site (generator/forms.js refuses a second), so its fields' ids are unique on any page that holds
  // it. Every id built from a field follows: `f-contact-email-help`, `f-contact-email-error`
  // (movelli-form) and `f-contact-reply-0` for an option.
  const formName = c.name;
  if (!formName) throw new Error('form has no name');
  const fieldId = (name) => `f-${formName}-${name}`;
  const autoOf = (f) => f.autocomplete
    || (f.name === 'name' ? 'name' : f.name === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'off');
  const val = (f) => (f.value != null ? ` value="${esc(f.value)}"` : ''); // prefill only when present (byte-parity)
  // The element's OWN standard attributes, emitted when the author declares one. CONFIG, so escaped
  // (nothing upstream sanitizes them). `min: "now"` is deliberately skipped — see below.
  const BOOLEAN_ATTR = ['readonly', 'multiple', 'disabled'];
  const std = (f, names) => names.map((n) => {
    const v = f[n];
    if (v == null || v === '' || v === false) return '';
    // The sentinel travels as a data- attribute so movelli-form knows to resolve it; as a literal
    // `min` the browser would reject every value against the string "now".
    if (n === 'min' && v === 'now') return ' data-min="now"';
    // A boolean attribute's presence IS its value — `readonly="false"` reads as TRUE in HTML.
    if (BOOLEAN_ATTR.includes(n)) return ` ${n}`;
    return ` ${n}="${esc(v)}"`;
  }).join('');
  // [hard] A STATIC SITE CANNOT BAKE "TODAY" INTO `min`. The page is generated at build time and
  // only regenerated on publish, so a literal min="2026-08-22T00:00" states the BUILD date and rots
  // — a form asking for a future appointment would happily accept last month. `min: "now"` is
  // therefore a sentinel: movelli-form resolves it to a real min at load (the UX half) and
  // forms-core enforces it independently (the correctness half, and the JS-off half). One slot, one
  // concept: a lower bound that is either fixed or relative.
  // WHICH OF ITS OWN ATTRIBUTES EACH TYPE ACCEPTS. A component covers the attributes the ELEMENT
  // defines — not a Swiss army knife, but not making a client ask for the one we skipped either.
  // Per type rather than one list, because most of these are silently INERT on the wrong control:
  // `pattern` does nothing on a number, `placeholder` nothing on a select or a date, `maxlength`
  // nothing on a checkbox. Emitting them anyway would be markup that looks like it does something.
  // `disabled` is missing here on purpose — it applies to every control, so it is emitted below.
  const BOUNDS = ['min', 'max', 'step'];
  const TEXT_ENTRY = ['placeholder', 'inputmode', 'pattern', 'minlength', 'maxlength', 'readonly'];
  const STD = {
    text: TEXT_ENTRY,
    tel: TEXT_ENTRY,
    url: TEXT_ENTRY,
    email: TEXT_ENTRY.concat('multiple'),                 // several addresses in one field
    textarea: ['placeholder', 'inputmode', 'minlength', 'maxlength', 'readonly'],
    number: ['placeholder', 'inputmode', 'readonly'].concat(BOUNDS),
    'datetime-local': ['readonly'].concat(BOUNDS),
    select: ['multiple', 'size'],   // `size` = how many rows a multiple shows
    radio: [], checkbox: [], hidden: [],
  };
  const control = (f) => {
    const attrs = `id="${esc(fieldId(f.name))}" name="${esc(f.name)}"${f.required ? ' required' : ''}`
      + `${f.disabled ? ' disabled' : ''} autocomplete="${esc(autoOf(f))}"${describedBy(f)}`
      + std(f, STD[f.type] || []);
    if (f.type === 'textarea') return `<textarea ${attrs} rows="${f.rows || 5}">${esc(f.value || '')}</textarea>`;
    if (f.type === 'select') {
      // An option may nest ONE level — that is an <optgroup>, a labelled band inside the list. Only
      // one: optgroups do not nest in HTML either.
      const option = (o) => {
        const v = typeof o === 'string' ? o : o.value;
        return `<option value="${esc(v)}">${esc(typeof o === 'string' ? o : named(o.label, `an option of "${f.name}"`))}</option>`;
      };
      const opts = (f.options || []).map((o) => (o && Array.isArray(o.options)
        ? `<optgroup label="${esc(named(o.label, `an option group of "${f.name}"`))}">${o.options.map(option).join('')}</optgroup>`
        : option(o))).join('');
      // A MULTIPLE select gets no "Choose…" row: it has no closed state for a placeholder to label,
      // and the row would sit in the list as a permanently-disabled option taking up a line.
      //
      // [owner 2026-08-22] `disabled` ONLY WHEN THE FIELD IS REQUIRED. A plain <select> selects its
      // first option automatically (the spec's "ask for a reset" step, for any select whose display
      // size is 1), so a dropdown ALWAYS has a value and whatever happens to be first becomes a
      // silent default. The empty option is the only way a dropdown can represent "no answer" — and
      // `disabled` does not prevent that state, it makes it one you can LEAVE but never return to.
      // On a required field that is coherent: the option exists to force a deliberate choice, and
      // `required` is what fails validation on the empty value. On an OPTIONAL field there is
      // nothing to protect, so a visitor who picks by mistake is stuck with no way back but a reload.
      //
      // [owner] THE COPY STAYS "Choose…" IN BOTH CASES. A wording like "Any" is a CHOICE — it says
      // "I have no preference" — and if a form wants to offer that, it belongs in the list as a real
      // option. "Choose…" says no choice has been made yet, which is the state the control starts in
      // and, when it is optional, the state it can go back to.
      //
      // `selected` is load-bearing next to `disabled`: a disabled first option with no explicit
      // `selected` is SKIPPED, and the browser selects the first enabled one instead.
      const placeholder = f.multiple ? ''
        : `<option value=""${f.required ? ' disabled' : ''} selected>Choose…</option>`;
      return `<select ${attrs}>${placeholder}${opts}</select>`;
    }
    return `<input ${attrs} type="${esc(f.type || 'text')}"${val(f)}>`;
  };
  // ── CHECKABLES ─────────────────────────────────────────────────────────────────────────────────
  // A radio is ALWAYS a group; a checkbox is a group when it carries `options` and a standalone
  // yes/no when it does not (consent, opt-in). Three shapes, one field type each.
  //
  // [hard] A GROUP IS A <fieldset> WITH A <legend>, not a <label> and some inputs. The legend is the
  // group's accessible name — without it a screen reader announces each option with no idea what
  // question it answers, which is the whole point of the grouping.
  //
  // [hard] THE TICK IS A SIBLING <svg>, NOT A PSEUDO-ELEMENT. `::after` on an appearance:none input
  // renders in Chrome and Safari but is not valid per spec (an input has no content model) and has
  // historically not rendered in Firefox — and this could not be tested here. A sibling from the
  // sprite we already ship is standards-clean, reuses `#icon-check`, and takes its colour from a
  // token rather than a hardcoded fill inside a data-URI (the trap the `<select>` chevron records).
  // The radio needs no mark at all: its selected state is pure CSS.
  /**
   * [hard] `required` MEANS DIFFERENT THINGS ON A RADIO AND A CHECKBOX, so it cannot be emitted the
   * same way. On a RADIO it is a property of the GROUP — the browser reads it from any member and
   * demands that one of them be chosen — so every member carries it. On a CHECKBOX it is a property
   * of THAT BOX ("you must tick this one"), which is right for a standalone consent box and wrong
   * for a group, where it would demand every option. HTML has no native "at least one of these", so
   * a required checkbox GROUP is enforced by movelli-form and forms-core instead.
   *
   * Before this, `f.required && !opt` meant a required radio group emitted the attribute NOWHERE, so
   * the browser never enforced it and a JS-off submission reached the server to be refused there.
   */
  const req = (f, opt) => {
    if (!f.required) return '';
    if (opt == null) return ' required';                        // a standalone checkbox
    return f.type === 'radio' ? ' required' : '';               // every radio in the group; never a checkbox group
  };
  const checkable = (f, opt, i) => {
    const id = `${esc(fieldId(f.name))}${opt ? `-${i}` : ''}`;
    const v = opt == null ? (f.value != null ? f.value : 'yes') : (typeof opt === 'string' ? opt : opt.value);
    const label = opt == null ? named(f.label, `field "${f.name}"`) : (typeof opt === 'string' ? opt : named(opt.label, `an option of "${f.name}"`));
    return `<div class="form__option">
        <span class="form__control">
          <input type="${esc(f.type)}" id="${id}" name="${esc(f.name)}" value="${esc(v)}"${req(f, opt)}${f.disabled ? ' disabled' : ''}>
          ${f.type === 'checkbox' ? '<svg class="form__check-mark" aria-hidden="true"><use href="#icon-check"/></svg>' : ''}
        </span>
        <label for="${id}">${esc(label)}</label>
      </div>`;
  };
  const groupLegend = (f) => `<legend>${esc(named(f.label, `field "${f.name}"`))}`
    + `${f.required ? ' <span class="form__required" aria-hidden="true">*</span>' : ''}</legend>`;
  // A required CHECKBOX group means "at least one", which HTML cannot express (see `req` above), so
  // the requirement is carried as data for movelli-form to enforce — forms-core already does the
  // server half. Without this the client and the server would disagree about the same field.
  const groupRequired = (f) => (f.required && f.type === 'checkbox' ? ' data-required="true"' : '');
  // [2026-10-06] `--options` names this kind of group, a radio group and a checkbox group alike: both
  // are options to pick from, drawn here. The stylesheet and movelli-form select it by that class; they
  // selected it as "a group that is not `--fields`" before, which a third kind of group would also match.
  const group = (f) => `<fieldset class="form__field form__group form__group--options"${groupRequired(f)}${describedBy(f)}>
      ${groupLegend(f)}${help(f)}
      ${(f.options || []).map((o, i) => checkable(f, o, i)).join('\n      ')}
    </fieldset>`;

  // Hidden fields (e.g. the handoff's captured question) render as bare inputs, no label/wrapper.
  const hidden = (c.fields || []).filter((f) => f.type === 'hidden')
    .map((f) => `<input type="hidden" name="${esc(f.name)}"${val(f)}>`).join('\n    ');
  // HELP TEXT. Wired with aria-describedby rather than sat next to the label, so a screen reader
  // reads it AS PART OF the field instead of as loose prose the user has to hunt for. The id is
  // derived from the name, and movelli-form APPENDS an error id to the same attribute rather than
  // replacing it — a field can have both, and losing the help while showing an error would be worse
  // than either alone.
  // [hard] `help` is the ONE string in the fields CONFIG that may carry MARKUP, so it is emitted
  // VERBATIM while everything around it is esc()'d. A help line very often needs a link ("see our
  // Privacy policy"), and there is nowhere else to put one. It obeys the ordinary contract by being
  // treated as CONTENT: whoever builds the config sanitizes it to `inline` — the page resolver and
  // forms.js `normalize` (the manifest, which feeds the chat and ChatGPT) both do, via one shared
  // helper so a form cannot render differently in the three places.
  // A FIELDSET has a label and no name, so `f.name` alone produced `f-undefined-help` — harmless
  // while one exists (the id and the aria-describedby derive from the same call, so they matched)
  // and a duplicate id the moment a second group carried help. Named fields are untouched: the
  // slug is only reached for the nameless case.
  const slug = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
  const helpId = (f) => `${fieldId(f.name || slug(f.label))}-help`;
  const help = (f) => (f.help ? `\n      <p class="form__help" id="${esc(helpId(f))}">${f.help}</p>` : '');
  const describedBy = (f) => (f.help ? ` aria-describedby="${esc(helpId(f))}"` : '');
  const one = (f) => {
    if (f.type === 'radio' || (f.type === 'checkbox' && Array.isArray(f.options))) return group(f);
    // A standalone checkbox has its text to the RIGHT, so it does not use the stacked label/control
    // shape the text inputs share.
    if (f.type === 'checkbox') return `<div class="form__field">${checkable(f)}${help(f)}</div>`;
    return `<div class="form__field">
      <label for="${esc(fieldId(f.name))}">${esc(named(f.label, `field "${f.name}"`))}${f.required ? ' <span class="form__required" aria-hidden="true">*</span>' : ''}</label>${help(f)}
      ${control(f)}
    </div>`;
  };
  // ── A FIELDSET AROUND ORDINARY FIELDS ──────────────────────────────────────────────────────────
  // FLAT, with an `isChild` marker rather than nesting a `fields` array (page templates had the same
  // marker until 2026-10-02; only a form's fields keep it): a `fieldset` entry opens a group and the
  // entries marked `isChild` after it belong to it. Nesting was the obvious alternative and is
  // worse for the recorded reason — flat keeps every consumer walking ONE list, so forms-core's
  // validation, the MCP inputSchema and the manifest need no recursion and a field inside a group
  // can never go silently missing from any of them. They skip the marker; only the renderer groups.
  // An orphan `isChild` or an empty fieldset fails the build (generator/forms.js), because
  // convention is doing the work structure would otherwise do.
  const shown = (c.fields || []).filter((f) => f.type !== 'hidden');
  const rows = [];
  let open = null;
  for (const f of shown) {
    if (f.type === 'fieldset') { open = { set: f, children: [] }; rows.push(open); continue; }
    if (f.isChild && open) open.children.push(f);
    else { open = null; rows.push({ field: f }); }   // a non-child CLOSES the group
  }
  const fields = rows.map((r) => (r.field ? one(r.field) : `<fieldset class="form__field form__group form__group--fields"${describedBy(r.set)}>
      ${groupLegend(r.set)}${help(r.set)}
      ${r.children.map(one).join('\n      ')}
    </fieldset>`)).join('\n    ');
  // Only when there ARE required fields — a form without any must not claim otherwise. The asterisk
  // itself is aria-hidden and the control carries `required`, so assistive tech already knows; this
  // note is the SIGHTED reader's version of that information, which is why it can sit at the end.
  // [owner 2026-08-23] `.form__note`, not `.form__legend` — it is not a <legend> and never was, and
  // the form now has two real ones (a field group's and a checkable group's) for that name to be
  // confused with. Nothing else used the class.
  const note = shown.some((f) => f.required)
    ? `\n    <p class="form__note">Fields marked <span class="form__required" aria-hidden="true">*</span> are required.</p>`
    : '';
  // Inside the <form>, not above it: a form is one thing, and its heading belongs to it the way the
  // faq's and the callout's do. `title` is CONTENT — sanitized upstream — so it is emitted verbatim.
  const title = c.title ? `\n    ${componentTitle(c)}` : '';
  // A FORM-level help line — the same thing a field and a field group can carry, one level up: what
  // this form is for, or what happens to the answers. It sits OUTSIDE `.form__fields` so the stack's
  // gap does not apply to it, and describes the <form> itself. Its id is `form-` prefixed rather
  // than `f-` so it can never collide with a field's id: `f-contact-help` is the id of a field called
  // `help` in the contact form (2026-10-06, since a field's id carries its form's name).
  const formHelpId = `form-${slug(formName)}-help`;
  const formHelp = c.help ? `\n    <p class="form__help form__help--form" id="${esc(formHelpId)}">${c.help}</p>` : '';
  return `<movelli-form${rootAttrs(c, 'form')}>
  <form class="form__body component__body" method="post" action="${esc(c.action || '')}"${c.help ? ` aria-describedby="${esc(formHelpId)}"` : ''}>${title}${formHelp}
    <input type="hidden" name="_form" value="${esc(formName)}">
    <div class="form__hp" aria-hidden="true"><label>Leave this field empty<input name="_gotcha" tabindex="-1" autocomplete="off"></label></div>
    <div class="form__fields">
    ${hidden ? hidden + '\n    ' : ''}${fields}
    <button type="submit" class="btn">${esc(c.submitLabel || 'Send')}</button>${note}
    </div>
  </form>
</movelli-form>`;
}

/** An image figure, pre-rendered to accessible semantic HTML (works with no JS). `c = { src, alt,
 *  caption, credit, srcset, sizes, width, height, loading }`. The AI emits it grounded on a
 *  retrieved item's image (the server resolves `src`/`alt`); the page-figure path (render-blocks)
 *  resolves to this too — ONE renderer, byte-identical. */
function renderFigure(c) {
  const loading = c.loading || 'lazy';
  const srcset = c.srcset ? ` srcset="${esc(c.srcset)}"` : '';
  // `sizes="auto"` lets a LAZY image select its srcset candidate from its real rendered width (layout
  // is known by the time a lazy image loads) — more accurate than a hand-written media-query guess. It
  // REQUIRES loading="lazy" and only matters with a srcset; unsupported browsers ignore the `auto`
  // token and use the resolved fallback list, so we keep that as the tail. `auto` must come first.
  // [owner 2026-10-04] The build writes `sizes` from where the figure sits (`image-widths.mjs`); the
  // figure only adds `auto` in front.
  let sizesVal = c.sizes || '';
  if (loading === 'lazy' && c.srcset && !/^auto\b/.test(sizesVal)) sizesVal = sizesVal ? `auto, ${sizesVal}` : 'auto';
  const sizes = sizesVal ? ` sizes="${esc(sizesVal)}"` : '';
  const w = dim(c.width), h = dim(c.height);
  const wh = `${w ? ` width="${w}"` : ''}${h ? ` height="${h}"` : ''}`;
  // caption/credit/alt are CONTENT (verbatim — and `alt` is why 'none' sanitizing must be
  // attribute-safe); src/srcset are resolver-built URLs and sizes the build's hint, escaped at the boundary as always.
  const figcaption = (c.caption || c.credit)
    ? `\n    <figcaption>${c.caption || ''}${c.credit ? ` <span class="figure__credit">${c.credit}</span>` : ''}</figcaption>`
    : '';
  // The image's own shape, for the stylesheet's cap on how tall the figure may be (`widths.maxHeight`): a number the build coerced, never text.
  const ratio = w && h ? ` style="--figure-ratio: ${+(w / h).toFixed(4)}"` : '';
  return `<movelli-figure${rootAttrs(c, 'figure')}>${componentTitle(c)}<figure class="figure__body component__body"${ratio}>
    <img src="${esc(c.src)}"${srcset}${sizes}${wh} alt="${c.alt || ''}" loading="${esc(loading)}"${priority(c.fetchpriority)} decoding="async">${figcaption}
  </figure></movelli-figure>`;
}

/** Suggested-reply chips on the opener — one tap = a query submitted as CONTINUE (the assistant input
 *  wires `.chat-reply` clicks). Items are `{ text }` objects or plain strings. */
/**
 * ONE TURN in the conversation — the visitor's own message. The thinking state is its own component,
 * `chat-thinking` (renderChatThinking), since 2026-10-04.
 *
 * [owner 2026-08-03] ONLY THE VISITOR'S TURN IS A BUBBLE. The AI's reply renders exactly as page
 * content does, with no wrapper and no label, so the one side that stands out is the visitor's own
 * words — and with one half in a bubble and the other not, a caption saying which is which is
 * redundant furniture.
 *
 * A <p>, not a bare text node: the AI's half of the exchange is a real paragraph inside
 * movelli-prose, so a loose text node made the two different kinds of thing, and it takes no
 * paragraph styling at all.
 */
function renderChatTurn(c) {
  return `<movelli-chat-turn${rootAttrs(c, 'chat-turn')}>${textBody('chat-turn', `<p>${esc(c.text || '')}</p>`)}</movelli-chat-turn>`;
}

/** The thinking state while the answer is on its way. [owner 2026-10-04] Split from `chat-turn`.
 *  It is announced ONCE — `role=status` plus a visually-hidden label, so a screen reader hears
 *  "Thinking…" rather than spelling out three dots. */
function renderChatThinking(c) {
  const body = `<span class="sr-only">${esc(c.text || '')}</span>`
    + '<span class="chat-thinking__dot" aria-hidden="true"></span>'.repeat(3);
  return `<movelli-chat-thinking${rootAttrs(c, 'chat-thinking')} role="status">${textBody('chat-thinking', body)}</movelli-chat-thinking>`;
}

/** The line between two conversation segments. The <hr> keeps its role=separator, so the component
 *  is the WRAPPER — the same rule every component follows where the TAG carries meaning. */
function renderChatDivider(c) {
  return `<movelli-chat-divider${rootAttrs(c, 'chat-divider')}>`
    + '<hr class="chat-divider__body component__body"></movelli-chat-divider>';
}

/**
 * "Continue with this segment" — at the foot of an ended segment.
 *
 * [hard] THE COMPONENT WRAPS THE BUTTON, it does not replace it. Setting `type = 'button'` on a
 * custom element sets a property that means nothing: the element had no button role, was not
 * focusable, could not be activated from the keyboard, and got the text cursor rather than the
 * pointer — which is how it was noticed. Where the TAG carries meaning, keep it and wrap it.
 */
function renderChatContinue(c) {
  return `<movelli-chat-continue${rootAttrs(c, 'chat-continue')}${c.segment ? ` data-title="${esc(c.segment)}"` : ''}>`
    + '<button type="button" class="chat-continue__btn">'
    + '<svg class="icon" aria-hidden="true"><use href="#icon-reply"/></svg>'
    + `${esc(c.label || '')}</button></movelli-chat-continue>`;
}

/**
 * ONE CHIP IN THE CHAT. Its LABEL IS THE QUERY — pressing it sends exactly the words on it, which is
 * what a chip in a transcript has always meant. `{ text }` is the same thing named.
 *
 * [hard, owner 2026-09-24] IT NO LONGER TAKES `{ label, state }`. That shape belonged to the
 * OPENER's entry chips, which are `reply-options` now — a separate component with separate code and
 * no shared CSS, because *"behaviour is going to be different"*. One component serving both had
 * already gone wrong twice: deleting the delegated handler killed these chips, and before that
 * `engage()` ran on every turn so a chip pressed HERE collapsed the opener's row on another surface.
 */
function replyChip(text) {
  return `<button type="button" class="chat-reply chip">${esc(text)}</button>`;   // [owner 2026-10-08] a plain string, as the catalog declares (it took `{ text }` too)
}

/**
 * THE OPENER'S REPLY OPTIONS — a row of ready-made answers to the question above them.
 *
 * [hard, owner 2026-09-24] A DIFFERENT COMPONENT FROM `chat-replies`, ON PURPOSE. They look alike
 * and behave differently: these hand a `state` object to `assistant.start()` and mark the one that
 * was chosen (never disabled — owner, 2026-09-26); the chat's send their own label as a query and do
 * none of that. *"If the chips might look the same they most likely won't behave the same."*
 *
 * [hard] `state` NEVER REACHES THE MARKUP. It rides in the CONFIG, and whoever renders the component
 * keeps it — `proactive.js` lifts it into a variable at bind time. A `data-` attribute would be a
 * round trip with nothing at either end, and it is what let a delegated handler reach in.
 *
 * [hard] `.chip` IS THE SHARED LOOK AND NOTHING ELSE. It is ADDITIONAL to the component's own class,
 * never a replacement, and NO SCRIPT MAY SELECT IT — a handler binds on `.reply-options__option`, so
 * a styling decision never starts deciding behaviour. A longer-reply variant simply drops it. See
 * the guard in a11y.test.js.
 *
 * The leading glyph is kept (owner): the labels do not stand alone — *"Yes, please"* needs the
 * question above it — so the icon links the two, and it previews the chat the visitor is about to
 * see.
 */
function renderReplyOptions(c) {
  const options = (c.items || []).map((r) => {
    const o = typeof r === 'string' ? { label: r } : r;
    return `<button type="button" class="reply-options__option chip">${esc(o.label)}</button>`;
  }).join('\n        ');
  return `<movelli-reply-options${rootAttrs(c, 'reply-options')}>
      <div class="reply-options__list" role="group"${c.label ? ` aria-label="${esc(c.label)}"` : ''}>
        <svg class="icon reply-options__icon" aria-hidden="true"><use href="#icon-prompt-suggestion"/></svg>
        ${options}
      </div>
    </movelli-reply-options>`;
}

function renderReplies(c) {
  const btns = (c.items || []).map(replyChip).join('\n        ');
  // NO note under the chips. "You can also just type" is guidance about the SURFACE, not about this
  // component, so the container owns it — which is what lets the suggestions aside show a note when it has no
  // chips at all (it could not, while the note lived here) and swap it once the visitor has replied.
  // In the CHAT VIEW, where the AI also emits these, no note is wanted: the visitor is already in
  // the conversation with the input in front of them, and one under every chip row would repeat down
  // the log. See `setNote` in proactive.js.
  // ONE root element: renderComponent consumers take `firstElementChild` (renderElement), so a
  // component that returned siblings would silently lose all but the first.
  // Material's "prompt_suggestion" glyph leads the row: a chip click SENDS its own text as the
  // query, which is a suggested prompt rather than a reply. (The "Continue with this segment" link
  // keeps the reply icon — it sets a target and you write the message yourself.) Decorative: the
  // group already carries an accessible name, and the chips say what they do.
  // The OUTER element is the component; the class stays on it, so every `.chat-replies` rule is
  // untouched. (Renaming the tag rather than adding a wrapper — the CSS keys on the class.)
  return `<movelli-chat-replies${rootAttrs(c, 'chat-replies')}>
      <div class="chat-replies__chips" role="group"${c.label ? ` aria-label="${esc(c.label)}"` : ''}>
        <svg class="icon chat-replies__icon" aria-hidden="true"><use href="#icon-prompt-suggestion"/></svg>
        ${btns}
      </div>
    </movelli-chat-replies>`;
}

function renderChatSegmentTitle(c) {
  // h3, not h2: this heading sits INSIDE a surface that already has one — the aside's own label and
  // the chat dialog's `#assistant-dialog-title` are both h2, so an h2 here would be their sibling
  // rather than their child, and a screen reader browsing by heading would read a flat list where
  // there is a real hierarchy.
  // Wrapped in <movelli-chat-segment-title> like every other component: a direct child of a content
  // flow is ALWAYS a movelli-* element (asserted in build.test.js). This one and `replies` were the
  // two renderers that forgot theirs.
  // [owner 2026-08-28] The heading is not `__body component__body`: `__body` is the component's own BOX — the thing a max-width caps and
  // the thing that holds the component's parts — and a heading with nothing but text inside it is neither. [owner 2026-10-08] It is
  // `chat-segment-title__heading`, the component convention (`<key>__part`); it was `-h` until then, the last name on the site that
  // spelled "heading" that way. No script reads this class: the assistant reads the public element `movelli-chat-segment-title`.
  // [owner 2026-09-28] The heading is still not the `__body`: the box is a separate element around it
  // (step 28), which is what its line length acts on; the box is centred.
  const h = `h${headingLevel(c.level, 3)}`;
  return `<movelli-chat-segment-title${rootAttrs(c, 'chat-segment-title')}>${textBody('chat-segment-title', `<${h} class="chat-segment-title__heading">${esc(c.text)}</${h}>`)}</movelli-chat-segment-title>`;
}

/**
 * A small secondary line. `html` is for the one case that carries a link (the affiliate disclosure,
 * built by page-renderer.js); `text` is escaped for everything else. The <p> stays a <p> — the tag carries
 * the meaning — so the component is the WRAPPER, exactly as block-heading does it.
 */
/**
 * A system status message — see the catalog entry for why it is not a note and not prose. The <p> is
 * the renderer's, so the content is one statement and cannot smuggle in page structure.
 */
function renderStatusMessage(c) {
  return `<movelli-status-message${rootAttrs(c, 'status-message')}>${textBody('status-message', `<p>${c.html != null ? c.html : esc(c.text)}</p>`)}</movelli-status-message>`;
}

/**
 * [owner 2026-10-10] The footnotes of an article, a component the author places in the stack. The page renderer fills it from the page's report, so each item is the
 * footnote's own text, already resolved; the number is the item's place. A back link returns to the sentence (`ref-<n>`), and `role="list"`
 * is restated because the list has no marker, which some screen readers take for no list.
 */
function renderFootnotes(c) {
  const back = esc(c.backLabel || '');
  const items = (c.items || []).map((it, i) => `<li class="footnotes__item" id="note-${i + 1}" role="doc-endnote"><sup>${i + 1}</sup>${it.html}<a class="footnotes__back" href="#ref-${i + 1}" role="doc-backlink" aria-label="${back}" title="${back}">↩</a></li>`).join('\n      ');
  // With no items it is an EMPTY element: the page renderer finds it there, then fills it or removes it (`generator/page-renderer.js`).
  return items ? `<movelli-footnotes${rootAttrs(c, 'footnotes')}><ol class="footnotes__body component__body" role="list">
      ${items}
    </ol></movelli-footnotes>` : `<movelli-footnotes${rootAttrs(c, 'footnotes')}></movelli-footnotes>`;
}

function renderNote(c) {
  return `<movelli-note${rootAttrs(c, 'note')}>${textBody('note', `<p>${c.html != null ? c.html : esc(c.text)}</p>`)}</movelli-note>`;
}

/**
 * A photo/clip credit overlaid on the banner's media band — `banner__credit`, the banner's own part, so
 * there is one emitter rather than two that drift. Bottom-right, on the card tag's scrim.
 *
 * `credit` is CONTENT, so it arrives sanitized and is emitted verbatim, exactly like the figure's
 * credit.
 *
 * [owner 2026-10-06] IT MAY HOLD A LINK NOW (`allowHtml: 'inline'`): "Photo by <a>Name</a>", the way a
 * stock site asks to be credited. Until then it was `'none'` and deliberately not a link, on the
 * reasoning that an attribution needing a URL belongs in a `figure` caption. The owner chose the link
 * in the banner (option a, over plain text). The sanitizer keeps an <a href> with a safe URL and
 * strips everything else; the link's look is the banner's own (`.banner__credit a`).
 */
function mediaCredit(c) {
  return c.credit ? `\n    <span class="banner__credit">${c.credit}</span>` : '';
}

/** One taxonomy link: the eyebrow's category (`page-title__category`) or one of the byline's tags (`byline__tag`). */
function taxoLink(t, cls) {
  return t && t.href ? `<a class="${cls}" href="${esc(t.href)}">${esc(t.label)}</a>` : esc((t && t.label) || '');
}

function renderPageTitle(c) {
  // The eyebrow is the category, LINKED. [owner 2026-10-11] The tags are in the byline now.
  const eyebrow = c.category && c.category.label
    ? `\n    <p class="page-title__eyebrow">${taxoLink(c.category, 'page-title__category')}</p>` : '';
  // `title` is CONTENT, so it arrives already safe — the resolver sanitized it to its `allowHtml`,
  // and the hand-built callers sanitize too. Escaping again double-escaped every title containing
  // `&`, `<`, `>` or `"` (the same bug `props` carried).
  //
  // The root class is the catalog key, like every component's. It was `article__header` — a name that
  // described only ONE of the two places this belongs, since a listing's h1 should use this component
  // too, which is the wrong-name argument in miniature.
  // There is no <header> ELEMENT any more: it used to wrap the byline and standfirst, which now live
  // outside this component, and inside <main> it mapped to no landmark anyway (HTML-AAM excludes a
  // <header> descended from main), so nothing is lost by dropping it.
  return `<movelli-page-title${rootAttrs(c, 'page-title')}>${textBody('page-title', `${eyebrow}
    <h1>${c.title || ''}</h1>
  `)}</movelli-page-title>`;
}

function renderByline(c) {
  // `updated` is the machine-readable ISO value, `updatedLabel` the localised text — both, so the
  // <time> stays valid while the visible date follows the locale. These are engine-built strings,
  // never resolver output, so unlike the title above they keep their esc().
  const tags = (Array.isArray(c.tags) ? c.tags : []).filter((t) => t && t.label).map((t) => taxoLink(t, 'byline__tag'));
  const parts = [
    c.updated ? `<span>Updated <time datetime="${esc(c.updated)}">${esc(c.updatedLabel || c.updated)}</time></span>` : '',
    // [owner 2026-10-11] The tags follow the updated date: a pipe in the divider colour, then the tags apart by `·`.
    tags.length ? `<span class="byline__separator" aria-hidden="true">|</span><span class="byline__tags">${tags.join(' · ')}</span>` : '',
    c.readingTime ? `<span>${esc(c.readingTime)}</span>` : '',
  ].filter(Boolean);
  // Nothing to attribute renders nothing at all — a producer may pass a byline it turns out to have
  // no values for, and an empty <p> would still take its slot's row gap.
  return parts.length ? `<movelli-byline${rootAttrs(c, 'byline')}><p class="byline__body component__body">${parts.join('')}</p></movelli-byline>` : '';
}

/**
 * Render ONE label/value cell value — shared by `props` and `overview-table`, which take the same `rows` shape.
 *
 * [owner 2026-10-07] A CELL IS TEXT. It was also a list, a reference, a media ref or a group, because a record's
 * typed fields were bound into the rows of a factsheet; the records that had them are deleted, and a row's value
 * is a `text` field of the catalog now, so nothing else reaches here.
 *
 * ESCAPING: a **string** is emitted verbatim because the resolver already sanitized it to its field's
 * `allowHtml` (the same contract `prose` and `callout` rely on) — escaping here would double-escape and print the
 * entities. A number is escaped.
 */
function cellValue(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'string') return v;          // resolver-sanitized — see the escaping note above
  return esc(String(v));                        // a number
}

function renderToc(c) {
  const items = (c.items || []).filter((i) => i && i.label && i.href);
  if (!items.length) return '';   // no titled sections → no empty box
  // The LABEL is emitted verbatim: the builder makes both sources safe (a raw `tocTitle` is escaped
  // there, a prose heading's text is already escaped content), so escaping again here double-escaped
  // every prose heading containing an `&`. The href is build-derived and still esc()'d.
  const links = items.map((i) => `<li><a href="${esc(i.href)}">${i.label}</a></li>`).join('\n        ');
  // A real <nav> with an accessible name: it is a navigation landmark, not decoration.
  //
  // The name now comes from a VISIBLE heading via aria-labelledby rather than an aria-label. Both
  // name the landmark, but aria-labelledby names it with the words on screen — so a screen-reader
  // user and a sighted user hear and read the same thing, and there is no second copy of the string
  // to drift. The label config still supplies the text; it is simply rendered rather than hidden.
  //
  // h2 because the ToC sits inside <main>, one level under the page's <h1> — the same relationship
  // the menu's own <h2>Menu</h2> has to its dialog. It is a peer of the sections it lists, which is
  // the conventional shape (Wikipedia's "Contents" is an h2 too): the list indexes the page, it is
  // not a subsection of anything.
  //
  // [owner 2026-10-03] The title and the list are ONE block (`toc__content`), centred in the box and
  // left-aligned inside it, so the box can fill its slot while its lines keep one edge.
  return `<movelli-toc${rootAttrs(c, 'toc')}><nav class="toc__body component__body" aria-labelledby="toc-title">
      <div class="toc__content">
        <h${headingLevel(c.level, 2)} id="toc-title" class="toc__title">${c.label}</h${headingLevel(c.level, 2)}>
        <ol class="toc__list">
          ${links}
        </ol>
      </div>
    </nav></movelli-toc>`;
}

/* ONE table. It used to have a second, multi-section form that laid out its own grid of category
   cards — deleted 2026-08-25 with the decomposition: laying out a row of things is not a table's
   job, so several tables side by side are several instances, not one instance drawing its own.
   [2026-10-02] They went into the cells of a section (a `grid` held them before; the card grid
   holds cards only) — the slots of a layout since 2026-10-03. Nothing had to be migrated: the
   factsheets already used seven separate instances, and the sectioned form existed only on
   `/test/`. */
function renderOverviewTable(c) {
  // The table is WRAPPED: the wrapper carries the surface, the padding and the radius, because
  // `border-collapse: collapse` makes padding on the <table> itself a no-op.
  const table = oneTable({ caption: c.caption, subtitle: c.subtitle, rows: c.rows });
  if (!table) return '';
  return `<movelli-overview-table${rootAttrs(c, 'overview-table')}>${componentTitle(c)}<div class="overview-table__body component__body">${table}</div></movelli-overview-table>`;
}

/** One captioned table. Returns '' when it has no rows, so an empty category renders nothing at all
 *  rather than a heading with a blank card under it. */
function oneTable(sec) {
  const rows = (sec.rows || []).map((r) => (r ? { label: r.label, value: cellValue(r.value) } : r))
    .filter((r) => r && (r.label || r.value)).map((r) =>
      // <th scope="row"> — the label IS the row's header, which is what makes the stacked mobile form
      // still read correctly to a screen reader.
      `<tr role="row"><th scope="row" role="rowheader">${esc(r.label)}</th><td role="cell">${r.value}</td></tr>`)
    .join('\n        ');
  if (!rows) return '';
  const caption = sec.caption ? `<caption>${esc(sec.caption)}${sec.subtitle ? `<span class="overview-table__subtitle">${esc(sec.subtitle)}</span>` : ''}</caption>` : '';
  // Explicit ARIA roles: the mobile form sets `display:block` on the table parts, which drops their
  // implicit roles in most engines. Stating them keeps the table a table at every width.
  return `<table class="overview-table__table" role="table">${caption}
      <tbody role="rowgroup">
        ${rows}
      </tbody>
    </table>`;
}

function renderProps(c) {
  // `esc(r.value)` here used to DOUBLE-escape: the resolver has already sanitized the value (this
  // component's schema declares plain text, so `&` arrives as `&amp;`), and escaping it again shipped
  // the literal "&amp;" to the reader. Same fix as `overview-table` — one shared cell renderer.
  const rows = (c.rows || []).map((r) => `<div class="props__row">
        <dt>${esc(r.label)}</dt>
        <dd>${cellValue(r.value)}</dd>
      </div>`).join('\n      ');
  return rows ? `<movelli-props${rootAttrs(c, 'props')}>${componentTitle(c)}<dl class="props__body component__body">
      ${rows}
    </dl></movelli-props>` : '';
}

/**
 * [owner 2026-10-10] THE MARK OF A LINK THAT LEAVES THE SITE: the icon, and the words a screen reader hears with it. One markup for the button
 * (`renderCta`) and for a link inside a text (`markExternalLinks` in `generator/transforms.js`, which adds `inline` for the smaller icon).
 */
export function externalLinkMark({ inline = false, icon = true } = {}) {
  // The words open with a NON-BREAKING space, so a screen reader does not run them into the link text — and neither does a copy of the page: the hidden element is out of the flow, which drops an ordinary space at its start (measured: the selection read "GL.iNet(opens in a new tab)"). `icon: false` is a photo credit's: it opens in a new tab but shows no icon.
  return `${icon ? `<svg class="icon${inline ? ' icon--inline' : ''}" aria-hidden="true"><use href="#icon-external"/></svg>` : ''}<span class="sr-only">&nbsp;(opens in a new tab)</span>`;
}

/** A call-to-action button/link (external → sponsored-aware, opens a new tab). One renderer for
 *  guide `cta` blocks, record affiliate CTAs, and AI-emitted CTAs. */
function renderCta(c) {
  // `href` arrives in TWO shapes and both are legitimate: a plain string (what a `field:` bind
  // unwraps to, and what the hand-built callers pass) or the resolver's link OBJECT, because a
  // content-authored `link` field resolves to `{__link, url, rel, target}` — a URL must not be
  // HTML-escaped like prose. Handling only the string meant a CTA authored on a PAGE rather than
  // bound to a record field rendered `href="[object Object]"`, silently.
  const link = c.href && typeof c.href === 'object' ? c.href : null;
  const href = link ? link.url : c.href;
  // A <button> CTA, rendered before any of the link plumbing below because none of it applies: a
  // button does not navigate, so it takes no target, no rel and no external icon. `disabled` forces
  // this branch — see the config note.
  if (c.disabled || c.element === 'button') {
    const cls = c.isPrimary === false ? 'btn btn--secondary' : 'btn';
    const off = c.disabled ? ' disabled' : '';
    return `<movelli-cta${rootAttrs(c, 'cta')}><button type="button" class="${cls}"${off}>${c.label || ''}</button></movelli-cta>`;
  }
  const target = link ? link.target : c.target;
  const external = /^https?:/i.test(href || '');
  // `.btn` IS the primary button — there is no `.btn--primary` rule, so emitting the modifier was
  // a class that styled nothing. Only the secondary look modifies the base (`isPrimary: false`).
  const cls = c.isPrimary === false ? 'btn btn--secondary' : 'btn';
  // `rel` is a UNION, never a choice. The registry's disclosure on a sponsor link is authoritative
  // and the component's own `sponsored` can only ADD to it — so an author can strengthen a
  // disclosure but never weaken one, whichever of the two flags they happen to set.
  const rels = String((link && link.rel) || c.rel || (external ? 'noopener noreferrer' : ''))
    .split(/\s+/).filter(Boolean);
  // `sponsored` LEADS, matching the sponsor registry's canonical order, so a config-flagged link and
  // a registry-resolved one emit the identical rel rather than two orderings of the same tokens.
  if (c.sponsored && !rels.includes('sponsored')) rels.unshift('sponsored');
  const rel = rels.join(' ');
  const attrs = `${external || target ? ` target="${esc(target || '_blank')}"` : ''}${rel ? ` rel="${esc(rel)}"` : ''}`;
  const icon = external
    ? ` ${externalLinkMark()}`
    : '';
  // `label` is CONTENT (verbatim); `href` is a URL — scheme-checked upstream, escaped here because
  // it is an attribute value and a URL must never be HTML-escaped twice.
  return `<movelli-cta${rootAttrs(c, 'cta')}><a class="${cls}" href="${esc(href)}"${attrs}>${c.label || ''}${icon}</a></movelli-cta>`;
}

/** Does this value already carry block-level markup of its own? */
const HAS_BLOCK = /<(p|h[1-6]|ul|ol|li|blockquote|div|figure|table|pre)\b/i;

/**
 * [hard] BARE TEXT IS WRAPPED IN A <p>. A BOUND field is sanitized to the FIELD's own `allowHtml`,
 * and a plain `type: 'text'` field resolves to 'none' — so binding one into a paragraph component
 * (every collection binds `summary` into the standfirst) delivered a string with no markup at all,
 * which rendered as loose text in a <div>: not a paragraph, and outside the block's own rhythm. This
 * was never specific to the standfirst; it is latent for every bound field that carries a paragraph.
 *
 * One function because it is one rule. `prose` and `intro` are two components for two ROLES — the
 * reading face and the interface one — and how a paragraph gets its <p> is not part of that
 * difference, so it is not duplicated across them.
 */
function paragraphBody(html) {
  return html && !HAS_BLOCK.test(html) ? `<p>${html}</p>` : (html || '');
}

function renderProse(c) {
  const body = paragraphBody(c.html);
  // `standfirst` is the intro paragraph's type, `smaller` the conversation's — variants, so their class
  // is on the root (rootAttrs). [owner 2026-10-04] They were a class on the box, `prose__body--*`.
  return `<movelli-prose${rootAttrs(c, 'prose')}>${textBody('prose', body)}</movelli-prose>`;
}

/**
 * The line under a page title on a listing, an archive or a taxonomy page — see the catalog entry
 * for why it is its own component and not a third `prose` variant. Identical MARKUP to prose and a
 * different FACE, which is exactly the split: the element name is what the stylesheet reaches.
 */
function renderIntro(c) {
  return `<movelli-intro${rootAttrs(c, 'intro')}>${textBody('intro', paragraphBody(c.html))}</movelli-intro>`;
}

/**
 * A banner — a background image with a heading + text over it.
 *
 * Its `sizes` is the one it was resolved with — see the note at its <img> below: worked out by the build
 * from the layout slot it sits in (`image-widths.mjs`, docs/record/layouts.md § 8).
 *
 * The scrim is NOT optional decoration: text over a photograph has no guaranteed contrast, and a
 * light image would leave the heading unreadable. It is a `::after`, so it needs no extra element.
 */
function renderBanner(c) {
  // [owner 2026-10-14] A band holds a CLIP when its `src` is a video of the library: only a video gives `bytes` (the size of its file).
  const clip = c.src && c.bytes != null ? c.src : null;

  // [owner 2026-10-04] Its shape is its variant (`component-variant--wide` / `--full` on the root, from
  // `rootAttrs`) and its own CSS, so the only thing left in its `style` is the clip's poster.
  // The poster doubles as the reduced-motion still, handed to CSS as a custom property so the swap
  // needs no JS: the clip is hidden and this paints in its place.
  // SINGLE quotes inside the url(), and any apostrophe percent-encoded: this lands in a
  // double-quoted style attribute, so wrapping it in double quotes would close the attribute early.
  // esc() handles `"` but leaves `'` alone, so both are needed.
  const style = clip && c.poster ? `--band-poster:url('${esc(c.poster).replace(/'/g, '%27')}')` : '';

  // [owner 2026-10-02] ITS SLOT: the components over the photo, rendered here — the slot is the
  // banner's, so its components render inside it in every runtime
  // (docs/record/layout-sections-2026.md § 5).
  const slotted = ((c.slots && c.slots.content && c.slots.content.components) || [])
    .map(renderComponent).filter(Boolean);
  const body = slotted.length ? `<div class="banner__slot">\n          ${slotted.join('\n          ')}\n        </div>` : '';

  let media = '';
  if (clip) {
    // The address waits in `data-src` until the band nears the screen (`movelli-banner.js`), unless the band is `eager`: the same rule as the video component's autoplay clip.
    const sources = `<source ${c.loading === 'eager' ? 'src' : 'data-src'}="${esc(clip)}" type="video/mp4">`;
    // `role="img"` + label sits on the VIDEO, not the wrapper. It still makes the clip a leaf, so
    // assistive tech reads one labelled image rather than a video it cannot control — but a role on
    // the WRAPPER would make the whole band a leaf and hide the body and the credit beside it.
    media = `\n    <video class="banner__img" role="img" aria-label="${c.label || c.alt || ''}" autoplay muted loop playsinline preload="none"${c.poster ? ` poster="${esc(c.poster)}"` : ''}>
      ${sources}
    </video>`;
  } else if (c.src) {
    const srcset = c.srcset ? ` srcset="${esc(c.srcset)}"` : '';
    // [owner 2026-10-04] ITS `sizes` IS WORKED OUT FROM WHERE IT SITS (`image-widths.mjs`); a banner
    // rendered with none — anywhere but directly in a layout's slot — takes the whole window, which never
    // picks a rendition too small. `auto` lets a LAZY image choose from its own rendered width; the
    // explicit list is the fallback for engines that ignore it, and the only correct one for an
    // eager image — a page's LCP, the worst place on the site to be soft.
    const loading = c.loading === 'eager' ? 'eager' : 'lazy';
    const sizesFor = (list) => (loading === 'lazy' ? `auto, ${list || '100vw'}` : (list || '100vw'));
    const sizes = c.srcset ? ` sizes="${esc(sizesFor(c.sizes))}"` : '';
    const w = dim(c.width), h = dim(c.height);
    const wh = `${w ? ` width="${w}"` : ''}${h ? ` height="${h}"` : ''}`;
    const img = `<img class="banner__img" src="${esc(c.src)}"${srcset}${sizes}${wh} alt="${c.alt || ''}" loading="${loading}"${priority(c.fetchpriority)} decoding="async">`;
    // [owner 2026-10-13] A BAND WITH SEVERAL SHAPES IS A `<picture>`, ONE WITH ONE IS AN `<img>`. The build gives a band that changes shape across the window widths a `<source media>` for each shape
    // after the first (`sources`, widest first — the first that matches wins), each with files cut to that shape; the `<img>` is the narrowest shape and what a browser with no match loads. The
    // `<picture>` takes no part in the layout (`display: contents`): the `<img>` is still the band's own absolutely placed box. `sizes="auto"` is the `<img>`'s alone (the spec
    // allows the keyword on an image, not on a `<source>`), so a `<source>` asks for its own shape's width in full and the `<img>` keeps `auto` in front of its own.
    const sources = Array.isArray(c.sources) ? c.sources : [];
    media = sources.length
      ? `\n    <picture class="banner__picture">${sources.map((s) => {
        const sw = dim(s.width), sh = dim(s.height);
        return `\n      <source media="${esc(s.media)}" srcset="${esc(s.srcset)}"${s.sizes ? ` sizes="${esc(s.sizes)}"` : ''}${sw ? ` width="${sw}"` : ''}${sh ? ` height="${sh}"` : ''}>`;
      }).join('')}\n      ${img}\n    </picture>`
      : `\n    ${img}`;
  }

  // [hard] THE ROOT CARRIES NO ROLE. (It was kept free for a container to impose one; a card in a
  // list carries the role, set by the build — `generator/roles.js`.) An <img>
  // carries its own alt from the media record and a band with text is named by that text, so
  // neither needs one; a BARE band is a placeholder with nothing to announce, and it used to take
  // `role="img"` + a label — the site's only root-level role, and the one thing that could have
  // collided. A placeholder should never reach production anyway.
  // The scrim is a CONTRAST GUARANTEE for the text, so it exists exactly when there is text — never a
  // configurable look. A bare media band has nothing to keep legible.
  const scrim = body ? ' banner--scrim' : '';
  // [owner 2026-10-05] Its option `contentWidth`: the wide box takes a class of the banner's own; the reading width is the default.
  const contentBox = c.contentWidth === 'wide' ? 'banner--content-wide' : '';
  // [owner 2026-09-27] THE BAND IS ITS OWN BOX, `.banner__body`, INSIDE THE ROOT — the component
  // convention, and what lets the band's ratio answer a CONTAINER query: the root is the container,
  // and an element cannot query itself. The text is a part of the band, `.banner__content`.
  const content = body ? `\n      <div class="banner__content">\n        ${body}\n      </div>` : '';
  return `<movelli-banner${rootAttrs(c, 'banner', scrim.trim(), contentBox)}${style ? ` style="${style}"` : ''}>
    <div class="banner__body component__body">${media}${content}${mediaCredit(c)}
    </div>
  </movelli-banner>`;
}

function renderCallout(c) {
  // Both fields are CONTENT and arrive safe — `title` sanitized to 'none', `html` to 'block'.
  return `<movelli-callout${rootAttrs(c, 'callout')}><aside class="callout__body component__body">${componentTitle(c)}${c.html || ''}</aside></movelli-callout>`;
}

/** A pull quote. `<figure>` + `<blockquote>` + `<figcaption>` is the spec's own pattern for a
 *  quotation WITH an attribution — the attribution is about the quote, so it must not sit inside the
 *  `<blockquote>`, which is reserved for the quoted material itself. Both fields are CONTENT and
 *  arrive sanitized (`text` to 'inline', `attribution` to 'none'). */
function renderQuote(c) {
  // A `link` field resolves to an OBJECT; a `field:` bind hands over the raw string. Accept both, as
  // `cta` does. Escaped here because it lands in an attribute — the resolver has already
  // scheme-checked it, so this is the output boundary rather than the validation.
  const src = typeof c.cite === 'string' ? c.cite : (c.cite && c.cite.url);
  const cite = src ? ` cite="${esc(src)}"` : '';
  const caption = c.attribution ? `\n    <figcaption class="quote__attribution">${c.attribution}</figcaption>` : '';
  return `<movelli-quote${rootAttrs(c, 'quote')}>${componentTitle(c)}<figure class="quote__body component__body">
    <blockquote class="quote__text"${cite}><p>${c.text || ''}</p></blockquote>${caption}
  </figure></movelli-quote>`;
}

/** A code block. `<pre><code>` is the spec's pairing: `pre` preserves the whitespace, `code` says what
 *  the text IS. The label is a `<figcaption>`-style line above it rather than inside the panel, so a
 *  copy of the block's text never picks it up. `code` is CONTENT and arrives escaped, not sanitized. */
function renderCodeBlock(c) {
  const label = c.label ? `\n    <p class="code-block__label">${c.label}</p>` : '';
  // [2026-10-06] THE <pre> IS A SCROLL CONTAINER, so a browser makes it a tab stop, and a stop with
  // no name is announced as a bare group. A titled block names it by its title, as a region — the
  // id is the title's own (`anchor`; the resolver derives one for every title on a page). With no
  // title it gets no role: a region without a name is no landmark. The name for that case is
  // "Code block" (owner), still to come — this renderer cannot read `site.copy.json`.
  const region = c.title && c.anchor ? ` role="region" aria-labelledby="${esc(c.anchor)}"` : '';
  return `<movelli-code-block${rootAttrs(c, 'code-block')}>${componentTitle(c)}${textBody('code-block', `${label}
    <pre${region}><code>${c.code || ''}</code></pre>
  `)}</movelli-code-block>`;
}

/* One list. It was half of `pros-cons`, which drew two columns AND the lists inside them — so the
   layout could never be changed without touching the component. Two of these in the slots of a
   `two-column` layout is the same picture, composed instead of hardcoded. */
function renderList(c) {
  const mark = c.marker === 'cross' ? 'close' : 'check';
  const items = (c.items || []).map((i) =>
    `<li><svg class="icon" aria-hidden="true"><use href="#icon-${mark}"/></svg>${i == null ? '' : i}</li>`).join('');
  if (!items) return '';
  return `<movelli-list${rootAttrs(c, 'list')}><div class="list__body component__body">${componentTitle(c)}<ul>${items}</ul></div></movelli-list>`;
}

function renderComparison(c) {
  // Caption, headers, row labels and cells are ALL content — sanitized upstream, emitted verbatim.
  const head = `<thead><tr>${(c.columns || []).map((col) => `<th scope="col">${col == null ? '' : col}</th>`).join('')}</tr></thead>`;
  const body = `<tbody>${(c.rows || []).map((r) =>
    `<tr><th scope="row">${r.label || ''}</th>${(r.cells || []).map((cell) => `<td>${cell == null ? '' : cell}</td>`).join('')}</tr>`).join('')}</tbody>`;
  const caption = c.caption ? `<caption>${c.caption}${c.subtitle ? `<span class="comparison-table__subtitle">${c.subtitle}</span>` : ''}</caption>` : '';
  const note = (c.note || c.source) ? `\n    <p class="comparison-table__note">${c.note || ''}${c.source ? ` <span class="comparison-table__credit">${c.source}</span>` : ''}</p>` : '';
  return `<movelli-comparison-table${rootAttrs(c, 'comparison-table')}>${componentTitle(c)}
    <div class="comparison-table__body component__body" tabindex="0"><table class="comparison-table__table">${caption}${head}${body}</table></div>${note}
  </movelli-comparison-table>`;
}

function renderFaq(c) {
  // [owner 2026-10-06] ONE QUESTION OPEN AT A TIME IS THE BROWSER'S OWN JOB: the <details> that share a
  // `name` are one group, and opening one closes the others (Baseline 2024). It replaced movelli-faq.js,
  // which listened for `toggle` and closed the siblings — and it now works with JavaScript off too.
  // The name has to be this FAQ's own, or two FAQs on one page would close each other's questions. It
  // is the FAQ's `anchor` when it has one — authored, or derived from its title by the build, which
  // keeps every anchor on a page unique — and otherwise a checksum of its questions and answers, so the
  // same FAQ gets the same name in every build. The one case that does not separate: two FAQs with no
  // title and the same words on one page would be one group.
  const fnv1a = (s) => {
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(36);
  };
  const group = esc(c.anchor || `faq-${fnv1a((c.items || []).map((i) => `${i.q || ''}\n${i.a || ''}`).join('\n'))}`);
  const details = (c.items || []).map((i) =>
    `<details name="${group}"><summary>${i.q || ''}<svg class="icon faq__marker" aria-hidden="true"><use class="faq__more" href="#icon-add"/><use class="faq__less" href="#icon-remove"/></svg></summary><p>${i.a || ''}</p></details>`).join('\n    ');
  // [owner 2026-10-04] Its heading is its own `title`, like every component's. The hard-coded 'FAQ' it
  // fell back to was English in every locale and could not be changed, so it went.
  // [2026-09-28] NO BOX WHEN THERE ARE NO QUESTIONS: an empty `faq__body` would be the root's last
  // child, so the title's bottom margin would add space under an FAQ that says nothing more.
  return `<movelli-faq${rootAttrs(c, 'faq')}>
    ${componentTitle(c)}
    ${details ? textBody('faq', `
    ${details}
  `) : ''}</movelli-faq>`;
}

function renderVideo(c) {
  // [owner 2026-10-14] THE FILE LOADS WHEN IT IS WANTED. A video plays from its poster and loads nothing until it is played (`preload="none"`). An AUTOPLAY clip cannot wait for a press, so its
  // address waits in `data-src` and `movelli-video.js` moves it to `src` as the clip nears the screen. `eager` loads it with the page (the build refuses it for a big file).
  const loadLater = c.autoplay && !c.eager;
  const sources = c.src ? `<source ${loadLater ? 'data-src' : 'src'}="${esc(c.src)}" type="video/mp4">` : '';
  const tracks = (c.tracks || []).map((t) =>
    `<track kind="captions" srclang="${esc(t.srclang)}" label="${esc(t.label)}" src="${esc(t.src)}"${t.default ? ' default' : ''}>`).join('\n        ');
  // caption/credit are CONTENT (verbatim); poster, src, tracks and fallback below are CONFIG.
  const figcaption = (c.caption || c.credit)
    ? `\n    <figcaption>${c.caption || ''}${c.credit ? ` <span class="video__credit">${c.credit}</span>` : ''}</figcaption>`
    : '';
  const vw = dim(c.width), vh = dim(c.height);
  // AUTOPLAY IMPLIES MUTED. Every browser blocks an autoplaying video with sound, so `autoplay: true`
  // alone silently does nothing — the pairing is the platform's rule, not a preference, and making
  // the author discover it is exactly the support request this component set is meant to avoid.
  const flags = [
    c.controls === false ? '' : 'controls',
    c.autoplay ? 'autoplay' : '',
    (c.muted || c.autoplay) ? 'muted' : '',
    c.loop ? 'loop' : '',
    'playsinline',
  ].filter(Boolean).join(' ');
  // Omitted when absent rather than emitted empty: `poster=""` resolves against the page URL, so the
  // browser fetches the DOCUMENT as an image and the first frame never shows.
  const poster = c.poster ? ` poster="${esc(c.poster)}"` : '';
  const label = c.alt ? ` aria-label="${esc(c.alt)}"` : '';
  // [hard] THE ROUNDED CORNERS LIVE ON THIS WRAPPER, NOT ON THE <video> — Safari paints the native
  // CONTROLS in a separately composited layer that a radius on the video itself does not clip, so
  // the frame stayed square over a rounded picture (owner saw it; the wrapper fix was confirmed in
  // Safari before this shipped). It wraps the video ALONE: the figure also holds the caption, which
  // must not be clipped or rounded. Same two properties `.banner` already uses for the same reason.
  return `<movelli-video${rootAttrs(c, 'video')}>${componentTitle(c)}<figure class="video__body component__body">
    <div class="video__frame"><video ${flags} preload="${c.eager ? 'auto' : 'none'}"${vw ? ` width="${vw}"` : ''}${vh ? ` height="${vh}"` : ''}${poster}${label}>
        ${sources}
        ${tracks}
        ${esc(c.fallback || '')}
    </video></div>${figcaption}
  </figure></movelli-video>`;
}

function renderCard(c) {
  // [hard] THE TITLE IS A HEADING ONLY WHERE THE CARD IS THE PAGE'S CONTENT (owner, 2026-08-17).
  // On a listing or archive the cards ARE the page — /blog/ and /countries/ shipped an <h1> and
  // nothing else, so there was no outline to skim — and each entry earns a heading. The level comes
  // from the CONTEXT, not the card: h2 on a flat archive, h3 under a heading, so the outline nests
  // correctly. [owner 2026-10-05] And the context says so in DATA: the page or the template sets
  // `level`; nothing lowers it by itself.
  // It stays a <span> everywhere else, which is most places: inside an article the outline belongs
  // to the article, and in a chat reply it belongs to the conversation — a heading per suggested
  // link would compete with both. This is the same context-dependence `thumb: false` already has.
  const titleTag = c.level == null ? 'span' : `h${headingLevel(c.level, 2)}`;
  // A picture REPLACES the placeholder block and its big label — the label exists because there was
  // no image, so showing both would be a caption over a photo nobody asked for. The category tag
  // stays: it names the card, and it is the one thing the image cannot say.
  //
  // alt="" and the wrapper's aria-hidden are BOTH deliberate, and they agree. A card is one link
  // whose accessible name is already its title, summary and CTA; the thumbnail illustrates that link
  // rather than adding to it, so it is decoration. This is where a card thumb differs from `figure`,
  // `hero` and `banner`, which take their alt from the media record because they ARE content.
  const w = dim(c.width), h = dim(c.height);
  // [owner 2026-10-13] A thumbnail has several sizes (`srcset`) like any other image: the build plans them from where the card sits, cut to the card's 16/9 (`rendition-plan.mjs`).
  const cardLoading = c.loading === 'eager' ? 'eager' : 'lazy';
  const cardSrcset = c.srcset ? ` srcset="${esc(c.srcset)}"` : '';
  let cardSizes = c.sizes || '';
  if (cardLoading === 'lazy' && c.srcset && !/^auto\b/.test(cardSizes)) cardSizes = cardSizes ? `auto, ${cardSizes}` : 'auto';
  const img = c.src ? `<img class="card__img" src="${esc(c.src)}"${cardSrcset}${cardSizes ? ` sizes="${esc(cardSizes)}"` : ''}${w ? ` width="${w}"` : ''}${h ? ` height="${h}"` : ''} alt=""`
    + ` loading="${cardLoading}"${priority(c.fetchpriority)} decoding="async">` : '';
  // [hard] THE IMAGE COMES FIRST. Both it and the tag are `position: absolute` inside the thumb with
  // no z-index, so paint order is DOM order — with the image last it covered the tag completely. The
  // measurements all passed while it did (the tag had its chip, its colours and its box); only a
  // screenshot showed it, which is exactly how the banner's scrim hid its own text.
  // Fixed by ORDER rather than by a z-index: nothing here needs to join the site's stacking scale.
  const warm = c.heroImage && typeof c.heroImage === 'object' ? ` data-hero-image="${esc(JSON.stringify(c.heroImage))}"` : '';
  // title · summary · thumbLabel · tag are CONTENT, so they are emitted VERBATIM — the
  // resolver sanitized an authored one, and a producer that builds a card config in code sanitizes
  // its own. Escaping here as well would double-escape an `&`.
  // [owner 2026-10-04] The `no-thumb` variant leaves the thumbnail out of the HTML (it was thumb: false).
  const thumb = (c.variant || []).includes('no-thumb') ? '' : `
        <span class="card__thumb" aria-hidden="true">
          ${img}${c.tag ? `<span class="card__tag">${c.tag}</span>` : ''}${img ? '' : (c.thumbLabel || '')}
        </span>`;
  return `<movelli-card${rootAttrs(c, 'card')}${warm}>
      <a class="card__body component__body" href="${esc(c.url || '#')}">${thumb}
        <span class="card__text">
          <${titleTag} class="card__title is-underlined">${c.title}</${titleTag}>
          <span class="card__summary">${c.summary || ''}</span>
        </span>
      </a>
    </movelli-card>`;
}

/**
 * [owner 2026-10-05] A HEADING ON ITS OWN — the title of a row of cards, in a slot above them. It is the component
 * title every other component draws, through the same helper, so its look, its line length and its id are theirs.
 * The title is the component's own box, `heading__body` — what it says IS the heading — and its variant `centered`
 * centres that box's line.
 */
function renderHeadingComponent(c) {
  return `<movelli-heading${rootAttrs(c, 'heading')}>${componentTitle(c, 2, 'heading__body')}</movelli-heading>`;
}

/**
 * [owner 2026-10-05] THE LINK TO THE FULL LIST, under a row of cards: "View all destinations". It was the card grid's
 * own `moreUrl` / `moreLabel`. The URL is CONFIG, so it is escaped here; the label is CONTENT, already made safe.
 */
function renderMoreLink(c) {
  if (!c.url || !c.label) return '';
  return `<movelli-more-link${rootAttrs(c, 'more-link')}><a class="more-link__body component__body" href="${esc(c.url)}">${c.label}<svg class="icon" aria-hidden="true"><use href="#icon-arrow"/></svg></a></movelli-more-link>`;
}

/**
 * [2026-10-06] RELATED PAGES — an EMPTY, HIDDEN box the component fills in the browser
 * (`components/movelli-related-pages.js`): it searches with the page's own address and draws the cards it
 * finds, with its lead line above them as a prose. Without JavaScript, or with nothing found, it stays
 * hidden, and a hidden box takes no gap in its slot.
 *
 * The lead line's forms ride on the root as data, one attribute per form, for the script to pick from by
 * the number of cards. They are CONTENT, sanitized to `none`, which is safe in an attribute (the sanitizer
 * escapes the quote), so they are emitted verbatim like every other content field.
 */
function renderRelatedPages(c) {
  const lead = c.lead || {};
  const forms = ['one', 'other'].filter((f) => lead[f] != null).map((f) => ` data-lead-${f}="${lead[f]}"`).join('');
  return `<movelli-related-pages${rootAttrs(c, 'related-pages')} hidden${forms}><div class="related-pages__body component__body"></div></movelli-related-pages>`;
}
