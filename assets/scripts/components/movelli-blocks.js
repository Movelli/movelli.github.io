/**
 * Passive content components.
 *
 * Every page component (each content block + the page scaffolding) is a light-DOM
 * `<movelli-*>` custom element wrapping server-rendered semantic HTML. These have
 * no behaviour yet — registering them just makes them real, upgradeable web
 * components and the shared library the AI will also generate. Client-side
 * render-from-config (so the AI can *emit* these) lands with the generative layer;
 * per-component behaviour (e.g. hero image loading) can attach to the base class.
 *
 * The five with BEHAVIOUR define themselves in their own files — `movelli-card`,
 * `-comparison-table`, `-video`, `-form`, `-related-pages` — and the guard below skips them. (This
 * line named `-compare`, `-proscons` and `-cards` until 2026-09-16: two renames and a component that
 * no longer exists, in the header of the file whose whole point is that lists like it erode.
 * [2026-10-06] And `-menu` and `-ask` until today, three weeks after the first went with the menu
 * panel and two after the second went into `<movelli-assistant>`. `-faq` went the same day: the
 * browser's own `<details name>` does its one job, so it is registered here now.)
 * CSS gives every `<movelli-*>` `display:block`.
 */
import { catalog, baseName } from '../catalog/catalog.mjs';
import { layoutNames } from '../catalog/generated/layouts.mjs';

class MovelliBlock extends HTMLElement {}

/**
 * [hard, owner 2026-09-05] THE LIST IS DERIVED FROM THE CATALOG, not kept by hand.
 *
 * It WAS a hand-written array, and it eroded exactly as this codebase's other hand-kept lists did:
 * five components rendered a tag that was never registered, for months, and a sixth stayed listed
 * eleven days after nothing emitted it. Nothing broke either time — an unknown hyphenated element is
 * still an HTMLElement and the CSS styles it — which is precisely why nobody noticed.
 *
 * It costs NOTHING to derive. `catalog.mjs` is already in the module graph — `renderers.mjs` imports
 * it, and that is loaded because proactive.js and input.js render components in the browser —
 * so this adds no bytes. It is imported from the CATALOG rather than from `renderers.mjs` because
 * what this file needs is the DATA (the component keys), not the render functions.
 *
 * [2026-09-07] It used to import `flatten-presets.mjs`, the PROCESSOR — which is what put the two
 * hand-edited catalogs and the flattening code in every visitor's browser. `catalog.mjs` reads the
 * GENERATED data instead; the processor is build-only now and is deleted from `public/`.
 *
 * [hard] THE `customElements.get` GUARD IS WHAT MAKES THIS SAFE, and it is load-bearing rather than
 * defensive. Five components carry real behaviour and define themselves in their own files —
 * card, comparison-table, video, form, related-pages — and a second define() for one name THROWS.
 * `main.js` imports this file last of the components, so those are already defined and skipped.
 * Deriving turns "deliberately absent from the list" into a mechanism instead of an absence nobody
 * could explain: before this, five catalog components were missing from the array and only
 * movelli-video had a comment saying why.
 *
 * PRESETS ARE EXCLUDED: `card--index` is a configuration of `card`, not an element of its own,
 * and `<movelli-card--index>` is emitted nowhere. `baseName` is the catalog's own splitter.
 *
 * There is NO chrome exception. `movelli-breadcrumb` was the last one — the single chrome element
 * with no behaviour and therefore no file of its own — and it stopped being a web component on
 * 2026-09-05, deliberately just before this. `movelli-assistant` is chrome too and is NOT in the catalog,
 * but it defines itself, so it never needed this file. *(`movelli-menu` was the other one, deleted
 * with the menu panel on 2026-09-19.)*
 */
const TAGS = Object.keys(catalog)
  .filter((key) => baseName(key) === key)      // a preset is a configuration, not an element
  .map((key) => `movelli-${key}`)
  // [2026-10-03] …and every LAYOUT, from the generated list of their names (the layout catalog is
  // build-only). A layout has no behaviour either; registered, it is a real web component like the rest.
  .concat(layoutNames.map((name) => `movelli-${name}`));

for (const tag of TAGS) {
  if (!customElements.get(tag)) customElements.define(tag, class extends MovelliBlock {});
}
