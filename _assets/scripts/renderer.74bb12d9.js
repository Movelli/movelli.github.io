import { modules as B_main } from '/_assets/scripts/main.f8dbaa93.js';
const M0 = {};
const M1 = {};
const M2 = {};
const M3 = {};
const M4 = {};
const M5 = {};
(() => {
const PRESET_SEP = "--";
const catalog = {"chat-segment-title":{"config":{"text":{"type":"string","required":true},"level":{"type":"enum","values":[2,3,4,5,6],"default":3},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"name":"chat-segment-title","isPreset":false},"prose":{"config":{"variant":{"type":"enum[]","values":["standfirst","smaller","inverse"],"description":"standfirst, an article's opening paragraph; smaller, a step under the reading size, for the conversation.; inverse, the look for a dark ground such as a banner's photo"},"id":{"type":"string","description":"id on the component root, for a script to target it by."},"utility":{"type":"enum[]","values":["js-only","assistant-only"],"description":"Utility classes on the root: js-only (hidden without JavaScript), assistant-only (hidden while the assistant cannot answer)."},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"html":{"type":"text","allowHtml":"block","i18n":true,"required":true,"slot":"body"}},"name":"prose","isPreset":false},"intro":{"config":{"variant":{"type":"enum[]","values":["centered","inverse"],"description":"centered, its lines centred — for a centred page head, a status line, a note.; inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"html":{"type":"text","allowHtml":"block","i18n":true,"required":true,"slot":"body"}},"name":"intro","isPreset":false},"card":{"config":{"url":{"type":"url","required":true},"role":{"type":"enum","values":["listitem"],"description":"The ARIA role this card carries — set by the build where the card is one of a list, never by an author."},"variant":{"type":"enum[]","values":["no-thumb","inverse"],"description":"no-thumb, a card without its thumbnail block (the thumbnail-less chat results).; inverse, the look for a dark ground such as a banner's photo"},"heroImage":{"type":"object","description":"BUILD: the linked page's hero image — { srcset, sizes?, sources? } — for warming it on hover."},"level":{"type":"enum","values":[2,3,4,5,6],"description":"Render the title as a real heading at this level. Set where the cards are the page's content — a listing, or under a heading (one level below it); omitted elsewhere, where the title is a <span> so it does not compete with the article's or the conversation's outline."},"loading":{"type":"enum","values":["lazy","eager"],"default":"lazy"},"fetchpriority":{"type":"enum","values":["auto","high","low"],"default":"auto"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"title":{"type":"text","allowHtml":"none","i18n":true,"required":true},"summary":{"type":"text","allowHtml":"none","i18n":true},"thumbLabel":{"type":"text","allowHtml":"none","i18n":true,"description":"Large label shown in the thumbnail."},"tag":{"type":"text","allowHtml":"none","i18n":true,"description":"Small category tag in the thumbnail corner."},"image":{"type":"media","i18n":true,"description":"Optional thumbnail; replaces the placeholder block and its label."}},"name":"card","isPreset":false},"card--index":{"config":{"url":{"type":"url","required":true},"role":{"type":"enum","values":["listitem"],"description":"The ARIA role this card carries — set by the build where the card is one of a list, never by an author."},"variant":{"type":"enum[]","values":["no-thumb","inverse"],"description":"no-thumb, a card without its thumbnail block (the thumbnail-less chat results).; inverse, the look for a dark ground such as a banner's photo"},"heroImage":{"type":"object","description":"BUILD: the linked page's hero image — { srcset, sizes?, sources? } — for warming it on hover."},"level":{"type":"enum","values":[2,3,4,5,6],"description":"Render the title as a real heading at this level. Set where the cards are the page's content — a listing, or under a heading (one level below it); omitted elsewhere, where the title is a <span> so it does not compete with the article's or the conversation's outline.","default":2},"loading":{"type":"enum","values":["lazy","eager"],"default":"lazy"},"fetchpriority":{"type":"enum","values":["auto","high","low"],"default":"auto"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"title":{"type":"text","allowHtml":"none","i18n":true,"required":true},"summary":{"type":"text","allowHtml":"none","i18n":true},"thumbLabel":{"type":"text","allowHtml":"none","i18n":true,"description":"Large label shown in the thumbnail."},"tag":{"type":"text","allowHtml":"none","i18n":true,"description":"Small category tag in the thumbnail corner."},"image":{"type":"media","i18n":true,"description":"Optional thumbnail; replaces the placeholder block and its label."}},"name":"card--index","isPreset":true},"card--row":{"config":{"url":{"type":"url","required":true},"role":{"type":"enum","values":["listitem"],"description":"The ARIA role this card carries — set by the build where the card is one of a list, never by an author."},"variant":{"type":"enum[]","values":["no-thumb","inverse"],"description":"no-thumb, a card without its thumbnail block (the thumbnail-less chat results).; inverse, the look for a dark ground such as a banner's photo"},"heroImage":{"type":"object","description":"BUILD: the linked page's hero image — { srcset, sizes?, sources? } — for warming it on hover."},"level":{"type":"enum","values":[2,3,4,5,6],"description":"Render the title as a real heading at this level. Set where the cards are the page's content — a listing, or under a heading (one level below it); omitted elsewhere, where the title is a <span> so it does not compete with the article's or the conversation's outline.","default":3},"loading":{"type":"enum","values":["lazy","eager"],"default":"lazy"},"fetchpriority":{"type":"enum","values":["auto","high","low"],"default":"auto"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"title":{"type":"text","allowHtml":"none","i18n":true,"required":true},"summary":{"type":"text","allowHtml":"none","i18n":true},"thumbLabel":{"type":"text","allowHtml":"none","i18n":true,"description":"Large label shown in the thumbnail."},"tag":{"type":"text","allowHtml":"none","i18n":true,"description":"Small category tag in the thumbnail corner."},"image":{"type":"media","i18n":true,"description":"Optional thumbnail; replaces the placeholder block and its label."}},"name":"card--row","isPreset":true},"heading":{"config":{"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"anchor":{"type":"string","description":"id for the heading, so it can be linked to — and named in the table of contents. Made from the title when empty."},"variant":{"type":"enum[]","values":["centered","inverse"],"description":"centered, the heading in the middle of its slot — the suggestions panel's.; inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."},"toc":{"type":"enum","values":["off"],"description":"off leaves this heading out of the table of contents (listed otherwise)."}},"content":{"title":{"type":"text","allowHtml":"none","i18n":true,"required":true},"tocTitle":{"type":"text","allowHtml":"none","i18n":true,"description":"Short label for the table of contents; the text of the heading itself when empty."}},"name":"heading","isPreset":false},"more-link":{"config":{"url":{"type":"url","required":true},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"label":{"type":"text","allowHtml":"none","i18n":true,"required":true}},"name":"more-link","isPreset":false},"related-pages":{"content":{"lead":{"type":"group","required":true,"description":"The line above the cards, in plural forms: `one` for a single card, `other` for several.","fields":{"one":{"type":"text","allowHtml":"none","i18n":true},"other":{"type":"text","allowHtml":"none","i18n":true,"required":true}}}},"config":{"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"name":"related-pages","isPreset":false},"chat-turn":{"content":{"text":{"type":"text","allowHtml":"none","i18n":true,"description":"The message."}},"config":{"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"name":"chat-turn","isPreset":false},"chat-thinking":{"content":{"text":{"type":"text","allowHtml":"none","i18n":true,"description":"The label a screen reader hears, announced once rather than spelled out as three dots."}},"config":{"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"name":"chat-thinking","isPreset":false},"chat-divider":{"config":{"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{},"name":"chat-divider","isPreset":false},"chat-continue":{"config":{"segment":{"type":"string","description":"The title of the segment this continues."},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"label":{"type":"text","allowHtml":"none","i18n":true,"default":{"en":"Continue with this segment"}}},"name":"chat-continue","isPreset":false},"chat-replies":{"config":{"items":{"type":"string[]","description":"Reply chips: plain strings. The label IS the query the visitor sends."},"label":{"type":"string","description":"The chip group's accessible name (aria-label)."},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"name":"chat-replies","isPreset":false},"reply-options":{"config":{"items":{"type":"object[]","rendered":"label","description":"The options: { label, state: { seed, prompt, placeholder, context } }. Only `label` is rendered — `state` is read by whoever binds the buttons and never reaches the DOM."},"label":{"type":"string","description":"The group's accessible name (aria-label)."},"utility":{"type":"enum[]","values":["js-only","assistant-only"],"description":"Utility classes on the root: js-only (hidden without JavaScript), assistant-only (hidden while the assistant cannot answer)."},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"name":"reply-options","isPreset":false},"status-message":{"config":{"variant":{"type":"enum[]","values":["centered","inverse"],"description":"centered, its lines centred — for a centred page head, a status line, a note.; inverse, the look for a dark ground such as a banner's photo"},"id":{"type":"string","description":"id on the component root, for a script to target it by."},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"text":{"type":"text","allowHtml":"none","i18n":true},"html":{"type":"text","allowHtml":"inline","i18n":true,"slot":"body"}},"name":"status-message","isPreset":false},"note":{"config":{"variant":{"type":"enum[]","values":["centered","inverse"],"description":"centered, its lines centred — for a centred page head, a status line, a note.; inverse, the look for a dark ground such as a banner's photo"},"id":{"type":"string","description":"id on the component root, for a script to target it by."},"hidden":{"type":"boolean","description":"Ship the note hidden; something else reveals it."},"utility":{"type":"enum[]","values":["js-only","assistant-only"],"description":"Utility classes on the root: js-only (hidden without JavaScript), assistant-only (hidden while the assistant cannot answer)."},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"text":{"type":"text","allowHtml":"none","i18n":true},"html":{"type":"text","allowHtml":"inline","i18n":true,"slot":"body"}},"name":"note","isPreset":false},"note--affiliate":{"config":{"variant":{"type":"enum[]","values":["centered","inverse"],"description":"centered, its lines centred — for a centred page head, a status line, a note.; inverse, the look for a dark ground such as a banner's photo"},"id":{"type":"string","description":"id on the component root, for a script to target it by."},"hidden":{"type":"boolean","description":"Ship the note hidden; something else reveals it."},"utility":{"type":"enum[]","values":["js-only","assistant-only"],"description":"Utility classes on the root: js-only (hidden without JavaScript), assistant-only (hidden while the assistant cannot answer)."},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"text":{"type":"text","allowHtml":"none","i18n":true},"html":{"type":"text","allowHtml":"inline","i18n":true,"slot":"body","default":"","locked":true}},"name":"note--affiliate","isPreset":true},"footnotes":{"config":{"backLabel":{"type":"text","description":"The accessible name of the arrow that returns the reader to the sentence."},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"items":{"type":"list","of":{"type":"group","fields":{"html":{"type":"text","allowHtml":"inline","i18n":false}}}}},"name":"footnotes","isPreset":false},"form":{"config":{"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"anchor":{"type":"text"},"form":{"type":"string","description":"AUTHORING: the name of a form in the manifest (the server resolves its fields)."},"name":{"type":"string","required":true,"description":"RESOLVED: the form key (hidden `_form` value)."},"action":{"type":"url","description":"RESOLVED: the POST endpoint (usually /api/form)."},"submitLabel":{"type":"string"},"fields":{"type":"object[]","description":"RESOLVED: [{ name, label, type, required, options? }]."},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."},"toc":{"type":"enum","values":["off"],"description":"off leaves this heading out of the table of contents (listed otherwise)."}},"content":{"tocTitle":{"type":"text","allowHtml":"none","i18n":true,"description":"Short label for the table of contents; the text of the heading itself when empty."},"title":{"type":"text","allowHtml":"none","i18n":true,"description":"Heading above the fields, inside the <form>."},"help":{"type":"text","allowHtml":"inline","i18n":true,"description":"A line under the heading: what the form is for, or what happens to the answers. May contain a link. The field-level equivalent is a field's own `help`."}},"name":"form","isPreset":false},"banner":{"slots":{"content":{"description":"The components over the photo, stacked: a title, a line of text, a button, a form. On the dark overlay they want the variant `inverse`."}},"config":{"variant":{"type":"enum[]","values":["wide","full","inverse"],"description":"wide, a band shaped for the wide layout; full, for a full-width layout — edge to edge, so its corners are square. No variant: shaped for the reading column.; inverse, the look for a dark ground such as a banner's photo"},"contentWidth":{"type":"enum","values":["reading","wide"],"default":"reading","description":"The width of the box its components sit in, centred in the band: the reading width (52rem) or the wide width (80rem)."},"poster":{"type":"string"},"bytes":{"type":"number"},"tracks":{"type":"object[]"},"loading":{"type":"enum","values":["lazy","eager"],"default":"lazy"},"fetchpriority":{"type":"enum","values":["auto","high","low"],"default":"auto"},"sources":{"type":"object[]","description":"BUILD: the sources of a picture element, one per shape wider than the first — { media, srcset, sizes?, width, height }."},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"src":{"type":"media","i18n":true},"label":{"type":"text","allowHtml":"none","i18n":true,"description":"aria-label — used only when the band has no image and no text of its own."},"credit":{"type":"text","allowHtml":"inline","i18n":true,"description":"Photo attribution, shown small in the band's bottom-right corner. May hold a link to the photographer."}},"name":"banner","isPreset":false},"page-title":{"config":{"variant":{"type":"enum[]","values":["centered","inverse"],"description":"centered, its lines centred — for a centred page head, a status line, a note.; inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"category":{"type":"group","fields":{"label":{"type":"text"},"href":{"type":"url"}}},"title":{"type":"text","allowHtml":"none","i18n":true,"required":true,"slot":"h1"}},"name":"page-title","isPreset":false},"byline":{"config":{"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"updated":{"type":"text","allowHtml":"none","description":"ISO date; rendered inside <time datetime>."},"updatedLabel":{"type":"text","allowHtml":"none","i18n":true,"description":"The formatted, localised date."},"readingTime":{"type":"text","allowHtml":"none","i18n":true},"tags":{"type":"list","of":{"type":"group","fields":{"label":{"type":"text"},"href":{"type":"url"}}}}},"name":"byline","isPreset":false},"props":{"config":{"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"anchor":{"type":"text"},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."},"toc":{"type":"enum","values":["off"],"description":"off leaves this heading out of the table of contents (listed otherwise)."}},"content":{"tocTitle":{"type":"text","allowHtml":"none","i18n":true,"description":"Short label for the table of contents; the text of the heading itself when empty."},"title":{"type":"text","allowHtml":"none","i18n":true,"description":"The component's own heading."},"rows":{"type":"list","of":{"type":"group","fields":{"label":{"type":"text"},"value":{"type":"text"}}}}},"name":"props","isPreset":false},"toc":{"config":{"items":{"type":"list","of":{"type":"group","fields":{"label":{"type":"text"},"href":{"type":"text"}}}},"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"label":{"type":"text","allowHtml":"none","i18n":true,"required":true,"description":"Heading above the contents list."}},"name":"toc","isPreset":false},"overview-table":{"config":{"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"anchor":{"type":"text"},"variant":{"type":"enum[]","values":["inline","inverse"],"description":"inline, each label and its value on one row at any width — for short values.; inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."},"toc":{"type":"enum","values":["off"],"description":"off leaves this heading out of the table of contents (listed otherwise)."}},"content":{"tocTitle":{"type":"text","allowHtml":"none","i18n":true,"description":"Short label for the table of contents; the text of the heading itself when empty."},"title":{"type":"text","allowHtml":"none","i18n":true,"description":"The component's own heading."},"caption":{"type":"text","allowHtml":"none","i18n":true},"subtitle":{"type":"text","allowHtml":"none","i18n":true,"description":"A line under the caption, smaller and in the secondary colour: what the title leaves out (a place, a currency). Needs a caption."},"rows":{"type":"list","of":{"type":"group","fields":{"label":{"type":"text","allowHtml":"none","i18n":true},"value":{"type":"text","allowHtml":"inline","i18n":true}}}}},"name":"overview-table","isPreset":false},"cta":{"config":{"isPrimary":{"type":"boolean","default":true,"description":"The primary button; false gives the secondary look."},"sponsored":{"type":"boolean","default":false},"element":{"type":"enum","values":["link","button"],"default":"link"},"disabled":{"type":"boolean","default":false},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."}},"content":{"label":{"type":"text","allowHtml":"none","i18n":true,"required":true},"href":{"type":"link","i18n":true,"required":true}},"name":"cta","isPreset":false},"callout":{"config":{"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"anchor":{"type":"text"},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."},"toc":{"type":"enum","values":["off"],"description":"off leaves this heading out of the table of contents (listed otherwise)."}},"content":{"tocTitle":{"type":"text","allowHtml":"none","i18n":true,"description":"Short label for the table of contents; the text of the heading itself when empty."},"title":{"type":"text","allowHtml":"none","i18n":true,"description":"The component's own heading."},"html":{"type":"text","allowHtml":"block","i18n":true,"description":"The body: sanitized block HTML (p, headings, lists, inline)."}},"name":"callout","isPreset":false},"code-block":{"config":{"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"anchor":{"type":"text"},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."},"toc":{"type":"enum","values":["off"],"description":"off leaves this heading out of the table of contents (listed otherwise)."}},"content":{"tocTitle":{"type":"text","allowHtml":"none","i18n":true,"description":"Short label for the table of contents; the text of the heading itself when empty."},"title":{"type":"text","allowHtml":"none","i18n":true,"description":"The component's own heading."},"code":{"type":"code","i18n":true,"required":true},"label":{"type":"text","allowHtml":"none","i18n":true,"description":"Optional caption — a filename, or \"Terminal\"."}},"name":"code-block","isPreset":false},"quote":{"config":{"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"anchor":{"type":"text"},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."},"toc":{"type":"enum","values":["off"],"description":"off leaves this heading out of the table of contents (listed otherwise)."}},"content":{"tocTitle":{"type":"text","allowHtml":"none","i18n":true,"description":"Short label for the table of contents; the text of the heading itself when empty."},"title":{"type":"text","allowHtml":"none","i18n":true,"description":"The component's own heading."},"text":{"type":"text","allowHtml":"inline","i18n":true,"required":true},"attribution":{"type":"text","allowHtml":"inline","i18n":true},"cite":{"type":"link","i18n":true}},"name":"quote","isPreset":false},"list":{"config":{"marker":{"type":"enum","values":["check","cross"],"default":"check","description":"The glyph before each item."},"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"anchor":{"type":"text"},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."},"toc":{"type":"enum","values":["off"],"description":"off leaves this heading out of the table of contents (listed otherwise)."}},"content":{"tocTitle":{"type":"text","allowHtml":"none","i18n":true,"description":"Short label for the table of contents; the text of the heading itself when empty."},"title":{"type":"text","allowHtml":"none","i18n":true,"description":"The component's own heading."},"items":{"type":"list","of":{"type":"text","allowHtml":"inline","i18n":true}}},"name":"list","isPreset":false},"comparison-table":{"config":{"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"anchor":{"type":"text"},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."},"toc":{"type":"enum","values":["off"],"description":"off leaves this heading out of the table of contents (listed otherwise)."}},"content":{"tocTitle":{"type":"text","allowHtml":"none","i18n":true,"description":"Short label for the table of contents; the text of the heading itself when empty."},"title":{"type":"text","allowHtml":"none","i18n":true,"description":"The component's own heading."},"caption":{"type":"text","allowHtml":"none","i18n":true},"subtitle":{"type":"text","allowHtml":"none","i18n":true,"description":"A line under the caption, smaller and in the secondary colour: what the title leaves out (a place, a currency). Needs a caption."},"columns":{"type":"list","of":{"type":"text","i18n":true}},"rows":{"type":"list","of":{"type":"group","fields":{"label":{"type":"text","i18n":true},"cells":{"type":"list","of":{"type":"text","i18n":true}}}}},"note":{"type":"text","allowHtml":"none","i18n":true},"source":{"type":"text","allowHtml":"none","i18n":true,"description":"Where the data came from, e.g. \"Source: Movelli Lab\"."}},"name":"comparison-table","isPreset":false},"faq":{"config":{"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"anchor":{"type":"text"},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."},"toc":{"type":"enum","values":["off"],"description":"off leaves this heading out of the table of contents (listed otherwise)."}},"content":{"tocTitle":{"type":"text","allowHtml":"none","i18n":true,"description":"Short label for the table of contents; the text of the heading itself when empty."},"title":{"type":"text","allowHtml":"none","i18n":true},"items":{"type":"list","of":{"type":"group","fields":{"q":{"type":"text","i18n":true},"a":{"type":"text","i18n":true}}}}},"name":"faq","isPreset":false},"video":{"config":{"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"anchor":{"type":"text"},"width":{"type":"number"},"height":{"type":"number"},"poster":{"type":"string"},"tracks":{"type":"object[]"},"bytes":{"type":"number"},"fallback":{"type":"string"},"controls":{"type":"boolean","default":true},"autoplay":{"type":"boolean","default":false},"loop":{"type":"boolean","default":false},"muted":{"type":"boolean","default":false},"eager":{"type":"boolean","default":false},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."},"toc":{"type":"enum","values":["off"],"description":"off leaves this heading out of the table of contents (listed otherwise)."}},"content":{"tocTitle":{"type":"text","allowHtml":"none","i18n":true,"description":"Short label for the table of contents; the text of the heading itself when empty."},"title":{"type":"text","allowHtml":"none","i18n":true,"description":"The component's own heading."},"src":{"type":"media","i18n":true,"required":true,"description":"The video: a `media:<id>` of a video of the library."},"caption":{"type":"text","allowHtml":"none","i18n":true},"credit":{"type":"text","allowHtml":"inline","i18n":true,"description":"Attribution. May hold a link to its maker."}},"name":"video","isPreset":false},"figure":{"config":{"ref":{"type":"integer","description":"AUTHORING: the result number whose image to show (the server resolves its src + alt)."},"srcset":{"type":"string"},"width":{"type":"number"},"height":{"type":"number"},"level":{"type":"enum","values":[2,3,4,5,6],"default":2},"anchor":{"type":"text"},"loading":{"type":"enum","values":["lazy","eager"],"default":"lazy"},"fetchpriority":{"type":"enum","values":["auto","high","low"],"default":"auto"},"variant":{"type":"enum[]","values":["inverse"],"description":"inverse, the look for a dark ground such as a banner's photo"},"classes":{"type":"string[]","description":"Extra class names on the root."},"toc":{"type":"enum","values":["off"],"description":"off leaves this heading out of the table of contents (listed otherwise)."}},"content":{"tocTitle":{"type":"text","allowHtml":"none","i18n":true,"description":"Short label for the table of contents; the text of the heading itself when empty."},"title":{"type":"text","allowHtml":"none","i18n":true,"description":"The component's own heading."},"src":{"type":"media","i18n":true,"required":true},"alt":{"type":"text","allowHtml":"none","i18n":true},"caption":{"type":"text","allowHtml":"inline","i18n":true},"credit":{"type":"text","allowHtml":"inline","i18n":true,"description":"Attribution. May hold a link to its maker."}},"name":"figure","isPreset":false}};
Object.assign(M0, { PRESET_SEP, catalog });
})();
(() => {
const { catalog, PRESET_SEP } = M0;
const baseName = (type) => String(type == null ? '' : type).split(PRESET_SEP)[0];
Object.assign(M1, { baseName, catalog, PRESET_SEP });
})();
(() => {
const esc = (s) => String(s == null ? '' : s)
.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
Object.assign(M2, { esc });
})();
(() => {
Object.assign(M3, { classesProblem, hasValue, checkComponent });
const ID = /^[a-z][a-z0-9-]*$/;
const SPRITE_PREFIX = /^(icon|logo)-/;
const CLASS_NAME = /^[A-Za-z][A-Za-z0-9_-]*$/;
const SHARED_CLASSES = ['component', 'component__body', 'component__title', 'sr-only', 'js-only', 'assistant-only', 'is-underlined',
'btn', 'btn--secondary', 'chip', 'icon', 'toast'];
const baseOf = (key) => String(key).split('--')[0];
const reservedClass = (name, ownNames = []) => SHARED_CLASSES.includes(name) || /^(component|layout)-variant--/.test(name)
|| ownNames.some((k) => { const b = baseOf(k); return name === b || name.startsWith(`${b}__`) || name.startsWith(`${b}--`); });
function classesProblem(classes, ownNames = null) {
if (!Array.isArray(classes)) return `classes is a list of class names, like ["my-class"] — got ${JSON.stringify(classes)}`;
const wrong = classes.filter((c) => typeof c !== 'string' || !CLASS_NAME.test(c));
if (wrong.length) {
return `classes holds ${wrong.map((c) => JSON.stringify(c)).join(', ')} — a class name is letters, digits, "-" and "_", starting with a letter`;
}
if (new Set(classes).size !== classes.length) return `classes names ${JSON.stringify(classes)} — each class once`;
if (ownNames) {
const taken = classes.filter((c) => reservedClass(c, ownNames));
if (taken.length) return `classes holds ${taken.map((c) => JSON.stringify(c)).join(', ')} — a class the site owns (a shared class, an option class, or a component's or layout's own); pick a name of your own`;
}
return '';
}
const atPath = (c) => (c && c.__path ? ` at ${c.__path}` : ' (a config built at runtime)');
const UNIVERSAL = new Set(['type', '__path']);
const EXPANDS = {
media: ['src', 'srcset', 'sizes', 'width', 'height', 'alt'],
link: ['rel', 'target'],
};
function expansionKeys(comp) {
const out = [];
for (const bucket of [comp.config, comp.content]) {
for (const def of Object.values(bucket || {})) {
if (def && EXPANDS[def.type]) out.push(...EXPANDS[def.type]);
}
}
return out;
}
function hasValue(value, type) {
if (value === undefined || value === null) return false;
if (type === 'number' || type === 'integer' || type === 'boolean') return true;
if (Array.isArray(value)) return value.length > 0;
if (typeof value === 'object') return Object.keys(value).length > 0;
return value !== '';
}
const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const TYPE_TESTS = {
string: [(v) => typeof v === 'string', 'a string'],
text: [(v) => typeof v === 'string', 'text'],
url: [(v) => typeof v === 'string', 'a URL (a string)'],
boolean: [(v) => typeof v === 'boolean', 'true or false'],
number: [(v) => typeof v === 'number' && Number.isFinite(v), 'a number'],
integer: [(v) => Number.isInteger(v), 'a whole number'],
object: [isPlainObject, 'an object'],
list: [Array.isArray, 'a list'],
'string[]': [(v) => Array.isArray(v) && v.every((x) => typeof x === 'string'), 'a list of strings'],
'object[]': [(v) => Array.isArray(v) && v.every(isPlainObject), 'a list of objects'],
};
function typeProblem(value, type) {
const test = Object.hasOwn(TYPE_TESTS, type) ? TYPE_TESTS[type] : null;
return test && !test[0](value) ? test[1] : '';
}
function checkComponent(config, catalog) {
const comp = Object.hasOwn(catalog, String(config.type)) ? catalog[config.type] : null;
if (!comp) throw new Error(`unknown component "${config.type}"${atPath(config)}`);
const declared = new Set([...UNIVERSAL,
...Object.keys(comp.config || {}), ...Object.keys(comp.content || {}),
...expansionKeys(comp), ...(comp.slots ? ['slots'] : [])]);
const unknown = Object.keys(config).filter((k) => !declared.has(k));
if (unknown.length) {
throw new Error(`"${config.type}"${atPath(config)} sets keys the catalog does not declare: `
+ `${unknown.join(', ')} — it declares ${[...declared].sort().join(', ')}`);
}
for (const [k, def] of Object.entries(comp.config || {})) {
if (!def || !['enum', 'enum[]'].includes(def.type) || config[k] == null) continue;
const values = def.values || [];
const given = def.type === 'enum[]' ? (Array.isArray(config[k]) ? config[k] : [config[k]]) : [config[k]];
const wrong = given.filter((v) => !values.includes(v));
if (def.type === 'enum[]' && Array.isArray(config[k]) && new Set(config[k]).size !== config[k].length) {
throw new Error(`"${config.type}"${atPath(config)} sets ${k} to ${JSON.stringify(config[k])} — each value once`);
}
if (wrong.length || (def.type === 'enum[]' && !Array.isArray(config[k]))) {
throw new Error(`"${config.type}"${atPath(config)} sets ${k} to ${JSON.stringify(config[k])}, which its `
+ `declaration does not list — it takes ${def.type === 'enum[]' ? 'a list of ' : ''}${values.map((v) => JSON.stringify(v)).join(', ')}`);
}
}
for (const [k, def] of Object.entries(comp.config || {})) {
if (!def) continue;
if (config[k] != null && k !== 'classes' && !['enum', 'enum[]'].includes(def.type)) {
const wanted = typeProblem(config[k], def.type);
if (wanted) throw new Error(`"${config.type}"${atPath(config)} sets ${k} to ${JSON.stringify(config[k])}, but its declaration is ${def.type} — it takes ${wanted}`);
}
if (def.required && !hasValue(config[k], def.type)) {
throw new Error(`"${config.type}"${atPath(config)} is missing its required config ${k}`);
}
}
if (config.classes != null) {
const problem = classesProblem(config.classes, Object.keys(catalog));
if (problem) throw new Error(`"${config.type}"${atPath(config)}: ${problem}`);
}
if (config.slots != null) checkSlots(config, comp, catalog);
if (config.anchor != null && !(ID.test(config.anchor) && !SPRITE_PREFIX.test(config.anchor))) {
throw new Error(`"${config.type}"${atPath(config)} has an invalid anchor "${config.anchor}" — `
+ 'lowercase, starting with a letter, and not an icon-/logo- prefix');
}
for (const [k, v] of Object.entries(config)) {
if (typeof v === 'string' && /^(media|sponsor):/.test(v)) {
throw new Error(`"${config.type}"${atPath(config)} ships an unexpanded ref in \`${k}\`: ${v}`);
}
}
}
function checkSlots(config, comp, catalog) {
const slots = config.slots;
if (!slots || typeof slots !== 'object' || Array.isArray(slots)) {
throw new Error(`"${config.type}"${atPath(config)} has slots that are not an object of named slots`);
}
for (const [name, slot] of Object.entries(slots)) {
if (!Object.hasOwn(comp.slots || {}, name)) {
throw new Error(`"${config.type}"${atPath(config)} fills a slot "${name}" it does not declare`);
}
if (!slot || Array.isArray(slot) || !Array.isArray(slot.components)) {
throw new Error(`"${config.type}"${atPath(config)}: slot "${name}" is one { components: [ … ] }`);
}
for (const k of slot.components) {
if (k && (catalog[k.type] || {}).slots) {
throw new Error(`"${k.type}"${atPath(k)} has slots of its own — a component with slots cannot go into a slot`);
}
if (k && ((catalog[k.type] || {}).widths || {}).media) {
throw new Error(`"${k.type}"${atPath(k)} is an image component, and slot "${name}" of "${config.type}" declares no width — no width is known to size its image to`);
}
}
}
}
Object.assign(M3, { CLASS_NAME, SHARED_CLASSES, reservedClass, atPath });
})();
(() => {
const { catalog } = M1;
const { checkComponent } = M3;
Object.assign(M4, { withConfigDefaults, prepareComponent });
function withConfigDefaults(cfg) {
const declared = (catalog[cfg.type] || {}).config || {};
let out = cfg;
for (const [key, def] of Object.entries(declared)) {
if (def && 'default' in def && !(key in cfg)) {
if (out === cfg) out = { ...cfg };
out[key] = def.default;
}
}
if (cfg.slots && typeof cfg.slots === 'object') {
const one = (stack) => (stack && Array.isArray(stack.components)
? { ...stack, components: stack.components.map((k) => (k && typeof k === 'object' ? withConfigDefaults(k) : k)) }
: stack);
const slots = Object.fromEntries(Object.entries(cfg.slots).map(([name, slot]) => [name, one(slot)]));
if (out === cfg) out = { ...cfg };
out.slots = slots;
}
return out;
}
function prepareComponent(input) {
if (!input || typeof input !== 'object') return null;
const cfg = withConfigDefaults(input);
check(cfg);
return cfg;
}
function check(cfg) {
checkComponent(cfg, catalog);
if (cfg.slots && typeof cfg.slots === 'object') {
for (const slot of Object.values(cfg.slots)) {
for (const kid of (slot && slot.components) || []) if (kid && typeof kid === 'object') check(kid);
}
}
}
})();
(() => {
const { baseName } = M1;
const { esc } = M2;
const { prepareComponent } = M4;
Object.assign(M5, { componentTitle, renderComponent, externalLinkMark });
const dim = (v) => { const n = Math.trunc(Number(v)); return Number.isFinite(n) && n > 0 ? n : null; };
const priority = (v) => (v === 'high' || v === 'low' ? ` fetchpriority="${v}"` : '');
const rootAttrs = (c, ...classes) => {
const utility = c && Array.isArray(c.utility) ? c.utility.map((u) => esc(u)) : [];
const variants = c && Array.isArray(c.variant) ? c.variant.map((v) => `component-variant--${esc(v)}`) : [];
const custom = c && Array.isArray(c.classes) ? c.classes.map((x) => esc(x)) : [];
const cls = ['component', ...classes.filter(Boolean), ...variants, ...utility, ...custom]
.filter(Boolean).join(' ');
return ` class="${cls}"${c && c.id ? ` id="${esc(c.id)}"` : ''}`
+ `${c && c.role ? ` role="${esc(c.role)}"` : ''}${c && c.hidden ? ' hidden' : ''}`
;
};
const textBody = (key, inner) => `<div class="${key}__body component__body">${inner}</div>`;
const headingLevel = (level, fallback) => ([2, 3, 4, 5, 6].includes(Number(level)) ? Number(level) : fallback);
function componentTitle(c, defaultLevel = 2, box = '') {
if (!c.title) return '';
const level = headingLevel(c.level, defaultLevel);
const id = c.anchor ? ` id="${esc(c.anchor)}"` : '';
return `<h${level} class="${box ? `${box} ` : ''}component__title"${id}>${c.title}</h${level}>`;
}
function renderComponent(input) {
const config = prepareComponent(input);
if (!config) return '';
switch (baseName(config.type)) {
case 'chat-segment-title': return renderChatSegmentTitle(config);
case 'status-message': return renderStatusMessage(config);
case 'note': return renderNote(config);
case 'footnotes': return renderFootnotes(config);
case 'page-title': return renderPageTitle(config);
case 'byline': return renderByline(config);
case 'props': return renderProps(config);
case 'toc': return renderToc(config);
case 'overview-table': return renderOverviewTable(config);
case 'cta': return renderCta(config);
case 'banner': return renderBanner(config);
case 'callout': return renderCallout(config);
case 'quote': return renderQuote(config);
case 'code-block': return renderCodeBlock(config);
case 'list': return renderList(config);
case 'comparison-table': return renderComparison(config);
case 'faq': return renderFaq(config);
case 'video': return renderVideo(config);
case 'prose': return renderProse(config);
case 'intro': return renderIntro(config);
case 'card': return renderCard(config);
case 'heading': return renderHeadingComponent(config);
case 'more-link': return renderMoreLink(config);
case 'related-pages': return renderRelatedPages(config);
case 'chat-turn': return renderChatTurn(config);
case 'chat-thinking': return renderChatThinking(config);
case 'chat-divider': return renderChatDivider(config);
case 'chat-continue': return renderChatContinue(config);
case 'chat-replies': return renderReplies(config);
case 'reply-options': return renderReplyOptions(config);
case 'form': return renderForm(config);
case 'figure': return renderFigure(config);
default: throw new Error(`the catalog declares "${config.type}" but no renderer handles it`);
}
}
function renderForm(c) {
const named = (v, what) => { if (v == null || v === '') throw new Error(`form "${c.name}": ${what} has no label`); return v; };
const formName = c.name;
if (!formName) throw new Error('form has no name');
const fieldId = (name) => `f-${formName}-${name}`;
const autoOf = (f) => f.autocomplete
|| (f.name === 'name' ? 'name' : f.name === 'email' ? 'email' : f.type === 'tel' ? 'tel' : 'off');
const val = (f) => (f.value != null ? ` value="${esc(f.value)}"` : '');
const BOOLEAN_ATTR = ['readonly', 'multiple', 'disabled'];
const std = (f, names) => names.map((n) => {
const v = f[n];
if (v == null || v === '' || v === false) return '';
if (n === 'min' && v === 'now') return ' data-min="now"';
if (BOOLEAN_ATTR.includes(n)) return ` ${n}`;
return ` ${n}="${esc(v)}"`;
}).join('');
const BOUNDS = ['min', 'max', 'step'];
const TEXT_ENTRY = ['placeholder', 'inputmode', 'pattern', 'minlength', 'maxlength', 'readonly'];
const STD = {
text: TEXT_ENTRY,
tel: TEXT_ENTRY,
url: TEXT_ENTRY,
email: TEXT_ENTRY.concat('multiple'),
textarea: ['placeholder', 'inputmode', 'minlength', 'maxlength', 'readonly'],
number: ['placeholder', 'inputmode', 'readonly'].concat(BOUNDS),
'datetime-local': ['readonly'].concat(BOUNDS),
select: ['multiple', 'size'],
radio: [], checkbox: [], hidden: [],
};
const control = (f) => {
const attrs = `id="${esc(fieldId(f.name))}" name="${esc(f.name)}"${f.required ? ' required' : ''}`
+ `${f.disabled ? ' disabled' : ''} autocomplete="${esc(autoOf(f))}"${describedBy(f)}`
+ std(f, STD[f.type] || []);
if (f.type === 'textarea') return `<textarea ${attrs} rows="${f.rows || 5}">${esc(f.value || '')}</textarea>`;
if (f.type === 'select') {
const option = (o) => {
const v = typeof o === 'string' ? o : o.value;
return `<option value="${esc(v)}">${esc(typeof o === 'string' ? o : named(o.label, `an option of "${f.name}"`))}</option>`;
};
const opts = (f.options || []).map((o) => (o && Array.isArray(o.options)
? `<optgroup label="${esc(named(o.label, `an option group of "${f.name}"`))}">${o.options.map(option).join('')}</optgroup>`
: option(o))).join('');
const placeholder = f.multiple ? ''
: `<option value=""${f.required ? ' disabled' : ''} selected>Choose…</option>`;
return `<select ${attrs}>${placeholder}${opts}</select>`;
}
return `<input ${attrs} type="${esc(f.type || 'text')}"${val(f)}>`;
};
const req = (f, opt) => {
if (!f.required) return '';
if (opt == null) return ' required';
return f.type === 'radio' ? ' required' : '';
};
const checkable = (f, opt, i) => {
const id = `${esc(fieldId(f.name))}${opt ? `-${i}` : ''}`;
const v = opt == null ? (f.value != null ? f.value : 'yes') : (typeof opt === 'string' ? opt : opt.value);
const label = opt == null ? named(f.label, `field "${f.name}"`) : (typeof opt === 'string' ? opt : named(opt.label, `an option of "${f.name}"`));
return `<div class="form__option">
        <span class="form__control">
          <input type="${esc(f.type)}" id="${id}" name="${esc(f.name)}" value="${esc(v)}"${req(f, opt)}${f.disabled ? ' disabled' : ''}>
          ${f.type === 'checkbox' ? '<svg class="form__check-mark" aria-hidden="true"><use href="#icon-check"/></svg>' : ''}
        </span>
        <label for="${id}">${esc(label)}</label>
      </div>`;
};
const groupLegend = (f) => `<legend>${esc(named(f.label, `field "${f.name}"`))}`
+ `${f.required ? ' <span class="form__required" aria-hidden="true">*</span>' : ''}</legend>`;
const groupRequired = (f) => (f.required && f.type === 'checkbox' ? ' data-required="true"' : '');
const group = (f) => `<fieldset class="form__field form__group form__group--options"${groupRequired(f)}${describedBy(f)}>
      ${groupLegend(f)}${help(f)}
      ${(f.options || []).map((o, i) => checkable(f, o, i)).join('\n      ')}
    </fieldset>`;
const hidden = (c.fields || []).filter((f) => f.type === 'hidden')
.map((f) => `<input type="hidden" name="${esc(f.name)}"${val(f)}>`).join('\n    ');
const slug = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x';
const helpId = (f) => `${fieldId(f.name || slug(f.label))}-help`;
const help = (f) => (f.help ? `\n      <p class="form__help" id="${esc(helpId(f))}">${f.help}</p>` : '');
const describedBy = (f) => (f.help ? ` aria-describedby="${esc(helpId(f))}"` : '');
const one = (f) => {
if (f.type === 'radio' || (f.type === 'checkbox' && Array.isArray(f.options))) return group(f);
if (f.type === 'checkbox') return `<div class="form__field">${checkable(f)}${help(f)}</div>`;
return `<div class="form__field">
      <label for="${esc(fieldId(f.name))}">${esc(named(f.label, `field "${f.name}"`))}${f.required ? ' <span class="form__required" aria-hidden="true">*</span>' : ''}</label>${help(f)}
      ${control(f)}
    </div>`;
};
const shown = (c.fields || []).filter((f) => f.type !== 'hidden');
const rows = [];
let open = null;
for (const f of shown) {
if (f.type === 'fieldset') { open = { set: f, children: [] }; rows.push(open); continue; }
if (f.isChild && open) open.children.push(f);
else { open = null; rows.push({ field: f }); }
}
const fields = rows.map((r) => (r.field ? one(r.field) : `<fieldset class="form__field form__group form__group--fields"${describedBy(r.set)}>
      ${groupLegend(r.set)}${help(r.set)}
      ${r.children.map(one).join('\n      ')}
    </fieldset>`)).join('\n    ');
const note = shown.some((f) => f.required)
? `\n    <p class="form__note">Fields marked <span class="form__required" aria-hidden="true">*</span> are required.</p>`
: '';
const title = c.title ? `\n    ${componentTitle(c)}` : '';
const formHelpId = `form-${slug(formName)}-help`;
const formHelp = c.help ? `\n    <p class="form__help form__help--form" id="${esc(formHelpId)}">${c.help}</p>` : '';
return `<movelli-form${rootAttrs(c, 'form')}>
  <form class="form__body component__body" method="post" action="${esc(c.action || '')}"${c.help ? ` aria-describedby="${esc(formHelpId)}"` : ''}>${title}${formHelp}
    <input type="hidden" name="_form" value="${esc(formName)}">
    <div class="form__hp" aria-hidden="true"><label>Leave this field empty<input name="_gotcha" tabindex="-1" autocomplete="off"></label></div>
    <div class="form__fields">
    ${hidden ? hidden + '\n    ' : ''}${fields}
    <button type="submit" class="btn">${esc(c.submitLabel || 'Send')}</button>${note}
    </div>
  </form>
</movelli-form>`;
}
function renderFigure(c) {
const loading = c.loading || 'lazy';
const srcset = c.srcset ? ` srcset="${esc(c.srcset)}"` : '';
let sizesVal = c.sizes || '';
if (loading === 'lazy' && c.srcset && !/^auto\b/.test(sizesVal)) sizesVal = sizesVal ? `auto, ${sizesVal}` : 'auto';
const sizes = sizesVal ? ` sizes="${esc(sizesVal)}"` : '';
const w = dim(c.width), h = dim(c.height);
const wh = `${w ? ` width="${w}"` : ''}${h ? ` height="${h}"` : ''}`;
const figcaption = (c.caption || c.credit)
? `\n    <figcaption>${c.caption || ''}${c.credit ? ` <span class="figure__credit">${c.credit}</span>` : ''}</figcaption>`
: '';
const ratio = w && h ? ` style="--figure-ratio: ${+(w / h).toFixed(4)}"` : '';
return `<movelli-figure${rootAttrs(c, 'figure')}>${componentTitle(c)}<figure class="figure__body component__body"${ratio}>
    <img src="${esc(c.src)}"${srcset}${sizes}${wh} alt="${c.alt || ''}" loading="${esc(loading)}"${priority(c.fetchpriority)} decoding="async">${figcaption}
  </figure></movelli-figure>`;
}
function renderChatTurn(c) {
return `<movelli-chat-turn${rootAttrs(c, 'chat-turn')}>${textBody('chat-turn', `<p>${esc(c.text || '')}</p>`)}</movelli-chat-turn>`;
}
function renderChatThinking(c) {
const body = `<span class="sr-only">${esc(c.text || '')}</span>`
+ '<span class="chat-thinking__dot" aria-hidden="true"></span>'.repeat(3);
return `<movelli-chat-thinking${rootAttrs(c, 'chat-thinking')} role="status">${textBody('chat-thinking', body)}</movelli-chat-thinking>`;
}
function renderChatDivider(c) {
return `<movelli-chat-divider${rootAttrs(c, 'chat-divider')}>`
+ '<hr class="chat-divider__body component__body"></movelli-chat-divider>';
}
function renderChatContinue(c) {
return `<movelli-chat-continue${rootAttrs(c, 'chat-continue')}${c.segment ? ` data-title="${esc(c.segment)}"` : ''}>`
+ '<button type="button" class="chat-continue__btn">'
+ '<svg class="icon" aria-hidden="true"><use href="#icon-reply"/></svg>'
+ `${esc(c.label || '')}</button></movelli-chat-continue>`;
}
function replyChip(text) {
return `<button type="button" class="chat-reply chip">${esc(text)}</button>`;
}
function renderReplyOptions(c) {
const options = (c.items || []).map((r) => {
const o = typeof r === 'string' ? { label: r } : r;
return `<button type="button" class="reply-options__option chip">${esc(o.label)}</button>`;
}).join('\n        ');
return `<movelli-reply-options${rootAttrs(c, 'reply-options')}>
      <div class="reply-options__list" role="group"${c.label ? ` aria-label="${esc(c.label)}"` : ''}>
        <svg class="icon reply-options__icon" aria-hidden="true"><use href="#icon-prompt-suggestion"/></svg>
        ${options}
      </div>
    </movelli-reply-options>`;
}
function renderReplies(c) {
const btns = (c.items || []).map(replyChip).join('\n        ');
return `<movelli-chat-replies${rootAttrs(c, 'chat-replies')}>
      <div class="chat-replies__chips" role="group"${c.label ? ` aria-label="${esc(c.label)}"` : ''}>
        <svg class="icon chat-replies__icon" aria-hidden="true"><use href="#icon-prompt-suggestion"/></svg>
        ${btns}
      </div>
    </movelli-chat-replies>`;
}
function renderChatSegmentTitle(c) {
const h = `h${headingLevel(c.level, 3)}`;
return `<movelli-chat-segment-title${rootAttrs(c, 'chat-segment-title')}>${textBody('chat-segment-title', `<${h} class="chat-segment-title__heading">${esc(c.text)}</${h}>`)}</movelli-chat-segment-title>`;
}
function renderStatusMessage(c) {
return `<movelli-status-message${rootAttrs(c, 'status-message')}>${textBody('status-message', `<p>${c.html != null ? c.html : esc(c.text)}</p>`)}</movelli-status-message>`;
}
function renderFootnotes(c) {
const back = esc(c.backLabel || '');
const items = (c.items || []).map((it, i) => `<li class="footnotes__item" id="note-${i + 1}" role="doc-endnote"><sup>${i + 1}</sup>${it.html}<a class="footnotes__back" href="#ref-${i + 1}" role="doc-backlink" aria-label="${back}" title="${back}">↩</a></li>`).join('\n      ');
return items ? `<movelli-footnotes${rootAttrs(c, 'footnotes')}><ol class="footnotes__body component__body" role="list">
      ${items}
    </ol></movelli-footnotes>` : `<movelli-footnotes${rootAttrs(c, 'footnotes')}></movelli-footnotes>`;
}
function renderNote(c) {
return `<movelli-note${rootAttrs(c, 'note')}>${textBody('note', `<p>${c.html != null ? c.html : esc(c.text)}</p>`)}</movelli-note>`;
}
function mediaCredit(c) {
return c.credit ? `\n    <span class="banner__credit">${c.credit}</span>` : '';
}
function taxoLink(t, cls) {
return t && t.href ? `<a class="${cls}" href="${esc(t.href)}">${esc(t.label)}</a>` : esc((t && t.label) || '');
}
function renderPageTitle(c) {
const eyebrow = c.category && c.category.label
? `\n    <p class="page-title__eyebrow">${taxoLink(c.category, 'page-title__category')}</p>` : '';
return `<movelli-page-title${rootAttrs(c, 'page-title')}>${textBody('page-title', `${eyebrow}
    <h1>${c.title || ''}</h1>
  `)}</movelli-page-title>`;
}
function renderByline(c) {
const tags = (Array.isArray(c.tags) ? c.tags : []).filter((t) => t && t.label).map((t) => taxoLink(t, 'byline__tag'));
const parts = [
c.updated ? `<span>Updated <time datetime="${esc(c.updated)}">${esc(c.updatedLabel || c.updated)}</time></span>` : '',
tags.length ? `<span class="byline__separator" aria-hidden="true">|</span><span class="byline__tags">${tags.join(' · ')}</span>` : '',
c.readingTime ? `<span>${esc(c.readingTime)}</span>` : '',
].filter(Boolean);
return parts.length ? `<movelli-byline${rootAttrs(c, 'byline')}><p class="byline__body component__body">${parts.join('')}</p></movelli-byline>` : '';
}
function cellValue(v) {
if (v == null || v === '') return '';
if (typeof v === 'string') return v;
return esc(String(v));
}
function renderToc(c) {
const items = (c.items || []).filter((i) => i && i.label && i.href);
if (!items.length) return '';
const links = items.map((i) => `<li><a href="${esc(i.href)}">${i.label}</a></li>`).join('\n        ');
return `<movelli-toc${rootAttrs(c, 'toc')}><nav class="toc__body component__body" aria-labelledby="toc-title">
      <div class="toc__content">
        <h${headingLevel(c.level, 2)} id="toc-title" class="toc__title">${c.label}</h${headingLevel(c.level, 2)}>
        <ol class="toc__list">
          ${links}
        </ol>
      </div>
    </nav></movelli-toc>`;
}
function renderOverviewTable(c) {
const table = oneTable({ caption: c.caption, subtitle: c.subtitle, rows: c.rows });
if (!table) return '';
return `<movelli-overview-table${rootAttrs(c, 'overview-table')}>${componentTitle(c)}<div class="overview-table__body component__body">${table}</div></movelli-overview-table>`;
}
function oneTable(sec) {
const rows = (sec.rows || []).map((r) => (r ? { label: r.label, value: cellValue(r.value) } : r))
.filter((r) => r && (r.label || r.value)).map((r) =>
`<tr role="row"><th scope="row" role="rowheader">${esc(r.label)}</th><td role="cell">${r.value}</td></tr>`)
.join('\n        ');
if (!rows) return '';
const caption = sec.caption ? `<caption>${esc(sec.caption)}${sec.subtitle ? `<span class="overview-table__subtitle">${esc(sec.subtitle)}</span>` : ''}</caption>` : '';
return `<table class="overview-table__table" role="table">${caption}
      <tbody role="rowgroup">
        ${rows}
      </tbody>
    </table>`;
}
function renderProps(c) {
const rows = (c.rows || []).map((r) => `<div class="props__row">
        <dt>${esc(r.label)}</dt>
        <dd>${cellValue(r.value)}</dd>
      </div>`).join('\n      ');
return rows ? `<movelli-props${rootAttrs(c, 'props')}>${componentTitle(c)}<dl class="props__body component__body">
      ${rows}
    </dl></movelli-props>` : '';
}
function externalLinkMark({ inline = false, icon = true } = {}) {
return `${icon ? `<svg class="icon${inline ? ' icon--inline' : ''}" aria-hidden="true"><use href="#icon-external"/></svg>` : ''}<span class="sr-only">&nbsp;(opens in a new tab)</span>`;
}
function renderCta(c) {
const link = c.href && typeof c.href === 'object' ? c.href : null;
const href = link ? link.url : c.href;
if (c.disabled || c.element === 'button') {
const cls = c.isPrimary === false ? 'btn btn--secondary' : 'btn';
const off = c.disabled ? ' disabled' : '';
return `<movelli-cta${rootAttrs(c, 'cta')}><button type="button" class="${cls}"${off}>${c.label || ''}</button></movelli-cta>`;
}
const target = link ? link.target : c.target;
const external = /^https?:/i.test(href || '');
const cls = c.isPrimary === false ? 'btn btn--secondary' : 'btn';
const rels = String((link && link.rel) || c.rel || (external ? 'noopener noreferrer' : ''))
.split(/\s+/).filter(Boolean);
if (c.sponsored && !rels.includes('sponsored')) rels.unshift('sponsored');
const rel = rels.join(' ');
const attrs = `${external || target ? ` target="${esc(target || '_blank')}"` : ''}${rel ? ` rel="${esc(rel)}"` : ''}`;
const icon = external
? ` ${externalLinkMark()}`
: '';
return `<movelli-cta${rootAttrs(c, 'cta')}><a class="${cls}" href="${esc(href)}"${attrs}>${c.label || ''}${icon}</a></movelli-cta>`;
}
const HAS_BLOCK = /<(p|h[1-6]|ul|ol|li|blockquote|div|figure|table|pre)\b/i;
function paragraphBody(html) {
return html && !HAS_BLOCK.test(html) ? `<p>${html}</p>` : (html || '');
}
function renderProse(c) {
const body = paragraphBody(c.html);
return `<movelli-prose${rootAttrs(c, 'prose')}>${textBody('prose', body)}</movelli-prose>`;
}
function renderIntro(c) {
return `<movelli-intro${rootAttrs(c, 'intro')}>${textBody('intro', paragraphBody(c.html))}</movelli-intro>`;
}
function renderBanner(c) {
const clip = c.src && c.bytes != null ? c.src : null;
const style = clip && c.poster ? `--band-poster:url('${esc(c.poster).replace(/'/g, '%27')}')` : '';
const slotted = ((c.slots && c.slots.content && c.slots.content.components) || [])
.map(renderComponent).filter(Boolean);
const body = slotted.length ? `<div class="banner__slot">\n          ${slotted.join('\n          ')}\n        </div>` : '';
let media = '';
if (clip) {
const sources = `<source ${c.loading === 'eager' ? 'src' : 'data-src'}="${esc(clip)}" type="video/mp4">`;
media = `\n    <video class="banner__img" role="img" aria-label="${c.label || c.alt || ''}" autoplay muted loop playsinline preload="none"${c.poster ? ` poster="${esc(c.poster)}"` : ''}>
      ${sources}
    </video>`;
} else if (c.src) {
const srcset = c.srcset ? ` srcset="${esc(c.srcset)}"` : '';
const loading = c.loading === 'eager' ? 'eager' : 'lazy';
const sizesFor = (list) => (loading === 'lazy' ? `auto, ${list || '100vw'}` : (list || '100vw'));
const sizes = c.srcset ? ` sizes="${esc(sizesFor(c.sizes))}"` : '';
const w = dim(c.width), h = dim(c.height);
const wh = `${w ? ` width="${w}"` : ''}${h ? ` height="${h}"` : ''}`;
const img = `<img class="banner__img" src="${esc(c.src)}"${srcset}${sizes}${wh} alt="${c.alt || ''}" loading="${loading}"${priority(c.fetchpriority)} decoding="async">`;
const sources = Array.isArray(c.sources) ? c.sources : [];
media = sources.length
? `\n    <picture class="banner__picture">${sources.map((s) => {
const sw = dim(s.width), sh = dim(s.height);
return `\n      <source media="${esc(s.media)}" srcset="${esc(s.srcset)}"${s.sizes ? ` sizes="${esc(s.sizes)}"` : ''}${sw ? ` width="${sw}"` : ''}${sh ? ` height="${sh}"` : ''}>`;
}).join('')}\n      ${img}\n    </picture>`
: `\n    ${img}`;
}
const scrim = body ? ' banner--scrim' : '';
const contentBox = c.contentWidth === 'wide' ? 'banner--content-wide' : '';
const content = body ? `\n      <div class="banner__content">\n        ${body}\n      </div>` : '';
return `<movelli-banner${rootAttrs(c, 'banner', scrim.trim(), contentBox)}${style ? ` style="${style}"` : ''}>
    <div class="banner__body component__body">${media}${content}${mediaCredit(c)}
    </div>
  </movelli-banner>`;
}
function renderCallout(c) {
return `<movelli-callout${rootAttrs(c, 'callout')}><aside class="callout__body component__body">${componentTitle(c)}${c.html || ''}</aside></movelli-callout>`;
}
function renderQuote(c) {
const src = typeof c.cite === 'string' ? c.cite : (c.cite && c.cite.url);
const cite = src ? ` cite="${esc(src)}"` : '';
const caption = c.attribution ? `\n    <figcaption class="quote__attribution">${c.attribution}</figcaption>` : '';
return `<movelli-quote${rootAttrs(c, 'quote')}>${componentTitle(c)}<figure class="quote__body component__body">
    <blockquote class="quote__text"${cite}><p>${c.text || ''}</p></blockquote>${caption}
  </figure></movelli-quote>`;
}
function renderCodeBlock(c) {
const label = c.label ? `\n    <p class="code-block__label">${c.label}</p>` : '';
const region = c.title && c.anchor ? ` role="region" aria-labelledby="${esc(c.anchor)}"` : '';
return `<movelli-code-block${rootAttrs(c, 'code-block')}>${componentTitle(c)}${textBody('code-block', `${label}
    <pre${region}><code>${c.code || ''}</code></pre>
  `)}</movelli-code-block>`;
}
function renderList(c) {
const mark = c.marker === 'cross' ? 'close' : 'check';
const items = (c.items || []).map((i) =>
`<li><svg class="icon" aria-hidden="true"><use href="#icon-${mark}"/></svg>${i == null ? '' : i}</li>`).join('');
if (!items) return '';
return `<movelli-list${rootAttrs(c, 'list')}><div class="list__body component__body">${componentTitle(c)}<ul>${items}</ul></div></movelli-list>`;
}
function renderComparison(c) {
const head = `<thead><tr>${(c.columns || []).map((col) => `<th scope="col">${col == null ? '' : col}</th>`).join('')}</tr></thead>`;
const body = `<tbody>${(c.rows || []).map((r) =>
`<tr><th scope="row">${r.label || ''}</th>${(r.cells || []).map((cell) => `<td>${cell == null ? '' : cell}</td>`).join('')}</tr>`).join('')}</tbody>`;
const caption = c.caption ? `<caption>${c.caption}${c.subtitle ? `<span class="comparison-table__subtitle">${c.subtitle}</span>` : ''}</caption>` : '';
const note = (c.note || c.source) ? `\n    <p class="comparison-table__note">${c.note || ''}${c.source ? ` <span class="comparison-table__credit">${c.source}</span>` : ''}</p>` : '';
return `<movelli-comparison-table${rootAttrs(c, 'comparison-table')}>${componentTitle(c)}
    <div class="comparison-table__body component__body" tabindex="0"><table class="comparison-table__table">${caption}${head}${body}</table></div>${note}
  </movelli-comparison-table>`;
}
function renderFaq(c) {
const fnv1a = (s) => {
let h = 0x811c9dc5;
for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
return (h >>> 0).toString(36);
};
const group = esc(c.anchor || `faq-${fnv1a((c.items || []).map((i) => `${i.q || ''}\n${i.a || ''}`).join('\n'))}`);
const details = (c.items || []).map((i) =>
`<details name="${group}"><summary>${i.q || ''}<svg class="icon faq__marker" aria-hidden="true"><use class="faq__more" href="#icon-add"/><use class="faq__less" href="#icon-remove"/></svg></summary><p>${i.a || ''}</p></details>`).join('\n    ');
return `<movelli-faq${rootAttrs(c, 'faq')}>
    ${componentTitle(c)}
    ${details ? textBody('faq', `
    ${details}
  `) : ''}</movelli-faq>`;
}
function renderVideo(c) {
const loadLater = c.autoplay && !c.eager;
const sources = c.src ? `<source ${loadLater ? 'data-src' : 'src'}="${esc(c.src)}" type="video/mp4">` : '';
const tracks = (c.tracks || []).map((t) =>
`<track kind="captions" srclang="${esc(t.srclang)}" label="${esc(t.label)}" src="${esc(t.src)}"${t.default ? ' default' : ''}>`).join('\n        ');
const figcaption = (c.caption || c.credit)
? `\n    <figcaption>${c.caption || ''}${c.credit ? ` <span class="video__credit">${c.credit}</span>` : ''}</figcaption>`
: '';
const vw = dim(c.width), vh = dim(c.height);
const flags = [
c.controls === false ? '' : 'controls',
c.autoplay ? 'autoplay' : '',
(c.muted || c.autoplay) ? 'muted' : '',
c.loop ? 'loop' : '',
'playsinline',
].filter(Boolean).join(' ');
const poster = c.poster ? ` poster="${esc(c.poster)}"` : '';
const label = c.alt ? ` aria-label="${esc(c.alt)}"` : '';
return `<movelli-video${rootAttrs(c, 'video')}>${componentTitle(c)}<figure class="video__body component__body">
    <div class="video__frame"><video ${flags} preload="${c.eager ? 'auto' : 'none'}"${vw ? ` width="${vw}"` : ''}${vh ? ` height="${vh}"` : ''}${poster}${label}>
        ${sources}
        ${tracks}
        ${esc(c.fallback || '')}
    </video></div>${figcaption}
  </figure></movelli-video>`;
}
function renderCard(c) {
const titleTag = c.level == null ? 'span' : `h${headingLevel(c.level, 2)}`;
const w = dim(c.width), h = dim(c.height);
const cardLoading = c.loading === 'eager' ? 'eager' : 'lazy';
const cardSrcset = c.srcset ? ` srcset="${esc(c.srcset)}"` : '';
let cardSizes = c.sizes || '';
if (cardLoading === 'lazy' && c.srcset && !/^auto\b/.test(cardSizes)) cardSizes = cardSizes ? `auto, ${cardSizes}` : 'auto';
const img = c.src ? `<img class="card__img" src="${esc(c.src)}"${cardSrcset}${cardSizes ? ` sizes="${esc(cardSizes)}"` : ''}${w ? ` width="${w}"` : ''}${h ? ` height="${h}"` : ''} alt=""`
+ ` loading="${cardLoading}"${priority(c.fetchpriority)} decoding="async">` : '';
const warm = c.heroImage && typeof c.heroImage === 'object' ? ` data-hero-image="${esc(JSON.stringify(c.heroImage))}"` : '';
const thumb = (c.variant || []).includes('no-thumb') ? '' : `
        <span class="card__thumb" aria-hidden="true">
          ${img}${c.tag ? `<span class="card__tag">${c.tag}</span>` : ''}${img ? '' : (c.thumbLabel || '')}
        </span>`;
return `<movelli-card${rootAttrs(c, 'card')}${warm}>
      <a class="card__body component__body" href="${esc(c.url || '#')}">${thumb}
        <span class="card__text">
          <${titleTag} class="card__title is-underlined">${c.title}</${titleTag}>
          <span class="card__summary">${c.summary || ''}</span>
        </span>
      </a>
    </movelli-card>`;
}
function renderHeadingComponent(c) {
return `<movelli-heading${rootAttrs(c, 'heading')}>${componentTitle(c, 2, 'heading__body')}</movelli-heading>`;
}
function renderMoreLink(c) {
if (!c.url || !c.label) return '';
return `<movelli-more-link${rootAttrs(c, 'more-link')}><a class="more-link__body component__body" href="${esc(c.url)}">${c.label}<svg class="icon" aria-hidden="true"><use href="#icon-arrow"/></svg></a></movelli-more-link>`;
}
function renderRelatedPages(c) {
const lead = c.lead || {};
const forms = ['one', 'other'].filter((f) => lead[f] != null).map((f) => ` data-lead-${f}="${lead[f]}"`).join('');
return `<movelli-related-pages${rootAttrs(c, 'related-pages')} hidden${forms}><div class="related-pages__body component__body"></div></movelli-related-pages>`;
}
})();
export const modules = { "render/renderers.mjs": M5, "catalog/esc.mjs": M2, "catalog/catalog.mjs": M1 };
