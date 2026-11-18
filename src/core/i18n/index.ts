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
 * `locale` is the ISO code Obsidian reports for its interface language (`getLanguage()`).
 * Anything that is not Chinese falls back to English.
 */
export function detectLang(locale?: string | null): Lang {
  if (typeof locale === 'string' && locale.toLowerCase().startsWith('zh')) {
    return 'zh';
  }
  return 'en';
}

export { en, zh };
