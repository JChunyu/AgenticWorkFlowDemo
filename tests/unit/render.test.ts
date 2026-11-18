import { describe, expect, it } from 'vitest';
import { CONTENT_BASE_CSS } from '../../src/pipeline/render/base-styles';
import { render } from '../../src/pipeline/render';
import { scrub } from '../../src/pipeline/scrub';

function fragment(source: string) {
  const result = scrub(source);
  if (!result.ok) {
    throw new Error('unexpected scrub failure');
  }
  return result.value;
}

describe('render', () => {
  it('returns a host that is not attached to the document', () => {
    const host = render(fragment('<p>Hello</p>'));

    expect(host.element.parentElement).toBeNull();
    expect(host.element.isConnected).toBe(false);
  });

  it('mounts content inside the shadow root only', () => {
    const host = render(fragment('<p>Hello</p>'));
    document.body.appendChild(host.element);

    expect(document.querySelector('p')).toBeNull();
    expect(host.shadow.querySelector('p')?.textContent).toBe('Hello');
  });

  it('keeps every content style inside the shadow root', () => {
    const host = render(fragment('<style>.card{color:red}</style><div class="card">x</div>'));
    document.body.appendChild(host.element);

    const lightStyles = host.element.querySelectorAll('style');
    expect(lightStyles).toHaveLength(0);
    /* No `<style>` element anywhere: the shadow root adopts a constructed sheet. */
    expect(host.shadow.querySelector('style')).toBeNull();
    expect(host.shadow.adoptedStyleSheets).toHaveLength(1);
    expect(host.css).toContain('.card{color:red}');
  });

  it('applies the migrated root styles to the host of the shadow root', () => {
    const host = render(fragment('<style>body{font-size:15px;background:red}</style><p>x</p>'));

    expect(host.css).toContain(':host { font-size:15px }');
    expect(host.css).not.toContain('background:red');
  });

  it('never adds a background, border or shadow to the render container', () => {
    expect(CONTENT_BASE_CSS).toContain('background: transparent');
    expect(CONTENT_BASE_CSS).not.toMatch(/border\s*:/);
    expect(CONTENT_BASE_CSS).not.toMatch(/box-shadow/);
  });

  it('contains no literal colour value', () => {
    expect(CONTENT_BASE_CSS).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(CONTENT_BASE_CSS).not.toMatch(/\brgba?\(/i);
    expect(CONTENT_BASE_CSS).not.toMatch(/\bhsla?\(/i);
  });

  it('measures layout in declarations only, never in pixels', () => {
    expect(CONTENT_BASE_CSS).toContain('width: 100%');
    expect(CONTENT_BASE_CSS).toContain('max-width: none');
    expect(CONTENT_BASE_CSS).toContain('overflow-x: auto');
  });

  it('is deterministic for the same fragment', () => {
    const input = fragment('<p>same</p>');
    const first = render(input);
    const second = render(input);

    expect(first.css).toBe(second.css);
    expect(first.shadow.innerHTML).toBe(second.shadow.innerHTML);
  });

  it('cannot be fed raw markup text', () => {
    // @ts-expect-error render accepts only SanitizedFragment, never a bare string
    expect(() => render('<p>raw</p>')).toThrow();
  });
});
