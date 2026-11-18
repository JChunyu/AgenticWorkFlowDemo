import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(path.resolve(process.cwd(), 'styles.css'), 'utf8');

/*
 * These assertions read the stylesheet source. They prove the rules exist and are
 * scoped; they do NOT prove how a printed page looks — that stays a manual check in
 * a sample vault (NFR9).
 */

describe('shell stylesheet', () => {
  it('contains no literal colour value', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(css).not.toMatch(/\brgba?\(/i);
    expect(css).not.toMatch(/\bhsla?\(/i);
  });

  it('resolves every semantic surface to an Obsidian theme variable', () => {
    for (const alias of [
      '--h5r-surface-raised',
      '--h5r-text-secondary',
      '--h5r-hairline',
      '--h5r-accent',
      '--h5r-warning',
      '--h5r-danger',
    ]) {
      expect(css).toContain(`${alias}: var(--`);
    }
  });

  it('styles shell chrome only, never rendered content', () => {
    expect(css).not.toContain('.h5r-root');
    expect(css).not.toMatch(/\.h5r-root\s/);
    expect(css).not.toMatch(/^\s*(pre|code)\s*\{/m);
  });

  it('never needs !important or :has to win a print rule', () => {
    expect(css).not.toContain('!important');
    expect(css).not.toContain(':has(');
  });

  it('declares print rules that hide every shell control at its real mount point', () => {
    const print = css
      .slice(css.indexOf('@media print'))
      .replace(/\/\*[\s\S]*?\*\//g, '');
    const hidden = [...print.matchAll(/([^{}]+?)\s*\{[^{}]*?display:\s*none[^{}]*\}/g)]
      .flatMap((match) => match[1].split(','))
      .map((selector) => selector.trim())
      .filter((selector) => selector.length > 0 && !selector.startsWith('@'));

    /* The reconciler inserts these two inside the block wrapper. */
    expect(hidden).toContain('.h5r-block > .h5r-toggle');
    expect(hidden).toContain('.h5r-block > .h5r-notice');

    /* Onboarding prompts and the copy fallback mount on the preview root or the
     * inline host — a .h5r-block ancestor in the selector would match nothing and
     * leak them into printed output. Exactly the bare selectors must be hidden. */
    expect(hidden.filter((selector) => selector.includes('h5r-onboarding'))).toEqual(['.h5r-onboarding']);
    expect(hidden.filter((selector) => selector.includes('h5r-copy-fallback'))).toEqual(['.h5r-copy-fallback']);
  });

  it('declares print rules that force the rendered state for a source block', () => {
    const print = css.slice(css.indexOf('@media print'));
    expect(print).toContain('.h5r-block.h5r-block--source > .h5r-source');
    expect(print).toContain('.h5r-block.h5r-block--source > .h5r-rendered-host');
    expect(print).toContain('.h5r-block--hostless');
  });

  it('keeps the toggle at 24px with no animation', () => {
    expect(css).toMatch(/height: 24px/);
    expect(css).toContain('transition: none');
    expect(css).toContain('opacity: 0.4');
  });
});
