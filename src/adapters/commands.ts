import { App, Notice, Plugin } from 'obsidian';
import constraintCard from '../constraint-card.md';
import { t, type Lang } from '../core/i18n';
import { sampleNoteFor } from '../core/i18n/sample-note';
import { createCopyFallback, createInlineMessage } from '../view/shell';
import { writeClipboard } from './clipboard';
import { inlineHost, VaultWriter } from './vault';

export interface CommandDeps {
  readonly app: App;
  readonly lang: () => Lang;
}

/** Candidate names tried before falling back to opening the existing note. */
export const MAX_SAMPLE_NAME_ATTEMPTS = 9;

export function constraintCardText(): string {
  return constraintCard;
}

function showInlineCopyFallback(deps: CommandDeps, text: string): void {
  const host = inlineHost(deps.app);
  const lang = deps.lang();
  const box = createCopyFallback({
    lang,
    text,
    onClose: () => box.remove(),
  });
  host.prepend(box);
  const area = box.querySelector('textarea');
  area?.focus();
  area?.select();
}

export async function copyConstraintCard(deps: CommandDeps): Promise<boolean> {
  const lang = deps.lang();
  const copied = await writeClipboard(constraintCard);
  if (copied) {
    /* The single toast this product is allowed to show. */
    new Notice(t('copy.success', lang));
    return true;
  }
  showInlineCopyFallback(deps, constraintCard);
  return false;
}

function showSampleFallback(deps: CommandDeps, sampleSource: string): void {
  const lang = deps.lang();
  const host = inlineHost(deps.app);
  const box = createInlineMessage({
    lang,
    text: t('sample.readOnly', lang),
    actionLabel: t('sample.copySource', lang),
    onAction: () => {
      void writeClipboard(sampleSource).then((copied) => {
        if (copied) {
          new Notice(t('copy.success', lang));
          return;
        }
        showInlineCopyFallback(deps, sampleSource);
      });
    },
    onClose: () => box.remove(),
  });
  host.prepend(box);
}

/**
 * Creates and opens the sample note. Name collisions append a sequence number; after
 * repeated collisions the existing note is opened instead of creating more files.
 */
export async function insertSampleNote(deps: CommandDeps): Promise<void> {
  const lang = deps.lang();
  const vault = new VaultWriter(deps.app);
  const baseName = t('sample.fileName', lang);
  const content = sampleNoteFor(lang);

  for (let attempt = 1; attempt <= MAX_SAMPLE_NAME_ATTEMPTS; attempt += 1) {
    const path = `${attempt === 1 ? baseName : `${baseName} ${attempt}`}.md`;
    if (vault.exists(path)) {
      continue;
    }
    try {
      const file = await vault.create(path, content);
      await vault.open(file);
      return;
    } catch {
      /* Read-only or otherwise unwritable vault: degrade in place, never a modal. */
      showSampleFallback(deps, content);
      return;
    }
  }

  const existing = vault.existing(`${baseName}.md`);
  if (existing) {
    await vault.open(existing);
  }
  showSampleFallback(deps, content);
}

export function registerCommands(plugin: Plugin, deps: CommandDeps): void {
  plugin.addCommand({
    id: 'insert-sample-note',
    name: t('command.insertSample', deps.lang()),
    callback: () => {
      void insertSampleNote(deps);
    },
  });

  plugin.addCommand({
    id: 'copy-constraint-card',
    name: t('command.copyCard', deps.lang()),
    callback: () => {
      void copyConstraintCard(deps);
    },
  });
}

export type { App };
