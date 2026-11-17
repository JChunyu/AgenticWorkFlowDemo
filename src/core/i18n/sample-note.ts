import sampleEn from './sample-note.en.md';
import sampleZh from './sample-note.zh.md';
import type { Lang } from './index';

/** The three-card sample note, kept inside `core/i18n` so no copy lives elsewhere. */
export const SAMPLE_NOTE: Record<Lang, string> = {
  zh: sampleZh,
  en: sampleEn,
};

export function sampleNoteFor(lang: Lang): string {
  return SAMPLE_NOTE[lang];
}
