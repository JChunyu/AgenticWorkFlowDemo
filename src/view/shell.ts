import { t, type Lang } from '../core/i18n';

/**
 * Every piece of chrome lives here: `render` never produces a button, a notice,
 * or a word of copy (AD-14). Sizing and colour come from `styles.css` only.
 */

export type NoticeKind = 'info' | 'warning' | 'danger';

export interface ToggleOptions {
  readonly lang: Lang;
  /** The state the button will switch to. */
  readonly next: 'source' | 'rendered';
  readonly onActivate: () => void;
}

/**
 * Every control in the chrome is inert until clicked: a click here must never
 * bubble into the note (or the editor's block replacement) and steal the gesture.
 */
function button(
  parent: HTMLElement | null,
  cls: string,
  text: string,
  onActivate?: () => void,
): HTMLButtonElement {
  const el = createEl('button', { cls, text });
  el.type = 'button';
  el.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    onActivate?.();
  });
  if (parent) {
    parent.appendChild(el);
  }
  return el;
}

export function createToggle(options: ToggleOptions): HTMLButtonElement {
  const el = button(
    null,
    'h5r-toggle',
    options.next === 'source' ? t('toggle.toSource', options.lang) : t('toggle.toPreview', options.lang),
    options.onActivate,
  );
  el.setAttribute(
    'aria-label',
    options.next === 'source' ? t('toggle.aria.toSource', options.lang) : t('toggle.aria.toPreview', options.lang),
  );
  return el;
}

export interface NoticeOptions {
  readonly kind: NoticeKind;
  readonly text: string;
  readonly lang: Lang;
  /** At most one action, per the notice contract. */
  readonly action?: { readonly label: string; readonly onActivate: () => void };
  readonly onDismiss?: () => void;
}

export function createNotice(options: NoticeOptions): HTMLElement {
  const notice = createDiv({
    cls: `h5r-notice h5r-notice--${options.kind}`,
    attr: {
      role: 'status',
      'aria-live': options.kind === 'danger' ? 'assertive' : 'polite',
      tabindex: '0',
    },
  });

  const text = notice.createSpan({ cls: 'h5r-notice__text', text: options.text });
  text.title = options.text;

  if (options.action) {
    const { label, onActivate } = options.action;
    button(notice, 'h5r-notice__action', label, onActivate);
  }

  if (options.onDismiss) {
    notice.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        options.onDismiss?.();
      }
    });
  }

  return notice;
}

export interface OnboardingOptions {
  readonly lang: Lang;
  readonly onOpenSample: () => void;
  readonly onCopy: () => void;
  readonly onDismiss: () => void;
}

export function createOnboarding(options: OnboardingOptions): HTMLElement {
  const prompt = createDiv({ cls: 'h5r-onboarding', attr: { role: 'note' } });

  prompt.createSpan({ cls: 'h5r-onboarding__text', text: t('onboarding.message', options.lang) });
  button(prompt, 'h5r-onboarding__action', t('onboarding.openSample', options.lang), options.onOpenSample);
  button(prompt, 'h5r-onboarding__action', t('onboarding.copyCard', options.lang), options.onCopy);

  const dismiss = button(prompt, 'h5r-onboarding__dismiss', '×', options.onDismiss);
  dismiss.setAttribute('aria-label', t('onboarding.dismiss', options.lang));

  return prompt;
}

export interface SampleOfferOptions {
  readonly lang: Lang;
  readonly onInsert: () => void;
  readonly onDecline: () => void;
}

/** The one-time first-enable question, inline at the top of the note. */
export function createSampleOffer(options: SampleOfferOptions): HTMLElement {
  const box = createDiv({ cls: 'h5r-onboarding h5r-sample-offer', attr: { role: 'note' } });

  box.createSpan({ cls: 'h5r-onboarding__text', text: t('sample.ask', options.lang) });
  button(box, 'h5r-onboarding__action', t('command.insertSample', options.lang), options.onInsert);
  button(box, 'h5r-onboarding__action', t('sample.decline', options.lang), options.onDecline);

  return box;
}

export interface InlineMessageOptions {
  readonly lang: Lang;
  readonly text: string;
  readonly actionLabel: string;
  readonly onAction: () => void;
  readonly onClose: () => void;
}

/** A single line of explanation plus one action — used for read-only degradation. */
export function createInlineMessage(options: InlineMessageOptions): HTMLElement {
  const box = createDiv({ cls: 'h5r-onboarding h5r-inline-message' });

  box.createSpan({ cls: 'h5r-onboarding__text', text: options.text });
  button(box, 'h5r-onboarding__action', options.actionLabel, options.onAction);

  const dismiss = button(box, 'h5r-onboarding__dismiss', '×', options.onClose);
  dismiss.setAttribute('aria-label', t('notice.dismiss', options.lang));

  return box;
}

/** Inline, non-modal text area used when the clipboard is unavailable. */
export function createCopyFallback(options: {
  readonly lang: Lang;
  readonly text: string;
  readonly onClose: () => void;
}): HTMLElement {
  const box = createDiv({ cls: 'h5r-copy-fallback' });

  box.createEl('p', { cls: 'h5r-copy-fallback__hint', text: t('copy.failed', options.lang) });

  const area = box.createEl('textarea', { cls: 'h5r-copy-fallback__area' });
  area.readOnly = true;
  area.value = options.text;
  area.rows = 10;

  const close = button(box, 'h5r-onboarding__dismiss', '×', options.onClose);
  close.setAttribute('aria-label', t('notice.dismiss', options.lang));

  return box;
}
