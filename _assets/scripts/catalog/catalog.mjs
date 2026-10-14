/**
 * THE CATALOG, AS EVERY RUNTIME SEES IT — the flattened data plus the helpers that read it.
 *
 * [decided 2026-09-03, owner; built 2026-09-07] The shape is
 *
 *   source/components-catalog.mjs · source/templates-catalog.mjs
 *                                                      the DATA. Hand-edited. `.mjs` because they
 *                                                      are heavily commented and JSON has none.
 *         ↓  source/flatten-presets.mjs — the PROCESSOR. A BUILD STEP. Never shipped.
 *   generated/components-catalog.mjs                   GENERATED. Literals, no imports. The
 *                                                      COMPONENTS only — see `source/templates.mjs`.
 *         ↓
 *   THIS FILE                                          what every runtime imports: the build, the
 *                                                      browser, both MCP apps — and, since
 *                                                      2026-09-07, the CLOUD FUNCTION, which
 *                                                      replies with components and so must check
 *                                                      one against the library before it does.
 *                                                      Each gets its own PROJECTION of the
 *                                                      generated data, never a different file.
 *
 * It holds no data of its own: it re-exports what the processor produced and adds the four helpers
 * that read it. That is the *data and code are never in one file* rule applied to the catalog — the
 * generated half is a file of literals, this half is code.
 */

import { catalog, PRESET_SEP } from './generated/components-catalog.mjs';

export { catalog, PRESET_SEP };

/*
 * [owner 2026-10-05] `acceptsChildren`, `acceptsChildren()` and `childAllowed()` went with the last component that
 * took children: the card grid and the slider arrange their cards as LAYOUTS now, in a list slot
 * (`docs/record/layouts.md`). A component holds other components only in its SLOTS.
 */

/**
 * The BASE component a type names. `prose--standfirst` → `prose`.
 *
 * Grounding and rendering are properties of the COMPONENT, not of the configuration — turning
 * `refs` into cards is what a card grid or a slider does, and a preset only changes default values,
 * such as a title. So both the renderer switch and the AI's grounding chain dispatch on this
 * rather than gaining an entry per preset.
 */
export const baseName = (type) => String(type == null ? '' : type).split(PRESET_SEP)[0];

/*
 * HOW ONE RECORD BECOMES ONE CARD is `LISTING_CARD`, and it lives in `templates.mjs` — it is authored
 * in `templates-catalog.mjs`, so it is TEMPLATE data, and [owner 2026-09-07] no data from that file
 * belongs in a generated runtime file. It rode here until 2026-09-07 with nothing shipped reading it.
 */
