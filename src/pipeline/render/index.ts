import type { SanitizedFragment, ShadowHost } from '../../core/contracts';
import { CONTENT_BASE_CSS } from './base-styles';

/** Class of the host element `view` inserts into the note. */
export const HOST_CLASS = 'h5r-rendered-host';

/** Class of the wrapper inside the shadow root. */
export const ROOT_CLASS = 'h5r-root';

function hostSeedStyle(rootStyleSeed: string): string {
  if (rootStyleSeed.trim().length === 0) {
    return '';
  }
  return `:host { ${rootStyleSeed} }`;
}

/**
 * The stylesheet a single card carries: the shared base, the block's own `html`/`body`
 * declarations re-rooted on `:host`, then the block's `<style>` blocks in source order.
 */
export function contentCss(fragment: SanitizedFragment): string {
  return [CONTENT_BASE_CSS, hostSeedStyle(fragment.rootStyleSeed), fragment.styles.join('\n')]
    .filter((part) => part.trim().length > 0)
    .join('\n');
}

/**
 * Card styles are per block, so they cannot live in `styles.css`. Each shadow root
 * adopts its own constructed sheet instead: no `<style>` element is created, attached,
 * or reachable from the note.
 *
 * The sheet is built from the window that owns the shadow root — a constructed sheet
 * may only be adopted by a document that shares its constructor document, which is what
 * keeps a card rendering in a popout window.
 */
function adoptStyles(shadow: ShadowRoot, css: string): void {
  const Sheet = shadow.ownerDocument.defaultView?.CSSStyleSheet;
  if (css.length === 0 || typeof Sheet !== 'function') {
    return;
  }
  const sheet = new Sheet();
  sheet.replaceSync(css);
  shadow.adoptedStyleSheets = [sheet];
}

/**
 * The one place a string is turned back into nodes. `fragment.contentHtml` can only
 * come from `scrub`, which is what sets the `sanitized: true` marker: scripts, `on*`
 * handlers, `javascript:` URLs and every fetching attribute are already gone, and the
 * parse target is a detached document — not the note's document.
 */
function contentFragment(doc: Document, html: string): DocumentFragment {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const body = doc.importNode(parsed.body, true);
  const fragment = doc.createDocumentFragment();
  while (body.firstChild) {
    fragment.appendChild(body.firstChild);
  }
  return fragment;
}

/**
 * Stateless, side-effect free: the same fragment always yields an equivalent,
 * still-detached host. `view` owns attach / replace / detach (AD-12), the render
 * budget (AD-13), and every piece of chrome with copy in it (AD-14).
 */
export function render(fragment: SanitizedFragment): ShadowHost {
  const host = createDiv({ cls: HOST_CLASS });
  const doc = host.ownerDocument;

  const shadow = host.attachShadow({ mode: 'open' });

  const css = contentCss(fragment);
  adoptStyles(shadow, css);

  const root = createDiv({ cls: ROOT_CLASS });
  root.appendChild(contentFragment(doc, fragment.contentHtml));

  shadow.appendChild(root);

  return { element: host, shadow, css };
}
