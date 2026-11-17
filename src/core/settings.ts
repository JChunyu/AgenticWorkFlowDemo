/**
 * Settings shape, defaults, the sentinel fence name, and the render budget.
 * The two budget constants live here and nowhere else.
 */

/** The single fence this plugin recognizes. Case sensitive, no aliases. */
export const SENTINEL_FENCE = 'h5-renderer';

/** Soft budget: this render completes, the next render of the same block degrades. */
export const SOFT_BUDGET_MS = 50;

/** Hard budget: degrade immediately, never hang the note. */
export const HARD_BUDGET_MS = 500;

export type BlockDefaultState = 'rendered' | 'source';

/** Exactly four persisted settings, in this order. A fifth is a rejected change. */
export interface Settings {
  readonly enabled: boolean;
  readonly defaultState: BlockDefaultState;
  readonly showToggle: boolean;
  readonly showErrorHints: boolean;
}

/** Plugin-local state. Never written to the vault's markdown files. */
export interface LocalState {
  readonly onboardingSeen: boolean;
  readonly onboardingDismissed: boolean;
  readonly sampleNoteOffered: boolean;
  readonly sampleNoteDeclined: boolean;
}

export const SETTINGS_ORDER = ['enabled', 'defaultState', 'showToggle', 'showErrorHints'] as const;

export const DEFAULT_SETTINGS: Settings = Object.freeze({
  enabled: true,
  defaultState: 'rendered',
  showToggle: true,
  showErrorHints: true,
});

export const DEFAULT_LOCAL_STATE: LocalState = Object.freeze({
  onboardingSeen: false,
  onboardingDismissed: false,
  sampleNoteOffered: false,
  sampleNoteDeclined: false,
});

function readBoolean(raw: Record<string, unknown>, key: string, fallback: boolean): boolean {
  const value = raw[key];
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Unknown/legacy keys are ignored rather than reported — settings files outlive
 * individual plugin versions.
 */
export function normalizeSettings(raw: unknown): Settings {
  if (typeof raw !== 'object' || raw === null) {
    return DEFAULT_SETTINGS;
  }
  const record = raw as Record<string, unknown>;
  const state = record.defaultState;
  return {
    enabled: readBoolean(record, 'enabled', DEFAULT_SETTINGS.enabled),
    defaultState: state === 'source' || state === 'rendered' ? state : DEFAULT_SETTINGS.defaultState,
    showToggle: readBoolean(record, 'showToggle', DEFAULT_SETTINGS.showToggle),
    showErrorHints: readBoolean(record, 'showErrorHints', DEFAULT_SETTINGS.showErrorHints),
  };
}

export function normalizeLocalState(raw: unknown): LocalState {
  if (typeof raw !== 'object' || raw === null) {
    return DEFAULT_LOCAL_STATE;
  }
  const record = raw as Record<string, unknown>;
  return {
    onboardingSeen: readBoolean(record, 'onboardingSeen', DEFAULT_LOCAL_STATE.onboardingSeen),
    onboardingDismissed: readBoolean(record, 'onboardingDismissed', DEFAULT_LOCAL_STATE.onboardingDismissed),
    sampleNoteOffered: readBoolean(record, 'sampleNoteOffered', DEFAULT_LOCAL_STATE.sampleNoteOffered),
    sampleNoteDeclined: readBoolean(record, 'sampleNoteDeclined', DEFAULT_LOCAL_STATE.sampleNoteDeclined),
  };
}

/** Fully immutable snapshot handed to every layer except `adapters/settings`. */
export function snapshot(settings: Settings): Settings {
  return Object.freeze({ ...settings });
}
