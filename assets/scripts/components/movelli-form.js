/**
 * <movelli-form> — progressive enhancement for a pre-rendered <form>.
 *
 * The form works with zero JS (native POST to its action). This upgrade intercepts submit and posts
 * via fetch, so nothing reloads and nothing moves: the outcome is a TOAST plus a line under the
 * submit button (see `outcome`). A success resets the fields; an error keeps them, so a failed send
 * never costs the visitor what they typed.
 */
import { toast } from '../toast.js';
import { copy, copyForms, fill, pluralize } from '../copy-data.mjs';

/** The types whose "placeholder" is a UA format hint rather than a ::placeholder. */
const DATE_TYPES = new Set(['date', 'time', 'datetime-local', 'month', 'week']);

class MovelliForm extends HTMLElement {
  connectedCallback() {
    const form = this.querySelector('form');
    if (!form) return;
    // Bound for this connection only — moving the element disconnects and reconnects it, and the
    // listeners go with the first and come back with the second. See the component checklist.
    this.listening?.abort();
    this.listening = new AbortController();
    const { signal } = this.listening;
    this.resolveNow(form);
    // [hard] noValidate IS SET FROM JS, NEVER IN THE MARKUP. The browser refuses to submit an
    // invalid form and shows its own bubble, so our handler would not run at all and none of the
    // styling below could ever appear. Setting it here means the NO-JS path keeps native validation
    // in full — the constraint attributes are still on every control — and only the enhanced path
    // takes over. The constraints stay the source of truth either way: this reads el.validity, so
    // required/pattern/min/max/step/type are checked by the browser and only PRESENTED by us.
    form.noValidate = true;
    form.addEventListener('submit', (e) => this.onSubmit(e, form), { signal });
    // [owner] The error clears as soon as the field is touched, on `input` — the moment a visitor
    // starts correcting something, telling them it is still wrong is noise. Delegated, so controls
    // the AI or the CMS adds later are covered without re-binding. `input` fires on checkables and
    // selects too, so one listener covers every control.
    form.addEventListener('input', (e) => { this.clearField(e.target); this.markEmpty(e.target); }, { signal });
    // [owner 2026-08-28] The OUTCOME line goes as soon as the visitor touches the form again — both
    // outcomes, for one reason: it is stale either way. "Your message is on its way" is about the
    // message they already sent, not the one they are now writing; "that didn't send" is about the
    // attempt they are now correcting. `change` rather than `input`, so it survives the first
    // keystroke of a long answer and goes when a field is actually done.
    form.addEventListener('change', () => this.clearOutcome(form), { signal });
    for (const el of form.elements) this.markEmpty(el);
  }

  disconnectedCallback() { this.listening?.abort(); }

  /**
   * `data-empty` on a date/time control, because CSS cannot see that one is empty.
   *
   * Their `dd/mm/yyyy, --:--` hint is a UA shadow part rather than a ::placeholder, so the global
   * placeholder rule cannot reach it — and there is no selector for the state either:
   * `:placeholder-shown` does not match a date input (it wants a `placeholder` attribute, which date
   * inputs do not take) and an empty one is `:valid`. Both verified in the browser before reaching
   * for JS. Without this the format hint renders at full --font-color beside fields at --font-color-secondary.
   */
  markEmpty(el) {
    if (!el || !DATE_TYPES.has(el.type)) return;
    el.toggleAttribute('data-empty', !el.value);
  }

  /**
   * `data-min="now"` → a real `min`, at LOAD rather than at build.
   *
   * The site is generated statically and only regenerated on publish, so a min baked into the HTML
   * states the build date and rots — a form asking for a future appointment would accept last month.
   * The server enforces the same rule independently (forms-core), which is what covers a visitor
   * with JS off; this half is the UX, so the browser's own date picker greys out the past.
   *
   * [hard] The value must be the visitor's LOCAL wall clock, in the control's own format —
   * toISOString() would hand it UTC and shift the floor by the visitor's offset.
   */
  resolveNow(form) {
    const pad = (n) => String(n).padStart(2, '0');
    const d = new Date();
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    for (const el of form.querySelectorAll('[data-min="now"]')) {
      el.min = el.type === 'datetime-local' ? `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}` : date;
    }
  }

