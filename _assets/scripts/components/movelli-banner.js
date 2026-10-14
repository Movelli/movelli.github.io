/**
 * <movelli-banner> — a band whose background is a clip loads the clip as it nears the screen (`load-when-near.mjs`). A band with an image has nothing to do. Server-rendered and complete without JavaScript:
 * until the clip loads, and always without JavaScript, the band shows its poster.
 */
import { loadWhenNear } from '../load-when-near.mjs';

class MovelliBanner extends HTMLElement {
  connectedCallback() {
    const video = this.querySelector('video');
    if (!video) return;
    // Bound for this connection only — moving the element disconnects and reconnects it.
    this.listening?.abort();
    this.listening = new AbortController();
    loadWhenNear(video, this.listening.signal);
  }

  disconnectedCallback() { this.listening?.abort(); }
}

customElements.define('movelli-banner', MovelliBanner);
