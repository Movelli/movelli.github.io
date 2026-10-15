import { modules as B_main } from '/_assets/scripts/main.f8dbaa93.js';
const M0 = {};
const M1 = {};
const M2 = {};
(() => {
Object.assign(M0, { toast, dismiss });
const region = () => document.getElementById('app-toast');
let current = null;
function toast(message, { actionLabel, onAction, duration = 4000, variant } = {}) {
const r = region();
if (!r) return;
dismiss();
const el = document.createElement('div');
el.className = variant === 'error' ? 'toast toast--error' : 'toast';
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
const { toast } = M0;
const { copy, copyForms, fill, pluralize } = B_main["copy-data.mjs"];
const DATE_TYPES = new Set(['date', 'time', 'datetime-local', 'month', 'week']);
class MovelliForm extends HTMLElement {
connectedCallback() {
const form = this.querySelector('form');
if (!form) return;
this.listening?.abort();
this.listening = new AbortController();
const { signal } = this.listening;
this.resolveNow(form);
form.noValidate = true;
form.addEventListener('submit', (e) => this.onSubmit(e, form), { signal });
form.addEventListener('input', (e) => { this.clearField(e.target); this.markEmpty(e.target); }, { signal });
form.addEventListener('change', () => this.clearOutcome(form), { signal });
for (const el of form.elements) this.markEmpty(el);
}
disconnectedCallback() { this.listening?.abort(); }
markEmpty(el) {
if (!el || !DATE_TYPES.has(el.type)) return;
el.toggleAttribute('data-empty', !el.value);
}
resolveNow(form) {
const pad = (n) => String(n).padStart(2, '0');
const d = new Date();
const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
for (const el of form.querySelectorAll('[data-min="now"]')) {
el.min = el.type === 'datetime-local' ? `${date}T${pad(d.getHours())}:${pad(d.getMinutes())}` : date;
}
}
fieldLabel(control) {
const group = control.closest('fieldset.form__group--options');
const el = group ? group.querySelector('legend') : (control.labels && control.labels[0]);
return el ? el.textContent.replace(/\s*\*\s*$/, '').trim() : (control.name || copy('form_field_fallback'));
}
messageFor(control) {
const v = control.validity;
const name = this.fieldLabel(control);
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
if (v.tooShort) return fill(pluralize(copyForms('form_error_minlength'), control.minLength), control.minLength);
if (v.tooLong) return fill(pluralize(copyForms('form_error_maxlength'), control.maxLength), control.maxLength);
if (v.badInput) return fill(copy('form_error_unreadable'), name);
if (v.patternMismatch) return fill(copy('form_error_pattern'), name);
return control.validationMessage || fill(copy('form_error_generic'), name);
}
invalidControls(form) {
const seen = new Set();
const out = [];
for (const el of form.elements) {
if (!el.name || el.name[0] === '_' || el.disabled || el.willValidate === false) continue;
if (el.checkValidity()) continue;
if (seen.has(el.name)) continue;
seen.add(el.name);
out.push(el);
}
for (const fs of form.querySelectorAll('fieldset[data-required="true"]')) {
const boxes = [...fs.querySelectorAll('input[type="checkbox"]')];
if (!boxes.length || boxes.some((b) => b.checked) || seen.has(boxes[0].name)) continue;
seen.add(boxes[0].name);
out.push(boxes[0]);
}
return out;
}
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
errorId(form, name) { return `f-${form.elements._form.value}-${name}-error`; }
clearErrors(form) {
for (const p of this.querySelectorAll('.form__error, .form__field-error')) p.remove();
for (const el of form.querySelectorAll('[aria-invalid]')) {
el.removeAttribute('aria-invalid');
const ids = (el.getAttribute('aria-describedby') || '').split(' ').filter((id) => !id.endsWith('-error'));
if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
else el.removeAttribute('aria-describedby');
}
}
markField(form, name, message) {
const el = form.elements[name];
const control = el instanceof RadioNodeList ? el[0] : el;
if (!control) return null;
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
clearOutcome(form) { form.querySelector('.form__outcome')?.remove(); }
outcome(form, message, { error = false } = {}) {
const btn = form.querySelector('button[type="submit"]');
let line = form.querySelector('.form__outcome');
if (!line) {
line = document.createElement('p');
line.setAttribute('role', 'status');
if (btn) btn.insertAdjacentElement('afterend', line);
else form.append(line);
}
line.className = error ? 'form__outcome form__outcome--error' : 'form__outcome';
line.textContent = message;
toast(message, error ? { variant: 'error' } : {});
}
async onSubmit(e, form) {
e.preventDefault();
if (this.getAttribute('aria-busy') === 'true') return;
const btn = form.querySelector('button[type="submit"]');
this.clearErrors(form);
const bad = this.invalidControls(form);
if (bad.length) {
for (const el of bad) this.markField(form, el.name, this.messageFor(el));
bad[0].focus();
return;
}
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
let payload = {};
try { payload = await res.json(); } catch { }
throw Object.assign(new Error(payload.error || ''), { field: payload.field });
}
form.reset();
this.outcome(form, copy('form_sent'));
this.ready(btn);
} catch (err) {
const message = err.message || copy('form_send_failed');
const control = err.field ? this.markField(form, err.field, message) : null;
if (control) control.focus();
else this.outcome(form, message, { error: true });
this.ready(btn);
}
}
ready(btn) {
this.setAttribute('aria-busy', 'false');
if (btn) {
btn.removeAttribute('aria-disabled'); btn.classList.remove('disabled');
btn.textContent = btn.dataset.label || copy('form_submit_fallback');
}
}
}
customElements.define('movelli-form', MovelliForm);
})();
(() => {
})();
export const modules = { };
