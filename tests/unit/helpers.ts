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