  /**
   * The visible name of a control, for a message that reads like a sentence. A group is named by its
   * legend, a field by its label; the required asterisk is aria-hidden but still in the text, so it
   * is trimmed off.
   */
  fieldLabel(control) {
    const group = control.closest('fieldset.form__group--options');
    const el = group ? group.querySelector('legend') : (control.labels && control.labels[0]);
    return el ? el.textContent.replace(/\s*\*\s*$/, '').trim() : (control.name || copy('form_field_fallback'));
  }

  /**
   * Why our own copy rather than `el.validationMessage`: the browser's string is free and localised,
   * but it is written in a different voice from the server's ("Please fill out this field." against
   * "Your name is required"), and the two appear in the same place — one field can fail here while
   * the next fails on the server. Matching the server's wording is worth owning the strings; they
   * are recorded in content/copy-inventory.md for the multilingual extraction.
   */
  messageFor(control) {
    const v = control.validity;
    const name = this.fieldLabel(control);
    // A required checkbox group: every box is individually valid, so `validity` reports nothing.
    // The SAME KEYS the server validates with (`functions/forms-core.js`). They used to be two sets
    // of literals in two files under a comment saying they must be kept in step; sharing the keys is
    // what makes that structural — one field can fail here and the next on the server, and the two
    // messages land in the same place.
    if (v.valid) return fill(copy('form_error_required'), name);
    if (v.valueMissing) return fill(copy('form_error_required'), name);
    if (v.typeMismatch) {
      if (control.type === 'email') return copy('form_error_email');
      if (control.type === 'url') return copy('form_error_url');
    }
    if (v.rangeUnderflow) return fill(copy('form_error_min'), control.min);
    if (v.rangeOverflow) return fill(copy('form_error_max'), control.max);
    if (v.stepMismatch) {
      return Number(control.step) === 1
        ? copy('form_error_step_integer')
        : fill(copy('form_error_step'), control.step);
    }
    // [2026-09-17] THE TWO LENGTH ERRORS COUNT, so they carry plural forms and are read through
    // `copyForms` + `pluralize` rather than `copy` — which now throws on a plural key rather than
    // handing back the forms object. English only needs it at 1 ("1 character"); Polish needs four
    // categories for the same sentence, and the form the entry holds is picked per locale.
    // `minLength` is a NUMBER off the element, which is what pluralize requires — it refuses a
    // string, because Intl.PluralRules would silently answer "other" for one.
    if (v.tooShort) return fill(pluralize(copyForms('form_error_minlength'), control.minLength), control.minLength);
    if (v.tooLong) return fill(pluralize(copyForms('form_error_maxlength'), control.maxLength), control.maxLength);
    if (v.badInput) return fill(copy('form_error_unreadable'), name);
    if (v.patternMismatch) return fill(copy('form_error_pattern'), name);
    // A constraint we have no copy for: the browser's own message beats our generic one.
    return control.validationMessage || fill(copy('form_error_generic'), name);
  }

  /**
   * Check every control on submit. Returns the controls that failed, first in DOM order — which is
   * the one to focus, because it is the one the visitor reaches first on the way back down.
   */
  invalidControls(form) {
    const seen = new Set();
    const out = [];
    for (const el of form.elements) {
      if (!el.name || el.name[0] === '_' || el.disabled || el.willValidate === false) continue;
      if (el.checkValidity()) continue;
      if (seen.has(el.name)) continue;   // a radio group reports on every member; mark it once
      seen.add(el.name);
      out.push(el);
    }
    // A required CHECKBOX group is "at least one", which HTML has no attribute for — the renderer
    // marks the fieldset instead. Without this the browser would see nothing to enforce and the
    // server would refuse a submission the client had just called valid.
    for (const fs of form.querySelectorAll('fieldset[data-required="true"]')) {
      const boxes = [...fs.querySelectorAll('input[type="checkbox"]')];
      if (!boxes.length || boxes.some((b) => b.checked) || seen.has(boxes[0].name)) continue;
      seen.add(boxes[0].name);
      out.push(boxes[0]);
    }
    return out;
  }

