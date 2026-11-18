import { describe, expect, it } from 'vitest';
import { scrub } from '../../src/pipeline/scrub';

function fragmentOf(source: string) {
  const result = scrub(source);
  if (!result.ok) {
    throw new Error(`expected a fragment, got ${result.error.code}`);
  }
  return result.value;
}

describe('scrub', () => {
  it('removes scripts and records them', () => {
    const fragment = fragmentOf('<div>ok</div><script>alert(1)</script>');

    expect(fragment.contentHtml).not.toContain('script');
    expect(fragment.contentHtml).toContain('ok');
    expect(fragment.removed.some((entry) => entry.kind === 'script')).toBe(true);
  });

  it('removes event handlers and javascript: urls', () => {
    const fragment = fragmentOf(
      '<a href="javascript:alert(1)" onclick="alert(2)">x</a><img src="JavaScript:alert(3)">',
    );

    expect(fragment.contentHtml).not.toMatch(/onclick/i);
    expect(fragment.contentHtml.toLowerCase()).not.toContain('javascript:');
    expect(fragment.removed.some((entry) => entry.kind === 'event-handler')).toBe(true);
    expect(fragment.removed.some((entry) => entry.kind === 'javascript-url')).toBe(true);
  });

  it('strips every network vector while keeping data: urls', () => {
    const fragment = fragmentOf(`
      <link rel="stylesheet" href="http://example.com/x.css">
      <style>
        @import url(http://example.com/y.css);
        .card { background-image: url(http://example.com/z.png); }
        .dot { background-image: url("data:image/png;base64,AAA"); }
      </style>
      <iframe src="http://example.com"></iframe>
      <object data="http://example.com"></object>
      <embed src="http://example.com">
    `);

    const css = fragment.styles.join('\n');
    expect(css).not.toContain('@import');
    expect(css).not.toContain('example.com');
    expect(css).toContain('data:image/png;base64,AAA');
    expect(fragment.contentHtml).not.toContain('<link');
    expect(fragment.contentHtml).not.toContain('<iframe');
    expect(fragment.removed.some((entry) => entry.kind === 'embedded-frame')).toBe(true);
    expect(fragment.removed.some((entry) => entry.kind === 'external-reference')).toBe(true);
  });

  it('strips every resource attribute that would fetch something', () => {
    const fragment = fragmentOf(`
      <img src="https://example.com/logo.png">
      <img srcset="https://example.com/a.png 1x, https://example.com/b.png 2x">
      <video poster="https://example.com/p.png"></video>
      <svg><use xlink:href="https://example.com/s.svg#icon"></use></svg>
      <div background="https://example.com/bg.png"></div>
    `);

    expect(fragment.contentHtml).not.toContain('example.com');
    expect(fragment.contentHtml).not.toContain('srcset');
    expect(fragment.removed.filter((entry) => entry.kind === 'external-reference').length).toBeGreaterThanOrEqual(5);
  });

  it('keeps self-contained and in-document references', () => {
    const fragment = fragmentOf(`
      <img src="data:image/png;base64,AAA">
      <svg><use xlink:href="#icon"></use></svg>
      <a href="https://example.com/notes">a real link</a>
    `);

    expect(fragment.contentHtml).toContain('data:image/png;base64,AAA');
    expect(fragment.contentHtml).toContain('xlink:href="#icon"');
    expect(fragment.contentHtml).toContain('href="https://example.com/notes"');
  });

  it('strips @import even without whitespace before the target', () => {
    const fragment = fragmentOf('<style>@import"https://example.com/x.css";.card{color:red}</style>');

    expect(fragment.styles.join('\n')).not.toContain('example.com');
    expect(fragment.styles.join('\n')).not.toContain('@import');
  });

  it('neutralises remote urls inside inline style attributes', () => {
    const fragment = fragmentOf('<div style="background-image:url(http://example.com/a.png)">x</div>');

    expect(fragment.contentHtml).not.toContain('example.com');
    expect(fragment.removed.some((entry) => entry.kind === 'external-reference')).toBe(true);
  });

  it('migrates whitelisted root styles and drops everything else', () => {
    const fragment = fragmentOf(`
      <style>
        body {
          font-family: "Inter";
          font-size: 14px !important;
          line-height: 1.7;
          color: #222;
          text-align: justify;
          background: red;
          padding: 40px;
          display: grid;
        }
        html, body { margin: 0; }
        .card { color: var(--text-normal); }
      </style>
      <div class="card">hi</div>
    `);

    expect(fragment.rootStyleSeed).toContain('font-family:"Inter"');
    expect(fragment.rootStyleSeed).toContain('font-size:14px');
    expect(fragment.rootStyleSeed).toContain('line-height:1.7');
    expect(fragment.rootStyleSeed).toContain('color:#222');
    expect(fragment.rootStyleSeed).toContain('text-align:justify');
    expect(fragment.rootStyleSeed).not.toContain('important');
    expect(fragment.rootStyleSeed).not.toContain('background');
    expect(fragment.rootStyleSeed).not.toContain('padding');
    expect(fragment.styles.join('\n')).not.toContain('body {');
    expect(fragment.styles.join('\n')).toContain('.card');
  });

  it('still sees head-level references and styles in a full document', () => {
    const fragment = fragmentOf(
      '<link rel="stylesheet" href="https://example.com/a.css"><style>body{font-size:12px} .a{color:red}</style><p>x</p>',
    );

    expect(fragment.removed.some((entry) => entry.kind === 'external-reference')).toBe(true);
    expect(fragment.contentHtml).not.toContain('<link');
    expect(fragment.contentHtml).not.toContain('<style');
    expect(fragment.rootStyleSeed).toBe('font-size:12px');
    expect(fragment.styles.join('\n')).toContain('.a{color:red}');
  });

  it('accepts empty content without failing', () => {
    const fragment = fragmentOf('   ');

    expect(fragment.contentHtml.trim()).toBe('');
    expect(fragment.removed).toHaveLength(0);
    expect(fragment.sanitized).toBe(true);
  });

  it('never yields user-facing copy, only structured results', () => {
    const fragment = fragmentOf('<script>x</script>');

    for (const entry of fragment.removed) {
      expect(entry.detail).not.toMatch(/[\u4e00-\u9fa5]/);
    }
  });
});
