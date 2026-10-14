/**
 * THE BROWSER'S COPY — GENERATED. Do not edit; edit `site.copy.json`.
 *
 * A browser cannot import JSON the way Node can, so the build writes this wrapper around it. Same
 * shape as `src/sw.js`'s cache version: the markers below are replaced by `generator/assets/copy.js`
 * on the way to `public/`, and the default between them keeps THIS file valid so the source tree
 * still parses and the tests can import it.
 *
 * [hard] IT CARRIES EVERY LOCALE (owner, 2026-09-07). A language switch then needs no mechanism, and
 * there is ONE version of every script rather than one per locale. It costs nothing: every script
 * that reads copy is in `main.js`'s single module graph, so the total is identical whether the
 * strings sit in one module or are split across the eight files that use them.
 */

import { makeCopy, fill, pluralize as pick } from './copy.mjs';

/* BUILD_INJECT:COPY */
const DATA = {
  "site_description": {
    "text": {
      "en-US": "Discover practical guides and comparisons for digital nomads. Compare top eSIMs, VPNs, borderless banking, and nomad insurance on Movelli."
    }
  },
  "site_tagline": {
    "text": {
      "en-US": "Digital Nomad Guides, eSIMs & Remote Work Tech"
    }
  },
  "chrome_skip_to_navigation": {
    "text": {
      "en-US": "Skip to navigation"
    }
  },
  "chrome_skip_to_content": {
    "text": {
      "en-US": "Skip to main content"
    }
  },
  "ai_component_error": {
    "text": {
      "en-US": "Something went wrong showing this part of my answer."
    }
  },
  "ai_deadend_offer": {
    "text": {
      "en-US": "Sorry, I couldn’t find anything. I’d still like to help: shall I ask someone to get back to you?"
    }
  },
  "ai_deadend_offer_yes": {
    "text": {
      "en-US": "Yes, please"
    }
  },
  "ai_deadend_offer_no": {
    "text": {
      "en-US": "No, thanks"
    }
  },
  "ai_deadend_declined": {
    "text": {
      "en-US": "No problem, I’m here if you have any other question."
    }
  },
  "ai_deadend_form_intro": {
    "text": {
      "en-US": "Just your name and how to reach you, and we’ll come back to you."
    }
  },
  "ai_deadend_prose": {
    "text": {
      "en-US": "I couldn’t find that in Movelli’s guides. Try rephrasing, or leave your details and a human will follow up:"
    }
  },
  "ai_results_intro": {
    "text": {
      "en-US": "Here’s what I found:"
    }
  },
  "mcp_no_results": {
    "text": {
      "en-US": "Unfortunately I couldn’t find anything on Movelli."
    }
  },
  "mcp_form_unavailable": {
    "text": {
      "en-US": "Sorry, this form is unavailable."
    }
  },
  "mcp_form_submitted": {
    "text": {
      "en-US": "Thanks, we’ll be in touch shortly."
    }
  },
  "assistant_input_landmark": {
    "text": {
      "en-US": "Assistant input"
    }
  },
  "chrome_feed_title": {
    "text": {
      "en-US": "Movelli — latest guides"
    }
  },
  "media_credit": {
    "text": {
      "en-US": "Photo: {%1%}"
    }
  },
  "nav_menu_title": {
    "text": {
      "en-US": "Menu"
    }
  },
  "nav_breadcrumb": {
    "text": {
      "en-US": "Breadcrumb"
    }
  },
  "nav_breadcrumb_home": {
    "text": {
      "en-US": "Home"
    }
  },
  "nav_primary_about": {
    "text": {
      "en-US": "About"
    }
  },
  "nav_primary_privacy": {
    "text": {
      "en-US": "Privacy"
    }
  },
  "assistant_input_placeholder": {
    "text": {
      "en-US": "Your message"
    }
  },
  "assistant_input_submit": {
    "text": {
      "en-US": "Send your message"
    }
  },
  "assistant_input_escape_hint": {
    "text": {
      "en-US": "Press Escape to close"
    }
  },
  "assistant_input_enter_hint": {
    "text": {
      "en-US": "Press Enter to send"
    }
  },
  "nav_back": {
    "text": {
      "en-US": "Back"
    }
  },
  "page_affiliate_note": {
    "text": {
      "en-US": "We may earn a commission if you buy through certain links. See our {%1%}[\"affiliate disclosure\", /disclosure/]."
    }
  },
  "footnote_back": {
    "text": {
      "en-US": "Back to the text"
    }
  },
  "continue_segment_prefix": {
    "text": {
      "en-US": "Re:"
    }
  },
  "continue_segment_dismiss": {
    "text": {
      "en-US": "Cancel reply"
    }
  },
  "offline_intro": {
    "text": {
      "en-US": {
        "one": "No connection right now. The page you've already opened is still available:",
        "other": "No connection right now. The following {%1%} pages that you've already opened are still available:"
      }
    }
  },
  "offline_list_label": {
    "text": {
      "en-US": "Pages available offline"
    }
  },
  "assistant_skip_to_input": {
    "text": {
      "en-US": "Skip to message field"
    }
  },
  "assistant_dialog_title": {
    "text": {
      "en-US": "Assistant"
    }
  },
  "chat_history_title": {
    "text": {
      "en-US": "Chat history"
    }
  },
  "assistant_menu_title": {
    "text": {
      "en-US": "Assistant menu"
    }
  },
  "assistant_menu_open": {
    "text": {
      "en-US": "Open assistant menu"
    }
  },
  "assistant_menu_close": {
    "text": {
      "en-US": "Close assistant menu"
    }
  },
  "chat_no_history": {
    "text": {
      "en-US": "No chat history yet."
    }
  },
  "chat_clear_history": {
    "text": {
      "en-US": "Clear chat history"
    }
  },
  "assistant_button": {
    "text": {
      "en-US": "Assistant"
    }
  },
  "chat_close": {
    "text": {
      "en-US": "Close chat"
    }
  },
  "chat_empty": {
    "text": {
      "en-US": "Nothing here yet — ask your question below."
    }
  },
  "chat_thinking": {
    "text": {
      "en-US": "Thinking…"
    }
  },
  "chat_continue": {
    "text": {
      "en-US": "Continue with this segment"
    }
  },
  "chat_segment_fallback": {
    "text": {
      "en-US": "Chat"
    }
  },
  "chat_unavailable": {
    "text": {
      "en-US": "The assistant isn't available right now."
    }
  },
  "chat_history_cleared": {
    "text": {
      "en-US": "Chat history cleared"
    }
  },
  "chat_history_undo": {
    "text": {
      "en-US": "Undo"
    }
  },
  "comparison_scroll_hint": {
    "text": {
      "en-US": "comparison table, scroll horizontally"
    }
  },
  "video_unavailable": {
    "text": {
      "en-US": "Video not available"
    }
  },
  "form_error_required": {
    "text": {
      "en-US": "{%1%} is required"
    }
  },
  "form_error_email": {
    "text": {
      "en-US": "a valid email is required"
    }
  },
  "form_error_url": {
    "text": {
      "en-US": "a full web address (http:// or https://) is required"
    }
  },
  "form_error_min": {
    "text": {
      "en-US": "must be {%1%} or more"
    }
  },
  "form_error_max": {
    "text": {
      "en-US": "must be {%1%} or less"
    }
  },
  "form_error_step_integer": {
    "text": {
      "en-US": "a whole number is required"
    }
  },
  "form_error_step": {
    "text": {
      "en-US": "must be a multiple of {%1%}"
    }
  },
  "form_error_minlength": {
    "text": {
      "en-US": {
        "one": "must be at least {%1%} character",
        "other": "must be at least {%1%} characters"
      }
    }
  },
  "form_error_maxlength": {
    "text": {
      "en-US": {
        "one": "must be {%1%} character or fewer",
        "other": "must be {%1%} characters or fewer"
      }
    }
  },
  "form_error_unreadable": {
    "text": {
      "en-US": "{%1%} is not a value we can read"
    }
  },
  "form_error_pattern": {
    "text": {
      "en-US": "{%1%} is not in the format we expect"
    }
  },
  "form_fallback_back": {
    "text": {
      "en-US": "← Back to Movelli"
    }
  },
  "form_field_fallback": {
    "text": {
      "en-US": "This field"
    }
  },
  "form_sending": {
    "text": {
      "en-US": "Sending…"
    }
  },
  "form_submit_fallback": {
    "text": {
      "en-US": "Send"
    }
  },
  "form_sent": {
    "text": {
      "en-US": "Thanks — your message is on its way. We reply to most within a few days."
    }
  },
  "form_send_failed": {
    "text": {
      "en-US": "Sorry, that didn’t send. Please try again."
    }
  },
  "form_error_generic": {
    "text": {
      "en-US": "{%1%} is not valid"
    }
  },
  "form_error_number": {
    "text": {
      "en-US": "a number is required"
    }
  },
  "form_error_datetime": {
    "text": {
      "en-US": "a date and time is required"
    }
  },
  "form_error_datetime_real": {
    "text": {
      "en-US": "a real date and time is required"
    }
  },
  "form_error_future": {
    "text": {
      "en-US": "please choose a time in the future"
    }
  },
  "form_error_after": {
    "text": {
      "en-US": "must be {%1%} or later"
    }
  },
  "form_error_before": {
    "text": {
      "en-US": "must be {%1%} or earlier"
    }
  },
  "form_error_unexpected": {
    "text": {
      "en-US": "{%1%} has an unexpected value"
    }
  },
  "form_error_empty": {
    "text": {
      "en-US": "the message is empty"
    }
  },
  "form_fallback_ok_title": {
    "text": {
      "en-US": "Thanks — Movelli"
    }
  },
  "form_fallback_ok_heading": {
    "text": {
      "en-US": "Thanks — message received"
    }
  },
  "form_fallback_ok_body": {
    "text": {
      "en-US": "We read everything and reply to most messages within a few days."
    }
  },
  "form_fallback_error_title": {
    "text": {
      "en-US": "Something went wrong — Movelli"
    }
  },
  "form_fallback_error_heading": {
    "text": {
      "en-US": "That didn’t send"
    }
  },
  "form_error_server": {
    "text": {
      "en-US": "Something went wrong on our side. Please try again."
    }
  },
  "secondary_content_title": {
    "text": {
      "en-US": "Let us guide you"
    }
  },
  "proactive_intro": {
    "text": {
      "en-US": "Here are some of the top guides about {%1%} that you can find on Movelli"
    }
  },
  "proactive_intro_fallback": {
    "text": {
      "en-US": "Here are some of the top guides that you can find on Movelli"
    }
  },
  "proactive_note": {
    "text": {
      "en-US": "You can use the assistant to ask or find anything else."
    }
  },
  "proactive_landed_question": {
    "text": {
      "en-US": "Want to know what else you can find on Movelli?"
    }
  },
  "proactive_landed_reply_1": {
    "text": {
      "en-US": "Yes, please"
    }
  },
  "proactive_landed_reply_1_seed": {
    "text": {
      "en-US": "Happy to show you around."
    }
  },
  "proactive_landed_reply_1_prompt": {
    "text": {
      "en-US": "What can I find on Movelli, and what can the Movelli Assistant do for me?"
    }
  },
  "proactive_focused_question": {
    "text": {
      "en-US": "Do you have any questions about {%1%}?"
    }
  },
  "proactive_focused_question_fallback": {
    "text": {
      "en-US": "Do you have any questions?"
    }
  },
  "proactive_focused_reply_1": {
    "text": {
      "en-US": "Yes, I have a question"
    }
  },
  "proactive_focused_reply_1_seed": {
    "text": {
      "en-US": "Welcome. You've been reading about {%1%} — ask me anything about it, or about anything else on Movelli."
    }
  },
  "proactive_focused_reply_1_seed_fallback": {
    "text": {
      "en-US": "Welcome. Ask me anything about Movelli, or about what you're looking for."
    }
  },
  "proactive_exploring_question": {
    "text": {
      "en-US": "Is {%1%} what you're looking for or are you not sure yet?"
    }
  },
  "proactive_exploring_question_fallback": {
    "text": {
      "en-US": "Is this what you're looking for or are you not sure yet?"
    }
  },
  "proactive_exploring_reply_1": {
    "text": {
      "en-US": "Yes, I'm interested in {%1%}"
    }
  },
  "proactive_exploring_reply_1_fallback": {
    "text": {
      "en-US": "Yes, this page is what I'm looking for"
    }
  },
  "proactive_exploring_reply_1_seed": {
    "text": {
      "en-US": "Good — let's look at {%1%}."
    }
  },
  "proactive_exploring_reply_1_seed_fallback": {
    "text": {
      "en-US": "Good — let's find what you're looking for."
    }
  },
  "proactive_exploring_reply_1_prompt": {
    "text": {
      "en-US": "I'm interested in {%1%}. Tell me how you can help me find more about it, and that I can ask you anything else."
    }
  },
  "proactive_exploring_reply_1_prompt_fallback": {
    "text": {
      "en-US": "Tell me how you can help me find what I'm looking for, and that I can ask you anything else."
    }
  },
  "proactive_exploring_reply_2": {
    "text": {
      "en-US": "I'm not sure yet"
    }
  },
  "proactive_exploring_reply_2_seed": {
    "text": {
      "en-US": "No problem — let's work out what you need."
    }
  },
  "proactive_exploring_reply_2_prompt": {
    "text": {
      "en-US": "Tell me briefly what Movelli is about, then ask me one question to work out what I'm looking for."
    }
  },
  "proactive_changed_answer": {
    "text": {
      "en-US": "I've changed my mind: {%1%}"
    }
  },
  "proactive_changed_answer_context": {
    "text": {
      "en-US": "Earlier on this page they answered \"{%1%}\" to the same question, and they have now changed their answer to \"{%2%}\". Acknowledge the change briefly and do not repeat what you already told them."
    }
  },
  "proactive_exploring_reply_3": {
    "text": {
      "en-US": "I'm just looking around"
    }
  },
  "proactive_exploring_reply_3_seed": {
    "text": {
      "en-US": "Of course. Here's what Movelli covers."
    }
  },
  "proactive_exploring_reply_3_prompt": {
    "text": {
      "en-US": "Tell me briefly what Movelli is about, and end by saying I can use you to navigate or ask anything."
    }
  },
  "chat_replies_group": {
    "text": {
      "en-US": "Suggested replies"
    }
  },
  "reply_options_group": {
    "text": {
      "en-US": "Replies"
    }
  }
};
const CFG = {"locales":["en-US","en-GB"],"primary":"en-US","fallback":{}};
/* END_BUILD_INJECT */

/** The visitor's locale, from the document. `<html lang>` is emitted per locale by the build. */
const locale = (typeof document !== 'undefined' && document.documentElement.lang) || CFG.primary;

const lookup = makeCopy(DATA, CFG);

/** `copy(key)` — the string for THIS page's locale. Pass a locale to override. */
export const copy = (key, loc = locale) => lookup(key, loc);

/** `pluralize(value, count)` — bound to this page's locale, like `copy` above. See `copy.mjs`. */
export const pluralize = (value, count, loc = locale) => pick(value, count, loc);

/** The entry's raw value for this locale — the forms a plural key holds. `copy()` throws on one. */
export const copyForms = (key, loc = locale) => {
  const entry = DATA[key];
  if (!entry) throw new Error(`copy: no such key "${key}" in site.copy.json`);
  return entry.text[loc] ?? entry.text[CFG.primary];
};

/** Re-exported so a script needs ONE import for both halves. See `fill` in `copy.mjs`. */
export { fill };
