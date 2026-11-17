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

export function createToggle(options: ToggleOptions): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'h5r-toggle';
  button.textContent = options.next === 'source' ? t('toggle.toSource', options.lang) : t('toggle.toPreview', options.lang);
  button.setAttribute(
    'aria-label',
    options.next === 'source' ? t('toggle.aria.toSource', options.lang) : t('toggle.aria.toPreview', options.lang),
  );
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    options.onActivate();
  });
  return button;
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
  const notice = document.createElement('div');
  notice.className = `h5r-notice h5r-notice--${options.kind}`;
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', options.kind === 'danger' ? 'assertive' : 'polite');
  notice.setAttribute('tabindex', '0');

  const text = document.createElement('span');
  text.className = 'h5r-notice__text';
  text.textContent = options.text;
  text.setAttribute('title', options.text);
  notice.appendChild(text);

  if (options.action) {
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'h5r-notice__action';
    action.textContent = options.action.label;
    action.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      options.action?.onActivate();
    });
    notice.appendChild(action);
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
  const prompt = document.createElement('div');
  prompt.className = 'h5r-onboarding';
  prompt.setAttribute('role', 'note');

  const text = document.createElement('span');
  text.className = 'h5r-onboarding__text';
  text.textContent = t('onboarding.message', options.lang);
  prompt.appendChild(text);

  const sample = document.createElement('button');
  sample.type = 'button';
  sample.className = 'h5r-onboarding__action';
  sample.textContent = t('onboarding.openSample', options.lang);
  sample.addEventListener('click', (event) => {
    event.preventDefault();
    options.onOpenSample();
  });
  prompt.appendChild(sample);

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'h5r-onboarding__action';
  copy.textContent = t('onboarding.copyCard', options.lang);
  copy.addEventListener('click', (event) => {
    event.preventDefault();
    options.onCopy();
  });
  prompt.appendChild(copy);

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'h5r-onboarding__dismiss';
  dismiss.textContent = '×';
  dismiss.setAttribute('aria-label', t('onboarding.dismiss', options.lang));
  dismiss.addEventListener('click', (event) => {
    event.preventDefault();
    options.onDismiss();
  });
  prompt.appendChild(dismiss);

  return prompt;
}

export interface SampleOfferOptions {
  readonly lang: Lang;
  readonly onInsert: () => void;
  readonly onDecline: () => void;
}

/** The one-time first-enable question, inline at the top of the note. */
export function createSampleOffer(options: SampleOfferOptions): HTMLElement {
  const box = document.createElement('div');
  box.className = 'h5r-onboarding h5r-sample-offer';
  box.setAttribute('role', 'note');

  const text = document.createElement('span');
  text.className = 'h5r-onboarding__text';
  text.textContent = t('sample.ask', options.lang);

  const insert = document.createElement('button');
  insert.type = 'button';
  insert.className = 'h5r-onboarding__action';
  insert.textContent = t('command.insertSample', options.lang);
  insert.addEventListener('click', (event) => {
    event.preventDefault();
    options.onInsert();
  });

  const decline = document.createElement('button');
  decline.type = 'button';
  decline.className = 'h5r-onboarding__action';
  decline.textContent = t('sample.decline', options.lang);
  decline.addEventListener('click', (event) => {
    event.preventDefault();
    options.onDecline();
  });

  box.append(text, insert, decline);
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
  const box = document.createElement('div');
  box.className = 'h5r-onboarding h5r-inline-message';

  const text = document.createElement('span');
  text.className = 'h5r-onboarding__text';
  text.textContent = options.text;

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'h5r-onboarding__action';
  action.textContent = options.actionLabel;
  action.addEventListener('click', (event) => {
    event.preventDefault();
    options.onAction();
  });

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'h5r-onboarding__dismiss';
  dismiss.textContent = '×';
  dismiss.setAttribute('aria-label', t('notice.dismiss', options.lang));
  dismiss.addEventListener('click', (event) => {
    event.preventDefault();
    options.onClose();
  });

  box.append(text, action, dismiss);
  return box;
}

/** Inline, non-modal text area used when the clipboard is unavailable. */
export function createCopyFallback(options: {
  readonly lang: Lang;
  readonly text: string;
  readonly onClose: () => void;
}): HTMLElement {
  const box = document.createElement('div');
  box.className = 'h5r-copy-fallback';

  const hint = document.createElement('p');
  hint.className = 'h5r-copy-fallback__hint';
  hint.textContent = t('copy.failed', options.lang);

  const area = document.createElement('textarea');
  area.className = 'h5r-copy-fallback__area';
  area.readOnly = true;
  area.value = options.text;
  area.rows = 10;

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'h5r-onboarding__dismiss';
  close.textContent = '×';
  close.setAttribute('aria-label', t('notice.dismiss', options.lang));
  close.addEventListener('click', (event) => {
    event.preventDefault();
    options.onClose();
  });

  box.append(hint, area, close);
  return box;
}
