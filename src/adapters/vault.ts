import { App, MarkdownView, TFile } from 'obsidian';

/** File writes stay in the adapter layer; the callers only see success/failure. */
export class VaultWriter {
  private readonly app: App;

  constructor(app: App) {
    this.app = app;
  }

  exists(path: string): boolean {
    return this.app.vault.getAbstractFileByPath(path) !== null;
  }

  async create(path: string, content: string): Promise<TFile> {
    return this.app.vault.create(path, content);
  }

  async open(file: TFile): Promise<void> {
    await this.app.workspace.getLeaf(false).openFile(file);
  }

  existing(path: string): TFile | null {
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile ? file : null;
  }
}

/**
 * Inline messaging lands in the open note — never a modal. If no note is open the
 * document body is the last resort so the message still appears inline.
 */
export function inlineHost(app: App): HTMLElement {
  const view = app.workspace.getActiveViewOfType(MarkdownView);
  if (!view) {
    return activeDocument.body;
  }
  const preview = view.contentEl.querySelector<HTMLElement>('.markdown-preview-view');
  return preview ?? view.contentEl;
}
