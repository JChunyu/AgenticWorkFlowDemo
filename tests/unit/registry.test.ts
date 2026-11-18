import { beforeEach, describe, expect, it } from 'vitest';
import { t } from '../../src/core/i18n';
import { DEFAULT_SETTINGS } from '../../src/core/settings';
import { ViewRegistry } from '../../src/view';
import { attachSection, codeBlock, readingPass, resetBody } from './helpers';

/**
 * These tests replay the reading view's own choreography: a pass calls the
 * post-processor for each section while the sections are still detached, and only
 * then attaches them. Virtual scrolling detaches them again later. Everything here
 * exists because "the element is not connected" is the normal state there.
 */
describe('view registry (reading view)', () => {
  beforeEach(() => {
    resetBody();
  });

  function registry(): ViewRegistry {
    return new ViewRegistry({ settings: () => DEFAULT_SETTINGS, lang: () => 'zh' });
  }

  it('decorates a section handed over before it is attached', () => {
    const { root, section } = readingPass(codeBlock('<p>x</p>'));

    registry().process(section, root);

    expect(section.querySelector('.h5r-block')).not.toBeNull();
    expect(section.querySelector('.h5r-rendered-host')).not.toBeNull();
    expect(section.querySelector('.h5r-toggle')?.textContent).toBe(t('toggle.toSource', 'zh'));
  });

  it('keeps earlier sections of the same pass when later ones are processed', () => {
    const { root, section: first } = readingPass(codeBlock('<p>one</p>'));
    const second = document.createElement('div');
    second.appendChild(codeBlock('<p>two</p>'));
    const views = registry();

    views.process(first, root);
    views.process(second, root);
    attachSection(root, first);
    attachSection(root, second);

    expect(first.querySelector('.h5r-block')).not.toBeNull();
    expect(second.querySelector('.h5r-block')).not.toBeNull();
    /* One view per note, not one per section. */
    expect(views.views).toHaveLength(1);
  });

  it('keeps the card when a section is detached and re-attached (virtual scrolling)', () => {
    const { root, section } = readingPass(codeBlock('<p>scroll</p>'));
    const views = registry();
    views.process(section, root);
    attachSection(root, section);

    section.remove();
    views.process(section, root);
    attachSection(root, section);

    expect(section.querySelector('.h5r-rendered-host')).not.toBeNull();
    expect(views.views[0].blockCount).toBe(1);
  });

  it('sweeps a block whose wrapper was wiped out, and nothing else', () => {
    const { root, section: kept } = readingPass(codeBlock('<p>kept</p>'));
    const doomed = document.createElement('div');
    doomed.appendChild(codeBlock('<p>doomed</p>'));
    const views = registry();
    views.process(kept, root);
    views.process(doomed, root);

    /* What Obsidian does before re-rendering a section. */
    doomed.innerHTML = '';
    const rebuilt = document.createElement('div');
    rebuilt.appendChild(codeBlock('<p>rebuilt</p>'));
    views.process(rebuilt, root);

    expect(kept.querySelector('.h5r-block')).not.toBeNull();
    expect(rebuilt.querySelector('.h5r-block')).not.toBeNull();
    expect(views.views[0].blockCount).toBe(2);
  });

  it('prunes a view only once its root has left the document', async () => {
    const { root, section } = readingPass(codeBlock('<p>x</p>'));
    const views = registry();
    views.process(section, root);
    expect(views.views).toHaveLength(1);

    root.remove();
    const { root: otherRoot, section: otherSection } = readingPass(codeBlock('<p>y</p>'));
    views.process(otherSection, otherRoot);
    /* Pruning is deferred: a pass must not be torn down mid-flight. */
    await Promise.resolve();

    expect(views.views).toHaveLength(1);
    expect(otherSection.querySelector('.h5r-block')).not.toBeNull();

    /* The pruned view must restore the native block: a mis-pruned but still-alive
     * root keeps its content and can be decorated again on its next pass. */
    expect(section.querySelector('.h5r-block')).toBeNull();
    expect(section.querySelector('pre')).not.toBeNull();
    expect(section.querySelector('code')?.textContent).toBe('<p>x</p>');

    /* And the same root may resolve a fresh view afterwards — no zombie. */
    views.process(section, root);
    expect(views.views).toHaveLength(2);
  });
});
