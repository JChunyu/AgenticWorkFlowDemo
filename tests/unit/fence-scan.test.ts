import { describe, expect, it } from 'vitest';
import { scanSentinelBlocks } from '../../src/core/fence-scan';

const fence = (body: string): string => '```h5-renderer\n' + body + '\n```';

describe('scanSentinelBlocks', () => {
  it('finds every sentinel block and ignores other fences', () => {
    const doc = [
      fence('<div>a</div>'),
      '',
      '```html',
      '<p>x</p>',
      '```',
      '',
      fence('<div>b</div>'),
      '',
      fence('<div>c</div>'),
    ].join('\n');

    const blocks = scanSentinelBlocks(doc);

    expect(blocks).toHaveLength(3);
    expect(blocks.map((block) => block.sourceText)).toEqual([
      '<div>a</div>',
      '<div>b</div>',
      '<div>c</div>',
    ]);
  });

  it('spans both fence lines and leaves the following newline outside the range', () => {
    const doc = 'intro\n\n' + fence('<div>x</div>') + '\n\noutro';
    const [block] = scanSentinelBlocks(doc);

    expect(doc.slice(block.from, block.to)).toBe(fence('<div>x</div>'));
    expect(doc.slice(0, block.from) + doc.slice(block.to)).toBe('intro\n\n\n\noutro');
  });

  it('rejects aliases, wrong case, and unrelated fences', () => {
    const doc = [
      '```h5\n<div/>\n```',
      '```h5-renderer-x\n<div/>\n```',
      '```H5-Renderer\n<div/>\n```',
      '```js\n<div/>\n```',
      '```\n<div/>\n```',
    ].join('\n');

    expect(scanSentinelBlocks(doc)).toEqual([]);
  });

  it('accepts an info string that starts with the sentinel, as reading view does', () => {
    expect(scanSentinelBlocks('```h5-renderer foo\n<div/>\n```')).toHaveLength(1);
  });

  it('drops a fence still unclosed at the end of the document', () => {
    expect(scanSentinelBlocks('```h5-renderer\n<div>x</div>')).toEqual([]);
  });

  it('closes an unclosed fence at the next bare fence, as Markdown does', () => {
    const doc = '```h5-renderer\n<div>broken</div>\n\n' + fence('<div>ok</div>');

    const blocks = scanSentinelBlocks(doc);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].sourceText).toContain('```h5-renderer');
  });

  it('recognizes an empty block', () => {
    const [block] = scanSentinelBlocks('```h5-renderer\n```');

    expect(block.sourceText).toBe('');
  });

  it('does not treat a fence sharing a line with prose as an atomic block', () => {
    expect(scanSentinelBlocks('正文 ```h5-renderer\n<div/>\n```')).toEqual([]);
  });

  it('recognizes a fence indented up to three spaces and dedents its content', () => {
    const doc = '- 列表项\n  ```h5-renderer\n  <div>x</div>\n  ```';
    const blocks = scanSentinelBlocks(doc);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].sourceText).toBe('<div>x</div>');
    expect(doc.slice(blocks[0].from, blocks[0].to)).toBe('  ```h5-renderer\n  <div>x</div>\n  ```');
  });

  it('rejects a four-space indent, which CommonMark treats as an indented code block', () => {
    expect(scanSentinelBlocks('    ```h5-renderer\n    <div/>\n    ```')).toEqual([]);
  });

  it('rejects a tab-indented fence', () => {
    expect(scanSentinelBlocks('\t```h5-renderer\n\t<div/>\n\t```')).toEqual([]);
  });

  it('leaves a fence inside a blockquote or callout as source', () => {
    expect(scanSentinelBlocks('> ```h5-renderer\n> <div/>\n> ```')).toEqual([]);
  });

  it('recognizes blocks in a CRLF document without swallowing the carriage returns', () => {
    const doc = 'intro\r\n```h5-renderer\r\n<div>x</div>\r\n```\r\noutro';
    const [block] = scanSentinelBlocks(doc);

    expect(block.sourceText).toBe('<div>x</div>');
    expect(doc.slice(block.from, block.to)).toBe('```h5-renderer\r\n<div>x</div>\r\n```');
  });

  it('derives stable ids with an occurrence index for identical sources', () => {
    const doc = fence('<div>same</div>') + '\n\n' + fence('<div>same</div>');
    const [first, second] = scanSentinelBlocks(doc);
    const [firstHash, firstIndex] = first.id.split(':');
    const [secondHash, secondIndex] = second.id.split(':');

    expect(firstHash).toBe(secondHash);
    expect([firstIndex, secondIndex]).toEqual(['0', '1']);
  });

  it('leaves a sentinel fence written inside another code block alone', () => {
    const doc = ['```md', '```h5-renderer', '<div/>', '```', '```'].join('\n');

    expect(scanSentinelBlocks(doc)).toEqual([]);
  });

  it('refuses a backtick fence whose info string holds a backtick', () => {
    /* CommonMark: backtick info strings may not contain backticks, so this is prose. */
    expect(scanSentinelBlocks('```h5-renderer`x\n<div/>\n```')).toEqual([]);
  });

  it('accepts tilde fences and a longer closing fence', () => {
    expect(scanSentinelBlocks('~~~h5-renderer\n<div/>\n~~~~')).toHaveLength(1);
  });

  it('never mutates or depends on anything outside its input', () => {
    const doc = fence('<div>x</div>');

    expect(scanSentinelBlocks(doc)).toEqual(scanSentinelBlocks(doc));
    expect(scanSentinelBlocks('')).toEqual([]);
  });
});
