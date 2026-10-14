// [owner 2026-10-09] THE RESERVED MEDIA REF `media:placeholder`: what a page shows where its image is still missing.
// It is not a record in the media library (a CMS user could delete one), so it can never be created there either
// (`validateMedia` in generator/cms-model.js refuses the id). The image is one grey pixel as a data URI, so there is no file to ship.
// A page that shows it is a draft: a test fails the build's content if a published item names it.
export const PLACEHOLDER_ID = 'placeholder';
export const PLACEHOLDER_SRC = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGM4c+YMAATMAmU5mmUsAAAAAElFTkSuQmCC';
// The box a placeholder reserves, so the page does not shift when the real image arrives (a wide photo's ratio).
export const PLACEHOLDER_BOX = { width: 1600, height: 900 };
