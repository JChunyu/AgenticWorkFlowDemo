import { MarkdownView, Plugin } from 'obsidian';
import { copyConstraintCard, insertSampleNote, registerCommands, type CommandDeps } from './adapters/commands';
import { OnboardingController } from './adapters/onboarding';
import { H5SettingsTab, SettingsStore } from './adapters/settings';
import { detectLang, type Lang } from './core/i18n';
import { setDebugLogging } from './core/log';
import { ViewRegistry } from './view';

/**
 * The only file besides `adapters/**` that may import `obsidian` (AD-2).
 * Its whole job is wiring: settings, commands, post-processor, theme listener.
 */
export default class H5RendererPlugin extends Plugin {
  private lang: Lang = 'en';
  private store!: SettingsStore;
  private registry!: ViewRegistry;
  private onboarding!: OnboardingController;

  async onload(): Promise<void> {
    this.lang = detectLang();
    setDebugLogging(false);

    this.store = new SettingsStore(this);
    await this.store.load();

    this.registry = new ViewRegistry({
      settings: () => this.store.snapshot,
      lang: () => this.lang,
    });

    const commandDeps: CommandDeps = { app: this.app, lang: () => this.lang };

    this.onboarding = new OnboardingController({
      app: this.app,
      lang: () => this.lang,
      store: this.store,
      onOpenSample: () => {
        void insertSampleNote(commandDeps);
      },
      onCopyCard: () => {
        void copyConstraintCard(commandDeps);
      },
    });

    registerCommands(this, commandDeps);
    this.addSettingTab(
      new H5SettingsTab(this.app, this, {
        store: this.store,
        lang: () => this.lang,
        onCopyCard: () => {
          void copyConstraintCard(commandDeps);
        },
      }),
    );

    this.store.onChange = () => {
      this.applySettings();
    };

    /*
     * Registered once for the plugin's lifetime: disabling does not unregister a
     * post-processor, so `handleElement` short-circuits and every host is detached,
     * which is what "disabled equals plugin-absent" requires at the user surface.
     */
    this.registerMarkdownPostProcessor((element) => {
      this.handleElement(element);
    });

    this.registerEvent(
      this.app.workspace.on('css-change', () => {
        this.registry.refreshAll();
      }),
    );
  }

  onunload(): void {
    this.registry?.teardownAll(true);
  }

  private handleElement(element: HTMLElement): void {
    if (!this.store.snapshot.enabled) {
      return;
    }
    this.registry.process(element);
    this.onboarding.maybeRender(element);
  }

  private applySettings(): void {
    if (!this.store.snapshot.enabled) {
      this.registry.teardownAll(true);
    }
    /* Settings apply to notes that are already open, without a reload. */
    for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
      if (leaf.view instanceof MarkdownView) {
        leaf.view.previewMode?.rerender(true);
      }
    }
  }
}
