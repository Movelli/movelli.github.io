/**
 * THE SKIP LINKS CLOSE EVERY OPEN DIALOG.
 *
 * [owner 2026-09-25] Both skip links leave the chrome — one to the main content, one to the site's
 * navigation in the footer — and both targets sit outside every dialog. So using one closes them
 * all, and the visitor is not left reading the page through an open conversation.
 *
 * [hard, owner] IT BELONGS TO THE APP SHELL, NOT TO ANY COMPONENT. *"Components should not add a
 * skip to me link to the document by themself… they shouldn't know anything about skip links that
 * live outside them."* The shell knows which skip links exist and where their targets are, so it
 * can state the simple rule. This replaces the document click listener the assistant used to hold,
 * with the page's skip-link selector in it, deleted on 2026-09-25.
 *
 * [hard] THE TWO LINKS, BY id, AND NO OTHERS. Naming them rather than finding every link in the
 * skip-link bar is what keeps a third link from inheriting a behaviour nobody chose — one that
 * pointed INSIDE a dialog would close its own target.
 *
 * [hard] THE ASSISTANT IS CLOSED THROUGH ITS OWN DOOR, `close({ moveFocus: false })` — it closes its own menu and ends its own state, and nothing
 * here moves focus, so the link's own jump puts it on the target, which is what a skip link needs. Any other dialog gets a plain close().
 * The known cost: the next component with a dialog that must close differently is called by its own API here too.
 *
 * [2026-10-06] ONE GAP, MEASURED AND NOT FIXED: on the full-screen sheet the assistant steps back over
 * its history entry when its dialog closes, and that undoes the link's jump on a scrolled page — focus
 * still lands on the target. Which of the two gives way is the owner's call; the todo is in CLAUDE.md,
 * after the struck one for this file.
 *
 * [owner 2026-10-06] Its own file, imported by main.js. No DOMContentLoaded wait: a module script is
 * deferred, so the links are parsed before this runs.
 */
const closeEveryDialog = () => {
  // The assistant is closed through its own door, which lets it keep focus where the link puts it; any other dialog is closed plainly.
  document.querySelector('movelli-assistant')?.close({ moveFocus: false, keepHistory: true });
  document.querySelectorAll('dialog').forEach((d) => { if (!d.closest('movelli-assistant')) d.close(); });
};

document.getElementById('skip-to-content')?.addEventListener('click', closeEveryDialog);
document.getElementById('skip-to-navigation')?.addEventListener('click', closeEveryDialog);
