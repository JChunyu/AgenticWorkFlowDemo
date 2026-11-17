import { App } from 'obsidian';
import { t, type Lang } from '../core/i18n';
import { containsPlainHtmlBlock } from '../pipeline/detect';
import { createOnboarding, createSampleOffer } from '../view/shell';
import type { SettingsStore } from './settings';

export interface OnboardingDeps {
  readonly app: App;
  readonly lang: () => Lang;
  readonly store: SettingsStore;
  readonly onOpenSample: () => void;
  readonly onCopyCard: () => void;
}

const PROMPT_SELECTOR = '.h5r-onboarding';

/**
 * Two one-time inline prompts, both at the top of the note and both remembered in
 * plugin data — the vault is never written.
 *
 * 1. The wrong-fence hint, on the first note that contains a plain ```html block.
 * 2. The sample question, asked once on first enable when no such block is around.
 */
export class OnboardingController {
  private readonly deps: OnboardingDeps;
  private hintShownThisSession = false;
  private offerShownThisSession = false;

  constructor(deps: OnboardingDeps) {
    this.deps = deps;
  }

  maybeRender(element: HTMLElement): void {
    if (!this.deps.store.snapshot.enabled) {
      return;
    }
    /* Reading view only: never paint chrome into a Live Preview editor. */
    if (element.closest('.cm-editor')) {
      return;
    }
    const root = element.closest<HTMLElement>('.markdown-preview-view') ?? element;
    if (root.querySelector(PROMPT_SELECTOR)) {
      this.hintShownThisSession = true;
      this.offerShownThisSession = true;
      return;
    }

    const local = this.deps.store.localState;
    if (!this.hintShownThisSession && !local.onboardingSeen && !local.onboardingDismissed && containsPlainHtmlBlock(element)) {
      this.showHint(root);
      /* The hint carries "see an example", so the question has effectively been asked. */
      if (!this.deps.store.localState.sampleNoteOffered) {
        void this.deps.store.updateLocal({ sampleNoteOffered: true });
      }
      return;
    }

    if (!this.offerShownThisSession && !local.sampleNoteOffered) {
      this.showSampleOffer(root);
    }
  }

  private showHint(root: HTMLElement): void {
    const lang = this.deps.lang();
    const prompt = createOnboarding({
      lang,
      onOpenSample: () => {
        this.deps.onOpenSample();
        this.dismiss(prompt);
      },
      onCopy: () => {
        this.deps.onCopyCard();
      },
      onDismiss: () => {
        this.dismiss(prompt);
      },
    });
    root.prepend(prompt);
    this.hintShownThisSession = true;
    /* Shown once, for good — even if the reader never dismisses it. */
    void this.deps.store.updateLocal({ onboardingSeen: true });
  }

  private showSampleOffer(root: HTMLElement): void {
    const lang = this.deps.lang();
    const offer = createSampleOffer({
      lang,
      onInsert: () => {
        this.deps.onOpenSample();
        offer.remove();
        void this.deps.store.updateLocal({ sampleNoteOffered: true });
      },
      onDecline: () => {
        const text = offer.querySelector('.h5r-onboarding__text');
        if (text) {
          text.textContent = t('sample.declined', lang);
        }
        for (const button of Array.from(offer.querySelectorAll('button'))) {
          button.remove();
        }
        void this.deps.store.updateLocal({ sampleNoteOffered: true, sampleNoteDeclined: true });
      },
    });
    root.prepend(offer);
    this.offerShownThisSession = true;
  }

  private dismiss(prompt: HTMLElement): void {
    prompt.remove();
    void this.deps.store.updateLocal({ onboardingDismissed: true });
  }
}
