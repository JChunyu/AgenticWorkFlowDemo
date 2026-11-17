import { en, zh, type MessageKey } from './keys';

export type { MessageKey };
export type Lang = 'zh' | 'en';

const TABLES: Record<Lang, Record<MessageKey, string>> = { zh, en };

/** Key set of both languages — used by the parity test and by `verify-docs`. */
export function messageKeys(): MessageKey[] {
  return Object.keys(zh) as MessageKey[];
}

export function t(key: MessageKey, lang: Lang): string {
  return TABLES[lang][key] ?? TABLES.en[key];
}

export function createTranslator(lang: Lang): (key: MessageKey) => string {
  return (key: MessageKey) => t(key, lang);
}

/**
 * Obsidian stores the interface language in `localStorage.language`.
 * Anything that is not Chinese falls back to English.
 */
export function detectLang(storage?: Storage | null): Lang {
  let raw: string | null | undefined;
  if (storage !== undefined) {
    raw = storage === null ? null : storage.getItem('language');
  } else if (typeof window !== 'undefined' && window.localStorage) {
    raw = window.localStorage.getItem('language');
  }
  if (typeof raw === 'string' && raw.toLowerCase().startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

export { en, zh };
