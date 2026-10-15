import { modules as B_main } from '/_assets/scripts/main.f8dbaa93.js';
import { modules as B_renderer } from '/_assets/scripts/renderer.74bb12d9.js';
const M0 = {};
const M1 = {};
(() => {
const { renderComponent } = B_renderer["render/renderers.mjs"];
const { esc } = B_renderer["catalog/esc.mjs"];
const { pluralize } = B_main["copy-data.mjs"];
Object.assign(M0, { pathToQuery });
const MAX_CARDS = 3;
const MAX_WORDS = 12;
function pathToQuery(pathname) {
const words = String(pathname || '')
.replace(/\.[a-z0-9]{1,5}$/i, '')
.split(/[/\-_.]+/)
.filter((w) => /[a-z]/i.test(w));
return words.length && words.length <= MAX_WORDS ? words.join(' ') : '';
}
class MovelliRelatedPages extends HTMLElement {
connectedCallback() {
if (this.searched) return;
this.searched = true;
this.search().catch(() => { });
}
async search() {
const query = pathToQuery(location.pathname);
if (!query) return;
let components;
try {
const res = await fetch('/ask', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ query, output: 'components', model: false, limit: MAX_CARDS }),
});
if (!res.ok) return;
({ components } = await res.json());
} catch {
return;
}
const cards = (components || []).filter((c) => c && typeof c.type === 'string' && c.type.split('--')[0] === 'card');
if (!cards.length) return;
const forms = Object.fromEntries([['one', this.dataset.leadOne], ['other', this.dataset.leadOther]]
.filter(([, text]) => text != null));
const lead = forms.other != null ? pluralize(forms, cards.length) : '';
this.querySelector('.related-pages__body').innerHTML =
(lead ? renderComponent({ type: 'prose', html: `<p>${esc(lead)}</p>` }) : '')
+ cards.map((c) => renderComponent(c)).join('');
this.hidden = false;
}
}
customElements.define('movelli-related-pages', MovelliRelatedPages);
})();
(() => {
})();
export const modules = { };
