/**
 * [owner 2026-10-14] WHAT A VIDEO FILE MAY BE. One rule, read in two places (the CMS before it uploads, the function when it receives the file): a video is an MP4 with H.264 video, and
 * at most `VIDEO_MAX_BYTES`. H.265 (an iPhone's default), WebM and the rest are refused, because only H.264 plays in every browser. No resolution or duration limit: the size is the thing
 * that matters, and the size is the limit.
 *
 * It reads only the box headers and the `moov` box of the MP4, never the picture, so it works on a file of 22 MB in a few milliseconds and needs no dependency.
 * `read(start, end)` returns the bytes from `start` up to `end` as a Uint8Array, so a browser File (`slice`) and a Node Buffer (`subarray`) both fit.
 */

/** The largest video file: the CMS function takes it in one request (the file travels as base64, a third larger, under Google's 32 MB request limit). */
export const VIDEO_MAX_BYTES = 22 * 1024 * 1024;
/** The largest video that may load at once (`eager`): bigger files load only when played, or when an autoplay clip nears the screen. */
export const VIDEO_EAGER_MAX_BYTES = 2 * 1024 * 1024;
/** The only kind of file a video may be, in words a marketer can act on. The CMS shows its own copy of it; the function's refusal says the same. */
export const VIDEO_REFUSAL = 'Only MP4 (H.264) video is allowed, up to 22 MB.';

const ascii = (b, at) => String.fromCharCode(b[at], b[at + 1], b[at + 2], b[at + 3]);
const view = (b) => new DataView(b.buffer, b.byteOffset, b.byteLength);

/** The boxes in `bytes[start, end)`: `{ type, start, body, end }`, where `body` is where the box's content starts. */
function boxes(bytes, start = 0, end = bytes.length) {
  const out = [];
  const dv = view(bytes);
  let at = start;
  while (at + 8 <= end) {
    let size = dv.getUint32(at);
    let body = at + 8;
    if (size === 1) {                                   // a 64-bit size follows the type
      if (at + 16 > end) break;
      size = Number(dv.getBigUint64(at + 8));
      body = at + 16;
    } else if (size === 0) size = end - at;             // the box runs to the end of the file
    if (size < body - at || at + size > end) break;
    out.push({ type: ascii(bytes, at + 4), start: at, body, end: at + size });
    at += size;
  }
  return out;
}
const child = (bytes, box, type) => boxes(bytes, box.body, box.end).find((b) => b.type === type);
const children = (bytes, box, type) => boxes(bytes, box.body, box.end).filter((b) => b.type === type);

/**
 * @param {(start:number, end:number) => Promise<Uint8Array>} read
 * @param {number} size  the file's size in bytes
 * @returns {Promise<{ ok: true, width: number, height: number, duration: number } | { ok: false, why: 'too-big' | 'not-h264' }>}
 */
export async function inspectVideo(read, size) {
  if (size > VIDEO_MAX_BYTES) return { ok: false, why: 'too-big' };
  const refuse = { ok: false, why: 'not-h264' };
  try {
    // The top-level boxes, by their headers only: `ftyp` first, then `moov` wherever it sits (at the start for a file made for the web, at the end otherwise).
    let at = 0, ftyp = false, moov = null;
    while (at + 8 <= size && !moov) {
      const head = await read(at, Math.min(at + 16, size));
      const dv = view(head);
      let len = dv.getUint32(0);
      if (len === 1) len = Number(dv.getBigUint64(8));
      else if (len === 0) len = size - at;
      const type = ascii(head, 4);
      if (at === 0 && type !== 'ftyp') return refuse;
      if (type === 'ftyp') ftyp = true;
      if (len < 8 || at + len > size) return refuse;
      if (type === 'moov') moov = await read(at, at + len);
      at += len;
    }
    if (!ftyp || !moov) return refuse;
    const root = boxes(moov)[0];
    const mvhd = child(moov, root, 'mvhd');
    const dvm = view(moov);
    let duration = 0;
    if (mvhd) {
      const v1 = moov[mvhd.body] === 1;
      const scale = dvm.getUint32(mvhd.body + (v1 ? 20 : 12));
      const length = v1 ? Number(dvm.getBigUint64(mvhd.body + 24)) : dvm.getUint32(mvhd.body + 16);
      duration = scale ? length / scale : 0;
    }
    for (const trak of children(moov, root, 'trak')) {
      const mdia = child(moov, trak, 'mdia');
      const hdlr = mdia && child(moov, mdia, 'hdlr');
      if (!hdlr || ascii(moov, hdlr.body + 8) !== 'vide') continue;             // an audio or text track
      const stsd = child(moov, child(moov, child(moov, mdia, 'minf') || mdia, 'stbl') || mdia, 'stsd');
      if (!stsd) return refuse;
      const format = ascii(moov, stsd.body + 12);                                // the first sample entry: after version+flags (4), the count (4) and the entry's size (4)
      if (format !== 'avc1' && format !== 'avc3') return refuse;                 // hvc1/hev1 (H.265), av01, vp09 …
      const tkhd = child(moov, trak, 'tkhd');
      let width = 0, height = 0;
      if (tkhd) {
        const at2 = tkhd.body + (moov[tkhd.body] === 1 ? 88 : 76);              // width and height, 16.16 fixed point, last in the box
        width = Math.round(dvm.getUint32(at2) / 65536);
        height = Math.round(dvm.getUint32(at2 + 4) / 65536);
      }
      return { ok: true, width, height, duration };
    }
    return refuse;
  } catch { return refuse; }
}

/** A browser File. */
export const inspectFile = (file) => inspectVideo(async (a, b) => new Uint8Array(await file.slice(a, b).arrayBuffer()), file.size);
/** A Node Buffer. */
export const inspectBuffer = (buf) => inspectVideo(async (a, b) => buf.subarray(a, b), buf.length);
