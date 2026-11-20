/*
 * Browser entry for the screenshot and video tooling. It bundles the plugin's own
 * `scrub` + `render` stages and exposes them on `window.h5r`, so every image in
 * `docs/` is produced by the code that ships — not by a look-alike template.
 */
import { render } from '../../src/pipeline/render';
import { scrub } from '../../src/pipeline/scrub';
import { installDomHelpers } from '../../tests/unit/setup-dom';

installDomHelpers(globalThis);

export interface RenderReport {
  readonly host: HTMLElement;
  readonly removed: number;
  readonly removedKinds: string[];
}

function renderCard(source: string): RenderReport {
  const result = scrub(source);
  if (!result.ok) {
    throw new Error(`scrub failed: ${result.error.code}`);
  }
  const host = render(result.value);
  const element = host.element;
  element.classList.add('h5r-rendered-host');
  return {
    host: element,
    removed: result.value.removed.length,
    removedKinds: result.value.removed.map((entry) => `${entry.kind}:${entry.detail}`),
  };
}

/** Replaces every `<pre data-card="…">` with the card the plugin would draw. */
function paint(root: ParentNode = document): RenderReport[] {
  const reports: RenderReport[] = [];
  for (const pre of Array.from(root.querySelectorAll<HTMLElement>('pre[data-card]'))) {
    const report = renderCard(pre.dataset.card ?? '');
    const block = document.createElement('div');
    block.className = 'h5r-block h5r-block--rendered';
    block.appendChild(report.host);
    pre.replaceWith(block);
    reports.push(report);
  }
  return reports;
}

declare global {
  interface Window {
    h5r: { renderCard: typeof renderCard; paint: typeof paint };
  }
}

window.h5r = { renderCard, paint };
export { renderCard, paint };
