/**
 * ONE CONFIG, MADE READY AND CHECKED — everything `renderComponent` does before it renders.
 *
 * [decided 2026-09-03, owner] THE COMPONENT CHECK RUNS ONCE, at the one point every path passes
 * through: the page build, a derived listing, the AI chat's configs and both MCP apps. Before that,
 * only the AUTHORED path was checked, so a derived config could ship an unknown key, a raw
 * `id="Not A Slug"` or an unexpanded `sponsor:` ref (a dead commercial link with no sponsored
 * disclosure) with nothing to say so.
 *
 * [owner 2026-09-07] IT IS ITS OWN MODULE BECAUSE THE CLOUD FUNCTION RUNS EXACTLY THIS AND STOPS.
 * The function replies with the site's own components as CONFIGURATION — the client renders it,
 * which is what lets the streamed reveal, the web-component upgrade and the link handling work — so
 * a function returning HTML would break the chat client. It has no use for a renderer, and every use
 * for the rules. Splitting the shared half out is what lets it answer them *before* it replies:
 * "an error in the cloud and not in browser" (owner).
 *
 * It is NOT a second check. `renderComponent` remains the single choke point; this only moves where
 * the check runs FIRST, the way the build checks a page before writing it. The function runs it on
 * its own output, so a config it built wrong never leaves the server.
 */

import { catalog } from './catalog.mjs';
import { checkComponent } from './checks-component.mjs';

/**
 * Apply the CONFIG defaults the catalog declares for keys this config does not set.
 *
 * [2026-09-04] The resolver already did this for an AUTHORED config, and a config built in code
 * skipped it — so a producer naming `card--index` got the preset's TYPE and none of its
 * configuration, and had to restate by hand what the preset already says. That is the same
 * one-path argument that put `checkComponent` here: this is the point every path goes through.
 *
 * CONFIG only. A content default is per LOCALE and a renderer has no locale, so content stays with the resolver.
 */
export function withConfigDefaults(cfg) {
  const declared = (catalog[cfg.type] || {}).config || {};
  let out = cfg;
  for (const [key, def] of Object.entries(declared)) {
    if (def && 'default' in def && !(key in cfg)) {
      if (out === cfg) out = { ...cfg };
      out[key] = def.default;
    }
  }
  // [owner 2026-10-02] AND INTO SLOTS — the components inside a component. A slot's components are rendered by
  // their parent, never on their own, so this is the one place they would get their defaults. (A list
  // container's `children` had the same pass until 2026-10-05, when the card grid and the slider became layouts.)
  if (cfg.slots && typeof cfg.slots === 'object') {
    // Built with `Object.fromEntries`, which DEFINES each key: assigning `slots[name]` with a name of
    // `__proto__` set the new object's prototype instead, and the slot hid from every check after.
    const one = (stack) => (stack && Array.isArray(stack.components)
      ? { ...stack, components: stack.components.map((k) => (k && typeof k === 'object' ? withConfigDefaults(k) : k)) }
      : stack);
    const slots = Object.fromEntries(Object.entries(cfg.slots).map(([name, slot]) => [name, one(slot)]));
    if (out === cfg) out = { ...cfg };
    out.slots = slots;
  }
  return out;
}

/**
 * A config with the catalog's defaults applied and both checks passed — or `null` when it is not a
 * config at all. THROWS on anything the catalog refuses; the caller decides what that means (the
 * build fails, the function substitutes a note).
 */
export function prepareComponent(input) {
  if (!input || typeof input !== 'object') return null;
  const cfg = withConfigDefaults(input);
  check(cfg);
  return cfg;
}

/**
 * The check, on a component AND ON EVERY COMPONENT IN ITS SLOTS.
 *
 * [hard] THE RECURSION IS THE POINT FOR THE CLOUD FUNCTION. `renderComponent` reaches a slot's component by
 * rendering it, so checking the outer one alone is enough there — the inner one is checked a moment
 * later, in the same call stack. The function does not render, so without this it would check a banner
 * and ship a component in its slot the catalog refuses, and the refusal would happen in the visitor's
 * browser. That is the recorded incident exactly: "the AI's grid carried a child the layout check rightly
 * refused, `renderElement` threw, and the turn died".
 *
 * It costs the build nothing and changes no output: the inner one is checked earlier rather than twice
 * over, against the same rules, and `withConfigDefaults` has already filled it in.
 */
function check(cfg) {
  checkComponent(cfg, catalog);
  if (cfg.slots && typeof cfg.slots === 'object') {
    for (const slot of Object.values(cfg.slots)) {
      for (const kid of (slot && slot.components) || []) if (kid && typeof kid === 'object') check(kid);
    }
  }
}
