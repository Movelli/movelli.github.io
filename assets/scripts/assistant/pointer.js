/**
 * IS THIS A TOUCH DEVICE? One definition, in one place.
 *
 * `(pointer: coarse)` asks about the PRIMARY pointer, so a phone is coarse and a laptop is fine
 * whether or not its screen happens to be a touchscreen. A convertible can flip mid-session, which
 * is why this is the live `MediaQueryList` and not a boolean read once at import.
 *
 * [hard, 2026-09-23] IT IS A MODULE BECAUSE THE COMMENT ALREADY CLAIMED IT WAS. Three callers asked
 * this question and each wrote the media query out as a literal — and `clear-history.js`'s own
 * comment said they used *"the same `(pointer: coarse)` test … so there is one definition of 'this
 * is a touch device'"*. There wasn't; there were three, and a fourth was about to be written. That
 * is this codebase's most-recorded failure shape: a rule stated in prose beside code that does not
 * enforce it.
 *
 * [hard] WHAT IT IS REALLY STANDING IN FOR IS "WILL FOCUSING A FIELD SUMMON A KEYBOARD", and there
 * is no test for that. `navigator.virtualKeyboard` exists in Chromium only — not in Safari, which
 * is the platform where it matters most — so the primary pointer is the honest proxy: the devices
 * whose primary pointer is a finger are the devices with an on-screen keyboard. Anything reading
 * this should be written so that a wrong answer is a small disappointment, never a broken surface.
 */
export const POINTER_COARSE = matchMedia('(pointer: coarse)');

/** True where the primary pointer is a finger — so, where focusing a field opens a keyboard. */
export const isTouch = () => POINTER_COARSE.matches;
