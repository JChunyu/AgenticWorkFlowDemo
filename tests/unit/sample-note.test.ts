import { describe, expect, it } from 'vitest';
import { SAMPLE_NOTE } from '../../src/core/i18n/sample-note';

const LITERAL_COLOUR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i;

describe('sample note', () => {
  for (const lang of ['zh', 'en'] as const) {
    it(`${lang}: ships exactly three sentinel cards`, () => {
      const matches = SAMPLE_NOTE[lang].match(/```h5-renderer/g) ?? [];
      expect(matches).toHaveLength(3);
    });

    it(`${lang}: uses theme variables only`, () => {
      expect(SAMPLE_NOTE[lang]).not.toMatch(LITERAL_COLOUR);
      expect(SAMPLE_NOTE[lang]).toContain('var(--text-normal)');
    });

    it(`${lang}: puts one line of prose above every card`, () => {
      const lines = SAMPLE_NOTE[lang].split('\n');
      const indexes = lines
        .map((line, index) => (line.startsWith('```h5-renderer') ? index : -1))
        .filter((index) => index >= 0);

      for (const index of indexes) {
        const previous = lines
          .slice(0, index)
          .reverse()
          .find((line) => line.trim().length > 0);
        expect(previous?.startsWith('```')).toBe(false);
        expect(previous?.startsWith('#')).toBe(false);
      }
    });
  }
});