  /** Undo the marking on ONE field — its message, its flag and the id it added to describedby. */
  clearField(control) {
    if (!control || !control.name) return;
    const group = control.closest('fieldset.form__group--options');
    const target = group || control;
    if (!target.hasAttribute('aria-invalid')) return;
    target.removeAttribute('aria-invalid');
    const ids = (target.getAttribute('aria-describedby') || '').split(' ').filter((id) => id && !id.endsWith('-error'));
    if (ids.length) target.setAttribute('aria-describedby', ids.join(' '));
    else target.removeAttribute('aria-describedby');
    const note = this.querySelector(`#${CSS.escape(this.errorId(control.form, control.name))}`);
    if (note) note.remove();
  }

  /**
   * The id of a field's error line, `f-<form>-<field>-error` — the field's own id plus `-error`, the
   * way the renderer builds the help's (renderers.mjs, renderForm). The form's name is its hidden
   * `_form` value, which the renderer always writes. [owner 2026-10-06] It carries the form's name so
   * two forms on one page with a field of the same name cannot share it.
   */
  errorId(form, name) { return `f-${form.elements._form.value}-${name}-error`; }

  /** Clear whatever the last attempt left behind, so nothing stale survives a retry. */
  clearErrors(form) {
    for (const p of this.querySelectorAll('.form__error, .form__field-error')) p.remove();
    for (const el of form.querySelectorAll('[aria-invalid]')) {
      el.removeAttribute('aria-invalid');
      // Put back only the help id — the error id is the part we added.
      const ids = (el.getAttribute('aria-describedby') || '').split(' ').filter((id) => !id.endsWith('-error'));
      if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
      else el.removeAttribute('aria-describedby');
    }
  }

  /**
   * Mark ONE control. `aria-describedby` is APPENDED to, never replaced: a field can carry help text
   * as well, and dropping the help to show an error would lose the very context that explains the
   * error. A group's error goes on the fieldset, which is what carries the group's own description.
   */
  markField(form, name, message) {
    const el = form.elements[name];
    const control = el instanceof RadioNodeList ? el[0] : el;
    if (!control) return null;
    // Mark the FIELDSET only for a checkable group, where the field IS the group and there is no
    // single control to point at. A `--fields` group holds independent controls that each own their
    // own error — marking its fieldset would put one ring around the whole section.
    const target = control.closest('fieldset.form__group--options') || control;
    const wrap = control.closest('.form__field') || target.parentElement;
    const note = document.createElement('p');
    note.className = 'form__field-error';
    note.id = this.errorId(form, name);
    note.textContent = message;
    wrap.appendChild(note);
    target.setAttribute('aria-invalid', 'true');
    target.setAttribute('aria-describedby', `${(target.getAttribute('aria-describedby') || '').trim()} ${note.id}`.trim());
    return control;
  }

  /**
   * Report the outcome of a submission: a toast, and a line under the submit button that KEEPS it.
   *
   * [owner 2026-08-28] Two surfaces because they answer different questions. The toast says "that
   * happened" and is gone in four seconds; the line answers "did my message send?" for someone who
   * looked away, and persists until the page is left. Same words in both, so there is one message
   * rather than two that can disagree.
   *
   * NOTHING SCROLLS. The old form-level error was prepended and focused, which moved the page; the
   * visitor stays exactly where they were. The line is placed rather than focused for the same
   * reason — it sits under the button they just pressed, which is already where they are looking.
   *
   * `role="status"` on both outcomes rather than `alert` on the error: the toast region is already a
   * live region and announces the same words, so a second assertive announcement would say it twice.
   */
  /** Drop the outcome line — the visitor has started on the form again, so it is about the past. */
  clearOutcome(form) { form.querySelector('.form__outcome')?.remove(); }

