/**
 * ONE RETRIEVED RESULT → ONE CARD CONFIG.
 *
 * A MAPPING, not a renderer — the AI-surface twin of `LISTING_CARD`, which says how one collection
 * RECORD becomes one card. It lives here for the same reason the checks do: three runtimes need it
 * and none of them can reach the others.
 *
 * [owner 2026-09-07] IT WAS TWO HAND-TYPED COPIES. `nlweb-core.js` wrote `{type, thumb, url, title,
 * summary}` and `mcp-app.js` wrote the same six field names again inside its handshake — so a
 * card's shape lived in the Cloud Function and in a template literal, neither of which reads the
 * component library. That is the duplication the whole change is about, in its smallest form.
 *
 * WHAT IS ESCAPED HERE, and why the producer rather than the renderer: `title` and `summary`
 * are CONTENT, which the renderer emits VERBATIM on the contract that whoever built the config made
 * it safe. These values come from retrieved data and are rendered client-side through `innerHTML`,
 * so a result whose title carried a `<` would otherwise inject markup.
 *
 * [owner 2026-10-08] THE CARD HAS NO "Read more" LINK any more — the whole card is the link — so there is no label to
 * invent: it used to come from the preset's declared default, and before that it was five string literals in five files.
 */

import { esc } from './esc.mjs';

/**
 * @param {object} r        a schema.org result (`toSchemaResult`) — `@type`, name, url, description
 * @param {string} [preset] the card preset to use; otherwise chosen from what the result IS
 */
export function resultCard(r, preset) {
  // [owner 2026-10-08] ONE CARD, whatever the result is: the plain card. A caller may still name a preset, which is what
  // `output: 'components'` lets a consumer do.
  const p = preset || 'card';
  return {
    type: p,
    variant: ['no-thumb'],
    url: r.url,
    title: esc(r.name),
    summary: esc(r.description || ''),
  };
}

/** The card presets a caller may name. DERIVED, so it cannot drift from the catalog. */
export const cardPresets = (catalog) =>
  new Set(Object.keys(catalog).filter((k) => k.startsWith('card--')));
