/**
 * THE FIELD TYPES A FORM MAY USE — one list, read by the build (an unknown type fails it, so a typo cannot render a plain text box
 * that nothing validates) and by the Cloud Function's `forms-core.js` (which has a validator entry for each, and refuses to load if
 * the two disagree). It lives here, in the engine's own `src/scripts/`, and not in `functions/`, because the build must run on a
 * fresh clone: `functions/` holds copies the build writes near its end, so nothing the build loads early may live there
 * (owner 2026-10-08, E1). The build copies this file into `functions/`, like `copy.mjs`.
 */
export const FIELD_TYPE_NAMES = ['text', 'textarea', 'tel', 'hidden', 'select', 'radio', 'checkbox', 'email', 'url', 'number', 'datetime-local'];
