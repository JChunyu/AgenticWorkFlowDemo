import { describe, expect, it } from 'vitest';
import { detectLang, en, messageKeys, t, zh } from '../../src/core/i18n';

describe('i18n', () => {
  it('keeps the Chinese and English key sets aligned', () => {
    const zhKeys = Object.keys(zh).sort();
    const enKeys = Object.keys(en).sort();

    expect(enKeys).toEqual(zhKeys);
    expect(messageKeys().sort()).toEqual(zhKeys);
  });

  it('covers the ten required surfaces', () => {
    const required = [
      'toggle.toSource',
      'toggle.toPreview',
      'block.empty',
      'notice.parseFailed',
      'notice.renderFailed',
      'notice.removed',
      'onboarding.message',
      'copy.success',
      'sample.ask',
      'sample.declined',
    ];

    for (const key of required) {
      expect(zh).toHaveProperty(key);
      expect(en).toHaveProperty(key);
    }
  });

  it('has no empty or mixed-language value', () => {
    for (const key of messageKeys()) {
      expect(zh[key].trim().length).toBeGreaterThan(0);
      expect(en[key].trim().length).toBeGreaterThan(0);
    }
    for (const key of messageKeys()) {
      expect(en[key]).not.toMatch(/[\u4e00-\u9fa5]/);
    }
  });

  it('returns copy in the requested language', () => {
    expect(t('toggle.toSource', 'zh')).toBe('源码');
    expect(t('toggle.toSource', 'en')).toBe('Code');
  });

  it('detects the Obsidian interface language', () => {
    expect(detectLang({ getItem: () => 'zh' } as unknown as Storage)).toBe('zh');
    expect(detectLang({ getItem: () => 'zh-TW' } as unknown as Storage)).toBe('zh');
    expect(detectLang({ getItem: () => 'en' } as unknown as Storage)).toBe('en');
    expect(detectLang({ getItem: () => null } as unknown as Storage)).toBe('en');
  });
});
