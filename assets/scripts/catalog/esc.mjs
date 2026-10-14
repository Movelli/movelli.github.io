/**
 * ESCAPE FOR HTML OUTPUT — the one copy.
 *
 * [hard] Content is authored through the CMS by humans AND by AI, so every emitter treats it as
 * untrusted and escapes at the OUTPUT boundary. See § Output escaping: a text or attribute value is
 * `esc()`'d, a rich-text field goes through `sanitizeHtml` instead, and a URL through `safeUrl`.
 *
 * It escapes the QUOTE as well as `& < >`, which is what makes one function serve both text and
 * attribute position — a `figure`'s `alt` and a `banner`'s label are content fields that land inside
 * an attribute, and entities decode identically either way.
 *
 * [owner 2026-09-07] IT LIVES HERE BECAUSE THERE WERE THREE COPIES — `renderers.mjs`, the Cloud
 * Function and the MCP app each carried their own, each with a comment explaining why it had to be
 * local. The reason was always the same (the module must stay dependency-free and usable in four
 * runtimes) and it is satisfied by a dependency-free module rather than by three copies.
 */
export const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
