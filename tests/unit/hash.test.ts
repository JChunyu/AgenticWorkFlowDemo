import { describe, expect, it } from 'vitest';
import { hashSource, sha256Hex } from '../../src/core/hash';

/**
 * Known-answer vectors. Without these the id derivation could only be checked
 * against itself, so a padding or block-loop bug would go unnoticed while short
 * inputs still produced stable ids.
 */
describe('sha256', () => {
  it('matches the published digests for known inputs', () => {
    expect(sha256Hex('')).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256Hex('<p>Hello</p>')).toBe('d0a26d23e9d8e0538fd47e7bc502d26cf6c320e8daaec7c8521d4769530f5900');
  });

  it('matches for inputs spanning several 64-byte blocks', () => {
    expect(sha256Hex('a'.repeat(200))).toBe(
      'c2a908d98f5df987ade41b5fce213067efbcc21ef2240212a41e54b5e7c28ae5',
    );
    expect(sha256Hex('中文卡片内容'.repeat(20))).toBe(
      '438b14e5f1a8caaa84206da57968d895bb0ce513240dca027dce25d288ba41f9',
    );
  });

  it('reads UTF-8 rather than UTF-16 code units', () => {
    expect(sha256Hex('中')).not.toBe(sha256Hex('中文'));
  });

  it('shortens the digest to eight hex characters for block ids', () => {
    expect(hashSource('<p>Hello</p>')).toBe('d0a26d23');
    expect(hashSource('<p>Hello</p>')).toHaveLength(8);
  });

  it('distinguishes content that differs only past the first block', () => {
    const head = 'x'.repeat(120);
    expect(hashSource(`${head}a`)).not.toBe(hashSource(`${head}b`));
  });
});
