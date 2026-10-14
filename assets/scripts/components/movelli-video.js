/**
 * <movelli-video> — say so when the video cannot play, instead of showing dead controls.
 *
 * The element is fully server-rendered and works with no JS. This upgrade only handles the case
 * where the file is not there: offline, or a source that 404s. Without it the visitor gets a black
 * box with a control bar that does nothing when pressed, which reads as a broken site rather than
 * as a missing file.
 *
 * [owner 2026-09-01] The copy is "Video not available", NOT "not available offline" — the same state
 * is reached with a working connection and a missing file, and a message that names a cause it does
 * not know is worse than one that does not.
 *
 * TWO triggers, because one is not enough:
 *   · OFFLINE, up front. Our clips carry `preload="none"`, so the browser requests nothing until
 *     someone presses play — there is no failure to wait for. (Video can never be cached either: a
 *     <video> fetches with RANGE requests, which return 206, and `cache.put` rejects a partial
 *     response. See sw.js.)
 *   · The `error` event, as the backstop for a source that is missing while online. It is listened
 *     for on the <video> AND on its <source> children: a <source> that fails fires `error` on
 *     ITSELF and does not bubble, and the <video>'s own error only fires once every source is
 *     exhausted.
 *
 * It is reversible: `online` restores the video, so a visitor who reconnects gets it back without
 * reloading.
 */
import { copy } from '../copy-data.mjs';
import { loadWhenNear } from '../load-when-near.mjs';

const LABEL = copy('video_unavailable');

class MovelliVideo extends HTMLElement {
  connectedCallback() {
    this.video = this.querySelector('video');
    if (!this.video) return;
    // Bound for this connection only — moving the element disconnects and reconnects it, and the
    // listeners go with the first and come back with the second. See the component checklist.
    this.listening?.abort();
    this.listening = new AbortController();
    const { signal } = this.listening;

    const fail = () => this.setUnavailable(true);
    this.video.addEventListener('error', fail, { signal });
    // A <source>'s error does NOT bubble, so each one is listened to directly.
    for (const s of this.video.querySelectorAll('source')) s.addEventListener('error', fail, { signal });

    window.addEventListener('offline', () => this.setUnavailable(true), { signal });
    window.addEventListener('online', () => this.setUnavailable(false), { signal });

    if (!navigator.onLine) this.setUnavailable(true);
    loadWhenNear(this.video, signal);   // an autoplay clip waits for the screen
  }

  disconnectedCallback() { this.listening?.abort(); }

  /**
   * The placeholder REPLACES the video visually but never removes it from the DOM: the element keeps
   * its sources, its captions and its poster, so restoring is a class toggle rather than a rebuild.
   * The poster is painted as the placeholder's own background, so the frame keeps its picture and
   * only the dead controls go.
   */
  setUnavailable(on) {
    const frame = this.querySelector('.video__frame');
    if (!frame || this.unavailable === on) return;
    this.unavailable = on;
    frame.classList.toggle('video__frame--unavailable', on);

    if (!on) { this.note?.remove(); this.note = null; return; }

    const poster = this.video.getAttribute('poster');
    // A url() inside a style attribute needs SINGLE quotes, and any apostrophe percent-encoded —
    // double quotes would close the attribute early. Same trap the hero's poster records.
    if (poster) frame.style.setProperty('--video-poster', `url('${poster.replace(/'/g, '%27')}')`);

    this.note = document.createElement('p');
    this.note.className = 'video__unavailable';
    this.note.textContent = LABEL;              // never innerHTML — one engine constant, still text
    frame.append(this.note);
  }
}

customElements.define('movelli-video', MovelliVideo);
