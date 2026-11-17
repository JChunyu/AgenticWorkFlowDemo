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
 * Stateless, side-effect free: the same fragment always yields an equivalent,
 * still-detached host. `view` owns attach / replace / detach (AD-12), the render
 * budget (AD-13), and every piece of chrome with copy in it (AD-14).
 */
export function render(fragment: SanitizedFragment): ShadowHost {
  const host = document.createElement('div');
  host.className = HOST_CLASS;

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = [CONTENT_BASE_CSS, hostSeedStyle(fragment.rootStyleSeed), fragment.styles.join('\n')]
    .filter((part) => part.trim().length > 0)
    .join('\n');

  const root = document.createElement('div');
  root.className = ROOT_CLASS;
  root.innerHTML = fragment.contentHtml;

  shadow.append(style, root);

  return { element: host, shadow };
}
