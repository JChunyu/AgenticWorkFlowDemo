import { getLanguage, MarkdownView, Plugin, type MarkdownPostProcessorContext } from 'obsidian';
import { copyConstraintCard, insertSampleNote, registerCommands, type CommandDeps } from './adapters/commands';
import { createEditorExtension, refreshEditorDecorations } from './adapters/editor-ext';
import { OnboardingController } from './adapters/onboarding';
import { containerElOf, type PostProcessorContextLike } from './adapters/post-context';
import { H5SettingsTab, SettingsStore } from './adapters/settings';
import { detectLang, type Lang } from './core/i18n';
import { log, setDebugLogging } from './core/log';
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
    this.lang = detectLang(getLanguage());
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
     * Registered once and gated at rebuild time, so flipping the switch needs no
     * re-registration: `refreshEditorDecorations` supplies the transaction that makes
     * the editor re-project its blocks.
     */
    this.registerEditorExtension(
      createEditorExtension({ enabled: () => this.store.snapshot.enabled }),
    );

    /*
     * Registered once for the plugin's lifetime: disabling does not unregister a
     * post-processor, so `handleElement` short-circuits and every host is detached,
     * which is what "disabled equals plugin-absent" requires at the user surface.
     */
    this.registerMarkdownPostProcessor((element, ctx) => {
      this.handleElement(element, ctx);
    });

    this.registerEvent(
      this.app.workspace.on('css-change', () => {
        this.registry.refreshAll();
      }),
    );

    /*
     * A post-processor only decorates content rendered from now on. Notes that were
     * already open when the plugin loaded would keep showing plain code blocks until
     * the reader navigated away and back, so re-render them once the layout is up.
     */
    this.app.workspace.onLayoutReady(() => {
      this.refreshOpenNotes();
    });
  }

  onunload(): void {
    this.registry?.teardownAll(true);
  }

  private handleElement(element: HTMLElement, ctx?: MarkdownPostProcessorContext): void {
    try {
      if (this.store.snapshot.enabled) {
        /* `ctx.containerEl` is the note's preview root: the reading view calls this
         * for a section before that section is attached to the document. */
        const containerEl = containerElOf(ctx as PostProcessorContextLike | undefined);
        this.registry.process(element, containerEl);
        this.onboarding.maybeRender(element, containerEl);
      }
    } catch (error) {
      /* One malformed block must never take the rest of the note down with it. */
      log.error('post-processor failed', error);
    }
  }

  private applySettings(): void {
    if (!this.store.snapshot.enabled) {
      this.registry.teardownAll(true);
    }
    this.refreshOpenNotes();
    /* The editor keeps its extension; it only needs a nudge to re-project blocks. */
    refreshEditorDecorations();
  }

  /** Re-renders every open note so post-processors run again on its blocks. */
  private refreshOpenNotes(): void {
    for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
      if (leaf.view instanceof MarkdownView) {
        leaf.view.previewMode?.rerender(true);
      }
    }
  }
}
