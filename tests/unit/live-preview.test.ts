import { describe, expect, it } from 'vitest';
import { scanSentinelBlocks } from '../../src/core/fence-scan';
import { enterTarget, projectEditorBlocks } from '../../src/view/live-preview';

const doc =
  'intro\n\n' +
  '```h5-renderer\n<div>a</div>\n```' +
  '\n\nmid\n\n' +
  '```h5-renderer\n<div>b</div>\n```' +
  '\n\noutro';

const [first, second] = scanSentinelBlocks(doc);

describe('projectEditorBlocks', () => {
  it('cards every block when no cursor touches them', () => {
    expect(projectEditorBlocks(doc, [])).toHaveLength(2);
    expect(projectEditorBlocks(doc, [{ from: 0, to: 0 }])).toHaveLength(2);
  });

  it('drops only the block holding the cursor', () => {
    const blocks = projectEditorBlocks(doc, [{ from: first.from + 5, to: first.from + 5 }]);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].id).toBe(second.id);
  });

  it('drops a block when a cursor sits on either fence line', () => {
    expect(projectEditorBlocks(doc, [{ from: first.from, to: first.from }])).toHaveLength(1);
    expect(projectEditorBlocks(doc, [{ from: first.to, to: first.to }])).toHaveLength(1);
  });

  it('keeps a block when the cursor is on the line after it', () => {
    expect(projectEditorBlocks(doc, [{ from: first.to + 1, to: first.to + 1 }])).toHaveLength(2);
  });

  it('drops a block a selection merely spans, so hidden text is never selected', () => {
    expect(projectEditorBlocks(doc, [{ from: 0, to: doc.length }])).toEqual([]);
  });

  it('handles two cursors independently', () => {
    const blocks = projectEditorBlocks(doc, [
      { from: first.from + 2, to: first.from + 2 },
      { from: second.from + 2, to: second.from + 2 },
    ]);

    expect(blocks).toEqual([]);
  });

  it('cards nothing when the plugin is switched off', () => {
    expect(projectEditorBlocks(doc, [], { enabled: false })).toEqual([]);
    expect(projectEditorBlocks(doc, [{ from: 0, to: 0 }], { enabled: false })).toEqual([]);
  });
});

describe('enterTarget', () => {
  const simple = 'a\n\n```h5-renderer\n<div/>\n```\n\ntail';
  const [block] = scanSentinelBlocks(simple);
  const closingEnd = block.to;

  it('walks down into a block that starts on the next line', () => {
    expect(enterTarget(simple, 2, 1)).toBe(block.from);
  });

  it('walks up into a block that ends on the previous line', () => {
    expect(enterTarget(simple, closingEnd + 1, -1)).toBe(block.to);
  });

  it('declines when the block is not on the adjacent line', () => {
    expect(enterTarget(simple, 0, 1)).toBeNull();
    expect(enterTarget(simple, simple.indexOf('tail'), -1)).toBeNull();
  });

  it('declines on an empty document', () => {
    expect(enterTarget('', 0, 1)).toBeNull();
  });
});
