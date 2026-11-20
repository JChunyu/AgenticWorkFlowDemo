import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scrub } from '../../src/pipeline/scrub';

/**
 * `examples/` ships hand-written notes for the README and the release page, so they
 * have to survive the same pipeline a user's block would: nothing stripped, one
 * top-level container, theme variables only.
 */

const EXAMPLES_DIR = join(process.cwd(), 'examples');
/** `examples/zh/` holds the Chinese mirrors; they pass the same gate. */
const EXAMPLE_DIRS = [EXAMPLES_DIR, join(EXAMPLES_DIR, 'zh')];
const LITERAL_COLOUR = /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i;

const files = EXAMPLE_DIRS.flatMap((dir) =>
  readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => ({ dir, name })),
);

function cardsIn(markdown: string): string[] {
  const cards: string[] = [];
  let buffer: string[] | null = null;
  for (const line of markdown.split('\n')) {
    if (buffer === null) {
      if (line.trim() === '```h5-renderer') {
        buffer = [];
      }
      continue;
    }
    if (line.trim() === '```') {
      cards.push(buffer.join('\n'));
      buffer = null;
      continue;
    }
    buffer.push(line);
  }
  return cards;
}

describe('example notes', () => {
  it('ships at least one example note', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    describe(file.name, () => {
      const markdown = readFileSync(join(file.dir, file.name), 'utf8');
      const cards = cardsIn(markdown);

      it('has at least one card', () => {
        expect(cards.length).toBeGreaterThan(0);
      });

      it('uses theme variables instead of literal colours', () => {
        expect(markdown).not.toMatch(LITERAL_COLOUR);
      });

      cards.forEach((card, index) => {
        it(`card ${index + 1}: survives scrubbing untouched`, () => {
          const result = scrub(card);
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.value.removed).toEqual([]);
          }
        });

        it(`card ${index + 1}: has a single top-level container`, () => {
          const result = scrub(card);
          expect(result.ok).toBe(true);
          if (!result.ok) return;

          const template = document.createElement('template');
          template.innerHTML = result.value.contentHtml;
          const topLevel = Array.from(template.content.children);
          expect(topLevel).toHaveLength(1);
        });

        it(`card ${index + 1}: stays under 150 lines`, () => {
          expect(card.split('\n').length).toBeLessThanOrEqual(150);
        });
      });
    });
  }
});
