import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  HARD_BUDGET_MS,
  normalizeLocalState,
  normalizeSettings,
  SETTINGS_ORDER,
  SENTINEL_FENCE,
  snapshot,
  SOFT_BUDGET_MS,
} from '../../src/core/settings';

describe('settings', () => {
  it('exposes exactly four settings in a fixed order', () => {
    expect(SETTINGS_ORDER).toEqual(['enabled', 'defaultState', 'showToggle', 'showErrorHints']);
    expect(Object.keys(DEFAULT_SETTINGS)).toHaveLength(4);
  });

  it('defaults to rendering enabled, rendered blocks, toggle and hints visible', () => {
    expect(DEFAULT_SETTINGS).toEqual({
      enabled: true,
      defaultState: 'rendered',
      showToggle: true,
      showErrorHints: true,
    });
  });

  it('ignores unknown and legacy keys instead of failing', () => {
    const settings = normalizeSettings({
      enabled: false,
      showToggle: false,
      removedInV1: true,
      advanced: { nested: 1 },
    });

    expect(settings.enabled).toBe(false);
    expect(settings.showToggle).toBe(false);
    expect(settings.defaultState).toBe('rendered');
    expect(settings.showErrorHints).toBe(true);
    expect(Object.keys(settings)).toHaveLength(4);
  });

  it('falls back to defaults for malformed values', () => {
    const settings = normalizeSettings({ enabled: 'yes', defaultState: 'weird', showToggle: 0 });

    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
  });

  it('keeps local state separate from the four settings', () => {
    expect(normalizeLocalState({ onboardingDismissed: true })).toEqual({
      onboardingSeen: false,
      onboardingDismissed: true,
      sampleNoteOffered: false,
      sampleNoteDeclined: false,
    });
  });

  it('freezes the snapshot handed to inner layers', () => {
    const frozen = snapshot(DEFAULT_SETTINGS);

    expect(Object.isFrozen(frozen)).toBe(true);
  });

  it('defines the render budget in exactly one place', () => {
    expect(SOFT_BUDGET_MS).toBe(50);
    expect(HARD_BUDGET_MS).toBe(500);
    expect(SENTINEL_FENCE).toBe('h5-renderer');
  });
});
