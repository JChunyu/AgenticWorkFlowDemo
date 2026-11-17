import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { t, type Lang } from '../core/i18n';
import { log } from '../core/log';
import {
  DEFAULT_LOCAL_STATE,
  DEFAULT_SETTINGS,
  normalizeLocalState,
  normalizeSettings,
  SETTINGS_ORDER,
  type LocalState,
  type Settings,
} from '../core/settings';

/**
 * The only place `loadData` / `saveData` are called (AD-7). Everything else
 * receives an immutable snapshot.
 */
export class SettingsStore {
  private settings: Settings = DEFAULT_SETTINGS;
  private local: LocalState = DEFAULT_LOCAL_STATE;
  private readonly plugin: Plugin;

  /** Fired after every successful write so open notes can react immediately. */
  onChange: (() => void) | null = null;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
  }

  async load(): Promise<void> {
    const raw = (await this.plugin.loadData()) as Record<string, unknown> | null;
    const record = raw ?? {};
    /* Legacy files kept the four keys at the top level; unknown keys are ignored. */
    const settingsSource = record.settings ?? record;
    this.settings = normalizeSettings(settingsSource);
    this.local = normalizeLocalState(record.localState);
  }

  get snapshot(): Settings {
    return this.settings;
  }

  get localState(): LocalState {
    return this.local;
  }

  async update(patch: Partial<Settings>): Promise<void> {
    this.settings = { ...this.settings, ...patch };
    await this.persist();
    /* Even if the write failed the in-memory snapshot changed, so open notes must follow. */
    this.onChange?.();
  }

  async updateLocal(patch: Partial<LocalState>): Promise<void> {
    this.local = { ...this.local, ...patch };
    await this.persist();
  }

  private async persist(): Promise<void> {
    try {
      await this.plugin.saveData({ settings: this.settings, localState: this.local });
    } catch (error) {
      log.error('settings could not be saved', error);
    }
  }
}

export interface SettingsTabDeps {
  readonly store: SettingsStore;
  readonly lang: () => Lang;
  readonly onCopyCard: () => void;
}

/**
 * Exactly four rows in a fixed order, one title plus one explanation each.
 * No headings, no separators, no advanced section, no fifth item.
 */
export class H5SettingsTab extends PluginSettingTab {
  private readonly deps: SettingsTabDeps;

  constructor(app: App, plugin: Plugin, deps: SettingsTabDeps) {
    super(app, plugin);
    this.deps = deps;
  }

  display(): void {
    const { containerEl } = this;
    const lang = this.deps.lang();
    containerEl.empty();

    const intro = containerEl.createEl('p', { cls: 'h5r-settings-intro' });
    intro.createSpan({ text: `${t('settings.copyIntro', lang)} ` });
    const copyLink = intro.createEl('a', { text: t('copy.action', lang), href: '#' });
    copyLink.addEventListener('click', (event) => {
      event.preventDefault();
      this.deps.onCopyCard();
    });

    const settings = this.deps.store.snapshot;
    const rows = containerEl.createDiv({ cls: 'h5r-settings-rows' });

    new Setting(rows)
      .setName(t('settings.enabled.name', lang))
      .setDesc(t('settings.enabled.desc', lang))
      .addToggle((toggle) =>
        toggle.setValue(settings.enabled).onChange(async (value) => {
          await this.deps.store.update({ enabled: value });
        }),
      );

    new Setting(rows)
      .setName(t('settings.defaultState.name', lang))
      .setDesc(t('settings.defaultState.desc', lang))
      .addDropdown((dropdown) =>
        dropdown
          .addOption('rendered', t('settings.state.rendered', lang))
          .addOption('source', t('settings.state.source', lang))
          .setValue(settings.defaultState)
          .onChange(async (value) => {
            await this.deps.store.update({ defaultState: value === 'source' ? 'source' : 'rendered' });
          }),
      );

    new Setting(rows)
      .setName(t('settings.showToggle.name', lang))
      .setDesc(t('settings.showToggle.desc', lang))
      .addToggle((toggle) =>
        toggle.setValue(settings.showToggle).onChange(async (value) => {
          await this.deps.store.update({ showToggle: value });
        }),
      );

    new Setting(rows)
      .setName(t('settings.showErrorHints.name', lang))
      .setDesc(t('settings.showErrorHints.desc', lang))
      .addToggle((toggle) =>
        toggle.setValue(settings.showErrorHints).onChange(async (value) => {
          await this.deps.store.update({ showErrorHints: value });
        }),
      );
  }
}

/** Exposed for tests: the fixed order the settings page must render. */
export const SETTINGS_ROW_ORDER = SETTINGS_ORDER;
