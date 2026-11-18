/** Fixtures that mimic what Obsidian hands to a markdown post-processor. */

export function codeBlock(source: string, fence = 'h5-renderer'): HTMLPreElement {
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.className = `language-${fence}`;
  code.textContent = source;
  pre.appendChild(code);
  return pre;
}

export function noteView(...children: Node[]): HTMLElement {
  const view = document.createElement('div');
  view.className = 'markdown-preview-view markdown-rendered';
  for (const child of children) {
    view.appendChild(child);
  }
  document.body.appendChild(view);
  return view;
}

export function shadowParagraph(host: HTMLElement): Element | null {
  return host.shadowRoot?.querySelector('p') ?? null;
}

/**
 * The reading view's shape at post-processor time: the preview root is in the
 * document, the section element is not. Obsidian attaches sections only after the
 * pass is done, and virtual scrolling detaches them again on scroll.
 */
export function readingPass(...blocks: HTMLPreElement[]): { root: HTMLElement; section: HTMLElement } {
  const root = document.createElement('div');
  root.className = 'markdown-preview-view markdown-rendered';
  const sizer = document.createElement('div');
  sizer.className = 'markdown-preview-sizer markdown-preview-section';
  root.appendChild(sizer);
  document.body.appendChild(root);

  const section = document.createElement('div');
  for (const block of blocks) {
    section.appendChild(block);
  }
  return { root, section };
}

/** What Obsidian does once the pass is over. */
export function attachSection(root: HTMLElement, section: HTMLElement): void {
  root.querySelector('.markdown-preview-sizer')?.appendChild(section);
}

export function sequenceNow(values: number[]): () => number {
  let index = 0;
  return () => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  };
}

export function resetBody(): void {
  document.body.innerHTML = '';
}
