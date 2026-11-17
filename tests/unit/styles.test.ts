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

  it('declares print rules that hide every shell control', () => {
    const print = css.slice(css.indexOf('@media print'));
    expect(print).toContain('.h5r-toggle');
    expect(print).toContain('.h5r-notice');
    expect(print).toContain('.h5r-onboarding');
    expect(print).toContain('display: none !important');
  });

  it('declares print rules that force the rendered state for a source block', () => {
    const print = css.slice(css.indexOf('@media print'));
    expect(print).toContain('.h5r-block--source > .h5r-source');
    expect(print).toContain('.h5r-block--source > .h5r-rendered-host');
    expect(print).toContain(':not(:has(.h5r-rendered-host))');
  });

  it('keeps the toggle at 24px with no animation', () => {
    expect(css).toMatch(/height: 24px/);
    expect(css).toContain('transition: none');
    expect(css).toContain('opacity: 0.4');
  });
});
