import { renderComponent } from '../render/renderers.mjs';
import { copy } from '../copy-data.mjs';

/**
 * ONE COMPONENT CONFIG → ONE ELEMENT. Browser only.
 *
 * [decided 2026-09-01, owner] `renderComponent` is isomorphic and shared, and this three-line
 * wrapper around it was written FOUR times in three files — a `<template>` here, a throwaway `<div>`
 * there, a bare `createElement` and an `innerHTML` string somewhere else. It cannot live in
 * `renderers.mjs`: that module runs in Node, in the Cloud Function and inside ChatGPT's iframe, and
 * there is no `document` in the first two.
 *
 * A `<template>`, not a `<div>`: template content is INERT, so an image inside it does not start
 * loading and a script inside it does not run until the element is adopted into the page.
 *
 * ONE root element. Every consumer takes the first child, so a component returning siblings would
 * silently lose all but the first — which is why every renderer in the catalog emits exactly one.
 */
export function renderElement(config) {
  const tpl = document.createElement('template');
  try {
    tpl.innerHTML = renderComponent(config);
  } catch (e) {
    // ONE REFUSED COMPONENT MUST NOT TAKE THE TURN WITH IT.
    //
    // [the recorded incident, input.js] the AI's grid carried a child the layout check rightly
    // refused, this threw, and the turn died four lines before `setPending(false)` — the Ask bar dead
    // for the rest of the session. A `try/finally` there fixed the Ask bar; this fixes the answer.
    //
    // NOT a duplicate of the check the Cloud Function now runs on its own configs. That covers what
    // the function builds; this covers every OTHER producer the browser renders — the pro-active
    // opener, the 404's related pages, `askComponents` — and it is the last line before a visitor.
    console.error('[render] the component library refused a config:', e.message, config);
    tpl.innerHTML = renderComponent({
      type: 'note', text: copy('ai_component_error'),
    });
  }
  return tpl.content.firstElementChild;
}
