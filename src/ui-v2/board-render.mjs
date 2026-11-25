/**
 * src/ui-v2/board-render.mjs — DOM mount for the whole board.
 *
 * The only module in the v2 UI that touches the DOM for board content.  It
 * takes buildView() output, asks the pure templates for an HTML string, then
 * mounts it.  There are deliberately no click handlers: phase 3.1 is display
 * only, and all advancement goes through the demo controller.
 */

import { renderBoardMarkup } from './templates/board.mjs';

export function createBoardRenderer(root, options = {}) {
  if (!root || typeof root.innerHTML !== 'string') {
    throw new TypeError('createBoardRenderer needs a DOM root element');
  }

  let lastView = null;
  let lastHtml = '';

  function render(view, renderOptions = {}) {
    lastView = view;
    lastHtml = renderBoardMarkup(view, { ...options, ...renderOptions });
    root.innerHTML = lastHtml;
    return root;
  }

  return {
    render,
    getView: () => lastView,
    getHtml: () => lastHtml,
    clear: () => {
      root.innerHTML = '';
      lastView = null;
      lastHtml = '';
    },
  };
}

/** One-shot convenience wrapper. */
export function renderBoard(root, view, options = {}) {
  return createBoardRenderer(root, options).render(view);
}

export default createBoardRenderer;
