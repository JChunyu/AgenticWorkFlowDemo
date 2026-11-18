/**
 * Obsidian injects its DOM helpers (`createEl`, `createDiv`, `createSpan`,
 * `instanceOf`) into every window it controls — popout windows included. Vitest
 * runs the plugin's code without them, so this file installs the same surface on
 * the test realm (`installDomHelpers` also covers extra happy-dom windows in the
 * cross-realm tests). It lives in `tests/` only: nothing in `src/` may rely on it.
 */

function applyInfo(el: HTMLElement, info?: DomElementInfo | string): void {
  if (typeof info === 'string') {
    el.className = info;
    return;
  }
  if (!info) {
    return;
  }
  if (info.cls !== undefined) {
    el.className = Array.isArray(info.cls) ? info.cls.join(' ') : info.cls;
  }
  if (typeof info.text === 'string') {
    el.textContent = info.text;
  } else if (info.text !== undefined) {
    el.appendChild(info.text);
  }
  if (info.title !== undefined) {
    el.title = info.title;
  }
  if (info.href !== undefined) {
    el.setAttribute('href', info.href);
  }
  if (info.placeholder !== undefined) {
    el.setAttribute('placeholder', info.placeholder);
  }
  if (info.value !== undefined) {
    (el as HTMLInputElement).value = info.value;
  }
  if (info.type !== undefined && 'type' in el) {
    (el as HTMLInputElement).type = info.type;
  }
  for (const [name, value] of Object.entries(info.attr ?? {})) {
    if (value !== null) {
      el.setAttribute(name, String(value));
    }
  }
}

function createFor(
  parent: Node | null,
  tag: string,
  info?: DomElementInfo | string,
  callback?: (el: HTMLElement) => void,
): HTMLElement {
  const target = parent ?? (typeof info === 'object' ? (info.parent ?? null) : null);
  /* Create in the document that will own the element: a helper called on a node
   * from a popout window must not produce main-window elements. */
  const doc = target?.ownerDocument ?? document;
  const el = doc.createElement(tag);
  applyInfo(el, info);
  callback?.(el);
  if (target) {
    if (typeof info === 'object' && info?.prepend) {
      target.insertBefore(el, target.firstChild);
    } else {
      target.appendChild(el);
    }
  }
  return el;
}

const nodeHelpers = {
  createEl(this: Node, tag: string, info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) {
    return createFor(this, tag, info, callback);
  },
  createDiv(this: Node, info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) {
    return createFor(this, 'div', info, callback);
  },
  createSpan(this: Node, info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) {
    return createFor(this, 'span', info, callback);
  },
  /**
   * Realm aware, like Obsidian's: `instanceof` answers for the checking realm, so a
   * node from a popout window fails a main-realm `instanceof`. The real helper
   * therefore asks the node's own window for the constructor.
   */
  instanceOf<T>(this: Node, type: abstract new (...args: never[]) => T): boolean {
    const name = (type as { name: string }).name;
    const realm = this.ownerDocument?.defaultView as unknown as Record<string, unknown> | null | undefined;
    const realmType = (name ? realm?.[name] : undefined) as (abstract new (...args: never[]) => T) | undefined;
    return this instanceof (realmType ?? type);
  },
};

/** Mirrors Obsidian injecting the helpers into a window it controls. */
export function installDomHelpers(target: unknown): void {
  const realm = target as typeof globalThis;
  Object.assign(realm.Node.prototype as unknown as Record<string, unknown>, nodeHelpers);
  Object.assign(realm as unknown as Record<string, unknown>, {
    createEl: (tag: string, info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) =>
      createFor(null, tag, info, callback),
    createDiv: (info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) =>
      createFor(null, 'div', info, callback),
    createSpan: (info?: DomElementInfo | string, callback?: (el: HTMLElement) => void) =>
      createFor(null, 'span', info, callback),
  });
}

installDomHelpers(globalThis);