  outcome(form, message, { error = false } = {}) {
    const btn = form.querySelector('button[type="submit"]');
    let line = form.querySelector('.form__outcome');
    if (!line) {
      line = document.createElement('p');
      line.setAttribute('role', 'status');
      // Under the SUBMIT BUTTON, wherever that is — the one element every form has, so this needs to
      // know nothing about a particular form's fields.
      if (btn) btn.insertAdjacentElement('afterend', line);
      else form.append(line);
    }
    line.className = error ? 'form__outcome form__outcome--error' : 'form__outcome';
    line.textContent = message;
    toast(message, error ? { variant: 'error' } : {});
  }

  async onSubmit(e, form) {
    e.preventDefault();
    // ONE SEND AT A TIME. The button stays pressable while a send runs (see below), so a second
    // press, or Enter in a field, is refused here instead.
    if (this.getAttribute('aria-busy') === 'true') return;
    const btn = form.querySelector('button[type="submit"]');
    this.clearErrors(form);

    // [owner] VALIDATE ON SUBMIT ONLY — not as the visitor types. Marking a field red while someone
    // is halfway through typing an email address is scolding them for not having finished.
    const bad = this.invalidControls(form);
    if (bad.length) {
      for (const el of bad) this.markField(form, el.name, this.messageFor(el));
      bad[0].focus();
      return;
    }

    // The button's own LABEL is the visible pending state ("Sending…"). `aria-busy` is the
    // same fact for a screen reader — the assistant input has set it on its own bar since the chat was built, and
    // this had no equivalent.
    // [owner 2026-09-26] UNAVAILABLE, NOT DISABLED. A disabled button drops focus to the page, so the
    // visitor who pressed it was left there — the next Tab started over from the top of the page. It
    // keeps focus now: `aria-disabled` tells a screen reader it is unavailable, `.disabled` gives it
    // the site's one disabled look, and the busy check above refuses a second send.
    this.setAttribute('aria-busy', 'true');
    if (btn) {
      btn.setAttribute('aria-disabled', 'true'); btn.classList.add('disabled');
      btn.dataset.label = btn.textContent; btn.textContent = copy('form_sending');
    }

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new URLSearchParams(new FormData(form)),
      });
      if (!res.ok) {
        // The server's message is written FOR THE VISITOR ("Email is required"), and it used to be
        // thrown away here in favour of a generic line — so the one thing that said what was
        // actually wrong never reached the reader.
        let payload = {};
        try { payload = await res.json(); } catch { /* not JSON — fall back to the generic message */ }
        throw Object.assign(new Error(payload.error || ''), { field: payload.field });
      }
      // [owner 2026-08-28] RESET, do not REPLACE. This used to do `form.replaceWith(note)`, so a
      // successful send destroyed the form — the visitor could not send a second message, and the
      // page jumped as a tall element became a short one. The outcome is a toast plus the line below
      // the button now, and the form stays where it is with its fields cleared.
      form.reset();
      this.outcome(form, copy('form_sent'));
      // [owner 2026-08-28] RESTORE THE BUTTON. It never had to be restored while success REPLACED
      // the form — the disabled "Sending…" button went with it. Now the form stays, so a successful
      // send left a dead button behind and a second message could not be written.
      this.ready(btn);
    } catch (err) {
      const message = err.message || copy('form_send_failed');
      // A named field gets marked in place AND focused — the browser does that for its own
      // validation, and a server error the visitor has to go hunting for is worse than one it does.
      // A named field is still marked in place and focused — the message belongs AT the thing that
      // is wrong, and the browser does the same for its own validation. Only the FORM-level failure
      // (no field named) becomes an outcome: a toast plus the line, with nothing moving.
      const control = err.field ? this.markField(form, err.field, message) : null;
      if (control) control.focus();
      else this.outcome(form, message, { error: true });
      this.ready(btn);
    }
  }

  /** Back from "Sending…" — both outcomes need it now that the form survives a success. */
  ready(btn) {
    this.setAttribute('aria-busy', 'false');
    if (btn) {
      btn.removeAttribute('aria-disabled'); btn.classList.remove('disabled');
      btn.textContent = btn.dataset.label || copy('form_submit_fallback');
    }
  }
}

customElements.define('movelli-form', MovelliForm);
