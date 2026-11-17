import { beforeEach, describe, expect, it } from 'vitest';
import { hashSource } from '../../src/core/hash';
import { collect, containsPlainHtmlBlock } from '../../src/pipeline/detect';
import { codeBlock, noteView, resetBody } from './helpers';

describe('detect', () => {
  beforeEach(() => {
    resetBody();
  });

  it('collects a sentinel block with a hash:occurrence id', () => {
    const view = noteView(codeBlock('<p>Hello</p>'));

    const blocks = collect(view);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].id).toBe(`${hashSource('<p>Hello</p>')}:0`);
    expect(blocks[0].sourceText).toBe('<p>Hello</p>');
    expect(blocks[0].preEl.tagName).toBe('PRE');
    expect(blocks[0].codeEl.tagName).toBe('CODE');
  });

  it('finds blocks nested in lists, quotes and callouts', () => {
    const list = document.createElement('ul');
    const item = document.createElement('li');
    item.appendChild(codeBlock('<p>list</p>'));
    list.appendChild(item);

    const quote = document.createElement('blockquote');
    quote.appendChild(codeBlock('<p>quote</p>'));

    const callout = document.createElement('div');
    callout.className = 'callout';
    const calloutBody = document.createElement('div');
    calloutBody.className = 'callout-content';
    calloutBody.appendChild(codeBlock('<p>callout</p>'));
    callout.appendChild(calloutBody);

    const view = noteView(list, quote, callout);

    expect(collect(view).map((block) => block.sourceText)).toEqual([
      '<p>list</p>',
      '<p>quote</p>',
      '<p>callout</p>',
    ]);
  });

  it('ignores similar and differently cased fence names', () => {
    const view = noteView(
      codeBlock('<p>a</p>', 'h5'),
      codeBlock('<p>b</p>', 'h5-renderer-x'),
      codeBlock('<p>c</p>', 'HTML'),
      codeBlock('<p>d</p>', 'H5-Renderer'),
    );

    expect(collect(view)).toHaveLength(0);
  });

  it('ignores an unclosed fence, which Obsidian renders as prose', () => {
    const view = noteView();
    const paragraph = document.createElement('p');
    paragraph.textContent = '```h5-renderer';
    view.appendChild(paragraph);

    expect(collect(view)).toHaveLength(0);
  });

  it('finds the block even if another plugin re-parents the code element', () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'some-other-plugin';
    const code = document.createElement('code');
    code.className = 'language-h5-renderer';
    code.textContent = '<p>adopted</p>';
    wrapper.appendChild(code);
    const view = noteView(wrapper);

    const blocks = collect(view);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].sourceText).toBe('<p>adopted</p>');
    expect(blocks[0].preEl).toBe(code);
  });

  it('never re-collects a block it already wrapped', () => {
    const view = noteView(codeBlock('<p>x</p>'));
    const first = collect(view);
    expect(first).toHaveLength(1);

    const wrapper = document.createElement('div');
    wrapper.className = 'h5r-block';
    first[0].preEl.replaceWith(wrapper);
    wrapper.appendChild(first[0].preEl);

    expect(collect(view)).toHaveLength(0);
  });

  it('gives identical sources distinct occurrence indices', () => {
    const view = noteView(codeBlock('<p>same</p>'), codeBlock('<p>same</p>'));

    const ids = collect(view).map((block) => block.id);

    expect(ids).toEqual([`${hashSource('<p>same</p>')}:0`, `${hashSource('<p>same</p>')}:1`]);
  });

  it('treats edited content as a new block', () => {
    const view = noteView(codeBlock('<p>before</p>'));
    const before = collect(view)[0].id;

    const code = view.querySelector('code');
    expect(code).not.toBeNull();
    if (code) {
      code.textContent = '<p>after</p>';
    }

    const after = collect(view)[0].id;
    expect(after).not.toBe(before);
  });

  it('never fires inside a Live Preview editor', () => {
    const editor = document.createElement('div');
    editor.className = 'cm-editor';
    editor.appendChild(codeBlock('<p>live</p>'));
    document.body.appendChild(editor);

    expect(collect(editor)).toHaveLength(0);
  });

  it('reports a native html block for the onboarding prompt', () => {
    expect(containsPlainHtmlBlock(noteView(codeBlock('<p>x</p>', 'html')))).toBe(true);
    expect(containsPlainHtmlBlock(noteView(codeBlock('<p>x</p>')))).toBe(false);
  });
});
